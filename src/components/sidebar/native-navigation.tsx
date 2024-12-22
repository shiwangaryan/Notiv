import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/cypressHomeIcon";
import CypressSettingsIcon from "../icons/cypressSettingsIcon";
import CypressTrashIcon from "../icons/cypressTrashIcon";

interface NaviteNavigationProps {
  myWorkspaceId: string;
  className?: string;
}

const NativeNavigation: React.FC<NaviteNavigationProps> = ({
  myWorkspaceId,
  className,
}) => {
  return (
    <nav className={twMerge("my-2", className)}>
      <ul
        className="flex
         flex-col
         gap-3"
      >
        <li>
          <Link
            href={`/dashboard/${myWorkspaceId}`}
            className="group/native
            flex
            text-Neutrals/neutrals-7
            transition-all
            items-center
            justify-start
            gap-2"
          >
            <CypressHomeIcon />
            <span className="-mb-[5px]">My Workspace</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/dashboard/${myWorkspaceId}`}
            className="group/native
            flex
            text-Neutrals/neutrals-7
            transition-all
            items-center
            justify-start
            gap-2"
          >
            <CypressSettingsIcon />
            <span className="">Settings</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/dashboard/${myWorkspaceId}`}
            className="group/native
            flex
            text-Neutrals/neutrals-7
            transition-all
            items-center
            justify-start
            gap-2"
          >
            <CypressTrashIcon />
            <span className="-mb-[2px]">Trash</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NativeNavigation;
