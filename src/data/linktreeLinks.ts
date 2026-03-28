/**
 * Single source of truth for Linktree rows and the nav hamburger menu.
 * `glyph` identifies which icon to render (see LinktreeGlyph).
 */

export type LinkKind = 'internal' | 'external';

export type LinktreeGlyphId =
  | 'resume'
  | 'projects'
  | 'arch'
  | 'about'
  | 'now'
  | 'github'
  | 'linkedin'
  | 'email'
  | 'aggier';

export type LinktreeLink = {
  href: string;
  label: string;
  kind: LinkKind;
  /** Maps to an icon in `LinktreeGlyph` */
  glyph: LinktreeGlyphId;
};

export const LINKTREE_INTERNAL_LINKS: readonly LinktreeLink[] = [
  { href: '/Isaac_Chacko.pdf', label: 'resume', kind: 'internal', glyph: 'resume' },
  { href: '/projects', label: 'projects', kind: 'internal', glyph: 'projects' },
  { href: '/arch', label: 'arch', kind: 'internal', glyph: 'arch' },
  { href: '/about', label: 'about', kind: 'internal', glyph: 'about' },
  { href: '/now', label: 'now', kind: 'internal', glyph: 'now' },
] as const;

export const LINKTREE_EXTERNAL_LINKS: readonly LinktreeLink[] = [
  { href: 'https://github.com/isaacchacko', label: 'github', kind: 'external', glyph: 'github' },
  {
    href: 'https://www.linkedin.com/in/isaacchacko',
    label: 'linkedin',
    kind: 'external',
    glyph: 'linkedin',
  },
  { href: 'mailto:isaac.chacko05@tamu.edu', label: 'email', kind: 'external', glyph: 'email' },
  { href: 'https://aggier.ing', label: 'aggier.ing', kind: 'external', glyph: 'aggier' },
] as const;
