import NowPlaying from "@/components/NowPlaying";
import CopyButton from "@/components/CopyButton";

export default function Home() {
  return (
    <>
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
        i love to yap! reach me at isaac.chacko05@gmail.com{" "}
        <CopyButton value="isaac.chacko05@gmail.com" />
      </p>

      <NowPlaying />

      <p>- isaac</p>
    </>
  );
}
