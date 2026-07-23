export const schema = gql`
  enum RoundState {
    upcoming
    submitting
    voting
    results
  }

  type Round {
    id: String!
    leagueId: String!
    league: League!
    roundNumber: Int!
    theme: String!
    description: String
    state: RoundState!
    submissionsOpen: DateTime
    submissionsClose: DateTime
    votingClose: DateTime
    submissionDurationHours: Int
    votingDurationHours: Int
    songsPerPlayer: Int!
    createdAt: DateTime!
    submissionCount: Int
  }

  type MemberProgress {
    userId: String!
    displayName: String!
    hasSubmitted: Boolean!
    hasVoted: Boolean!
  }

  type RoundProgress {
    roundId: String!
    state: RoundState!
    totalMembers: Int!
    submittedCount: Int!
    votedCount: Int!
    members: [MemberProgress!]!
  }

  type Query {
    rounds(leagueId: String!): [Round!]! @requireAuth
    round(id: String!): Round! @requireAuth
    roundProgress(roundId: String!): RoundProgress! @requireAuth
  }

  input CreateRoundInput {
    leagueId: String!
    theme: String!
    description: String
    songsPerPlayer: Int
    submissionDurationHours: Int
    votingDurationHours: Int
  }

  type Mutation {
    createRound(input: CreateRoundInput!): Round! @requireAuth
    advanceRound(id: String!, state: RoundState!): Round! @requireAuth
  }
`
