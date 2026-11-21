import Crumb from "@/components/site/Crumb";
import { sans } from "./fonts/sans";
import "./(site)/site.css";

export const metadata = { title: "Not here · Isaac Chacko" };

export default function NotFound() {
  return (
    <div className={`site ${sans.variable}`}>
      <div className="page">
        <main>
          <header className="heading">
            <Crumb href="/">Home</Crumb>
            <h1 className="title">Not here</h1>
          </header>
          <p>Either this page is private or it doesn&apos;t exist.</p>
        </main>
      </div>
    </div>
  );
}
