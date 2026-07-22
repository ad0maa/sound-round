// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  results: [
    {
      __typename: 'Results' as const,
      id: 42,
    },
    {
      __typename: 'Results' as const,
      id: 43,
    },
    {
      __typename: 'Results' as const,
      id: 44,
    },
  ],
})
