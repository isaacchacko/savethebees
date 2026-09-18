import Shell from "@/components/Shell";
import NowPlaying from "@/components/NowPlaying";
import CopyButton from "@/components/CopyButton";

const SOCIALS = [
  { href: "/Isaac_Chacko.pdf", label: "resume" },
  { href: "https://www.github.com/isaacchacko", label: "github" },
  { href: "https://www.linkedin.com/in/isaacchacko", label: "linkedin" },
];

export default function Home() {
  return (
    <Shell cmd="whoami">
      <h2 style={{ marginTop: 0 }}>howdy!</h2>

      <p>
        cs/math at{" "}
        <a href="https://aggier.ing" target="_blank" rel="noopener noreferrer">
          a&amp;m
        </a>{" "}
        + fullstack engineer at{" "}
        <a href="https://dryft.ai" target="_blank" rel="noopener noreferrer">
          dryft
        </a>{" "}
        + hackathons at{" "}
        <a href="https://tidaltamu.com" target="_blank" rel="noopener noreferrer">
          tidal
        </a>
        . previously at{" "}
        <a href="https://siso-eng.com" target="_blank" rel="noopener noreferrer">
          siso
        </a>
        .
      </p>

      <p>
        i love to yap! reach me at isaac.chacko05@gmail.com
        <CopyButton value="isaac.chacko05@gmail.com" />
      </p>

      <div style={{ margin: "1rem 0" }}>
        <NowPlaying />
      </div>

      <p>- isaac</p>

      <hr />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {SOCIALS.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.label}
          </a>
        ))}
      </div>
    </Shell>
  );
}
