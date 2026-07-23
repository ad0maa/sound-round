/**
 * Lightweight playlist export — deliberately no Spotify OAuth (it can't
 * represent the mixed-platform rounds this app encourages anyway).
 */

export type ExportableTrack = {
  trackName: string
  artistName: string
  trackUrl: string
  platform: string
  platformTrackId: string
}

/** Plain-text track list for pasting anywhere. */
export const trackListText = (tracks: ExportableTrack[]): string =>
  tracks
    .map((t) => `${t.artistName} – ${t.trackName}\n${t.trackUrl}`)
    .join('\n\n')

/**
 * YouTube's anonymous instant-playlist URL — only possible when every track
 * in the round is a YouTube video. Returns null otherwise.
 */
export const youtubeQueueUrl = (tracks: ExportableTrack[]): string | null => {
  if (tracks.length === 0 || tracks.some((t) => t.platform !== 'youtube')) {
    return null
  }
  const ids = tracks.map((t) => t.platformTrackId).join(',')
  return `https://www.youtube.com/watch_videos?video_ids=${ids}`
}
