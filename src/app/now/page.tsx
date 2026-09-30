import Shell from "@/components/Shell";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function NowPage() {
  return (
    <Shell cmd="tail -f now.log">
      <Markdown content={getPage("now")} />
    </Shell>
  );
}
