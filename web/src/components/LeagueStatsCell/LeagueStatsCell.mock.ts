// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  leagueStats: {
    __typename: 'LeagueStats' as const,
    roundsCompleted: 2,
    bestSingleRound: {
      __typename: 'BestSingleRound' as const,
      displayName: 'Alice',
      roundNumber: 1,
      theme: 'Songs about rain',
      trackName: 'Purple Rain',
      points: 14,
    },
    bestAverage: {
      __typename: 'UserAverage' as const,
      displayName: 'Alice',
      average: 11.5,
      submissionCount: 2,
    },
    mostConsistent: {
      __typename: 'UserAverage' as const,
      displayName: 'Bob',
      average: 8,
      submissionCount: 2,
    },
    biggestFan: {
      __typename: 'PairPoints' as const,
      fromName: 'Carol',
      toName: 'Alice',
      points: 9,
    },
    mostControversial: {
      __typename: 'ControversialTrack' as const,
      trackName: 'Barbie Girl',
      artistName: 'Aqua',
      displayName: 'Dave',
      upPoints: 6,
      downPoints: 3,
    },
    averages: [
      {
        __typename: 'UserAverage' as const,
        displayName: 'Alice',
        average: 11.5,
        submissionCount: 2,
      },
      {
        __typename: 'UserAverage' as const,
        displayName: 'Bob',
        average: 8,
        submissionCount: 2,
      },
    ],
    pointsGiven: [
      {
        __typename: 'PairPoints' as const,
        fromName: 'Carol',
        toName: 'Alice',
        points: 9,
      },
      {
        __typename: 'PairPoints' as const,
        fromName: 'Bob',
        toName: 'Dave',
        points: -2,
      },
    ],
  },
})
