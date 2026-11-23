import { notFound } from "next/navigation";
import Crumb from "@/components/site/Crumb";
import Footer from "@/components/site/Footer";
import Prose from "@/components/site/Prose";
import { getPage, getPageSlugs } from "@/lib/pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPageSlugs().map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const page = getPage((await params).page);
  return page ? { title: `${page.title} · Isaac Chacko` } : {};
}

export default async function StandalonePage({ params }: { params: Promise<{ page: string }> }) {
  const page = getPage((await params).page);
  if (!page) notFound();
  return (
    <div className="page">
      <main>
        <header className="heading">
          <Crumb href="/">Home</Crumb>
          <h1 className="title">{page.title}</h1>
        </header>
        <Prose content={page.content} />
      </main>
      <Footer />
    </div>
  );
}
