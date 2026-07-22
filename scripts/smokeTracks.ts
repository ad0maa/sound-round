import {
  lookupSoundcloudTrack,
  searchSoundcloudTracks,
} from 'api/src/lib/tracks/soundcloud'
import {
  extractSpotifyTrackId,
  lookupSpotifyTrack,
  searchSpotifyTracks,
} from 'api/src/lib/tracks/spotify'
import {
  extractYoutubeVideoId,
  lookupYoutubeVideo,
  searchYoutubeVideos,
} from 'api/src/lib/tracks/youtube'

// Smoke test for the three platform track clients (search + URL lookup).
// Run with: yarn cedar exec smokeTracks

export default async () => {
  const query = 'daft punk'

  const [spotify, youtube, soundcloud] = await Promise.all([
    searchSpotifyTracks(query, 3),
    searchYoutubeVideos(query, 3),
    searchSoundcloudTracks(query, 3),
  ])

  console.log('--- search results for "daft punk" ---')
  for (const [name, results] of [
    ['spotify', spotify],
    ['youtube', youtube],
    ['soundcloud', soundcloud],
  ] as const) {
    console.log(
      `${name}: ${results.length} results`,
      results[0]
        ? `| first: "${results[0].trackName}" by ${results[0].artistName}`
        : '| (empty — check credentials)'
    )
  }

  console.log('--- URL lookups ---')
  const spotifyUrl = 'https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV'
  const youtubeUrl = 'https://www.youtube.com/watch?v=FGBhQbmPwH8'

  const spotifyLookup = await lookupSpotifyTrack(
    extractSpotifyTrackId(spotifyUrl)
  )
  console.log('spotify lookup:', spotifyLookup?.trackName ?? 'FAILED')

  const youtubeLookup = await lookupYoutubeVideo(
    extractYoutubeVideoId(youtubeUrl)
  )
  console.log('youtube lookup:', youtubeLookup?.trackName ?? 'FAILED')

  const scPermalink = soundcloud[0]?.trackUrl
  if (scPermalink) {
    const soundcloudLookup = await lookupSoundcloudTrack(scPermalink)
    console.log('soundcloud lookup:', soundcloudLookup?.trackName ?? 'FAILED')
  } else {
    console.log('soundcloud lookup: skipped (no search result permalink)')
  }
}
