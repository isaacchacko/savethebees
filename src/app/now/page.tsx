import Navbar from "@/components/Navbar";

export default function NowPage() {
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
        <h2 style={{ marginTop: 0 }}>now</h2>
        <p>
          this is a{" "}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            now page
          </a>
          .
        </p>

        <h3>08/18/2026</h3>
        <ul>
          <li>
            had my friends visit me in sf + went to muir woods!
          </li>
          <li>another onsite soon</li>
          <li>officially started my marathon training yesterday!</li>
        </ul>

        <hr />
        <h3>07/19/2026</h3>
        <ul>
          <li>
            dryft is most if not all of my time commitment. prepping for a
            customer onsite soon!
          </li>
          <li>going to suki&apos;s concert at stern grove soon!</li>
          <li>odyssey was so good. watched on 70mm</li>
        </ul>

        <h3>03/31/2026</h3>
        <ul>
          <li>
            school: almost done with this semester, just keeping my grades up
          </li>
          <li>tidal: onboarding new officers!</li>
          <li>
            music: hunting for{" "}
            <a
              href="https://www.injiverse.net/"
              target="_blank"
              rel="noopener noreferrer"
            >
              inji
            </a>{" "}
            tickets at sf!
          </li>
          <li>
            other: spending time with friends before i join{" "}
            <a
              href="https://www.dryft.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              dryft
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
