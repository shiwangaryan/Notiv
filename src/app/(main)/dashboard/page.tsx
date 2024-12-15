import DashboardSetup from "@/components/dashboard-setup/dashboard-setup";
import { createServerSupabaseClient } from "@/lib/supabase/create-client";
import db from "@/lib/supabase/db";
import { redirect } from "next/navigation";
import React from "react";

const DashboardPage = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;
  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.workshpaceOwner, user.id),
  });

  const {data: subscription, error: subscriptionError}= await getUserSubscriptionStatus(user.id);

  if (!workspace)
    return (
      <div
        className="bg-background
    h-screen
    w-screen
    flex
    justify-center
    items-center"
      >
        <DashboardSetup></DashboardSetup>
      </div>
    );

  redirect(`/dashboard/${workspace.id}`);
};

export default DashboardPage;
