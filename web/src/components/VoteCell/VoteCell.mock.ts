const submissions = [
  {
    __typename: 'Submission' as const,
    id: 'sub-1',
    trackName: 'Midnight City',
    artistName: 'M83',
    artworkUrl: null,
    platform: 'youtube',
    platformTrackId: 'dX3k_QDnzHE',
    trackUrl: 'https://www.youtube.com/watch?v=dX3k_QDnzHE',
    isMine: false,
  },
  {
    __typename: 'Submission' as const,
    id: 'sub-2',
    trackName: 'Genesis',
    artistName: 'Justice',
    artworkUrl: null,
    platform: 'spotify',
    platformTrackId: '3H3cOQ6LBLSvmcaV7QkZEu',
    trackUrl: 'https://open.spotify.com/track/3H3cOQ6LBLSvmcaV7QkZEu',
    isMine: false,
  },
  {
    __typename: 'Submission' as const,
    id: 'sub-3',
    trackName: 'My Own Song',
    artistName: 'Me',
    artworkUrl: null,
    platform: 'youtube',
    platformTrackId: 'abc123def45',
    trackUrl: 'https://www.youtube.com/watch?v=abc123def45',
    isMine: true,
  },
]

export const standard = (/* vars, { ctx, req } */) => ({
  league: {
    __typename: 'League' as const,
    id: 'league-1',
    upvotesPerRound: 10,
    maxPointsPerSong: null,
    downvotesEnabled: false,
    downvotesPerRound: 0,
  },
  round: {
    __typename: 'Round' as const,
    id: 'round-1',
    state: 'voting',
  },
  submissions,
  myVotes: [],
})

export const withDownvotes = (/* vars, { ctx, req } */) => ({
  league: {
    __typename: 'League' as const,
    id: 'league-1',
    upvotesPerRound: 10,
    maxPointsPerSong: 5,
    downvotesEnabled: true,
    downvotesPerRound: 3,
  },
  round: {
    __typename: 'Round' as const,
    id: 'round-1',
    state: 'voting',
  },
  submissions,
  myVotes: [{ submissionId: 'sub-2', points: -1 }],
})
