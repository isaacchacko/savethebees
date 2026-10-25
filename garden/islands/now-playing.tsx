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
 * origin). Nothing at all when nothing's playing, or the api can't be reached.
 */
export default function NowPlaying({ api = "https://isaacchacko.com/api/spotify/now-playing" }: { api?: string }) {
  const [playback, setPlayback] = useState<Playback | null>(null)

  useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const res = await fetch(api, { cache: "no-store" })
        if (res.ok && live) setPlayback(await res.json())
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

  const playing = playback?.is_playing && playback.track ? playback : null
  if (!playing) return <div class="now-playing" />
  const artist = Array.isArray(playing.artist) ? playing.artist.join(", ") : playing.artist

  return (
    <div class="now-playing">
      <span class="now-playing-trigger" tabIndex={0}>
        <span class="now-playing-dot" />
        i&rsquo;m listening to music rn!
        <span class="now-playing-card" role="tooltip">
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
    </div>
  )
}
