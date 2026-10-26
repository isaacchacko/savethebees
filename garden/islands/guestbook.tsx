import { useEffect, useState } from "preact/hooks"

type Entry = { id: number; name: string; message: string; created_at: string }

const API = "/api/guestbook"
const DIDNT_GO_THROUGH = "That didn't go through. Try again?"

const day = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

/**
 * The guestbook: a form to sign it, and everyone who has, newest first, from
 * src/app/api/guestbook (so only where Next serves the site, not a Basalt dev
 * server). A signature shows at the top as soon as it's saved.
 */
export default function Guestbook() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [unreachable, setUnreachable] = useState(false)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(API)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body) => setEntries(body.entries))
      .catch(() => setUnreachable(true))
  }, [])

  const sign = async (event: Event) => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    setSending(true)
    setError("")
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) return setError(body.error ?? DIDNT_GO_THROUGH)
      setEntries((list) => [body.entry, ...(list ?? [])])
      form.reset()
    } catch {
      setError(DIDNT_GO_THROUGH)
    } finally {
      setSending(false)
    }
  }

  return (
    <div class="guestbook">
      <form class="guestbook-form" onSubmit={sign}>
        <label>
          Name
          <input name="name" required maxLength={40} autoComplete="nickname" />
        </label>
        <label>
          Message
          <textarea name="message" required maxLength={280} rows={3} />
        </label>
        <label class="guestbook-trap" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <div class="guestbook-send">
          <button type="submit" disabled={sending}>
            {sending ? "Signing…" : "Sign"}
          </button>
          {error ? <span class="guestbook-error">{error}</span> : null}
        </div>
      </form>

      {unreachable ? (
        <p class="guestbook-quiet">The guestbook can't be reached right now.</p>
      ) : entries === null ? null : entries.length === 0 ? (
        <p class="guestbook-quiet">Nobody yet. Be the first!</p>
      ) : (
        <ol class="guestbook-entries">
          {entries.map((entry) => (
            <li key={entry.id}>
              <p class="guestbook-message">{entry.message}</p>
              <p class="guestbook-signed">
                {entry.name}, {day(entry.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
