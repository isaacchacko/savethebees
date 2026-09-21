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

  return (
    <li>
      {item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      ) : (
        item.title
      )}
      {host ? (
        <span style={{ color: "var(--muted)" }}> ({host})</span>
      ) : null}
      {item.note ? <span> — {item.note}</span> : null}
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
            {list.description ? <p>{list.description}</p> : null}
            {list.items.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>empty for now.</p>
            ) : (
              <ul>
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
