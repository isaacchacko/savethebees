'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/** Place `main.mp4` (or change this path) under `public/arch/`. */
const ARCH_VIDEO_SRC = '/arch/rice.mp4';

const linkClass =
  'font-semibold text-(--accent) underline decoration-2 underline-offset-[3px] transition-colors hover:text-(--foreground)';

export default function ArchPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 md:px-8 lg:max-w-5xl lg:pt-14">
        {/* Opening blurb */}
        <header className="mb-10 space-y-4 sm:mb-12 lg:mb-14">
          <h1 className="text-balance text-3xl font-black tracking-tight text-(--primary-color) sm:text-4xl md:text-5xl">
            Arch Linux &amp; ricing
          </h1>
          <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg md:leading-[1.65]">
            Check out my setup!
          </p>
        </header>

        {/* Main content: video */}
        <section
          className="mb-12 sm:mb-14 lg:mb-16"
          aria-label="Arch rice walkthrough video"
        >
          <div className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,transparent)] shadow-[0_1px_3px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <video
              className="aspect-video w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
            >
              <source src={ARCH_VIDEO_SRC} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Markdown-style body */}
        <article className="space-y-10 text-[var(--foreground)] sm:space-y-12">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-color) sm:text-3xl">
              Stack &amp; workflow
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              <li>
                OS:{' '}
                <a
                  href="https://archlinux.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Arch
                </a>{' '}
                with{' '}
                <a
                  href="https://hypr.land/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Hyprland
                </a>{' '}
              </li>
              <li>
                Terminal:{' '}
                <a
                  href="https://sw.kovidgoyal.net/kitty/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Kitty
                </a>
              </li>
              <li>
                IDE:{' '}
                <a
                  href="http://www.lazyvim.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  LazyVim
                </a>
                , a batteries-included Neovim distribution
              </li>
              <li>
                Status bar:{' '}
                <a
                  href="https://waybar.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  waybar
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-color) sm:text-3xl">
              Tools worth naming
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              <li>
                <a
                  href="https://yazi-rs.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  yazi
                </a>{' '}
                for vim-style browsing in the terminal
              </li>
              <li>
                <a
                  href="https://github.com/lsd-rs/lsd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  lsd
                </a>{' '}
                as a batteries-included Neovim distribution.
              </li>
              <li>
                <a
                  href="https://github.com/fastfetch-cli/fastfetch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  fastfetch
                </a>{' '}
                to replace neofetch
              </li>
              <li>
                <a
                  href="https://github.com/nsxiv/nsxiv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  nsxiv
                </a>{' '}
                for my wallpaper selector
              </li>
              <li>
                <a
                  href="https://github.com/dylanaraps/pywal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  pywal
                </a>{' '}
                to generate color schemes
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-(--primary-color) sm:text-2xl">
              Wallpapers &amp; colors
            </h3>
            <p className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              I pull wallpapers from{' '}
              <a
                href="https://wallhaven.cc"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                wallhaven.cc
              </a>{' '}
              and sync palettes across apps.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-(--primary-color) sm:text-2xl">
              More reading
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              <li className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
                Curated setups and inspiration live on communities like{' '}
                <a
                  href="https://www.reddit.com/r/unixporn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  reddit
                </a>
              </li>
              <li className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
                Nice nerd fonts and glyphs to choose from over at{' '}
                <a
                  href="https://www.nerdfonts.com/#home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  nerdfonts.com
                </a>
              </li>
              <li className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
                Nice neovim plugins and colorschemes at{' '}
                <a
                  href="https://nvim.store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  nvim.store
                </a>
              </li>
            </ul>

          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-(--primary-color) sm:text-2xl">
              dotfiles?
            </h3>
            <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg md:leading-[1.65]">
              Sorry for gatekeeping my configuration files! I've never gotten around to cleaning them up and uploading them, so they&apos;re on request for now.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
