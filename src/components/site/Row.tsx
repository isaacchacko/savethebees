import type { CSSProperties, ReactNode } from "react";

// An external link points up and out; a link inside the site, or a list that opens in place, points on.
export function OutIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 12 4M5 4h7v7" />
    </svg>
  );
}

export function OnIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 3.5 5.5 8 10 12.5" />
    </svg>
  );
}

/**
 * A `morph` row opens a page that grows out of it, and that page shrinks back into it on the way
 * back (public/page-morph.js). Its title carries `<morph>-title`, the name the page's heading has, so
 * the words travel between the two. Internal links are plain anchors: each one is a real navigation
 * the browser can animate.
 */
export default function Row({
  href,
  children,
  meta,
  morph,
}: {
  href: string;
  children: ReactNode;
  meta?: ReactNode;
  morph?: string;
}) {
  const external = /^https?:/.test(href) || href.endsWith(".pdf");
  const titleStyle = morph ? ({ viewTransitionName: `${morph}-title` } as CSSProperties) : undefined;
  return (
    <li>
      <a
        href={href}
        className="row"
        data-morph-row={morph ? "" : undefined}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span style={titleStyle}>{children}</span>
        <span className="row-meta">{meta}</span>
        {external ? <OutIcon /> : <OnIcon />}
      </a>
    </li>
  );
}
