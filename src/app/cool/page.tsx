import HoverPreview from "@/components/HoverPreview";
import Markdown from "@/components/Markdown";
import Shell from "@/components/Shell";
import { getCoolLists, type CoolItem } from "@/lib/cool";

export const metadata = {
  title: "cool — isaacchacko.com",
  description: "Lists of cool things I find.",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function Entry({ item }: { item: CoolItem }) {
  const host = hostname(item.url);
  const text = item.label || item.title;
  const link = item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  ) : (
    text
  );

  return (
    <li>
      {item.shot ? (
        <HoverPreview trigger={link}>
          {/* width/height are the real pixel dimensions, so the popover can
              measure itself before the image has loaded. next/image would put
              the optimizer in front of a file the extension already shrank to
              640px webp, so a plain img it is. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.shot}
            alt=""
            width={item.shotW || undefined}
            height={item.shotH || undefined}
            loading="lazy"
            style={{ display: "block", width: "100%" }}
          />
        </HoverPreview>
      ) : (
        link
      )}
      {host ? (
        <span style={{ color: "var(--muted)" }}> ({host})</span>
      ) : null}
      {item.note ? (
        <span>
          {" — "}
          <Markdown content={item.note} inline />
        </span>
      ) : null}
    </li>
  );
}

export default function CoolPage() {
  const lists = getCoolLists();

  return (
    <Shell cmd="ls -R cool/">
      <h2 style={{ marginTop: 0 }}>cool</h2>
      <p>
        things i find and want to keep. i add them from chrome as i run into
        them, so this grows on its own.
      </p>
      {lists.length === 0 ? (
        <p>nothing here yet.</p>
      ) : (
        lists.map((list) => (
          <section key={list.id}>
            <h3>{list.title}</h3>
            {list.description ? (
              <p>
                <Markdown content={list.description} inline />
              </p>
            ) : null}
            {list.items.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>empty for now.</p>
            ) : (
              <ul className="cool-entries">
                {list.items.map((item) => (
                  <Entry key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </Shell>
  );
}
