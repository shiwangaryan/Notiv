"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  findUser,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { redirect, usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import EmojiPicker from "../global/emoji-picker";
import BannerUpload from "../banner-upload/banner-upload";
import { XCircleIcon } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  fileId: string;
  dirDetails: Workspace | Folder | File;
}

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({
  dirType,
  fileId,
  dirDetails,
}) => {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const pathName = usePathname();
  const saveTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useSupabaseUser();
  const { socket } = useSocket();
  const { toast } = useToast();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<
    { id: string; email: string; avatarUrl: string }[]
  >([]);
  const [timestampedBannerUrl, setTimestampedBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [localCursors, setLocalCursors] = useState<any[]>([]);

  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      (async () => {
        const Quill = (await import("quill")).default;
        const QuillCursors = (await import("quill-cursors")).default;
        Quill.register("modules/cursors", QuillCursors);
        const q = new Quill(editor, {
          theme: "snow",
          modules: {
            toolbar: TOOLBAR_OPTIONS,
            cursors: {
              transformOnTextChange: true,
            },
          },
        });
        setQuill(q);
      })();
    }
  }, []);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((w) => w.id === workspaceId)
        ?.folders.find((f) => f.id === folderId)
        ?.files.find((f) => f.id === fileId);
    } else if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((w) => w.id === workspaceId)
        ?.folders.find((f) => f.id === fileId);
    } else if (dirType === "workspace") {
      selectedDir = state.workspaces.find((w) => w.id === fileId);
    }

    if (selectedDir) return selectedDir;
    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as Workspace | Folder | File;
  }, [state, workspaceId, folderId, fileId, dirDetails, dirType]);

  //know where you are
  const breadCrumbs = useMemo(() => {
    if (!pathName || !workspaceId || !state.workspaces) return;

    //workspace breadcrumb
    const segments = pathName.split("/").filter((s) => s !== "dashboard" && s);
    const workspaceDetails = state.workspaces.find((w) => w.id === workspaceId);
    const workspaceBreadCrumb = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";
    if (segments.length === 1) return [workspaceBreadCrumb];

    //folder breadcrumb
    const folderSegmentId = segments[1];
    const folderDetails = workspaceDetails?.folders.find(
      (f) => f.id === folderSegmentId
    );
    const folderBreadCrumbs = folderDetails
      ? `/ ${folderDetails.iconId} ${folderDetails.title}`
      : "";
    if (segments.length === 2)
      return `${workspaceBreadCrumb} ${folderBreadCrumbs}`;

    //file breadcrumb
    const fileSegmentId = segments[2];
    const fileDetails = folderDetails?.files.find(
      (f) => f.id === fileSegmentId
    );
    const fileBreadCrumbs = fileDetails
      ? `/ ${fileDetails.iconId} ${fileDetails.title}`
      : "";
    return `${workspaceBreadCrumb} ${folderBreadCrumbs} ${fileBreadCrumbs}`;
  }, [state, workspaceId, pathName]);

  // restore file
  const restoreFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          fileId,
          folderId,
          file: { inTrash: "" },
        },
      });
      await updateFile({ inTrash: "" }, fileId);
      toast({
        title: "Restored",
        description: "File has been restored",
      });
    } else if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileId,
          folder: { inTrash: "" },
        },
      });
      await updateFolder({ inTrash: "" }, fileId);
      toast({
        title: "Restored",
        description: "Folder has been restored",
      });
    }
  };

  // delete file
  const deleteFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "DELETE_FILE",
        payload: {
          workspaceId,
          fileId,
          folderId,
        },
      });
      await deleteFile(fileId);
      toast({
        title: "Deleted",
        description: "File has been deleted",
      });
      //   router.replace(`/dashboard/${workspaceId}/${folderId}`);
      redirect(`/dashboard/${workspaceId}/${folderId}`);
    } else if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "DELETE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileId,
        },
      });
      await deleteFolder(fileId);
      toast({
        title: "Deleted",
        description: "Folder has been deleted",
      });
      redirect(`/dashboard/${workspaceId}`);
    }
  };

  // delete banner
  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { bannerUrl: "" }, fileId, folderId, workspaceId },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateFile({ bannerUrl: "" }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { folder: { bannerUrl: "" }, folderId: fileId, workspaceId },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateFolder({ bannerUrl: "" }, fileId);
    }
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: {
          workspace: { bannerUrl: "" },
          workspaceId: fileId,
        },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateWorkspace({ bannerUrl: "" }, fileId);
    }
    setDeletingBanner(false);
  };

  //change icon
  const iconOnChange = async (icon: string) => {
    setSaving(true);
    if (!fileId) return;
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });
      await updateWorkspace({ iconId: icon }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { iconId: icon },
          workspaceId: workspaceId,
          folderId: fileId,
        },
      });
      await updateFolder({ iconId: icon }, fileId);
    }
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { iconId: icon },
          workspaceId: workspaceId,
          fileId: fileId,
          folderId: folderId,
        },
      });
      await updateFile({ iconId: icon }, fileId);
    }
    setSaving(false);
  };

  //getting dynamic image
  useEffect(() => {
    if (details.bannerUrl) {
      const publicUrl = supabase.storage
        .from("file-banners")
        .getPublicUrl(details.bannerUrl).data.publicUrl;
      setTimestampedBannerUrl(`${publicUrl}?t=${new Date().getTime()}`);
    }
  }, [state, details.bannerUrl, supabase]);

  // on change handler (so tht everything that has changed using
  // socket can be updated in local changes and also sent
  // all the events/update to other client )
  useEffect(() => {
    if (!fileId) return;
    const fetchInformation = async () => {
      if (dirType === "file") {
        const { data: selectedDir, error } = await getFileDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }

        if (!selectedDir[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { data: selectedDir[0].data },
            fileId,
            folderId: selectedDir[0].folderId,
            workspaceId,
          },
        });
      }
      if (dirType === "folder") {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }

        if (!selectedDir[0]) {
          router.replace(`/dashboard/${workspaceId}`);
        }
        if (quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folderId: fileId,
            folder: { data: selectedDir[0].data },
            workspaceId: selectedDir[0].workspaceId,
          },
        });
      }
      if (dirType === "workspace") {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }
        if (!selectedDir[0] || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
    };
    fetchInformation();
  }, [fileId, workspaceId, quill, dirType, dispatch, router]);

  //rooms
  useEffect(() => {
    if (socket === null || quill === null || !fileId) return;
    socket.emit("create-room", fileId);
  }, [socket, quill, fileId]);

  // send data to other clients
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !user) return;
    const selectionChangeHandler = (cursorId: string) => {
      return (range: any, oldRange: any, source: any) => {
        if (source === "user" && cursorId) {
          socket.emit("send-cursor-move", range, fileId, cursorId);
        }
      };
    };
    const quillHandler = (delta: any, oldDelta: any, source: any) => {
      if (source !== "user") return;
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
      setSaving(true);
      const contents = quill.getContents();
      const quillLength = quill.getLength();
      saveTimeRef.current = setTimeout(async () => {
        if (contents && quillLength !== 1 && fileId) {
          if (dirType == "workspace") {
            dispatch({
              type: "UPDATE_WORKSPACE",
              payload: {
                workspace: { data: JSON.stringify(contents) || "" },
                workspaceId: fileId,
              },
            });
            await updateWorkspace(
              { data: JSON.stringify(contents) || "" },
              fileId
            );
          }
          if (dirType == "folder") {
            if (!workspaceId) return;
            dispatch({
              type: "UPDATE_FOLDER",
              payload: {
                folder: { data: JSON.stringify(contents) || "" },
                workspaceId,
                folderId: fileId,
              },
            });
            await updateFolder(
              { data: JSON.stringify(contents) || "" },
              fileId
            );
          }
          if (dirType == "file") {
            if (!workspaceId || !folderId) return;
            dispatch({
              type: "UPDATE_FILE",
              payload: {
                file: { data: JSON.stringify(contents) || "" },
                workspaceId,
                folderId: folderId,
                fileId,
              },
            });
            await updateFile({ data: JSON.stringify(contents) || "" }, fileId);
          }
        }
        setSaving(false);
      }, 850);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    quill.on("selection-change", selectionChangeHandler(user.id));

    return () => {
      quill.off("text-change", quillHandler);
      quill.off("selection-change", selectionChangeHandler);
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
    };
  }, [quill, socket, fileId, user, details, folderId, workspaceId, dispatch, dirType]);

  // receiving data from other clients
  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => {
      if (id === fileId) {
        quill.updateContents(deltas);
      }
    };
    socket.on("receive-changes", socketHandler);
    return () => {
      socket.off("receive-changes", socketHandler);
    };
  }, [quill, socket, fileId]);

  //listen to cursor changes
  useEffect(() => {
    if (!quill || !socket || !fileId || !localCursors.length) return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find(
          (c: any) => c.cursors()?.[0].id === cursorId
        );
        if (cursorToMove) cursorToMove.moveCursor(cursorId, range);
      }
    };
    socket.on("receive-cursor-move", socketHandler);
    return () => {
      socket.off("receive-cursor-move", socketHandler);
    };
  }, [quill, socket, fileId, localCursors]);

  //cursors
  useEffect(() => {
    if (!fileId || !quill) return;
    const room = supabase.channel(fileId);
    room
      .on("presence", { event: "sync" }, () => {
        const newState = room.presenceState();
        const newCollaborators = Object.values(newState).flat() as any;
        setCollaborators(newCollaborators);
        if (user) {
          const allCursors: any = [];
          newCollaborators.forEach(
            (collaborator: { id: string; email: string; avatar: string }) => {
              if (collaborator.id !== user.id) {
                const userCursor = quill.getModule("cursors");
                userCursor.createCursor(
                  collaborator.id,
                  collaborator.email.split("@")[0],
                  `#${Math.random().toString(16).slice(2, 8)}`
                );
                allCursors.push(userCursor);
              }
            }
          );
          setLocalCursors(allCursors);
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || !user) return;
        const response = await findUser(user.id);
        if (!response) return;

        room.track({
          id: user.id,
          email: user.email,
          avatar: response.avatarUrl
            ? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl)
                .data.publicUrl
            : "",
        });
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [fileId, quill, supabase, user]);

  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article
            className="py-2
            z-40
            bg-[#EB5757]
            flex
            flex-col
            justify-center
            items-center
            gap-2
            flex-wrap
            "
          >
            <div
              className="flex
                flex-col
                md:flex-row
                gap-2
                justify-center
                items-center
                "
            >
              <span className="text-white">This {dirType} is in trash.</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={"outline"}
                  className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-green-500
                "
                  onClick={restoreFileHandler}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant={"outline"}
                  className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]
                "
                  onClick={deleteFileHandler}
                >
                  Delete
                </Button>
              </div>
            </div>
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div
          className="flex
        flex-col-reverse
        sm:flex-row
        sm:justify-between
        justify-center
        sm:items-center
        sm:p-2
        p-8
        "
        >
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            
            <div className="flex items-center justify-center h-10">
              {collaborators?.map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="
                    -ml-3 
                    bg-background 
                    border-2 
                    flex 
                    items-center 
                    justify-center 
                    border-white 
                    h-8 
                    w-8 
                    rounded-full
                    "
                      >
                        <AvatarImage
                          src={`${
                            supabase.storage
                              .from("avatars")
                              .getPublicUrl(`avatar.${collaborator.id}`).data
                              .publicUrl
                          }`}
                          className="rounded-full"
                        />
                        <AvatarFallback>
                          {collaborator.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {collaborator.email.split("@")[0]}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant={"secondary"}
                className="bg-orange-600
                top-4
                text-white
                right-4
                h-7
                z-50"
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant={"secondary"}
                className="bg-emerald-600
                top-4
                text-white
                right-4
                h-7
                z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      {details.bannerUrl && timestampedBannerUrl !== "" && (
        <div className="relative w-full h-[230px]">
          <Image
            src={timestampedBannerUrl}
            alt="Banner Image"
            fill
            className="w-full
            md:h-48
            h-20
            object-cover"
          />
        </div>
      )}
      <div
        className="flex
        justify-center
        items-center
        flex-col
        mt-2
        relative"
      >
        <div
          className="w-full
            self-center
            max-w-[800px]
            flex
            flex-col
            px-7
            lg:my-8"
        >
          <div className="text-[80px] ">
            <EmojiPicker getValue={iconOnChange}>
              <div
                className="w-[100px]
                cursor-pointer
                transition-colors
                h-[100px]
                flex
                items-center
                justify-center
                hover:bg-muted
                rounded-xl"
              >
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              dirDetails={details}
              fileId={fileId}
              dirType={dirType}
              className="mt-2
            text-sm
            text-muted-foreground
            p-2
            hover:text-card-foreground
            transition-all
            rounded-md
            "
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBanner}
                variant="ghost"
                className="gap-1 hover:bg-background
                flex
                item-center
                justify-center
                mt-2
                text-sm
                text-muted-foreground
                w-36
                p-2
                rounded-md"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span
            className="text-muted-foreground
          text-3xl
          font-bold
          h-9"
          >
            {details.title}
          </span>
          <span
            className="text-muted-foreground text-sm
          "
          >
            {dirType.toUpperCase()}
          </span>
        </div>
        <div id="container" className="max-w-[800px]" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
