"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Workspace } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import SelectedWorkspace from "./selected-workspace";

interface WorkspaceDropdownProps {
  privateWorkspace: Workspace[] | [];
  sharedWorkspace: Workspace[] | [];
  collaboratingWorkspace: Workspace[] | [];
  defaltValue: Workspace | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspace,
  sharedWorkspace,
  collaboratingWorkspace,
  defaltValue,
}) => {
  const { dispatch, state } = useAppState();
  const [selectedOption, setSelectedOption] = useState(defaltValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: Workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: "SET_WORKSPACES",
        payload: {
          workspaces: [
            ...privateWorkspace,
            ...sharedWorkspace,
            ...collaboratingWorkspace,
          ].map((workspace) => ({ ...workspace, folders: [] })),
        },
      });
    }
  }, [privateWorkspace, sharedWorkspace, collaboratingWorkspace]);
  return (
    <div
      className="relative
  inline-block
  text-left"
    >
      <div>
        <span onClick={() => setIsOpen(!isOpen)}>
          {selectedOption ? (
            <SelectedWorkspace workspace={selectedOption} />
          ) : (
            "Select a workspace"
          )}
        </span>
      </div>
      {isOpen && (
        <div className="origin-top-right
        absolute
        w-full
        rounded-md
        shadow-md
        z-50
        h-[190px]
        bg-balck/10
        backdrop-blue-lg
        group
        overflow-scroll
        border-[1px]
        border-muted"></div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
