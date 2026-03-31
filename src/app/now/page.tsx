import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const linkClass =
  'font-semibold text-(--accent) underline decoration-2 underline-offset-[3px] transition-colors hover:text-(--foreground)';

export default function NowPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Navbar />
      <main className="relative mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 md:px-8 lg:max-w-5xl lg:pt-14">
        <header className="mb-10 space-y-4 sm:mb-12 lg:mb-14">
          <h1 className="text-balance text-3xl font-black tracking-tight text-(--primary-color) sm:text-4xl md:text-5xl">
            Now
          </h1>
          <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg md:leading-[1.65]">
            This is a{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              now page
            </a>
            .
          </p>
        </header>

        <article className="space-y-10 text-[var(--foreground)] sm:space-y-12">
          <section className="space-y-3" aria-label="Current priorities">
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              <li>
                school: almost done with this semester, just keeping my grades up
              </li>
              <li>tidal: onboarding new officers!</li>
              <li>
                music: hunting for{' '}
                <a
                  href="https://www.injiverse.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  INJI
                </a>{' '}
                tickets at sf!
              </li>
              <li>
                other: spending time with friends before i join{' '}
                <a
                  href="https://www.dryft.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  dryft
                </a>
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
