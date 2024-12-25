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
            md:flex-row
            flex-col
            justify-center
            items-center
            gap-4
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
              <Button
                size="sm"
                variant={"outline"}
                className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-green-400
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
          </article>
        )}
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
