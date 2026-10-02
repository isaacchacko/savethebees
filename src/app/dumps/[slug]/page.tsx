import { notFound } from "next/navigation";
import { SlideLink } from "@/components/slide";
import Markdown from "@/components/Markdown";
import { getDump, getDumpSlugs } from "@/lib/dumps";

const WORDS_PER_MINUTE = 200;

export function generateStaticParams() {
  return getDumpSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dump = getDump(slug);
  if (!dump) return { title: "traces — isaacchacko.com" };

  return {
    title: `${dump.title} — isaacchacko.com`,
    description: dump.description || dump.title,
  };
}

/** "2026-08-21" -> "08/21/26" */
function shortDate(date: string): string {
  const match = /^\d{2}(\d{2})-(\d{2})-(\d{2})/.exec(date);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
}

function readMinutes(markdown: string): number {
  return Math.max(1, Math.round(markdown.split(/\s+/).length / WORDS_PER_MINUTE));
}

export default async function DumpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dump = getDump(slug);
  if (!dump) notFound();

  const date = shortDate(dump.date);

  return (
    <article className="stack post">
      <div className="post-meta">
        <SlideLink href="/dumps" dir={-1} className="chip-link">
          ← traces
        </SlideLink>
        <span className="muted tabular">
          {date ? `${date} · ` : ""}
          {readMinutes(dump.content)} min
        </span>
      </div>
      <div className="post-head">
        <h2 className="post-title">{dump.title}</h2>
        {dump.description ? <span className="muted">{dump.description}</span> : null}
      </div>
      {/* the title is already above, from the frontmatter */}
      <Markdown content={dump.content} skipTitle />
    </article>
  );
}
