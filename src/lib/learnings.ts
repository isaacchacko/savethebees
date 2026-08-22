import fs from "fs";
import path from "path";
import matter from "gray-matter";

const LEARNINGS_DIR = path.join(process.cwd(), "content/learnings");

export type Learning = {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
};

function isMarkdown(filename: string) {
  return filename.endsWith(".md");
}

export function getLearningSlugs(): string[] {
  if (!fs.existsSync(LEARNINGS_DIR)) return [];
  return fs
    .readdirSync(LEARNINGS_DIR)
    .filter(isMarkdown)
    .map((filename) => filename.replace(/\.md$/, ""));
}

export function getLearning(slug: string): Learning | null {
  const filePath = path.join(LEARNINGS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: typeof data.date === "string" ? data.date : "",
    description: typeof data.description === "string" ? data.description : "",
    content,
  };
}

export function getAllLearnings(): Learning[] {
  return getLearningSlugs()
    .map((slug) => getLearning(slug))
    .filter((learning): learning is Learning => learning !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}
