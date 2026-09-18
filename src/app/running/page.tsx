import Shell from "@/components/Shell";

export default function RunningPage() {
  return (
    <Shell cmd="cat races.log">
      <h2 style={{ marginTop: 0 }}>running</h2>
      <p>running is nice! wish i was faster so i could fit my runs in more.</p>
      <ul>
        <li>2022: sf half</li>
        <li>2023: aramco half</li>
        <li>
          2026: aramco half w/ my friends shoutout boping andrew akhila william
          ishaan
        </li>
        <li>2027: chevron full w/ boping</li>
      </ul>
    </Shell>
  );
}
