
import { DM_Serif_Display, Playfair_Display, Bricolage_Grotesque, Prata } from 'next/font/google'

/** DM Serif Display — CSS variable only; wired on `<html>` in `layout.tsx` for optional future use. */
export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-dm-serif-display',
})

/** @deprecated Use {@link dmSerifDisplay} */
export const ms = dmSerifDisplay

export const pd = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
})

export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
})

/** @deprecated Use {@link dmSerifDisplay} */
export const gr = dmSerifDisplay
