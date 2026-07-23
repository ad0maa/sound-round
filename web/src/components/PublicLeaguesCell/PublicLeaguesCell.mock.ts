// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  publicLeagues: [
    {
      __typename: 'League' as const,
      id: '42',
    },
    {
      __typename: 'League' as const,
      id: '43',
    },
    {
      __typename: 'League' as const,
      id: '44',
    },
  ],
})
