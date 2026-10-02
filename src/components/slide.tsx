'use client';

import Link from 'next/link';
import { createContext, useContext } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/** Slides the card's contents out toward -dir, navigates, and slides the next page in from +dir. */
export type Slide = (href: string, dir: 1 | -1) => void;

// provided by Card, which owns the animation; anything inside the card can
// navigate through it
export const SlideContext = createContext<Slide>(() => {});

export const useSlide = () => useContext(SlideContext);

/** A link that navigates with the card's slide instead of a hard cut. */
export function SlideLink({
  href,
  dir,
  className,
  style,
  children,
}: {
  href: string;
  dir: 1 | -1;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const slide = useSlide();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // leave new-tab clicks to the browser
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    slide(href, dir);
  };

  return (
    <Link href={href} onClick={onClick} className={className} style={style}>
      {children}
    </Link>
  );
}
