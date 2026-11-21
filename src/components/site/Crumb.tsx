import { BackIcon } from "./Row";

/** The way back up, at the top of a page: a chevron and the name of where it goes. */
export default function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="crumb">
      <BackIcon />
      <span>{children}</span>
    </a>
  );
}
