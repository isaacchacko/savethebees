import IconLink from '@/components/IconLink';

import { AiOutlineLinkedin } from 'react-icons/ai';
import { FiGithub } from 'react-icons/fi';
import { BiFile, BiMailSend } from 'react-icons/bi';

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

type FooterProps = {
  /**
   * Icon row + copyright. Omit on the home page to show only {@link SiteAttributionFooter}
   * (CC BY / stack credit moved out of Hero).
   */
  ICON_WIDTH_HEIGHT?: string;
};

const Footer = ({ ICON_WIDTH_HEIGHT }: FooterProps) => (
  <div className="flex shrink-0 flex-col items-center">
    {ICON_WIDTH_HEIGHT ? (
      <div className="flex flex-row justify-center">
        <div
          style={{ pointerEvents: 'auto' }}
          className="contactInfo h-30 flex flex-col items-center justify-end gap-3 py-5"
        >
          <div className="flex flex-row gap-5">
            <IconLink
              className={ICON_WIDTH_HEIGHT}
              IconComponent={AiOutlineLinkedin}
              href="https://www.linkedin.com/in/isaacchacko"
              isNewTab={true}
            />
            <IconLink
              className={ICON_WIDTH_HEIGHT}
              IconComponent={BiFile}
              href="/Isaac_Chacko.pdf"
              isNewTab={true}
            />
            <IconLink
              className={ICON_WIDTH_HEIGHT}
              IconComponent={FiGithub}
              href="https://www.github.com/isaacchacko"
              isNewTab={true}
            />
            <IconLink
              className={ICON_WIDTH_HEIGHT}
              IconComponent={BiMailSend}
              href="mailto:isaac.chacko05@tamu.edu"
              isNewTab={true}
            />
          </div>
          <p>Copyright &copy; 2026 Isaac Chacko</p>
        </div>
      </div>
    ) : (
      <SiteAttributionFooter />
    )}
  </div>
);

export default Footer;
