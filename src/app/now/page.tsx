import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ICON_WIDTH_HEIGHT =
  'w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ';

export default function NowPage() {
  return (
    <div className="bg-(--background) min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-black text-(--primary-color) md:text-5xl">Now</h1>
        <p className="mt-6 text-base leading-relaxed text-(--foreground)">
          A snapshot of what I&apos;m focused on lately. More soon.
        </p>
      </main>
      <Footer ICON_WIDTH_HEIGHT={ICON_WIDTH_HEIGHT} />
    </div>
  );
}
