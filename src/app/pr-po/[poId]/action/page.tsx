"use client";

import { useParams } from "next/navigation";
import { VendorDeliveryActionPage } from "@/components/procurement/VendorDeliveryActionPage";
import { VendorProposalActionPage } from "@/components/procurement/VendorProposalActionPage";
import { useProcurementStore } from "@/store/useProcurementStore";

export default function PrActionPage() {
  const params = useParams<{ poId: string }>();
  const currentRole = useProcurementStore((state) => state.currentRole);

  if (currentRole === "Vendor") {
    return <VendorDeliveryActionPage poId={params.poId} />;
  }

  return <VendorProposalActionPage poId={params.poId} />;
}
