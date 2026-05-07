"use client";

import { useParams } from "next/navigation";
import { VendorProposalActionPage } from "@/components/procurement/VendorProposalActionPage";

export default function PrActionPage() {
  const params = useParams<{ poId: string }>();

  return <VendorProposalActionPage poId={params.poId} />;
}
