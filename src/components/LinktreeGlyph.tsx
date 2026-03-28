'use client';

import { useId } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaFileAlt,
  FaMale,
  FaRss,
} from 'react-icons/fa';
import { MdFolderSpecial } from 'react-icons/md';
import { SiArchlinux } from 'react-icons/si';
import type { LinktreeGlyphId } from '@/data/linktreeLinks';

function AggierRingGlyph({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const maskId = `aggier-ring-mask-${uid}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <circle cx="12" cy="12" r="4.25" fill="black" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

const GLYPH_MAP: Record<
  LinktreeGlyphId,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  resume: FaFileAlt,
  projects: MdFolderSpecial,
  arch: SiArchlinux,
  about: FaMale,
  now: FaRss,
  github: FaGithub,
  linkedin: FaLinkedin,
  email: FaEnvelope,
  aggier: AggierRingGlyph,
};

type LinktreeGlyphProps = {
  id: LinktreeGlyphId;
  className?: string;
};

/** Renders the icon for a link definition (`linktreeLinks` `glyph` field). */
export function LinktreeGlyph({ id, className }: LinktreeGlyphProps) {
  const Cmp = GLYPH_MAP[id];
  return <Cmp className={className} aria-hidden />;
}
