// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  leaderboard: {
    __typename: 'Leaderboard' as const,
    id: 42,
  },
})
