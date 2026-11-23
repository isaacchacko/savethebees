import fs from "fs";
import path from "path";
import matter from "gray-matter";

const PAGES_DIR = path.join(process.cwd(), "content/pages");

export type Page = { slug: string; title: string; content: string };

/** A page has no frontmatter; its title is its leading `# heading`, which the body then leaves out. */
function read(slug: string): Page | null {
  const filePath = path.join(PAGES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  const heading = content.match(/^\s*#\s+(.+)\n/);
  return {
    slug,
    title: typeof data.title === "string" ? data.title : heading?.[1].trim() ?? slug,
    content: heading ? content.slice(heading[0].length) : content,
  };
}

export function getPageSlugs(): string[] {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPage(slug: string): Page | null {
  return getPageSlugs().includes(slug) ? read(slug) : null;
}
