// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  league: {
    __typename: 'League' as const,
    id: 'league-1',
    name: 'Friday Sound Club',
    description: 'Five friends, five rounds, zero shame.',
    isPublic: false,
    inviteCode: 'friday-club',
    maxPlayers: 8,
    upvotesPerRound: 10,
    downvotesEnabled: true,
    downvotesPerRound: 3,
    maxPointsPerSong: 5,
    uniqueArtists: false,
    submissionDeadlineHours: 72,
    votingDeadlineHours: 48,
    myRole: 'creator' as const,
    hasStarted: true,
    members: [
      {
        __typename: 'LeagueMember' as const,
        userId: 'user-1',
        role: 'creator' as const,
        joinedAt: '2026-07-01T00:00:00Z',
        user: { __typename: 'User' as const, displayName: 'Alice' },
      },
      {
        __typename: 'LeagueMember' as const,
        userId: 'user-2',
        role: 'admin' as const,
        joinedAt: '2026-07-02T00:00:00Z',
        user: { __typename: 'User' as const, displayName: 'Bob' },
      },
      {
        __typename: 'LeagueMember' as const,
        userId: 'user-3',
        role: 'player' as const,
        joinedAt: '2026-07-03T00:00:00Z',
        user: { __typename: 'User' as const, displayName: 'Carol' },
      },
    ],
  },
})
