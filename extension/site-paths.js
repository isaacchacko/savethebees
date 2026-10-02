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

  if (["/about", "/now", "/running", "/library"].includes(path)) {
    return { page: path.slice(1) };
  }

  // the old names redirect on the site, so an old url still resolves here too
  if (path === "/cool") return { page: "library" };
  if (["/blog", "/dumps", "/learnings"].includes(path)) return { page: "blog" };

  const post = /^\/(?:blog|dumps|learnings)\/([^/]+)$/.exec(path);
  if (post) return { page: "blog", slug: decodeURIComponent(post[1]) };

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
