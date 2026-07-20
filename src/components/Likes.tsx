import Link from "next/link";

export default function Likes() {
  return (
    <>
      <p style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>i like</p>
      <ul style={{ margin: 0 }}>
        <li>running (training for chevron shoutout boping)</li>
        <li>
          shopping at{" "}
          <a
            href="https://www.amoeba.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            amoeba
          </a>{" "}
          and going to concerts (shoutout laufey inji 6th street trio suki)
        </li>
        <li>
          updating my <Link href="/arch">dotfiles</Link>
        </li>
        <li>my family</li>
        <li>drinking water at dolores</li>
      </ul>
    </>
  );
}
