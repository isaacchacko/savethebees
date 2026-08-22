import Link from "next/link";
import SfClock from "@/components/SfClock";

export type NavbarProps = {
  spotifyPlayback?: unknown;
  isHoveringMusic?: boolean;
  linktreePathSegment?: string | null;
};

// Pages get added back here one at a time as they are revamped.
const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/now", label: "now" },
  { href: "/running", label: "running" },
  { href: "/learnings", label: "learnings" },
];

export default function Navbar(_props: NavbarProps = {}) {
  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "1rem 1.25rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: "1rem",
      }}
    >
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          margin: 0,
          padding: 0,
          listStyle: "none",
          fontSize: "0.95rem",
        }}
      >
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <span style={{ marginLeft: "auto" }}>
        <SfClock />
      </span>
    </nav>
  );
}
