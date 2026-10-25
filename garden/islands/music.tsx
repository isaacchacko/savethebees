// The album shelf, as a grid of covers, from notes/music.json:
// <island name="music" data="music.json" ssr></island>
//
// Rendered at build time, so the covers are there with no script. A cover
// leans toward the pointer. Hovering one shows its album in the side content.
// One with a `sound` plays it through Basalt's <sound> (a .sound with
// data-clips: the same now playing card, one clip at a time); the rest open
// their song on Spotify.

type Sound = { src: string; label?: string; song?: string; spotify?: string }
type Album = {
  album: string
  artist: string
  year?: string
  song: string
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

function rest(e: PointerEvent) {
  const tile = e.currentTarget as HTMLElement
  tile.style.removeProperty("--lean-x")
  tile.style.removeProperty("--lean-y")
}

function Card({ a }: { a: Album }) {
  return (
    <span
      data-secondary="album"
      data-secondary-key={`album:${a.album}`}
      data-secondary-title={a.album}
      hidden
    >
      {a.artist}
      {a.year ? `, ${a.year}` : ""}
      <br />
      <em>{a.sound ? `▶ ${a.sound.label ?? a.sound.song ?? "a bit of it"}` : a.song}</em>
    </span>
  )
}

export default function Music({ data }: { data: { playlist?: string; albums: Album[] } }) {
  return (
    <div class="music-grid">
      {data.albums.map((a) => {
        const cover = <img src={a.cover} alt={`${a.album}, ${a.artist}`} loading="lazy" width={200} height={200} />
        const common = { key: a.album, onPointerMove: lean, onPointerLeave: rest }
        if (a.sound) {
          const clip = {
            src: a.sound.src,
            label: a.sound.label,
            track: {
              title: a.sound.song ?? a.song,
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
          <a {...common} class="music-tile" href={a.spotify} target="_blank" rel="noopener noreferrer">
            {cover}
            <Card a={a} />
          </a>
        )
      })}
    </div>
  )
}
