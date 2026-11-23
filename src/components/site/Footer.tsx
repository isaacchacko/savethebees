import { getPageSlugs, getPage } from "@/lib/pages";

export default function Footer() {
  const pages = getPageSlugs()
    .map((slug) => getPage(slug))
    .filter((page) => page !== null);
  return (
    <footer className="foot">
      <span>@isaacchacko</span>
      {pages.map((page) => (
        <a key={page.slug} href={`/${page.slug}`}>
          {page.title}
        </a>
      ))}
      <a href="/rss.xml">RSS</a>
    </footer>
  );
}
