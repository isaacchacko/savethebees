import Link from "next/link";
import Shell from "@/components/Shell";
import { getAllDumps } from "@/lib/dumps";

export const metadata = {
  title: "dumps — isaacchacko.com",
  description: "Write-ups on how things work.",
};

export default function DumpsPage() {
  const dumps = getAllDumps();

  return (
    <Shell cmd="ls -l dumps/">
      <h2 style={{ marginTop: 0 }}>dumps</h2>
      <p>write-ups on how things work. each page is a markdown file.</p>
      {dumps.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        <ul>
          {dumps.map((dump) => (
            <li key={dump.slug}>
              {dump.date ? (
                <span style={{ color: "var(--muted)" }}>{dump.date} </span>
              ) : null}
              <Link href={`/dumps/${dump.slug}`}>{dump.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
