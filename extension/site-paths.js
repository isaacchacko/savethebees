// Which part of the admin view edits a given page of the site. Shared, because
// the popup needs it to decide whether "edit this page" applies at all, and the
// admin view needs it to land on the right thing once opened.

/**
 * Returns {page, slug?} for an editable path, or null for one the admin view
 * has nothing to say about — home, /arch, a 404. The popup hides the button in
 * that case rather than opening an editor on nothing.
 */
export function editorFor(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (["/about", "/now", "/running", "/cool"].includes(path)) {
    return { page: path.slice(1) };
  }

  // learnings redirects to dumps on the site, so an old url still resolves
  if (path === "/dumps" || path === "/learnings") return { page: "dumps" };

  const dump = /^\/(?:dumps|learnings)\/([^/]+)$/.exec(path);
  if (dump) return { page: "dumps", slug: decodeURIComponent(dump[1]) };

  return null;
}

/** True when a tab is showing the site this extension edits. */
export function isOwnSite(tabUrl, siteUrl) {
  try {
    return new URL(tabUrl).host === new URL(siteUrl).host;
  } catch {
    return false;
  }
}
