import { UserInputError, ForbiddenError } from '@cedarjs/graphql-server'

import { comments, createComment, deleteComment } from './comments.js'
import type { StandardScenario } from './comments.scenarios.js'

const asUser = (user: { id: string; email: string; displayName: string }) =>
  mockCurrentUser({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isDemo: false,
    demoExpiresAt: null,
  })

describe('comments', () => {
  scenario(
    'members can comment once the round reaches results',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      const created = await createComment({
        input: { roundId: scenario.round.results.id, body: '  Banger.  ' },
      })
      expect(created.body).toBe('Banger.')

      const list = await comments({ roundId: scenario.round.results.id })
      expect(list).toHaveLength(2) // scenario comment + this one
    }
  )

  scenario(
    'rejects comments before the results reveal',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        createComment({
          input: { roundId: scenario.round.voting.id, body: 'Too early' },
        })
      ).rejects.toThrow('Comments open once the round results are revealed')
    }
  )

  scenario(
    'rejects empty and oversized comments',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        createComment({
          input: { roundId: scenario.round.results.id, body: '   ' },
        })
      ).rejects.toThrow(UserInputError)

      await expect(
        createComment({
          input: {
            roundId: scenario.round.results.id,
            body: 'x'.repeat(1001),
          },
        })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario('rejects non-members', async (scenario: StandardScenario) => {
    asUser(scenario.user.outsider)

    await expect(
      comments({ roundId: scenario.round.results.id })
    ).rejects.toThrow(ForbiddenError)
  })

  scenario(
    'authors and managers can delete; other players cannot',
    async (scenario: StandardScenario) => {
      // Bob (author) can delete his own comment
      asUser(scenario.user.bob)
      expect(await deleteComment({ id: scenario.comment.fromBob.id })).toBe(
        true
      )

      // Recreate as bob, then the creator (alice) can moderate it away
      const recreated = await createComment({
        input: { roundId: scenario.round.results.id, body: 'Again!' },
      })
      asUser(scenario.user.alice)
      expect(await deleteComment({ id: recreated.id })).toBe(true)

      // A plain player can't delete someone else's comment
      asUser(scenario.user.alice)
      const aliceComment = await createComment({
        input: { roundId: scenario.round.results.id, body: 'Mine' },
      })
      asUser(scenario.user.bob)
      await expect(deleteComment({ id: aliceComment.id })).rejects.toThrow(
        ForbiddenError
      )
    }
  )
})
