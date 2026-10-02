import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function RunningPage() {
  return (
    <div className="stack">
      <Markdown content={getPage("running")} skipTitle />
    </div>
  );
}
