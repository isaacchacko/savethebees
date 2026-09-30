import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import Markdown from "@/components/Markdown";
import { getDump, getDumpSlugs } from "@/lib/dumps";

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
  if (!dump) return { title: "dumps — isaacchacko.com" };

  return {
    title: `${dump.title} — isaacchacko.com`,
    description: dump.description || dump.title,
  };
}

export default async function DumpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dump = getDump(slug);
  if (!dump) notFound();

  return (
    <Shell cmd={`cat ${slug}.md`}>
      <p style={{ marginTop: 0 }}>
        <Link href="/dumps">← dumps</Link>
      </p>
      <Markdown content={dump.content} />
    </Shell>
  );
}
