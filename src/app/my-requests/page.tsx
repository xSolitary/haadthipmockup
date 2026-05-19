import { ProcureToPayPage } from "@/components/procurement/ProcureToPayPage";

type RequestTab = "memo" | "pr" | "po";

function parseTab(value: string | string[] | undefined): RequestTab {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === "memo" || tab === "pr" || tab === "po") {
    return tab;
  }
  return "memo";
}

export default async function MyRequestsPage(props: PageProps<"/my-requests">) {
  const searchParams = await props.searchParams;
  const initialTab = parseTab(searchParams.tab);
  const highlightId = Array.isArray(searchParams.highlightId) ? searchParams.highlightId[0] : searchParams.highlightId;

  return <ProcureToPayPage key={`${initialTab}:${highlightId ?? ""}`} initialTab={initialTab} initialHighlightId={highlightId} />;
}
