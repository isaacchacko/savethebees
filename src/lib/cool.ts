import fs from "fs";
import path from "path";

const COOL_FILE = path.join(process.cwd(), "content/cool.json");

export type CoolItem = {
  id: string;
  title: string;
  url: string;
  note: string;
  added: string;
};

export type CoolList = {
  id: string;
  title: string;
  description: string;
  items: CoolItem[];
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toItem(raw: unknown): CoolItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { id, title, url, note, added } = raw as Record<string, unknown>;
  if (!str(title) && !str(url)) return null;
  return {
    id: str(id) || str(url) || str(title),
    title: str(title) || str(url),
    url: str(url),
    note: str(note),
    added: str(added),
  };
}

function toList(raw: unknown): CoolList | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { id, title, description, items } = raw as Record<string, unknown>;
  if (!str(id) && !str(title)) return null;
  return {
    id: str(id) || str(title),
    title: str(title) || str(id),
    description: str(description),
    items: Array.isArray(items)
      ? items.map(toItem).filter((item): item is CoolItem => item !== null)
      : [],
  };
}

/**
 * The extension writes this file over the GitHub API, so a bad write would
 * otherwise fail the build. An unreadable file degrades to no lists — the same
 * bargain the now-playing widget makes — and logs the reason.
 */
export function getCoolLists(): CoolList[] {
  if (!fs.existsSync(COOL_FILE)) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(COOL_FILE, "utf8"));
  } catch (error) {
    console.error("content/cool.json is not valid JSON", error);
    return [];
  }

  const lists = (parsed as { lists?: unknown })?.lists;
  if (!Array.isArray(lists)) {
    console.error("content/cool.json has no lists array");
    return [];
  }

  return lists.map(toList).filter((list): list is CoolList => list !== null);
}
