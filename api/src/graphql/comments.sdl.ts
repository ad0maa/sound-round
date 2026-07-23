export const schema = gql`
  """
  Round-scoped discussion, opened once the round hits results — commenting
  earlier would leak submitter identity and undermine blind voting.
  """
  type Comment {
    id: String!
    roundId: String!
    user: User!
    body: String!
    createdAt: DateTime!
  }

  type Query {
    comments(roundId: String!): [Comment!]! @requireAuth
  }

  input CreateCommentInput {
    roundId: String!
    body: String!
  }

  type Mutation {
    createComment(input: CreateCommentInput!): Comment! @requireAuth
    deleteComment(id: String!): Boolean! @requireAuth
  }
`
