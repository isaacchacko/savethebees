import HomeLinks from "@/components/site/HomeLinks";
import SshSnippet from "@/components/site/SshSnippet";
import Footer from "@/components/site/Footer";

export const metadata = {
  title: "Isaac Chacko",
  description: "Isaac Chacko: founding engineer at Dryft. Projects, writing and links.",
};

export default function Home() {
  return (
    <div className="page">
      <main>
        <section className="identity" aria-label="Isaac Chacko">
          <SshSnippet />
          <h1 className="name">Isaac</h1>
        </section>
        <HomeLinks />
      </main>
      <Footer />
    </div>
  );
}
