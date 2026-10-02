/** Small line icons for buttons, drawn in currentColor so they follow the button's text color. */

export function ExitGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
      <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function UndoGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path d="M4 1.8 1.6 4.2 4 6.6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M2 4.2h5.2a3 3 0 0 1 0 6H4.6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function RefreshGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path d="M10 6a4 4 0 1 1-1.2-2.85" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10.2 1.2v2.6H7.6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
