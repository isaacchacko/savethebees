import { SlideLink } from "@/components/slide";
import { getAllDumps } from "@/lib/dumps";

export const metadata = {
  title: "blog — isaacchacko.com",
  description: "Write-ups on how things work.",
};

/** "2026-09-26" -> "09/26". Anything else renders nothing rather than NaN. */
function monthYear(date: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[2]}/${match[1].slice(2)}` : "";
}

export default function BlogPage() {
  const dumps = getAllDumps();

  return (
    <>
      <p>just let a man yap</p>
      {dumps.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        <div className="blog-list">
          {dumps.map((dump) => (
            <SlideLink
              key={dump.slug}
              href={`/blog/${dump.slug}`}
              dir={1}
              className="blog-row"
            >
              <span className="blog-title">{dump.title}</span>
              <span className="muted tabular">{monthYear(dump.date)}</span>
              <span className="blog-desc">{dump.description}</span>
            </SlideLink>
          ))}
        </div>
      )}
    </>
  );
}
