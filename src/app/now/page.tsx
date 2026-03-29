import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      <Footer />
    </div>
  );
}
