// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  vote: {
    __typename: 'Vote' as const,
    id: '42',
  },
})
