export const schema = gql`
  type TrackResult {
    trackName: String!
    artistName: String!
    albumName: String
    artworkUrl: String
    platform: Platform!
    platformTrackId: String!
    trackUrl: String!
    durationMs: Int
  }

  type Query {
    searchTracks(
      platform: Platform!
      query: String!
      limit: Int
    ): [TrackResult!]! @requireAuth
    lookupTrackUrl(url: String!): TrackResult @requireAuth
  }
`
