'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const linkClass =
  'font-semibold text-(--accent) underline decoration-2 underline-offset-[3px] transition-colors hover:text-(--foreground)';

/** Matches hero image caption overlay (`Hero.tsx`). */
const ABOUT_IMAGE_CAPTION_BAR_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black px-2 py-1 text-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2.5 2xl:px-4 2xl:py-3';
const ABOUT_IMAGE_CAPTION_TEXT_CLASS =
  'select-none font-mono text-[0.5rem] tracking-[0.05em] text-white sm:text-[0.55rem] sm:tracking-[0.07em] md:text-[0.625rem] md:tracking-[0.08em] lg:text-xs lg:tracking-[0.09em] xl:text-xs xl:tracking-[0.09em] 2xl:text-sm 2xl:tracking-[0.1em]';

export default function About() {
  return (
    <div className="relative min-h-screen bg-(--background)">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 md:px-8 lg:max-w-5xl lg:pt-14">
        <div className="mb-10 flex flex-col justify-around space-y-4 sm:mb-12 sm:flex-row lg:mb-14">
          <div className="relative flex flex-col justify-center">
            <header className="relative z-10 space-y-4">
              <h1 className="text-balance text-3xl font-black tracking-tight text-(--primary-color) sm:text-4xl md:text-5xl">
                About me
              </h1>
              <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg md:leading-[1.65]">
                Hackathons, organizing, and everything in between.
              </p>
            </header>
          </div>
          <div className="flex flex-row justify-center">
            <div className="group relative overflow-hidden rounded-lg ring-2 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/profile-picture.jpg"
                alt="Isaac Chacko"
                width={256}
                height={256}
                className="object-cover"
              />
              <div className={ABOUT_IMAGE_CAPTION_BAR_CLASS} aria-hidden>
                <span className={ABOUT_IMAGE_CAPTION_TEXT_CLASS}>
                  CALIFORNIA ADVENTURE
                </span>
              </div>
            </div>
          </div>
        </div>


        <article className="space-y-10 text-[var(--foreground)] sm:space-y-12">
          <section className="space-y-3">
            <p className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              Howdy! My biggest passion outside of school is attending (and
              occasionally winning) hackathons. I like to spend most of my weekends either <span className='italic'>at</span> hackathons (check out my{' '}
              <a
                href="https://www.devpost.com/isaacchacko"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Devpost
              </a>
              ) or <span className='italic'>organizing</span> hackathons at{' '}
              <a
                href="https://tidaltamu.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                tidalTAMU
              </a>
              . Outside of hackathons, I like to take math classes out of my
              league, board around campus, and eat lots of Blue
              Bell.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-color) sm:text-3xl">
              Links &amp; contact
            </h2>
            <p className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              Want to learn more? Check out my{' '}
              <a
                href="/Isaac_Chacko.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                resume
              </a>
              ,{' '}
              <a
                href="https://www.linkedin.com/in/isaacchacko"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                LinkedIn
              </a>
              , and{' '}
              <a
                href="https://www.github.com/isaacchacko"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                GitHub
              </a>
              , or for further questions,{' '}
              <a
                href="mailto:isaac.chacko05@tamu.edu"
                className={linkClass}
              >
                email me
              </a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
