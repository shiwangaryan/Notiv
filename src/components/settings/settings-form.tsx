"use client";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import {
  addWorkspaceCollaborators,
  changeProfilePicture,
  deleteWorkspace,
  findUser,
  getCollaborators,
  removeWorkspaceCollaborators,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import {
  Briefcase,
  Loader,
  Lock,
  Plus,
  Share,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CollaboratorsSearch from "../global/collaborators-search";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";
import { twMerge } from "tailwind-merge";
import CypressProfileIcon from "../icons/cypressProfileIcon";

const SettingsForm = () => {
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { state, workspaceId, dispatch } = useAppState();
  const [permission, setPermission] = useState("private");
  const [collaborators, setCollaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace>();
  const titleTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // WIP PAYMENT PORTAL

  //delete workspace
  const deleteWorkspaceHandler = async (workspaceId: string) => {
    if (!workspaceId) return;
    await deleteWorkspace(workspaceId);
    toast({
      title: "Workspace deleted",
      description: "Your workspace has been deleted",
    });
    router.replace("/dashboard");
  };

  //addCollaborators
  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;
    //WIP Subscription

    await addWorkspaceCollaborators([profile], workspaceId);
    setCollaborators([...collaborators, profile]);
    // router.refresh();
  };

  //remove collaborators
  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermission("private");
    }

    await removeWorkspaceCollaborators([user], workspaceId);
    setCollaborators(collaborators.filter((c) => c.id !== user.id));
    router.refresh();
  };
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
  const onClickAlertConfirm = async () => {
    if (!workspaceId) return;
    if (collaborators.length > 0) {
      await removeWorkspaceCollaborators(collaborators, workspaceId);
    }
    setPermission("private");
    setOpenAlertMessage(false);
  };
  const onPermissionChange = (val: string) => {
    if (val === "private") {
      setOpenAlertMessage(true);
    } else {
      setPermission(val);
    }
  };

  const onChangeProfilePicture = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const response = await findUser(user.id);
    if (!response) return;

    setUploadingProfilePic(true);
    if (response.avatarUrl)
      await supabase.storage.from("avatars").remove([response.avatarUrl]);
    await supabase.storage.from("avatars").upload(`avatar.${user.id}`, file);

    await changeProfilePicture(user);
    const avatarUrl = supabase.storage
      .from("avatars")
      .getPublicUrl(`avatar.${user.id}`).data.publicUrl;
    const timeStampedUrl = `${avatarUrl}?${new Date().getTime()}`;
    setAvatarUrl(timeStampedUrl);
    setUploadingProfilePic(false);
  };
  //fetching avatar details
  const getAvatar = async () => {
    if (!user) return;
    const response = await findUser(user.id);
    if (!response) return "";
    const avatarUrl = response.avatarUrl
      ? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl).data
          .publicUrl
      : "";
    const timeStampedUrl = `${avatarUrl}?${new Date().getTime()}`;
    setAvatarUrl(timeStampedUrl);
    return;
  };
  //get workspace detials
  useEffect(() => {
    const currentWorkspace = state.workspaces.find((w) => w.id === workspaceId);
    if (currentWorkspace) setWorkspaceDetails(currentWorkspace);
  }, [state, workspaceId]);
  //get all the collaborators
  //WIP Payment portal redirect

  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      const collaborators = await getCollaborators(workspaceId);
      if (collaborators.length) {
        setPermission("shared");
        setCollaborators(collaborators);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  useEffect(() => {
    getAvatar();
  }, [user]);
  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-1">
        <Label htmlFor="workspaceName">Name</Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : ""}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="workspaceLogo">Workspace Logo</Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          className="text-muted-foreground"
          placeholder="Workspace Logo"
          onChange={workspaceLogoChange}
          // WIP SUBS STATUS
          disabled={uploadingLogo}
        />
        {/* WIP SUBSCRIPTIONS */}
      </div>
      <>
        <div className="flex flex-col gap-2">
          <Label htmlFor="permissions">Permissions</Label>
          <Select onValueChange={onPermissionChange} value={permission}>
            <SelectTrigger className="w-full h-25">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="private">
                  <div
                    className="p-2
                        flex
                        gap-4
                        justify-center
                        items-center"
                  >
                    <Lock />
                    <article className="text-left flex flex-col">
                      <span>Private</span>
                      <p>
                        Your workspace is private to you. You can choose to
                        share it later.
                      </p>
                    </article>
                  </div>
                </SelectItem>
                <SelectItem value="shared">
                  <div
                    className="p-2
                        flex
                        gap-4
                        justify-center
                        items-center"
                  >
                    <Share />
                    <article className="text-left flex flex-col">
                      <span>Shared</span>
                      <p>You can invite collaborators.</p>
                    </article>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {permission === "shared" && (
          <div>
            <CollaboratorsSearch
              existingCollaborators={collaborators}
              getCollaborator={(user) => addCollaborator(user)}
            >
              <Button type="button" className="text-sm mt-4">
                <Plus />
                Add Collaborators
              </Button>
            </CollaboratorsSearch>
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                Collaborators: {collaborators.length || "None"}
              </span>
              <ScrollArea
                className="h-[120px]
            w-full
            rounded-md
            border
            border-muted-foreground/20"
              >
                {collaborators.length ? (
                  collaborators.map((c) => (
                    <div
                      className="p-4 flex
                    justify-center
                    items-center"
                      key={c.id}
                    >
                      <div className="flex gap-4 items-center">
                        <Avatar>
                          <AvatarImage src="/avatars/7.png" />
                          <AvatarFallback>DP</AvatarFallback>
                        </Avatar>
                        <div
                          className="text-sm
                        gap-2
                        text-muted-foreground
                        overflow-hidden
                        overflow-ellipsis
                        sm:w-[280px]
                        w-[140px]"
                        >
                          {c.email}
                        </div>
                      </div>
                      <Button
                        variant={"secondary"}
                        onClick={() => removeCollaborator(c)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div
                    className="
                    absolute
                    right-0 left-0 top-0 bottom-0
                    flex
                    justify-center items-center"
                  >
                    <span className="text-muted-foreground text-sm">
                      You have no collaborators yet.
                    </span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <Alert variant={"destructive"}>
          <AlertDescription className={twMerge("text-red-500/85")}>
            Warning! deleting your workspace will permanently delelte all the
            data associated with it.
          </AlertDescription>
          <Button
            type="submit"
            size={"sm"}
            variant={"destructive"}
            className="mt-4
          text-sm
          bg-destructive/40
          border-2
          border-destructive/90"
            onClick={async () => {
              if (!workspaceId) return;
              await deleteWorkspace(workspaceId);
              toast({
                title: "Workspace deleted",
                description: "Your workspace has been deleted",
              });
              dispatch({
                type: "DELETE_WORKSPACE",
                payload: workspaceId,
              });
              router.replace("/dashboard");
            }}
          >
            Delete Workspace
          </Button>
        </Alert>
        <p className="flex items-center">
          <Avatar className="flex items-center justify-center">
            {uploadingProfilePic ? <Loader /> : <AvatarImage src={avatarUrl} />}
            <AvatarFallback>
              <CypressProfileIcon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col ml-6 mb-1">
            <small className="text-muted-foreground cursor-not-allowed">
              {user ? user.email : ""}
            </small>
            <Label
              htmlFor="profilePicture"
              className="text-sm text-muted-foreground"
            >
              Profile Picture
            </Label>
            <Input
              name="profilePicture"
              type="file"
              accept="image/*"
              placeholder="Profile Picture"
              onChange={onChangeProfilePicture}
              disabled={uploadingProfilePic}
            />
          </div>
        </p>
      </>
      <AlertDialog open={openAlertMessage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing a Shared workspace to a Private workspace will remove all
              the collaborators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onClickAlertConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsForm;
