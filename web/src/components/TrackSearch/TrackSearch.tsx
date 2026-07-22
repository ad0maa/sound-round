import { useEffect, useRef, useState } from 'react'

import { useLazyQuery } from '@apollo/client'

import { Input } from 'src/components/ui/input'

const SEARCH_TRACKS = gql`
  query SearchTracksQuery($platform: Platform!, $query: String!, $limit: Int) {
    searchTracks(platform: $platform, query: $query, limit: $limit) {
      trackName
      artistName
      albumName
      artworkUrl
      platform
      platformTrackId
      trackUrl
      durationMs
    }
  }
`

const LOOKUP_TRACK_URL = gql`
  query LookupTrackUrlQuery($url: String!) {
    lookupTrackUrl(url: $url) {
      trackName
      artistName
      albumName
      artworkUrl
      platform
      platformTrackId
      trackUrl
      durationMs
    }
  }
`

export interface TrackResult {
  trackName: string
  artistName: string
  albumName?: string | null
  artworkUrl?: string | null
  platform: string
  platformTrackId: string
  trackUrl: string
  durationMs?: number | null
}

type Mode = 'search' | 'url'
type SearchPlatform = 'spotify' | 'youtube' | 'soundcloud'

const platformLabel: Record<SearchPlatform, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
}

const platformTabClass: Record<SearchPlatform, string> = {
  spotify: 'bg-[#1DB954] text-white',
  youtube: 'bg-[#FF0000] text-white',
  soundcloud: 'bg-[#FF5500] text-white',
}

const detectPlatform = (url: string): SearchPlatform | null => {
  if (url.includes('spotify.com') || url.includes('open.spotify'))
    return 'spotify'
  if (url.includes('soundcloud.com')) return 'soundcloud'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return null
}

const formatDuration = (ms?: number | null): string => {
  if (!ms) return ''
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

type TrackSearchProps = {
  onSelect: (track: TrackResult) => void
}

const TrackSearch = ({ onSelect }: TrackSearchProps) => {
  const [mode, setMode] = useState<Mode>('search')
  const [searchPlatform, setSearchPlatform] =
    useState<SearchPlatform>('spotify')
  const [query, setQuery] = useState('')
  const [trackUrl, setTrackUrl] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [runSearch, { data: searchData, loading: searching }] =
    useLazyQuery(SEARCH_TRACKS)
  const [runLookup, { data: lookupData, loading: lookingUp }] =
    useLazyQuery(LOOKUP_TRACK_URL)

  // Debounced search-as-you-type (300ms), per platform
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) return
    debounceRef.current = setTimeout(() => {
      runSearch({
        variables: { platform: searchPlatform, query: query.trim(), limit: 8 },
      })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, searchPlatform, runSearch])

  // Debounced URL lookup as the user pastes/edits a link
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const detected = detectPlatform(trackUrl)
    if (!detected) return
    debounceRef.current = setTimeout(() => {
      runLookup({ variables: { url: trackUrl.trim() } })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [trackUrl, runLookup])

  const results: TrackResult[] = searchData?.searchTracks ?? []
  const detected = trackUrl ? detectPlatform(trackUrl) : null

  useEffect(() => {
    if (lookupData?.lookupTrackUrl) {
      onSelect(lookupData.lookupTrackUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupData])

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
            mode === 'search'
              ? 'bg-background font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMode('search')}
        >
          Search
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
            mode === 'url'
              ? 'bg-background font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMode('url')}
        >
          Paste URL
        </button>
      </div>

      {mode === 'search' ? (
        <>
          <div className="flex gap-2">
            {(['spotify', 'youtube', 'soundcloud'] as SearchPlatform[]).map(
              (p) => (
                <button
                  key={p}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    searchPlatform === p
                      ? platformTabClass[p]
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSearchPlatform(p)}
                >
                  {platformLabel[p]}
                </button>
              )
            )}
          </div>

          <div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for a song on ${platformLabel[searchPlatform]}...`}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- opening this panel is itself a deliberate user action to search
              autoFocus
            />
            {searching && (
              <p className="mt-1 text-xs text-muted-foreground">Searching…</p>
            )}
          </div>

          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((track) => (
                <button
                  key={`${track.platform}-${track.platformTrackId}`}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent/50"
                  onClick={() => onSelect(track)}
                >
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-muted text-[10px]">
                      {platformLabel[track.platform as SearchPlatform] ??
                        track.platform}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {track.trackName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artistName}
                      {track.albumName && <span className="mx-1">·</span>}
                      {track.albumName}
                    </p>
                  </div>
                  {track.durationMs && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDuration(track.durationMs)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            query.trim().length >= 2 &&
            !searching && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No results found
              </p>
            )
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder="Paste a Spotify, YouTube, or SoundCloud link..."
            // eslint-disable-next-line jsx-a11y/no-autofocus -- opening this panel is itself a deliberate user action to paste a link
            autoFocus
          />
          {trackUrl ? (
            lookingUp ? (
              <p className="text-xs text-muted-foreground">Looking up track…</p>
            ) : detected ? (
              <p className="text-xs text-muted-foreground">
                Detected:{' '}
                <span className="font-medium">{platformLabel[detected]}</span>
              </p>
            ) : (
              <p className="text-xs text-destructive">
                Unrecognized URL — try Spotify, YouTube, or SoundCloud
              </p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Supports Spotify, YouTube, and SoundCloud links.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default TrackSearch
