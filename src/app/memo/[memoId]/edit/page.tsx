"use client";

import { useParams } from "next/navigation";
import { MemoEditorPage } from "@/components/memo/MemoEditorPage";

export default function EditMemoPage() {
  const params = useParams<{ memoId: string }>();

  return <MemoEditorPage memoId={params.memoId} />;
}
