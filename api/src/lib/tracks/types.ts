import type { Platform } from 'api/db/generated/prisma/client.mts'

/** Normalized track shape shared by all three platform clients. */
export interface TrackResult {
  trackName: string
  artistName: string
  albumName: string | null
  artworkUrl: string | null
  platform: Platform
  platformTrackId: string
  trackUrl: string
  durationMs: number | null
}

export const FETCH_TIMEOUT_MS = 5000
