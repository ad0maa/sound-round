// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  round: {
    __typename: 'Round' as const,
    id: '42',
  },
})
