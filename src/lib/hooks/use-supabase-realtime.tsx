"use client";

import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "../supabase/create-client-supabase";
import { useAppState } from "../providers/state-provider";
import { useEffect } from "react";
import { File, Folder } from "../supabase/supabase.types";

const useSupabaseRealtime = () => {
  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const { dispatch, state, workspaceId: selectedWorkspace } = useAppState();

  useEffect(() => {
    const channelFile = supabase
      .channel("db-files-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("RECIEVED REAL TIME EVENT");
            const {
              folder_id: folderId,
              workspace_id: workspaceId,
              id: fileId,
            } = payload.new;

            const files = state.workspaces
              .find((w) => w.id === workspaceId)
              ?.folders.find((f) => f.id === folderId)
              ?.files.find((f) => f.id === fileId);
            if (!files) {
              const newFile: File = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                folderId: payload.new.folder_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FILE",
                payload: {
                  file: newFile,
                  folderId,
                  workspaceId,
                },
              });
            }
          } else if (payload.eventType === "DELETE") {
            let workspaceId = "";
            let folderId = "";
            const fileExists = state.workspaces.some((w) =>
              w.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.old.id) {
                    workspaceId = w.id;
                    folderId = folder.id;
                    return true;
                  }
                })
              )
            );
            if (fileExists && workspaceId && folderId) {
              router.replace(`/dashboard/${workspaceId}/${folderId}`);
              dispatch({
                type: "DELETE_FILE",
                payload: {
                  fileId: payload.old.id,
                  folderId,
                  workspaceId,
                },
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const { folder_id: folderId, workspace_id: workspaceId } =
              payload.new;
            state.workspaces.some((workspace) =>
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.new.id) {
                    dispatch({
                      type: "UPDATE_FILE",
                      payload: {
                        workspaceId,
                        folderId,
                        fileId: payload.new.id,
                        file: {
                          title: payload.new.title,
                          iconId: payload.new.icon_id,
                          inTrash: payload.new.in_trash,
                        },
                      },
                    });
                    return true;
                  }
                })
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channelFile.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace, dispatch, router]);

  useEffect(() => {
    const channelFolder = supabase
      .channel("db-folders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("RECIEVED REAL TIME EVENT");
            const { folder_id: folderId, workspace_id: workspaceId } =
              payload.new;

            const folders = state.workspaces
              .find((w) => w.id === workspaceId)
              ?.folders.find((f) => f.id === folderId);
            if (!folders) {
              const newFolder: Folder = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FOLDER",
                payload: {
                  workspaceId,
                  folder: { ...newFolder, files: [] },
                },
              });
            }
          } else if (payload.eventType === "DELETE") {
            let workspaceId = "";
            const folderExist = state.workspaces.some((w) =>
              w.folders.some((folder) => {
                if (folder.id === payload.old.id) {
                  workspaceId = w.id;
                  return true;
                }
              })
            );
            if (folderExist && workspaceId) {
              router.replace(`/dashboard/${workspaceId}`);
              dispatch({
                type: "DELETE_FOLDER",
                payload: {
                  folderId: payload.old.id,
                  workspaceId,
                },
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const { folder_id: folderId, workspace_id: workspaceId } =
              payload.new;
            state.workspaces.some((workspace) =>
              workspace.folders.some((folder) => {
                if (folder.id === payload.old.id) {
                  dispatch({
                    type: "UPDATE_FOLDER",
                    payload: {
                      workspaceId,
                      folderId: payload.old.id,
                      folder: {
                        title: payload.new.title,
                        iconId: payload.new.icon_id,
                        inTrash: payload.new.in_trash,
                      },
                    },
                  });
                  return true;
                }
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      channelFolder.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace, dispatch, router]);

  return null;
};

export default useSupabaseRealtime;
