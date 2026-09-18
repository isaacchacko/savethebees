export const THEMES = ['pink', 'banana', 'dryft', 'maroon', 'matcha'] as const;

export const THEME_MS = 5 * 60 * 1000;

/**
 * Derived from the wall clock rather than stored, so every visitor sees the
 * same theme at the same moment and the server and client always agree.
 */
export function themeAt(epochMs: number) {
  return THEMES[Math.floor(epochMs / THEME_MS) % THEMES.length];
}
