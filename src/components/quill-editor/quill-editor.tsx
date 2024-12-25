"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, { useCallback, useMemo, useState } from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  updateFile,
  updateFolder,
} from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { redirect, usePathname } from "next/navigation";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  fileId: string;
  dirDetails: Workspace | Folder | File;
}

var TOOLBAR_OPTIONS = [
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
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const { toast } = useToast();
  const pathName = usePathname();

  // wrapper for quill editor
  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (typeof wrapper === "undefined" || wrapper === null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    import("quill").then((QuillModule) => {
      const Quill = QuillModule.default;
      //WIP cursors
      const q = new Quill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
        },
      });
      setQuill(q);
    });
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
  }, [state, workspaceId, folderId, fileId]);

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
          {breadCrumbs}
        </div>
      </div>
      <div
        className="flex
    justify-center
    items-center
    flex-col
    mt-2
    relative"
      >
        <div className="max-w-[800px]" id="container" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
