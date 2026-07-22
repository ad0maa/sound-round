import { FETCH_TIMEOUT_MS, type TrackResult } from './types'

export const extractYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

/** Convert ISO 8601 duration (PT4M33S) to milliseconds. */
const parseDuration = (isoDuration: string): number | null => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) {
    return null
  }
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const seconds = parseInt(match[3] ?? '0', 10)
  return (hours * 3600 + minutes * 60 + seconds) * 1000
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const parseVideo = (item: any, contentDetails?: any): TrackResult => {
  const snippet = item.snippet ?? {}
  const videoId = typeof item.id === 'object' ? item.id?.videoId : item.id

  const thumbnails = snippet.thumbnails ?? {}
  const artworkUrl =
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    null

  return {
    trackName: snippet.title ?? '',
    artistName: snippet.channelTitle ?? '',
    albumName: null,
    artworkUrl,
    platform: 'youtube',
    platformTrackId: videoId,
    trackUrl: `https://www.youtube.com/watch?v=${videoId}`,
    durationMs: contentDetails
      ? parseDuration(contentDetails.duration ?? '')
      : null,
  }
}

/** Search YouTube. Degrades gracefully to [] on missing key or errors. */
export const searchYoutubeVideos = async (
  query: string,
  limit = 10
): Promise<TrackResult[]> => {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      q: query,
      maxResults: String(limit),
      key: apiKey,
    })
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!resp.ok) {
      return []
    }

    const data = await resp.json()
    return (data.items ?? []).map((item: any) => parseVideo(item))
  } catch {
    return []
  }
}

/** Look up one YouTube video by id. Null on missing key or errors. */
export const lookupYoutubeVideo = async (
  videoId: string
): Promise<TrackResult | null> => {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: videoId,
      key: apiKey,
    })
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!resp.ok) {
      return null
    }

    const data = await resp.json()
    const item = data.items?.[0]
    if (!item) {
      return null
    }

    return parseVideo(item, item.contentDetails)
  } catch {
    return null
  }
}
