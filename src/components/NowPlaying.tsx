'use client';

import { useSpotifyPlayback } from '@/components/SpotifyNowPlaying';
import HoverPreview from '@/components/HoverPreview';

export default function NowPlaying() {
  const playback = useSpotifyPlayback();
  const playing = playback?.is_playing && playback.track ? playback : null;

  const artist = playing
    ? Array.isArray(playing.artist)
      ? playing.artist.join(', ')
      : playing.artist
    : undefined;

  return (
    // reserve one line up front so the trigger appearing after load never
    // shifts the content below it
    <div style={{ minHeight: '1.6em' }}>
      {playing ? (
        <HoverPreview trigger={<>i&rsquo;m listening to music rn!</>}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'nowrap',
            }}
          >
            {playing.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={playing.image}
                alt={playing.album || playing.track}
                title={playing.album || undefined}
                width={120}
                height={120}
                style={{
                  display: 'block',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <dl
              style={{
                margin: 0,
                flex: 1,
                minWidth: 0,
                overflowWrap: 'anywhere',
              }}
            >
              <div>
                <dt style={{ display: 'inline', fontWeight: 700 }}>Artist:</dt>{' '}
                <dd style={{ display: 'inline', margin: 0 }}>
                  {artist || 'unknown'}
                </dd>
              </div>
              <div>
                <dt style={{ display: 'inline', fontWeight: 700 }}>Album:</dt>{' '}
                <dd style={{ display: 'inline', margin: 0 }}>
                  {playing.album || 'unknown'}
                </dd>
              </div>
              <div>
                <dt style={{ display: 'inline', fontWeight: 700 }}>Song:</dt>{' '}
                <dd style={{ display: 'inline', margin: 0 }}>{playing.track}</dd>
              </div>
            </dl>
          </div>

          <blockquote style={{ marginTop: '1rem', marginBottom: 0 }}>
            <pre
              style={{
                margin: 0,
                background: 'none',
                border: 0,
                padding: 0,
                fontSize: '0.8rem',
                lineHeight: 1.5,
                tabSize: 2,
                overflowX: 'auto',
              }}
            >
              <code style={{ background: 'none', border: 0, padding: 0 }}>
                {JSON.stringify(playing, null, 2)}
              </code>
            </pre>
          </blockquote>
        </HoverPreview>
      ) : null}
    </div>
  );
}
