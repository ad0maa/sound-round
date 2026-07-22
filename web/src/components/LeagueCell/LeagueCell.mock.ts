// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  league: {
    __typename: 'League' as const,
    id: '42',
  },
})
