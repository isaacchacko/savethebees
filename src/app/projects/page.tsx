'use client';

/**
 * README fetch + previous UI: `@/components/projects/ProjectsReadmeLegacyView`
 * Data: `@/data/projectsRepoMeta` · API: `/api/github/repo/[name]`
 */

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Project, { type ProjectProps } from '@/components/projects/Project';

type ProjectEntry = ProjectProps & { sectionId: string; teaser: string };

/** Matches `ProjectsReadmeLegacyView` hero card + body copy. */
const INTRO_CARD_CLASS =
  '';

const HERO_BODY_LINK_CLASS =
  'font-black underline-growing hover:text-[var(--accent)] transition-colors inline';

const INTRO_BODY_CLASS =
  'reveal-mask-target w-full text-left text-sm leading-relaxed text-reveal sm:text-[0.95rem] md:text-base lg:text-xl xl:text-2xl';

const JUMP_KICKER_CLASS =
  'text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400';

const JUMP_LINK_CLASS =
  'inline-flex min-h-11 items-center rounded-full border border-[color-mix(in_srgb,var(--foreground)_14%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-3 py-2 text-sm font-black text-(--primary-color) transition-[color,background-color,border-color] hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-h-0 sm:py-1.5';

const PROJECTS: ProjectEntry[] = [
  {
    teaser: 'Agentic AI',
    sectionId: 'fold-forge-ai',
    ribbonName: 'HACKUTD 2025',
    name: 'Fold Forge AI',
    subtext: 'AI-powered protein analysis in seconds',
    stack: ['nextjs', 'tailwindcss', 'python', 'nemotron'],
    blurb:
      'Unlock deep insights into protein structures, mutations, and drug targets with our advanced AI analysis platform.',
    mediaSrc: '/projects/hackutd2025.png',
    mediaAlt: 'HackUTD 2025',
    needBorder: true,
    githubHref: 'https://github.com/isaacchacko/FoldForge-AI',
  },
  {
    teaser: "Browsers",
    sectionId: 'rabbit',
    ribbonName: 'HACKRICE 2025',
    name: 'Rabbit',
    subtext: 'The fastest way to browse knowledge',
    stack: ['nextjs', 'tailwindcss', 'express', 'electron', 'gemini'],
    blurb:
      'Hop between sources, build knowledge graphs, and burrow deeper into topics. Rabbit transforms how you search and discover information online.',
    mediaSrc: '/projects/hackrice2025.mp4',
    mediaAlt: 'HackRice 2025: Rabbit demo video',
    githubHref: 'https://github.com/isaacchacko/rabbit',
  },
  {
    teaser: "Webrings",
    sectionId: 'aggier-ing',
    ribbonName: 'THE AGGIE CONNECTION',
    name: 'Aggier.ing',
    subtext: "Thanks and Gig' Em!",
    stack: ['nextjs', 'tailwindcss', 'github', 'cloudflare'],
    blurb: 'An unofficial webring for TAMU students/alumni to strengthen the Aggie connection!',
    mediaSrc: '/projects/aggiering.png',
    mediaAlt: 'Aggier.ing landing',
    needBorder: true,
    githubHref: 'https://github.com/isaacchacko/aggiering',
    customHref: 'https://aggier.ing',
    customLinkLabel: 'View aggier.ing',
    isCustomLinkExternal: true,
  },
  {
    teaser: "Terminals",
    sectionId: 'heimdall',
    ribbonName: 'REMOTE SHELL ACCESS',
    name: 'Heimdall',
    subtext: 'Remote shell access from your browser',
    stack: ['react', 'vite', 'go', 'websockets'],
    blurb:
      "Connect to Isaac's laptop anytime, anywhere, from any device with a keyboard and an internet connection.",
    mediaSrc: '/projects/heimdall-full.png',
    mediaAlt: 'Heimdall Demo',
    needBorder: false,
    githubHref: 'https://github.com/isaacchacko/heimdall',
    customHref: 'https://heimdalli.up.railway.app',
    customLinkLabel: 'Try to login to my computer',
    isCustomLinkExternal: true,
  },
];

export default function ProjectsPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-(--background)">
      <Navbar />

      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className='flex w-full justify-center'>
          <div className="w-full sm:max-w-[75%] px-4 sm:px-6">
            <header className="shrink-0 pb-2 pt-3 sm:pb-3 sm:pt-5">
              <div className={`${INTRO_CARD_CLASS} px-3 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6`}>
                <p className={INTRO_BODY_CLASS}>
                  If you would want to peruse all of my projects, check out my{' '}
                  <a
                    href="https://github.com/isaacchacko/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={HERO_BODY_LINK_CLASS}
                  >
                    GitHub
                  </a>
                  . Otherwise, read more about some of the projects I deemed noteworthy!
                </p>

                <nav aria-label="Jump to project" className="mt-5 border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pt-4 sm:mt-6 sm:pt-5">
                  <p className={`${JUMP_KICKER_CLASS} mb-3`}>Jump to a project about</p>
                  <ul className="flex flex-row flex-wrap gap-2 sm:gap-x-2 sm:gap-y-2">
                    {PROJECTS.map(({ sectionId, teaser, name }) => (
                      <li key={sectionId}>
                        <a href={`#${sectionId}`} className={JUMP_LINK_CLASS} title={name}>
                          {teaser}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </header>

            <div className="flex w-full flex-col divide-y divide-[color-mix(in_srgb,var(--foreground)_12%,transparent)]">
              {PROJECTS.map(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- teaser: jump nav only
                ({ sectionId, teaser, ...project }) => (
                  <Project key={sectionId} sectionId={sectionId} {...project} />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
