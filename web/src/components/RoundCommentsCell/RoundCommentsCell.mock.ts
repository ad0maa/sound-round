// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  comments: [
    {
      __typename: 'Comment' as const,
      id: 'comment-1',
      body: 'What a round — that opener was unbeatable.',
      createdAt: '2026-07-20T10:00:00Z',
      user: { __typename: 'User' as const, displayName: 'Alice' },
    },
    {
      __typename: 'Comment' as const,
      id: 'comment-2',
      body: 'Robbed. Absolutely robbed.',
      createdAt: '2026-07-20T10:05:00Z',
      user: { __typename: 'User' as const, displayName: 'Bob' },
    },
  ],
})
