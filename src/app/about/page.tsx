import Shell from "@/components/Shell";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function About() {
  return (
    <Shell cmd="cat about.txt">
      {/* tight-lists keeps the spacing the hand-written markup had, where each
          heading sat right on top of its list */}
      <div className="tight-lists">
        <Markdown content={getPage("about")} />
      </div>
    </Shell>
  );
}
