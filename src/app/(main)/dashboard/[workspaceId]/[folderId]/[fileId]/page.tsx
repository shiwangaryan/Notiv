export const dynamic = "force-dynamic";

import QuillEditor from "@/components/quill-editor/quill-editor";
import { getFileDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

const FilePage = async ({ params }: { params: { fileId: string } }) => {
  const { fileId } =  params;
  const { data, error } = await getFileDetails(fileId);
  if (error || !data.length) {
    console.log(`error in file page: ${error}`);
    redirect("/dashboard");
  }

  return (
    <div className="relative">
      <QuillEditor dirType="file" fileId={fileId} dirDetails={data[0] || {}} />
    </div>
  );
};

export default FilePage;
