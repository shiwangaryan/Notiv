import React from 'react'

interface FoldersDropdownListProps {
  workspaceFolders: string;
  workspaceId: string;
}

const FoldersDropdownList: React.FC<FoldersDropdownListProps> = ({
    workspaceFolders,
    workspaceId,
}) => {
  return <div>FoldersDropdownList</div>;
}

export default FoldersDropdownList
