'use client';

/**
 * Previous projects page UI (accordion + README HTML + tech chips).
 * Not mounted by default — import on `/projects` or elsewhere when reusing.
 */

import { useState } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import { TbExternalLink } from 'react-icons/tb';

import { useRepoReadmes } from '@/hooks/useRepoReadmes';
import {
  PROJECT_REPOSITORIES,
  PROJECT_TITLES,
  PROJECT_TECH_STACK,
  PROJECT_EXTERNAL_LINKS,
  TECH_CHIP_COLORS,
  techChipTextColor,
  PROJECT_GITHUB_USER,
} from '@/data/projectsRepoMeta';

const HERO_BODY_LINK_CLASS =
  'font-black underline-growing hover:text-[var(--accent)] transition-colors inline';

const HERO_CARD_CLASS =
  'rounded-2xl bg-white/80 px-4 py-5 sm:px-6 md:px-7 md:py-6 dark:bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]';

const SECTION_KICKER_CLASS =
  'mb-3 text-sm text-gray-500 dark:text-gray-400 md:text-base';

export default function ProjectsReadmeLegacyView() {
  const repos = PROJECT_REPOSITORIES;
  const { htmlByRepo, fetchedByRepo } = useRepoReadmes(repos);
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(repos.map((r) => [r, false])),
  );
  const [hasExpanded, setHasExpanded] = useState(false);

  return (
    <div>
      <div className={`${HERO_CARD_CLASS} mb-6 sm:mb-8`}>
        <h1 className={SECTION_KICKER_CLASS}>Projects</h1>
        <p
          className="reveal-mask-target w-full text-left text-sm leading-relaxed text-reveal sm:text-[0.95rem] md:text-base lg:text-xl xl:text-2xl"
          style={{ animationDelay: '0.15s' }}
        >
          Although a complete list can be found on my{' '}
          <a
            target="_blank"
            href="https://github.com/isaacchacko"
            rel="noopener noreferrer"
            className={HERO_BODY_LINK_CLASS}
          >
            GitHub
          </a>
          , here&apos;s a brief list of my more notable projects.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8">
        {repos.map((name, index) => (
          <div key={name} className={HERO_CARD_CLASS}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  className="group flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-left"
                  onClick={() => {
                    setVisible((prev) => ({ ...prev, [name]: !prev[name] }));
                    setHasExpanded(true);
                  }}
                >
                  <span className="font-black text-(--primary-color) transition-colors duration-300 group-hover:text-[var(--accent)] md:text-2xl">
                    {PROJECT_TITLES[name]}
                  </span>
                  <span
                    className="inline-flex shrink-0 text-(--primary-color) transition-colors duration-300 group-hover:text-[var(--accent)]"
                    aria-hidden
                  >
                    {visible[name] ? (
                      <FiChevronDown className="h-6 w-6 md:h-7 md:w-7" />
                    ) : (
                      <FiChevronRight className="h-6 w-6 md:h-7 md:w-7" />
                    )}
                  </span>
                  {!hasExpanded && index === 0 ? (
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-600 animate-pulse dark:text-gray-300 md:text-xs">
                      click to expand readme
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:flex-col lg:items-end xl:flex-row">
                <a
                  href={`https://github.com/${PROJECT_GITHUB_USER}/${name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] md:text-base"
                >
                  <FaGithub
                    className="h-5 w-5 shrink-0 text-[var(--primary-color)] transition-colors group-hover:text-[var(--accent)] md:h-6 md:w-6"
                    aria-hidden
                  />
                  <span className="font-black underline-growing text-[var(--primary-color)] decoration-from-font transition-colors group-hover:text-[var(--accent)]">
                    {PROJECT_GITHUB_USER}/{name}
                  </span>
                </a>

                {PROJECT_EXTERNAL_LINKS[name] !== null ? (
                  <a
                    href={PROJECT_EXTERNAL_LINKS[name]![1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] md:text-base"
                  >
                    <TbExternalLink
                      className="h-5 w-5 shrink-0 text-[var(--primary-color)] transition-colors group-hover:text-[var(--accent)] md:h-6 md:w-6"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate font-black underline-growing text-[var(--primary-color)] transition-colors group-hover:text-[var(--accent)]">
                      {PROJECT_EXTERNAL_LINKS[name]![0]}
                    </span>
                  </a>
                ) : null}
              </div>
            </div>

            {visible[name] ? (
              <div className="markdown-body mt-5 w-full max-w-none px-0 pt-1 quick-slide-down-fade-in">
                <div className="mb-4 flex flex-row flex-wrap items-center gap-2 md:gap-3">
                  {PROJECT_TECH_STACK[name].map((techName) => (
                    <div
                      key={techName}
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-transform duration-300 hover:scale-105 md:text-sm"
                      style={{
                        background: TECH_CHIP_COLORS[techName],
                        color: techChipTextColor(TECH_CHIP_COLORS[techName]),
                      }}
                    >
                      {techName}
                    </div>
                  ))}
                </div>

                {!fetchedByRepo[name] ? (
                  <span className="my-3 block animate-pulse italic text-gray-500 dark:text-gray-400">
                    Loading README…
                  </span>
                ) : null}
                <div dangerouslySetInnerHTML={{ __html: htmlByRepo[name] }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
