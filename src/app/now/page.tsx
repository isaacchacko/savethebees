import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function NowPage() {
  return (
    <div className="stack">
      <Markdown content={getPage("now")} skipTitle />
    </div>
  );
}
