// The album shelf, as a grid of covers, from notes/music.json:
// <island name="music" data="music.json" ssr></island>
//
// Rendered at build time, so the covers are there with no script. A cover
// leans toward the pointer, and hovering it shows its card in the side content:
// an album's card is the album, its artist and year, and a link to it on
// Spotify; a song's is the song, its artist, year and album, and a link to the
// track. Clicking a cover with a clip plays it: the cover is Basalt's <sound>
// (a .sound with data-clips; Basalt adds its ▶ row to the card), with its now
// playing card. One without opens on Spotify. Covers aren't links themselves,
// since a link can't hold the card's own link.

type Sound = { src: string; label?: string; song?: string; spotify?: string }
type Album = {
  kind: "album" | "song"
  album: string
  artist: string
  year?: string
  song?: string
  spotify: string
  cover: string
  sound?: Sound
}

/** How far, in degrees, a cover leans toward the pointer at its edge. */
const LEAN = 9

function lean(e: PointerEvent) {
  const tile = e.currentTarget as HTMLElement
  const r = tile.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  tile.style.setProperty("--lean-x", `${(-y * LEAN * 2).toFixed(2)}deg`)
  tile.style.setProperty("--lean-y", `${(x * LEAN * 2).toFixed(2)}deg`)
}

/** A cover without a clip opens its Spotify page. */
function open(e: MouseEvent | KeyboardEvent) {
  if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return
  if ((e.target as Element).closest(".margin")) return
  e.preventDefault()
  window.open((e.currentTarget as HTMLElement).dataset.href, "_blank", "noopener")
}

function rest(e: PointerEvent) {
  const tile = e.currentTarget as HTMLElement
  tile.style.removeProperty("--lean-x")
  tile.style.removeProperty("--lean-y")
}

/** What the cover is called: a song by its song, an album by its album. */
const nameOf = (a: Album) => (a.kind === "song" && a.song ? a.song : a.album)

function Card({ a }: { a: Album }) {
  return (
    <span data-secondary={a.kind} data-secondary-key={`${a.kind}:${a.cover}`} data-secondary-title={nameOf(a)} hidden>
      {a.artist}
      {a.year ? ` · ${a.year}` : ""}
      {a.kind === "song" ? (
        <>
          <br />
          <em>{a.album}</em>
        </>
      ) : null}
      <a class="music-spotify" href={a.spotify} target="_blank" rel="noopener noreferrer">
        spotify ↗
      </a>
    </span>
  )
}

export default function Music({ data }: { data: { playlist?: string; albums: Album[] } }) {
  return (
    <div class="music-grid">
      {data.albums.map((a) => {
        const cover = <img src={a.cover} alt="" loading="lazy" width={200} height={200} />
        const common = { key: a.cover, "aria-label": `${nameOf(a)}, ${a.artist}`, onPointerMove: lean, onPointerLeave: rest }
        if (a.sound) {
          const clip = {
            src: a.sound.src,
            label: a.sound.label,
            track: {
              title: a.sound.song ?? nameOf(a),
              artist: a.artist,
              album: a.album,
              year: a.year,
              cover: a.cover,
              url: a.sound.spotify ?? a.spotify,
            },
          }
          return (
            <span
              {...common}
              class="music-tile sound"
              role="button"
              tabIndex={0}
              data-sound={a.sound.src}
              data-clips={JSON.stringify([clip])}
            >
              {cover}
              <Card a={a} />
            </span>
          )
        }
        return (
          <span {...common} class="music-tile" role="link" tabIndex={0} data-href={a.spotify} onClick={open} onKeyDown={open}>
            {cover}
            <Card a={a} />
          </span>
        )
      })}
    </div>
  )
}
