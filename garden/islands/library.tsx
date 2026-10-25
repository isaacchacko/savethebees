type Item = { id: string; title: string; label?: string; url: string; note: string; shot?: string }
type List = { id: string; title: string; description: string; items: Item[] }

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** A note's `[text](url)` links, as links; the rest as it is. */
function Note({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\))/)
  return (
    <>
      {parts.map((part) => {
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
        return link ? (
          <a class="external" href={link[2]} target="_blank" rel="noopener noreferrer">
            {link[1]}
          </a>
        ) : (
          part
        )
      })}
    </>
  )
}

/**
 * The bookshelf, from content/cool.json (which the chrome extension writes).
 * Rendered at build time, so it's all there with no script. Hovering an entry
 * shows the screenshot taken when it was saved.
 */
export default function Library({ data }: { data: { lists: List[] } }) {
  return (
    <div class="library">
      {data.lists.map((list) => {
        const items = list.items
        return (
          <section key={list.id}>
            <h2 id={list.id}>{list.title}</h2>
            {list.description ? <p>{list.description}</p> : null}
            {items.length === 0 ? (
              <p class="sidebar-empty">Empty for now.</p>
            ) : (
              <ul class="shelf">
                {items.map((item) => {
                  const h = host(item.url)
                  return (
                    <li key={item.id}>
                      <span
                        class="favicon"
                        style={h ? { backgroundImage: `url(https://www.google.com/s2/favicons?domain=${h}&sz=32)` } : undefined}
                      />
                      <span class="shelf-entry">
                        <a class="external" href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.label || item.title}
                        </a>
                        {item.shot ? (
                          // shown in the secondary column while the entry is hovered
                          <span
                            class="shelf-preview"
                            data-secondary="site"
                            data-secondary-title={item.label || item.title}
                            data-secondary-key={item.id}
                          >
                            <img class="shelf-shot" src={item.shot} alt={`a screenshot of ${h}`} />
                            <span class="shelf-host">{h}</span>
                          </span>
                        ) : null}
                      </span>
                      {item.note ? (
                        <span class="shelf-note">
                          {" — "}
                          <Note text={item.note} />
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
