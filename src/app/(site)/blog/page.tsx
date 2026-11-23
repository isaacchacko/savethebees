import type { CSSProperties } from "react";
import Crumb from "@/components/site/Crumb";
import Footer from "@/components/site/Footer";
import Row from "@/components/site/Row";
import { getAllDumps } from "@/lib/dumps";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Blog · Isaac Chacko",
  description: "Writing by Isaac Chacko.",
};

// The heading carries the name the home page's Blog row title has, so the word Blog travels from the
// row to the top of the page.
export default function Blog() {
  const posts = getAllDumps();
  return (
    <div className="page">
      <main>
        <header className="heading">
          <Crumb href="/">Home</Crumb>
          <h1 className="title" style={{ viewTransitionName: "blog-title" } as CSSProperties}>
            Blog
          </h1>
        </header>
        <ul className="rows">
          {posts.map((post) => (
            <Row key={post.slug} href={`/blog/${post.slug}`} meta={formatDate(post.date)} morph={`post-${post.slug}`}>
              {post.title}
            </Row>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
