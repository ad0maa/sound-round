export const schema = gql`
  type User {
    id: String!
    displayName: String!
    avatarUrl: String
  }

  input UpdateProfileInput {
    displayName: String!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User! @requireAuth
  }
`
