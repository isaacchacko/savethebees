import Navbar from "@/components/Navbar";

export default function RunningPage() {
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
        <h2 style={{ marginTop: 0 }}>running</h2>
        <p>
          running is nice! wish i was faster so i could fit my runs in more.
        </p>
        <ul>
          <li>2022: sf half</li>
          <li>2023: aramco half</li>
          <li>2026: aramco half w/ my friends shoutout boping andrew akhila william ishaan</li>
          <li>2027: chevron full w/ boping</li>
        </ul>
      </main>
    </div>
  );
}
