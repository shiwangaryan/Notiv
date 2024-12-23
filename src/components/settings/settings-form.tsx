"use client";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import { updateWorkspace } from "@/lib/supabase/queries";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import { Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { v4 } from "uuid";

const SettingsForm = () => {
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { state, workspaceId, dispatch } = useAppState();
  const [permission, setPermission] = useState("private");
  const [collaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace>();
  const titleTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // WIP PAYMENT PORTAL

  //addCollaborators
  //remove collaborators
  //on changes
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: { workspace: { title: e.target.value }, workspaceId },
    });

    if (titleTimeRef.current) clearTimeout(titleTimeRef.current);
    titleTimeRef.current = setTimeout(async () => {
      await updateWorkspace({ title: e.target.value }, workspaceId);
    }, 500);
  };

  const workspaceLogoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!workspaceId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingLogo(true);

    if (workspaceDetails && workspaceDetails.logo) {
      const previousLogo = workspaceDetails.logo;
      const { error: removeError } = await supabase.storage
        .from("workspace-logos")
        .remove([previousLogo]);
      if (removeError) {
        setUploadingLogo(false);
        toast({
          title: "Error removing previous logo",
          description: removeError.message,
        });
        return;
      }
    }

    const { data, error: uploadError } = await supabase.storage
      .from("workspace-logos")
      .upload(`workspaceLogo.${uuid}`, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (!uploadError) {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { logo: data.path }, workspaceId },
      });
      await updateWorkspace({ logo: data.path }, workspaceId);
      setUploadingLogo(false);
    }
  };

  //on clicks
  //fetching avatar details
  //get workspace detials
  //get all the collaborators
  //WIP Payment portal redirect

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : ""}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label
          htmlFor="workspaceLogo"
          className="text-sm text-muted-foreground"
        >
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          onChange={workspaceLogoChange}
          // WIP SUBS STATUS
          disabled={uploadingLogo}
        />
        {/* WIP SUBSCRIPTIONS */}
      </div>
    </div>
  );
};

export default SettingsForm;
