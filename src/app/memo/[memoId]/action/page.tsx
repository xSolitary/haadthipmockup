"use client";

import { useParams } from "next/navigation";
import { MemoApprovalPage } from "@/components/memo/MemoApprovalPage";

export default function MemoActionPage() {
  const params = useParams<{ memoId: string }>();

  return <MemoApprovalPage memoId={params.memoId} />;
}
