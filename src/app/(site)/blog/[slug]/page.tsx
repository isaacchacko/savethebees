import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Crumb from "@/components/site/Crumb";
import Footer from "@/components/site/Footer";
import Prose from "@/components/site/Prose";
import { getDump, getDumpSlugs } from "@/lib/dumps";
import { formatDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDumpSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = getDump((await params).slug);
  return post ? { title: `${post.title} · Isaac Chacko`, description: post.description } : {};
}

// The post carries the name its row on the blog list has, so the row grows into the post and the
// post shrinks back into its row; the title travels between the two the same way.
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getDump(slug);
  if (!post) notFound();
  return (
    <div className="page reading">
      <main>
        <header className="heading">
          <Crumb href="/blog">Blog</Crumb>
          <h1 className="title" style={{ viewTransitionName: `post-${slug}-title` } as CSSProperties}>
            {post.title}
          </h1>
          <p className="subtitle">{formatDate(post.date)}</p>
        </header>
        <article style={{ viewTransitionName: `post-${slug}` } as CSSProperties}>
          <Prose content={post.content} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
