/**
 * Dispatches to a platform-specific iframe embed. Ported from the original
 * SvelteKit TrackEmbed/SpotifyEmbed/YouTubeEmbed/SoundCloudEmbed components.
 */

type Platform = 'spotify' | 'soundcloud' | 'youtube'

type TrackEmbedProps = {
  platform: Platform | string
  platformTrackId: string
  trackUrl: string
  compact?: boolean
}

const SpotifyEmbed = ({
  trackId,
  compact,
}: {
  trackId: string
  compact?: boolean
}) => (
  <iframe
    title="Spotify"
    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
    width="100%"
    height={compact ? 80 : 152}
    frameBorder="0"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
    style={{ borderRadius: 12 }}
  />
)

const YoutubeEmbed = ({
  videoId,
  compact,
}: {
  videoId: string
  compact?: boolean
}) => {
  const src = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`

  if (compact) {
    return (
      <iframe
        title="YouTube"
        src={src}
        width="100%"
        height={80}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: 12 }}
      />
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      <iframe
        title="YouTube"
        src={src}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

const SoundcloudEmbed = ({
  trackUrl,
  compact,
}: {
  trackUrl: string
  compact?: boolean
}) => {
  const params = compact
    ? 'auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false&show_artwork=true'
    : 'auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true'

  return (
    <iframe
      title="SoundCloud"
      width="100%"
      height={compact ? 80 : 166}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&${params}`}
      style={{ borderRadius: 12 }}
      loading="lazy"
    />
  )
}

const TrackEmbed = ({
  platform,
  platformTrackId,
  trackUrl,
  compact = false,
}: TrackEmbedProps) => {
  switch (platform) {
    case 'spotify':
      return <SpotifyEmbed trackId={platformTrackId} compact={compact} />
    case 'youtube':
      return <YoutubeEmbed videoId={platformTrackId} compact={compact} />
    case 'soundcloud':
      return <SoundcloudEmbed trackUrl={trackUrl} compact={compact} />
    default:
      return (
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Listen on {platform}
        </a>
      )
  }
}

export default TrackEmbed
