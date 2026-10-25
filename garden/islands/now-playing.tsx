import { useEffect, useState } from "preact/hooks"

type Playback = {
  is_playing: boolean
  artist?: string | string[]
  track?: string
  album?: string
  image?: string
  external_url?: string
}

/**
 * What's playing on Isaac's spotify, from the live site's api (it answers any
 * origin), as the end of the home page's sentence about the time in sf:
 * "… is 9:41pm and i'm listening to music rn!", or just "." when nothing's
 * playing or the api can't be reached. Nothing until the first answer, so the
 * sentence doesn't end twice.
 */
export default function NowPlaying({ api = "https://isaacchacko.com/api/spotify/now-playing" }: { api?: string }) {
  const [playback, setPlayback] = useState<Playback | null | undefined>(undefined)

  useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const res = await fetch(api, { cache: "no-store" })
        if (live) setPlayback(res.ok ? await res.json() : null)
      } catch {
        if (live) setPlayback(null)
      }
    }
    load()
    const timer = setInterval(load, 15_000)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [api])

  if (playback === undefined) return <span class="spotify" />
  const playing = playback?.is_playing && playback.track ? playback : null
  if (!playing) return <span class="spotify">.</span>
  const artist = Array.isArray(playing.artist) ? playing.artist.join(", ") : playing.artist

  return (
    <span class="spotify">
      {" and "}
      <span class="spotify-trigger" tabIndex={0}>
        <span class="spotify-dot" />
        i&rsquo;m listening to music rn!
        <span
          class="spotify-card"
          data-secondary="now playing"
          data-secondary-title={playing.track}
          data-secondary-key="now-playing"
        >
          {playing.image ? <img src={playing.image} alt={playing.album ?? playing.track} width={96} height={96} /> : null}
          <span>
            <strong>{playing.track}</strong>
            <br />
            {artist}
            {playing.album ? (
              <>
                <br />
                <em>{playing.album}</em>
              </>
            ) : null}
          </span>
        </span>
      </span>
    </span>
  )
}
