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
 * `morph` names the row for page transitions: the page it opens carries the same name, so the row
 * grows into that page and the page shrinks back into it. Internal links are plain anchors, so each
 * one is a real navigation the browser can animate.
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
  const style = morph ? ({ viewTransitionName: morph } as CSSProperties) : undefined;
  const titleStyle = morph ? ({ viewTransitionName: `${morph}-title` } as CSSProperties) : undefined;
  return (
    <li>
      <a
        href={href}
        className="row"
        style={style}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span style={titleStyle}>{children}</span>
        <span className="row-meta">{meta}</span>
        {external ? <OutIcon /> : <OnIcon />}
      </a>
    </li>
  );
}
