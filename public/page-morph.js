// Moving between a row and the page it opens, as one object.
//
// Opening: clicking a `[data-morph-row]` link remembers where the row was. The next page, when it is
// revealed, starts the cross-document view transition as "grow": the new page is clipped to the row's
// rectangle and opens out to fill the screen.
//
// Going back: leaving a page remembers its path. When the next page is revealed and has a row that
// links to that path, the transition is "collapse": the old page closes into that row's rectangle.
//
// Anything else gets the browser's crossfade. The CSS lives in site.css; this file only says which of
// the two it is and where the row is, as `--morph-*` insets on the root element.
(() => {
  if (!("onpagereveal" in window)) return;

  const ROW_KEY = "morph-row";
  const FROM_KEY = "morph-from";

  const read = (key) => {
    try {
      const value = sessionStorage.getItem(key);
      sessionStorage.removeItem(key);
      return value && JSON.parse(value);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const insets = (rect) => ({
    top: rect.top,
    right: innerWidth - rect.right,
    bottom: innerHeight - rect.bottom,
    left: rect.left,
  });

  // Through a constructed stylesheet rather than the root's style attribute, which the page's own
  // hydration would find changed.
  const setInsets = ({ top, right, bottom, left }) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(
      `:root { --morph-top: ${top}px; --morph-right: ${right}px; --morph-bottom: ${bottom}px; --morph-left: ${left}px; }`,
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  };

  addEventListener(
    "click",
    (e) => {
      const row = e.target.closest?.("a[data-morph-row]");
      if (!row || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      write(ROW_KEY, { path: new URL(row.href).pathname, insets: insets(row.getBoundingClientRect()) });
    },
    true,
  );

  addEventListener("pageswap", () => write(FROM_KEY, location.pathname));

  addEventListener("pagereveal", (e) => {
    const transition = e.viewTransition;
    const opened = read(ROW_KEY);
    const from = read(FROM_KEY);
    if (!transition) return;

    if (opened && opened.path === location.pathname) {
      setInsets(opened.insets);
      transition.types.add("grow");
      return;
    }

    const row = from && [...document.querySelectorAll("a[data-morph-row]")].find((a) => new URL(a.href).pathname === from);
    if (row) {
      setInsets(insets(row.getBoundingClientRect()));
      transition.types.add("collapse");
    }
  });
})();
