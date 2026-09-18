'use client';

import { useEffect } from 'react';
import { THEME_MS, themeAt } from '@/lib/themes';

/**
 * The inline script in the layout picks the theme before first paint; this
 * only handles the handover for anyone still on the page when it rolls over.
 */
export default function ThemeRotator() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const apply = () => {
      const root = document.documentElement;
      root.dataset.theme = themeAt(Date.now());

      // keep mobile browser chrome in step with the palette
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute(
        'content',
        getComputedStyle(root).getPropertyValue('--background').trim()
      );

      // wake on the boundary itself, not every tick
      timer = setTimeout(apply, THEME_MS - (Date.now() % THEME_MS) + 50);
    };

    apply();
    return () => clearTimeout(timer);
  }, []);

  return null;
}
