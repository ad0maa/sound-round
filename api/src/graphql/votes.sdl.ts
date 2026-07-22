export const schema = gql`
  type Vote {
    id: String!
    roundId: String!
    voterId: String!
    submissionId: String!
    points: Int!
    createdAt: DateTime!
  }

  type LeaderboardEntry {
    user: User!
    totalPoints: Int!
    submissionCount: Int!
    roundsWon: Int!
  }

  input VoteInput {
    submissionId: String!
    points: Int!
  }

  type Query {
    myVotes(roundId: String!): [Vote!]! @requireAuth
    leagueLeaderboard(leagueId: String!): [LeaderboardEntry!]! @requireAuth
  }

  type Mutation {
    castVotes(roundId: String!, votes: [VoteInput!]!): [Vote!]! @requireAuth
  }
`
