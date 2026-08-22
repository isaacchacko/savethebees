import Link from "next/link";
import { getAllLearnings } from "@/lib/learnings";

export const metadata = {
  title: "learnings — isaacchacko.com",
  description: "Write-ups on how things work.",
};

export default function LearningsPage() {
  const learnings = getAllLearnings();

  return (
    <>
      <h2 style={{ marginTop: 0 }}>learnings</h2>
      <p>write-ups on how things work. each page is a markdown file.</p>
      {learnings.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        <ul>
          {learnings.map((learning) => (
            <li key={learning.slug}>
              <Link href={`/learnings/${learning.slug}`}>{learning.title}</Link>
              {learning.date ? ` — ${learning.date}` : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
