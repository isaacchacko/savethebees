/** CC BY / stack credit (was inline in Hero). */
export function SiteAttributionFooter() {
  return (
    <footer
      className="relative z-10 shrink-0 px-4 py-5 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400"
      style={{ pointerEvents: 'auto' }}
    >
      <p>
        Made with{' '}
        <span className="text-red-600 dark:text-red-400" role="img" aria-label="love">
          ♥
        </span>{' '}
        with NextJS! Licensed under{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--foreground)] underline decoration-gray-400/60 underline-offset-2 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
        >
          CC BY 4.0
        </a>
        .
      </p>
    </footer>
  );
}

export default function Footer() {
  return (
    <div className="flex shrink-0 flex-col items-center">
      <SiteAttributionFooter />
    </div>
  );
}
