import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireMembership } from 'src/lib/membership'
import {
  checkAutoAdvanceVoting,
  settleLeagueRounds,
  settleRound,
} from 'src/lib/roundManager'
import { ballotRemaining, voteCaps } from 'src/lib/voteBudget'

const currentUserId = () => context.currentUser.id as string

export const myVotes: QueryResolvers['myVotes'] = async ({ roundId }) => {
  const round = await settleRound(roundId)
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
  // Settling first means an expired voting window is rejected by the state
  // guard below rather than silently accepting late votes.
  const round = await settleRound(roundId)
  if (!round) {
    throw new UserInputError('Round not found')
  }
  await requireMembership(round.leagueId)

  if (round.state !== 'voting') {
    throw new UserInputError('Round is not in voting phase')
  }

  const league = await db.league.findUnique({ where: { id: round.leagueId } })

  // The budget depends on how many songs this voter can actually vote on: with
  // a per-song cap and few players, the round can't absorb the league's nominal
  // per-round allowance. See src/lib/voteBudget.ts.
  const roundSubmissions = await db.submission.findMany({ where: { roundId } })
  const byId = new Map(roundSubmissions.map((s) => [s.id, s]))
  const votable = roundSubmissions.filter((s) => s.userId !== currentUserId())

  // Validate submissions belong to this round; no self-voting; one vote each
  const seen = new Set<string>()
  for (const v of votes) {
    const submission = byId.get(v.submissionId)
    if (!submission) {
      throw new UserInputError(`Invalid submission: ${v.submissionId}`)
    }
    if (submission.userId === currentUserId()) {
      throw new UserInputError('Cannot vote on your own submission')
    }
    if (seen.has(v.submissionId)) {
      throw new UserInputError('Each song can only be given one vote')
    }
    seen.add(v.submissionId)
  }

  const { capUp, capDown } = voteCaps(league)
  const hasDownvote = votes.some((v) => v.points < 0)

  if (hasDownvote && !league.downvotesEnabled) {
    throw new UserInputError('Downvotes are not enabled')
  }

  for (const v of votes) {
    if (v.points > capUp) {
      throw new UserInputError(
        `Cannot give more than ${capUp} point${capUp === 1 ? '' : 's'} to a single song`
      )
    }
    if (-v.points > capDown) {
      throw new UserInputError(
        `Cannot give more than ${capDown} downvote${capDown === 1 ? '' : 's'} to a single song`
      )
    }
  }

  // Score every votable song, including the ones left at zero — the budget
  // helpers need the full ballot to tell whether anything is still placeable.
  const pointsBySubmission = new Map(
    votes.map((v) => [v.submissionId, v.points])
  )
  const ballot = ballotRemaining({
    league,
    points: votable.map((s) => pointsBySubmission.get(s.id) ?? 0),
  })

  if (ballot.upRemaining < 0) {
    throw new UserInputError(
      `Cannot distribute more than ${ballot.effectiveUp} upvote points`
    )
  }
  if (ballot.downRemaining < 0) {
    throw new UserInputError(
      `Cannot distribute more than ${ballot.effectiveDown} downvote points`
    )
  }

  // A ballot has to be spent out before it counts. Being specific here matters:
  // the client gates the submit button on the same rule, so any disagreement
  // shows up as a readable message rather than a masked server error.
  if (ballot.canPlaceUp) {
    throw new UserInputError(
      `You still have ${ballot.upRemaining} of ${ballot.effectiveUp} points to place`
    )
  }
  if (ballot.canPlaceDown) {
    throw new UserInputError(
      `You still have ${ballot.downRemaining} of ${ballot.effectiveDown} downvotes to place`
    )
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
  // A just-expired voting round should count in the standings.
  await settleLeagueRounds(leagueId)

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
