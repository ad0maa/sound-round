import { FETCH_TIMEOUT_MS, type TrackResult } from './types'

// Client-credentials token, cached in memory with a 60s expiry buffer
const tokenCache: { token: string | null; expiresAt: number } = {
  token: null,
  expiresAt: 0,
}

const getAccessToken = async (): Promise<string | null> => {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return null
  }

  const now = Date.now()
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token
  }

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!resp.ok) {
    return null
  }

  const data = await resp.json()
  tokenCache.token = data.access_token
  tokenCache.expiresAt = now + ((data.expires_in ?? 3600) - 60) * 1000
  return tokenCache.token
}

export const extractSpotifyTrackId = (url: string): string | null => {
  const match = url.match(/track\/([a-zA-Z0-9]{22})/)
  return match ? match[1] : null
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const parseTrack = (data: any): TrackResult => ({
  trackName: data.name,
  artistName: (data.artists ?? []).map((a: any) => a.name).join(', '),
  albumName: data.album?.name ?? null,
  artworkUrl: data.album?.images?.[0]?.url ?? null,
  platform: 'spotify',
  platformTrackId: data.id,
  trackUrl: data.external_urls?.spotify ?? '',
  durationMs: data.duration_ms ?? null,
})

/** Search Spotify. Degrades gracefully to [] on missing creds or errors. */
export const searchSpotifyTracks = async (
  query: string,
  limit = 10
): Promise<TrackResult[]> => {
  try {
    const token = await getAccessToken()
    if (!token) {
      return []
    }

    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: String(limit),
    })
    const resp = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!resp.ok) {
      return []
    }

    const data = await resp.json()
    return (data.tracks?.items ?? []).map(parseTrack)
  } catch {
    return []
  }
}

/** Look up one Spotify track by id. Null on missing creds or errors. */
export const lookupSpotifyTrack = async (
  trackId: string
): Promise<TrackResult | null> => {
  try {
    const token = await getAccessToken()
    if (!token) {
      return null
    }

    const resp = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!resp.ok) {
      return null
    }

    return parseTrack(await resp.json())
  } catch {
    return null
  }
}
