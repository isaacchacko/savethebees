import Shell from "@/components/Shell";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function RunningPage() {
  return (
    <Shell cmd="cat races.log">
      <Markdown content={getPage("running")} />
    </Shell>
  );
}
