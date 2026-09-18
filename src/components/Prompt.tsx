'use client';

import { usePathname } from 'next/navigation';

// "/" -> "~", "/learnings/foo" -> "~/learnings/foo"
function cwd(pathname: string) {
  return pathname === '/' ? '~' : `~${pathname}`;
}

export default function Prompt({ cmd }: { cmd: string }) {
  const pathname = usePathname();

  return (
    <p className="prompt">
      <span className="prompt-user">isaac@sf</span>
      <span className="prompt-sigil">:</span>
      <span className="prompt-path">{cwd(pathname)}</span>
      <span className="prompt-sigil">$ </span>
      <span className="prompt-cmd">{cmd} </span>
      <span className="cursor" aria-hidden />
    </p>
  );
}
