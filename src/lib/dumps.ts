import fs from "fs";
import path from "path";
import matter from "gray-matter";

const DUMPS_DIR = path.join(process.cwd(), "content/dumps");

export type Dump = {
  slug: string;
  title: string;
  date: string;
  description: string;
  /**
   * Kept off the index and never built as a page. The file still sits in the
   * repo, which is public — this hides a dump from the site, not from anyone
   * who goes looking on github.
   */
  private: boolean;
  content: string;
};

function isMarkdown(filename: string) {
  return filename.endsWith(".md");
}

function allSlugs(): string[] {
  if (!fs.existsSync(DUMPS_DIR)) return [];
  return fs
    .readdirSync(DUMPS_DIR)
    .filter(isMarkdown)
    .map((filename) => filename.replace(/\.md$/, ""));
}

function read(slug: string): Dump | null {
  const filePath = path.join(DUMPS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: typeof data.date === "string" ? data.date : "",
    description: typeof data.description === "string" ? data.description : "",
    private: data.private === true || data.private === "true",
    content,
  };
}

/** Only the ones that get a page. A private dump is not routable at all. */
export function getDumpSlugs(): string[] {
  return allSlugs().filter((slug) => !read(slug)?.private);
}

export function getDump(slug: string): Dump | null {
  const dump = read(slug);
  return dump && !dump.private ? dump : null;
}

export function getAllDumps(): Dump[] {
  return getDumpSlugs()
    .map((slug) => read(slug))
    .filter((dump): dump is Dump => dump !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}
