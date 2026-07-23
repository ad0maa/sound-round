import type { Vote } from 'api/db/generated/prisma'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'

import { castVotes, myVotes } from './votes.js'
import type { StandardScenario } from './votes.scenarios.js'

// castVotes budget + integrity validation, ported behavior from the original
// FastAPI app. League `main`: 10 upvotes, 3 downvotes, 5-point cap per song.

const asUser = (user: { id: string; email: string; displayName: string }) =>
  mockCurrentUser({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isDemo: false,
    demoExpiresAt: null,
  })

describe('castVotes validation', () => {
  scenario(
    'rejects spending more than the upvote budget',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: 5 },
          ],
        })
      ).resolves.toHaveLength(2)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: 1 },
          ],
        })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects downvotes when the league has them disabled',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.noDownVoting.id,
          votes: [
            { submissionId: scenario.submission.noDownFromBob.id, points: -1 },
          ],
        })
      ).rejects.toThrow('Downvotes are not enabled')
    }
  )

  scenario(
    'rejects spending more than the downvote budget',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: -2 },
            { submissionId: scenario.submission.fromCarol.id, points: -2 },
          ],
        })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects a single vote above maxPointsPerSong',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [{ submissionId: scenario.submission.fromBob.id, points: 6 }],
        })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects voting on your own submission',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromAlice.id, points: 1 },
          ],
        })
      ).rejects.toThrow('Cannot vote on your own submission')
    }
  )

  scenario(
    'rejects a submission that belongs to another round',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.noDownFromBob.id, points: 1 },
          ],
        })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects votes while the round is still submitting',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.noDownSubmitting.id,
          votes: [],
        })
      ).rejects.toThrow('Round is not in voting phase')
    }
  )
})

describe('castVotes semantics', () => {
  scenario(
    're-casting replaces the previous vote set',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [{ submissionId: scenario.submission.fromBob.id, points: 3 }],
      })
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [{ submissionId: scenario.submission.fromCarol.id, points: 2 }],
      })

      const mine = (await myVotes({
        roundId: scenario.round.voting.id,
      })) as Vote[]
      expect(mine).toHaveLength(1)
      expect(mine[0].submissionId).toBe(scenario.submission.fromCarol.id)
      expect(mine[0].points).toBe(2)
    }
  )

  scenario(
    'zero-point votes are dropped rather than stored',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [
          { submissionId: scenario.submission.fromBob.id, points: 2 },
          { submissionId: scenario.submission.fromCarol.id, points: 0 },
        ],
      })

      const mine = await myVotes({ roundId: scenario.round.voting.id })
      expect(mine).toHaveLength(1)
    }
  )

  scenario(
    'the last member voting advances the round to results and opens the next',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [{ submissionId: scenario.submission.fromBob.id, points: 3 }],
      })

      asUser(scenario.user.bob)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [{ submissionId: scenario.submission.fromCarol.id, points: 3 }],
      })

      // Not everyone has voted yet
      let round = await db.round.findUnique({
        where: { id: scenario.round.voting.id },
      })
      expect(round.state).toBe('voting')

      asUser(scenario.user.carol)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [{ submissionId: scenario.submission.fromAlice.id, points: 3 }],
      })

      round = await db.round.findUnique({
        where: { id: scenario.round.voting.id },
      })
      expect(round.state).toBe('results')

      const next = await db.round.findUnique({
        where: { id: scenario.round.next.id },
      })
      expect(next.state).toBe('submitting')
      expect(next.submissionsClose).not.toBeNull()
    }
  )
})
