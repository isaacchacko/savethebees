import fs from "fs";
import path from "path";

const PAGES_DIR = path.join(process.cwd(), "content/pages");

/** The pages the extension's admin view is allowed to edit. */
export const EDITABLE_PAGES = ["about", "now", "running"] as const;

export type PageSlug = (typeof EDITABLE_PAGES)[number];

/**
 * The prose for a page, as markdown. These used to be hardcoded JSX; they live
 * in content/ so they can be edited without touching code — a typo is then a
 * typo rather than a broken build.
 */
export function getPage(slug: PageSlug): string {
  const file = path.join(PAGES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) {
    console.error(`content/pages/${slug}.md is missing`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}
