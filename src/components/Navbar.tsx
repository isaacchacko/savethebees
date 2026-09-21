'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import SfClock from "@/components/SfClock";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/now", label: "now" },
  { href: "/running", label: "running" },
  { href: "/learnings", label: "learnings" },
  { href: "/cool", label: "cool" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="titlebar">
      <span className="titlebar-dots" aria-hidden>
        <span className="titlebar-dot" data-live="true" />
        <span className="titlebar-dot" />
        <span className="titlebar-dot" />
      </span>
      <ul className="nav-links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <span style={{ marginLeft: "auto", fontSize: "0.9rem" }}>
        <SfClock />
      </span>
    </nav>
  );
}
