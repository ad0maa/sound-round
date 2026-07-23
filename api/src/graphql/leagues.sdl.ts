export const schema = gql`
  enum Role {
    creator
    admin
    player
  }

  type League {
    id: String!
    name: String!
    description: String
    creatorId: String!
    creator: User!
    isPublic: Boolean!
    inviteCode: String
    maxPlayers: Int!
    upvotesPerRound: Int!
    downvotesEnabled: Boolean!
    downvotesPerRound: Int!
    maxPointsPerSong: Int
    uniqueArtists: Boolean!
    totalRounds: Int!
    submissionDeadlineHours: Int!
    votingDeadlineHours: Int!
    startsAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    members: [LeagueMember!]!
    rounds: [Round!]!
    memberCount: Int
    myRole: Role
    hasStarted: Boolean
    isFinished: Boolean
  }

  type LeagueMember {
    leagueId: String!
    userId: String!
    user: User!
    role: Role!
    joinedAt: DateTime!
  }

  type Query {
    myLeagues: [League!]! @requireAuth
    publicLeagues: [League!]! @requireAuth
    league(id: String!): League! @requireAuth
  }

  input LeagueRoundInput {
    theme: String!
    description: String
    submissionDurationHours: Int
    votingDurationHours: Int
  }

  input CreateLeagueInput {
    name: String!
    description: String
    isPublic: Boolean
    maxPlayers: Int
    upvotesPerRound: Int
    downvotesEnabled: Boolean
    downvotesPerRound: Int
    maxPointsPerSong: Int
    uniqueArtists: Boolean
    totalRounds: Int
    submissionDeadlineHours: Int
    votingDeadlineHours: Int
    startsAt: DateTime
    rounds: [LeagueRoundInput!]!
  }

  input UpdateLeagueInput {
    name: String
    description: String
    isPublic: Boolean
    maxPlayers: Int
    upvotesPerRound: Int
    downvotesEnabled: Boolean
    downvotesPerRound: Int
    maxPointsPerSong: Int
    uniqueArtists: Boolean
    totalRounds: Int
    submissionDeadlineHours: Int
    votingDeadlineHours: Int
  }

  type Mutation {
    createLeague(input: CreateLeagueInput!): League! @requireAuth
    updateLeague(id: String!, input: UpdateLeagueInput!): League! @requireAuth
    startLeague(id: String!): League! @requireAuth
    joinLeague(id: String!): League! @requireAuth
    joinLeagueByInvite(inviteCode: String!): League! @requireAuth
    leaveLeague(id: String!): Boolean! @requireAuth
  }
`
