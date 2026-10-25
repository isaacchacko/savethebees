// The album shelf, as a grid of covers, from notes/music.json:
// <island name="music" data="music.json" ssr></island>
//
// Rendered at build time, so the covers are there with no script. A cover
// leans toward the pointer. Clicking one opens its card in the side content
// (Basalt's data-secondary-open="click"): an album's card is the album, its
// artist and year, and a link to it on Spotify; a song's is the song, its artist,
// year and album, and a link to the track. Either has a ▶ row when it has a clip,
// which plays through Basalt's <sound> (the cover holds a hidden .sound with it).

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

function rest(e: PointerEvent) {
  const tile = e.currentTarget as HTMLElement
  tile.style.removeProperty("--lean-x")
  tile.style.removeProperty("--lean-y")
}

/** What the cover is called: a song by its song, an album by its album. */
const nameOf = (a: Album) => (a.kind === "song" && a.song ? a.song : a.album)

function Card({ a }: { a: Album }) {
  return (
    <span
      data-secondary={a.kind}
      data-secondary-open="click"
      data-secondary-key={`${a.kind}:${a.cover}`}
      data-secondary-title={nameOf(a)}
      hidden
    >
      {a.artist}
      {a.year ? ` · ${a.year}` : ""}
      {a.kind === "song" ? (
        <>
          <br />
          <em>{a.album}</em>
        </>
      ) : null}
      {a.sound ? (
        <span class="music-play" data-sound-play={a.sound.src} role="button" tabIndex={0}>
          ▶ {a.sound.label ?? a.sound.song ?? nameOf(a)}
        </span>
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
      {data.albums.map((a) => (
        <div
          key={a.cover}
          role="button"
          tabIndex={0}
          class="music-tile"
          aria-label={`${nameOf(a)}, ${a.artist}`}
          onPointerMove={lean}
          onPointerLeave={rest}
        >
          <img src={a.cover} alt="" loading="lazy" width={200} height={200} />
          {a.sound ? (
            // the clip, for the card's ▶ row: Basalt finds a clip's song by its .sound
            <span
              class="sound"
              hidden
              data-sound={a.sound.src}
              data-clips={JSON.stringify([
                {
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
                },
              ])}
            />
          ) : null}
          <Card a={a} />
        </div>
      ))}
    </div>
  )
}
