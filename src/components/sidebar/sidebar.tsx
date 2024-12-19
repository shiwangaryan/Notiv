import { createServerSupabaseClient } from "@/lib/supabase/create-client";
import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getUserSubscriptionStatus,
} from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
  const { workspaceId } = await params;
  const supabase = await createServerSupabaseClient();
  //check for user exist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  //check the subsscription status
  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);
  //check for folders
  const { data: folderData, error: folderError } = await getFolders(
    workspaceId
  );
  //handle error
  if (subscriptionError || folderError) redirect("/dashboard");
  //get all diff workspaces: private, collaborating, shared
  const [privateWorkspace, collaboratingWorkspace, sharedWorkspace] =
    await Promise.all([
      getPrivateWorkspaces(user.id),
      getCollaboratingWorkspaces(user.id),
      getSharedWorkspaces(user.id),
    ]);

  return (
    <aside
      className={twMerge(
        "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between",
        className
      )}
    >
      <div>
        <WorkspaceDropdown
          privateWorkspace={privateWorkspace}
          sharedWorkspace={sharedWorkspace}
          collaboratingWorkspace={collaboratingWorkspace}
          defaltValue={[
            ...privateWorkspace,
            ...sharedWorkspace,
            ...collaboratingWorkspace,
          ].find((workspace) => workspace.id === workspaceId)}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
