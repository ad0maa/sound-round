import type { Vote } from 'api/db/generated/prisma'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'

import { castVotes, myVotes } from './votes.js'
import type { StandardScenario } from './votes.scenarios.js'

// castVotes budget + integrity validation. League `main`: 6 upvote points
// (5 max per song), 3 downvote points (2 max per song), downvotes enabled.
// Alice can vote on Bob's and Carol's songs, so her effective budget is
// min(6, 2 × 5) = 6 upvote points and min(3, 2 × 2) = 3 downvotes.

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
      ).rejects.toThrow('Cannot distribute more than 6 upvote points')
    }
  )

  scenario(
    'rejects two votes on the same song',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: 1 },
            { submissionId: scenario.submission.fromCarol.id, points: 1 },
          ],
        })
      ).rejects.toThrow('Each song can only be given one vote')
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
      ).rejects.toThrow('Cannot distribute more than 3 downvote points')
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
      ).rejects.toThrow('Cannot give more than 5 points to a single song')
    }
  )

  scenario(
    'caps downvotes separately from upvotes',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      // 3 is under the 5-point upvote cap but over the 2-point downvote cap,
      // which only holds if the two directions are capped independently.
      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [{ submissionId: scenario.submission.fromBob.id, points: -3 }],
        })
      ).rejects.toThrow('Cannot give more than 2 downvotes to a single song')

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 3 },
            { submissionId: scenario.submission.fromCarol.id, points: 3 },
          ],
        })
      ).resolves.toHaveLength(2)
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

describe('castVotes ballot completeness', () => {
  scenario('rejects an empty ballot', async (scenario: StandardScenario) => {
    asUser(scenario.user.alice)

    await expect(
      castVotes({ roundId: scenario.round.voting.id, votes: [] })
    ).rejects.toThrow('You still have 6 of 6 points to place')
  })

  scenario(
    'rejects a ballot with points left over',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 3 },
            { submissionId: scenario.submission.fromCarol.id, points: 1 },
          ],
        })
      ).rejects.toThrow('You still have 2 of 6 points to place')
    }
  )

  scenario(
    'rejects a ballot that leaves a song untouched',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [{ submissionId: scenario.submission.fromBob.id, points: 5 }],
        })
      ).rejects.toThrow('You still have 1 of 6 points to place')
    }
  )

  scenario(
    'accepts a ballot once no further point can be placed',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      // Both songs hold upvotes, so there is nowhere left to put a downvote
      // even though the downvote budget is untouched.
      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: 1 },
          ],
        })
      ).resolves.toHaveLength(2)
    }
  )

  scenario(
    'accepts a mixed up- and downvote ballot',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      // Bob maxed at the 5-point cap, Carol maxed at the 2-downvote cap: a
      // point remains in each budget but neither song can take another.
      await expect(
        castVotes({
          roundId: scenario.round.voting.id,
          votes: [
            { submissionId: scenario.submission.fromBob.id, points: 5 },
            { submissionId: scenario.submission.fromCarol.id, points: -2 },
          ],
        })
      ).resolves.toHaveLength(2)
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
        votes: [
          { submissionId: scenario.submission.fromBob.id, points: 5 },
          { submissionId: scenario.submission.fromCarol.id, points: 1 },
        ],
      })
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [
          { submissionId: scenario.submission.fromBob.id, points: 2 },
          { submissionId: scenario.submission.fromCarol.id, points: 4 },
        ],
      })

      const mine = (await myVotes({
        roundId: scenario.round.voting.id,
      })) as Vote[]
      expect(mine).toHaveLength(2)
      expect(
        mine.find((v) => v.submissionId === scenario.submission.fromCarol.id)
          .points
      ).toBe(4)
    }
  )

  scenario(
    'zero-point votes are dropped rather than stored',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      // No per-song cap in this league, so all 10 points fit on Bob's song and
      // Dave's can legitimately sit at zero.
      await castVotes({
        roundId: scenario.round.noDownVoting.id,
        votes: [
          { submissionId: scenario.submission.noDownFromBob.id, points: 10 },
          { submissionId: scenario.submission.noDownFromDave.id, points: 0 },
        ],
      })

      const mine = await myVotes({ roundId: scenario.round.noDownVoting.id })
      expect(mine).toHaveLength(1)
    }
  )

  scenario(
    'the last member voting advances the round to results and opens the next',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [
          { submissionId: scenario.submission.fromBob.id, points: 5 },
          { submissionId: scenario.submission.fromCarol.id, points: 1 },
        ],
      })

      asUser(scenario.user.bob)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [
          { submissionId: scenario.submission.fromAlice.id, points: 5 },
          { submissionId: scenario.submission.fromCarol.id, points: 1 },
        ],
      })

      // Not everyone has voted yet
      let round = await db.round.findUnique({
        where: { id: scenario.round.voting.id },
      })
      expect(round.state).toBe('voting')

      asUser(scenario.user.carol)
      await castVotes({
        roundId: scenario.round.voting.id,
        votes: [
          { submissionId: scenario.submission.fromAlice.id, points: 5 },
          { submissionId: scenario.submission.fromBob.id, points: 1 },
        ],
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
