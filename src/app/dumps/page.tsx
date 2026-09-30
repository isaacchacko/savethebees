import Link from "next/link";
import Shell from "@/components/Shell";
import { getAllDumps } from "@/lib/dumps";

export const metadata = {
  title: "yap — isaacchacko.com",
  description: "Write-ups on how things work.",
};

/** "2026-09-26" -> "09/26". Anything else renders nothing rather than NaN. */
function monthYear(date: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[2]}/${match[1].slice(2)}` : "";
}

export default function YapPage() {
  const dumps = getAllDumps();

  return (
    <Shell cmd="ls -l dumps/">
      <h2 style={{ marginTop: 0 }}>yap</h2>
      <p>write-ups on how things work. each page is a markdown file.</p>
      {dumps.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        <ul className="yap-list">
          {dumps.map((dump) => (
            <li key={dump.slug}>
              <Link href={`/dumps/${dump.slug}`}>{dump.title}</Link>
              <span className="yap-date">{monthYear(dump.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
