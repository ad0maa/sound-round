export const schema = gql`
  """
  League superlatives, computed from completed (results-state) rounds only so
  in-flight votes never leak.
  """
  type LeagueStats {
    roundsCompleted: Int!
    bestSingleRound: BestSingleRound
    bestAverage: UserAverage
    mostConsistent: UserAverage
    biggestFan: PairPoints
    mostControversial: ControversialTrack
    averages: [UserAverage!]!
    pointsGiven: [PairPoints!]!
  }

  "Highest-scoring single submission across the league."
  type BestSingleRound {
    displayName: String!
    roundNumber: Int!
    theme: String!
    trackName: String!
    points: Int!
  }

  type UserAverage {
    displayName: String!
    average: Float!
    submissionCount: Int!
  }

  "Total points one member has given another across all completed rounds."
  type PairPoints {
    fromName: String!
    toName: String!
    points: Int!
  }

  "A submission that split the room — big upvotes and big downvotes."
  type ControversialTrack {
    trackName: String!
    artistName: String!
    displayName: String!
    upPoints: Int!
    downPoints: Int!
  }

  type Query {
    leagueStats(leagueId: String!): LeagueStats! @requireAuth
  }
`
