import { ProcureToPayPage } from "@/components/procurement/ProcureToPayPage";

type RequestTab = "memo" | "pr" | "po";

function parseTab(value: string | string[] | undefined): RequestTab {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === "memo" || tab === "pr" || tab === "po") {
    return tab;
  }
  return "memo";
}

export default async function ProcureToPayRoutePage(props: PageProps<"/procure-to-pay">) {
  const searchParams = await props.searchParams;
  const initialTab = parseTab(searchParams.tab);
  return <ProcureToPayPage key={initialTab} initialTab={initialTab} />;
}
