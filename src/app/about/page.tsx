import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/pages";

export default function About() {
  return (
    // labelled turns each bold-only paragraph ("**i like**") into a small
    // caps label sitting right on top of its list
    <div className="stack labelled">
      <Markdown content={getPage("about")} skipTitle />
    </div>
  );
}
