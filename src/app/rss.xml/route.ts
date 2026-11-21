import { getAllDumps } from "@/lib/dumps";

const SITE = "https://isaacchacko.com";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const dynamic = "force-static";

export function GET() {
  const items = getAllDumps()
    .map(
      (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid>${SITE}/blog/${post.slug}</guid>
      ${post.date ? `<pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>` : ""}
      <description>${escape(post.description)}</description>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Isaac Chacko</title>
    <link>${SITE}</link>
    <description>Writing by Isaac Chacko.</description>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
