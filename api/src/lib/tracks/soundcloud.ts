import { FETCH_TIMEOUT_MS, type TrackResult } from './types'

const tokenCache: { token: string | null; expiresAt: number } = {
  token: null,
  expiresAt: 0,
}

const getAccessToken = async (): Promise<string | null> => {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return null
  }

  const now = Date.now()
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token
  }

  const resp = await fetch('https://api.soundcloud.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
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

export const isSoundcloudUrl = (url: string): boolean => {
  return /^https?:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/.test(url)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const parseTrack = (data: any): TrackResult => ({
  trackName: data.title ?? '',
  artistName: data.user?.username ?? '',
  albumName: null,
  // Upscale artwork to 500x500
  artworkUrl: data.artwork_url
    ? data.artwork_url.replace('-large.', '-t500x500.')
    : null,
  platform: 'soundcloud',
  platformTrackId: String(data.id ?? ''),
  trackUrl: data.permalink_url ?? '',
  durationMs: data.duration ?? null,
})

/** Search SoundCloud. Degrades gracefully to [] on missing creds or errors. */
export const searchSoundcloudTracks = async (
  query: string,
  limit = 10
): Promise<TrackResult[]> => {
  try {
    const token = await getAccessToken()
    if (!token) {
      return []
    }

    const params = new URLSearchParams({ q: query, limit: String(limit) })
    const resp = await fetch(`https://api.soundcloud.com/tracks?${params}`, {
      headers: { Authorization: `OAuth ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!resp.ok) {
      return []
    }

    const data = await resp.json()
    return (Array.isArray(data) ? data : []).map(parseTrack)
  } catch {
    return []
  }
}

/** Resolve a SoundCloud URL, falling back to the no-auth oEmbed endpoint. */
export const lookupSoundcloudTrack = async (
  url: string
): Promise<TrackResult | null> => {
  try {
    const token = await getAccessToken()
    if (!token) {
      return lookupViaOembed(url)
    }

    const params = new URLSearchParams({ url })
    const resp = await fetch(`https://api.soundcloud.com/resolve?${params}`, {
      headers: { Authorization: `OAuth ${token}` },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!resp.ok) {
      return lookupViaOembed(url)
    }

    const data = await resp.json()
    if (data.kind !== 'track') {
      return null
    }

    return parseTrack(data)
  } catch {
    return lookupViaOembed(url)
  }
}

/** Fallback: fetch metadata via oEmbed (no auth required). */
const lookupViaOembed = async (url: string): Promise<TrackResult | null> => {
  try {
    const params = new URLSearchParams({ url, format: 'json' })
    const resp = await fetch(`https://soundcloud.com/oembed?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!resp.ok) {
      return null
    }

    const data = await resp.json()
    const html: string = data.html ?? ''
    const idMatch = html.match(/tracks%2F(\d+)/) || html.match(/tracks\/(\d+)/)

    return {
      trackName: data.title ?? '',
      artistName: data.author_name ?? '',
      albumName: null,
      artworkUrl: data.thumbnail_url ?? null,
      platform: 'soundcloud',
      platformTrackId: idMatch ? idMatch[1] : url,
      trackUrl: url,
      durationMs: null,
    }
  } catch {
    return null
  }
}
