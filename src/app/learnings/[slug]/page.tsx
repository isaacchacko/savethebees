import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { getLearning, getLearningSlugs } from "@/lib/learnings";

export function generateStaticParams() {
  return getLearningSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const learning = getLearning(slug);
  if (!learning) return { title: "learnings — isaacchacko.com" };

  return {
    title: `${learning.title} — isaacchacko.com`,
    description: learning.description || learning.title,
  };
}

export default async function LearningPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const learning = getLearning(slug);
  if (!learning) notFound();

  return (
    <>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        <Link href="/learnings">← learnings</Link>
      </p>
      <Markdown content={learning.content} />
    </>
  );
}
