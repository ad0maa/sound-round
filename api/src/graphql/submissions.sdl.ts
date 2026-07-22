export const schema = gql`
  enum Platform {
    spotify
    soundcloud
    youtube
  }

  """
  Blind voting: the submitter's identity is intentionally not exposed as a
  scalar userId. \`isMine\` lets the client filter its own submissions, while
  \`submitter\` and \`totalPoints\` resolve to null until the round reaches
  the results state.
  """
  type Submission {
    id: String!
    roundId: String!
    platform: Platform!
    platformTrackId: String!
    trackUrl: String!
    trackName: String!
    artistName: String!
    albumName: String
    artworkUrl: String
    durationMs: Int
    submittedAt: DateTime!
    isMine: Boolean
    submitter: User
    totalPoints: Int
  }

  type Query {
    submissions(roundId: String!): [Submission!]! @requireAuth
  }

  input CreateSubmissionInput {
    roundId: String!
    platform: Platform!
    platformTrackId: String!
    trackUrl: String!
    trackName: String!
    artistName: String!
    albumName: String
    artworkUrl: String
    durationMs: Int
  }

  type Mutation {
    createSubmission(input: CreateSubmissionInput!): Submission! @requireAuth
    deleteSubmission(id: String!): Boolean! @requireAuth
  }
`
