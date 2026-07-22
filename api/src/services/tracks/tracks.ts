import type { QueryResolvers } from 'types/graphql'

import {
  isSoundcloudUrl,
  lookupSoundcloudTrack,
  searchSoundcloudTracks,
} from 'src/lib/tracks/soundcloud'
import {
  extractSpotifyTrackId,
  lookupSpotifyTrack,
  searchSpotifyTracks,
} from 'src/lib/tracks/spotify'
import {
  extractYoutubeVideoId,
  lookupYoutubeVideo,
  searchYoutubeVideos,
} from 'src/lib/tracks/youtube'

export const searchTracks: QueryResolvers['searchTracks'] = async ({
  platform,
  query,
  limit,
}) => {
  const cappedLimit = Math.min(limit ?? 10, 20)

  switch (platform) {
    case 'youtube':
      return searchYoutubeVideos(query, cappedLimit)
    case 'soundcloud':
      return searchSoundcloudTracks(query, cappedLimit)
    case 'spotify':
    default:
      return searchSpotifyTracks(query, cappedLimit)
  }
}

export const lookupTrackUrl: QueryResolvers['lookupTrackUrl'] = async ({
  url,
}) => {
  const spotifyId = extractSpotifyTrackId(url)
  if (spotifyId) {
    return lookupSpotifyTrack(spotifyId)
  }

  const youtubeId = extractYoutubeVideoId(url)
  if (youtubeId) {
    return lookupYoutubeVideo(youtubeId)
  }

  if (isSoundcloudUrl(url)) {
    return lookupSoundcloudTrack(url)
  }

  // Unrecognized URL — the UI shows a "paste a Spotify/YouTube/SoundCloud
  // link" hint on null rather than an error
  return null
}
