import { addItem, fetchCool, getCached, mutate, shotPath } from "./store.js";
import { capture } from "./shot.js";

const ROOT = "cool-root";
const LIST_PREFIX = "cool-list:";
const REFRESH = "cool-refresh";
const CONTEXTS = ["page", "link", "selection"];

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/128.png",
    title,
    message,
  });
}

function prettyUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname.replace(/^www\./, "") + (pathname === "/" ? "" : pathname);
  } catch {
    return url;
  }
}

async function buildMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: ROOT, title: "add to cool", contexts: CONTEXTS });

  const cached = await getCached();
  const lists = cached?.data?.lists || [];

  for (const list of lists) {
    chrome.contextMenus.create({
      id: LIST_PREFIX + list.id,
      parentId: ROOT,
      title: list.title,
      contexts: CONTEXTS,
    });
  }
  if (lists.length === 0) {
    chrome.contextMenus.create({
      id: "cool-none",
      parentId: ROOT,
      title: "no lists yet — open the popup",
      enabled: false,
      contexts: CONTEXTS,
    });
  }
  chrome.contextMenus.create({
    id: REFRESH,
    parentId: ROOT,
    title: "refresh lists",
    contexts: CONTEXTS,
  });
}

// A link right-click targets the link; anything else targets the page. A
// selection names the entry when we have no title of our own to use.
function entryFrom(info, tab) {
  const selection = (info.selectionText || "").trim();

  if (info.linkUrl) {
    return {
      url: info.linkUrl,
      title: selection || prettyUrl(info.linkUrl),
      note: "",
    };
  }

  const url = info.pageUrl || tab?.url || "";
  return {
    url,
    title: tab?.title?.trim() || prettyUrl(url),
    note: selection,
  };
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === REFRESH) {
      await fetchCool();
      notify("cool", "lists refreshed");
      return;
    }
    if (!String(info.menuItemId).startsWith(LIST_PREFIX)) return;

    const listId = String(info.menuItemId).slice(LIST_PREFIX.length);
    const entry = entryFrom(info, tab);

    // Only the tab in front of us can be captured, so a right-clicked link —
    // whose page is not open — gets saved without a screenshot.
    const shot = info.linkUrl ? null : await capture();

    await mutate(`cool: add "${entry.title}" to ${listId}`, (data, files) => {
      const id = addItem(data, listId, entry, shot);
      if (shot) files.push({ path: shotPath(id), base64: shot.base64 });
    });
    notify("cool", `added "${entry.title}" to ${listId}`);
  } catch (error) {
    notify("cool — failed", error.message);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await buildMenus();
  // Best effort: an unconfigured token just leaves the menu empty until setup.
  await fetchCool().catch(() => {});
});

chrome.runtime.onStartup.addListener(buildMenus);

// The popup writes the cache after every mutation, which is how the submenu
// learns about lists created or renamed there.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.cool) buildMenus();
});
