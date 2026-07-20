import Navbar from "@/components/Navbar";
import NowPlaying from "@/components/NowPlaying";
import CopyButton from "@/components/CopyButton";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: "42rem",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.25rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>howdy!</h2>

        <p>
          cs/math at <a
                  href="https://aggier.ing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
            a&amp;m
                </a> + fullstack engineer at{" "}
          <a href="https://dryft.ai" target="_blank" rel="noopener noreferrer">
            dryft
          </a>
          {" "}+ hackathons at {" "}

                <a
                  href="https://tidaltamu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
              tidal
                </a>. previously at {" "}
          <a href="https://siso-eng.com" target="_blank" rel="noopener noreferrer">
            siso
          </a>
          .</p>

        <p>
          i love to yap! reach me at isaac.chacko05@gmail.com
          <CopyButton value="isaac.chacko05@gmail.com" />
        </p>
        <div style={{ margin: "1rem 0" }}>
          <NowPlaying />
        </div>
        - isaac
        <hr />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end ",
            gap: "1rem",
          }}
        >
          <a
            href="/Isaac_Chacko.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            resume
          </a>
          <a
            href="https://www.github.com/isaacchacko"
            target="_blank"
            rel="noopener noreferrer"
          >
            github
          </a>
          <a
            href="https://www.linkedin.com/in/isaacchacko"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin
          </a>
        </div>
      </main>
    </div>
  );
}
