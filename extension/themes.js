// Mirror of src/lib/themes.ts. The site derives its palette from the wall clock
// rather than storing it, so computing it the same way here puts the popup on
// the same theme as the site at the same moment — no messaging, no network, no
// drift. Change one and change the other; the palettes live in popup.css.

export const THEMES = ["pink", "banana", "dryft", "maroon", "matcha"];

export const THEME_MS = 5 * 60 * 1000;

export function themeAt(epochMs) {
  return THEMES[Math.floor(epochMs / THEME_MS) % THEMES.length];
}

/** Paints the current theme, then repaints on each rollover boundary. */
export function followTheme() {
  const apply = () => {
    document.documentElement.dataset.theme = themeAt(Date.now());
    // wake on the boundary itself, not every tick
    setTimeout(apply, THEME_MS - (Date.now() % THEME_MS) + 50);
  };
  apply();
}
