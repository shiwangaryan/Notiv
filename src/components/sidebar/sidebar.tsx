import { createServerSupabaseClient } from "@/lib/supabase/create-client";
import { getFolders, getUserSubscriptionStatus } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

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
  return <div>Sidebar</div>;
};

export default Sidebar;
