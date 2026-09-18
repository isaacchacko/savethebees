import Link from "next/link";
import Shell from "@/components/Shell";
import { getAllLearnings } from "@/lib/learnings";

export const metadata = {
  title: "learnings — isaacchacko.com",
  description: "Write-ups on how things work.",
};

export default function LearningsPage() {
  const learnings = getAllLearnings();

  return (
    <Shell cmd="ls -l learnings/">
      <h2 style={{ marginTop: 0 }}>learnings</h2>
      <p>write-ups on how things work. each page is a markdown file.</p>
      {learnings.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        <ul>
          {learnings.map((learning) => (
            <li key={learning.slug}>
              {learning.date ? (
                <span style={{ color: "var(--muted)" }}>{learning.date} </span>
              ) : null}
              <Link href={`/learnings/${learning.slug}`}>{learning.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
