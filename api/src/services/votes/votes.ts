import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireMembership } from 'src/lib/membership'
import { checkAutoAdvanceVoting } from 'src/lib/roundManager'

const currentUserId = () => context.currentUser.id as string

export const myVotes: QueryResolvers['myVotes'] = async ({ roundId }) => {
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round) {
    throw new UserInputError('Round not found')
  }
  await requireMembership(round.leagueId)

  return db.vote.findMany({
    where: { roundId, voterId: currentUserId() },
  })
}

export const castVotes: MutationResolvers['castVotes'] = async ({
  roundId,
  votes,
}) => {
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round) {
    throw new UserInputError('Round not found')
  }
  await requireMembership(round.leagueId)

  if (round.state !== 'voting') {
    throw new UserInputError('Round is not in voting phase')
  }

  const league = await db.league.findUnique({ where: { id: round.leagueId } })

  // Validate vote budgets
  const positiveTotal = votes
    .filter((v) => v.points > 0)
    .reduce((sum, v) => sum + v.points, 0)
  const negativeTotal = Math.abs(
    votes.filter((v) => v.points < 0).reduce((sum, v) => sum + v.points, 0)
  )

  if (positiveTotal > league.upvotesPerRound) {
    throw new UserInputError(
      `Cannot distribute more than ${league.upvotesPerRound} upvote points`
    )
  }
  if (negativeTotal > 0 && !league.downvotesEnabled) {
    throw new UserInputError('Downvotes are not enabled')
  }
  if (negativeTotal > league.downvotesPerRound) {
    throw new UserInputError(
      `Cannot distribute more than ${league.downvotesPerRound} downvote points`
    )
  }

  if (league.maxPointsPerSong) {
    for (const v of votes) {
      if (Math.abs(v.points) > league.maxPointsPerSong) {
        throw new UserInputError(
          `Cannot give more than ${league.maxPointsPerSong} points to a single song`
        )
      }
    }
  }

  // Validate submissions belong to this round; no self-voting
  const submissionIds = votes.map((v) => v.submissionId)
  const foundSubmissions = await db.submission.findMany({
    where: { id: { in: submissionIds } },
  })
  const byId = new Map(foundSubmissions.map((s) => [s.id, s]))

  for (const v of votes) {
    const submission = byId.get(v.submissionId)
    if (!submission || submission.roundId !== roundId) {
      throw new UserInputError(`Invalid submission: ${v.submissionId}`)
    }
    if (submission.userId === currentUserId()) {
      throw new UserInputError('Cannot vote on your own submission')
    }
  }

  // Bulk replace: delete this voter's existing votes, insert the new set
  const nonZero = votes.filter((v) => v.points !== 0)
  await db.$transaction([
    db.vote.deleteMany({ where: { roundId, voterId: currentUserId() } }),
    db.vote.createMany({
      data: nonZero.map((v) => ({
        roundId,
        voterId: currentUserId(),
        submissionId: v.submissionId,
        points: v.points,
      })),
    }),
  ])

  // All members voted? Auto-advance to results + open next round.
  await checkAutoAdvanceVoting(roundId)

  return db.vote.findMany({
    where: { roundId, voterId: currentUserId() },
  })
}

/**
 * Cumulative league leaderboard (new feature — the original app only had
 * per-round results). Aggregates votes across completed (results-state)
 * rounds only, so in-flight votes never leak.
 */
export const leagueLeaderboard: QueryResolvers['leagueLeaderboard'] = async ({
  leagueId,
}) => {
  await requireMembership(leagueId)

  const members = await db.leagueMember.findMany({
    where: { leagueId },
    include: { user: true },
  })

  const completedRounds = await db.round.findMany({
    where: { leagueId, state: 'results' },
    include: {
      submissions: {
        include: { votes: { select: { points: true } } },
      },
    },
  })

  // Seed from members so zero-point players still appear
  const totals = new Map(
    members.map((m) => [
      m.userId,
      { user: m.user, totalPoints: 0, submissionCount: 0, roundsWon: 0 },
    ])
  )

  for (const round of completedRounds) {
    let bestPoints = -Infinity
    let bestUserIds: string[] = []

    for (const submission of round.submissions) {
      const entry = totals.get(submission.userId)
      if (!entry) {
        continue // submitter has since left the league
      }

      const points = submission.votes.reduce((sum, v) => sum + v.points, 0)
      entry.totalPoints += points
      entry.submissionCount += 1

      if (points > bestPoints) {
        bestPoints = points
        bestUserIds = [submission.userId]
      } else if (points === bestPoints) {
        bestUserIds.push(submission.userId)
      }
    }

    for (const userId of new Set(bestUserIds)) {
      const entry = totals.get(userId)
      if (entry) {
        entry.roundsWon += 1
      }
    }
  }

  return [...totals.values()].sort((a, b) => b.totalPoints - a.totalPoints)
}
