import type {
  QueryResolvers,
  MutationResolvers,
  RoundRelationResolvers,
} from 'types/graphql'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireLeagueRole, requireMembership } from 'src/lib/membership'
import {
  advanceToResults,
  advanceToVoting,
  openRoundForSubmissions,
  settleLeagueRounds,
  settleRound,
} from 'src/lib/roundManager'

const STATE_ORDER = ['upcoming', 'submitting', 'voting', 'results'] as const

export const rounds: QueryResolvers['rounds'] = async ({ leagueId }) => {
  await requireMembership(leagueId)
  await settleLeagueRounds(leagueId)

  return db.round.findMany({
    where: { leagueId },
    orderBy: { roundNumber: 'asc' },
  })
}

export const round: QueryResolvers['round'] = async ({ id }) => {
  const found = await settleRound(id)
  if (!found) {
    throw new UserInputError('Round not found')
  }

  await requireMembership(found.leagueId)

  return found
}

export const roundProgress: QueryResolvers['roundProgress'] = async ({
  roundId,
}) => {
  const found = await settleRound(roundId)
  if (!found) {
    throw new UserInputError('Round not found')
  }

  await requireMembership(found.leagueId)

  const members = await db.leagueMember.findMany({
    where: { leagueId: found.leagueId },
    include: { user: { select: { displayName: true } } },
  })

  const submitters = await db.submission.findMany({
    where: { roundId },
    distinct: ['userId'],
    select: { userId: true },
  })
  const submittedIds = new Set(submitters.map((s) => s.userId))

  const voters = await db.vote.findMany({
    where: { roundId },
    distinct: ['voterId'],
    select: { voterId: true },
  })
  const votedIds = new Set(voters.map((v) => v.voterId))

  return {
    roundId: found.id,
    state: found.state,
    totalMembers: members.length,
    submittedCount: submittedIds.size,
    votedCount: votedIds.size,
    members: members.map((m) => ({
      userId: m.userId,
      displayName: m.user.displayName,
      hasSubmitted: submittedIds.has(m.userId),
      hasVoted: votedIds.has(m.userId),
    })),
  }
}

export const createRound: MutationResolvers['createRound'] = async ({
  input,
}) => {
  await requireLeagueRole(input.leagueId, ['creator', 'admin'])

  const league = await db.league.findUnique({ where: { id: input.leagueId } })

  const maxRound = await db.round.aggregate({
    where: { leagueId: input.leagueId },
    _max: { roundNumber: true },
  })
  const roundNumber = (maxRound._max.roundNumber ?? 0) + 1

  // Appending a round past totalRounds would otherwise never open —
  // maybeOpenNextRound stops at totalRounds — so grow the league to fit.
  const created = await db.$transaction(async (tx) => {
    if (roundNumber > league.totalRounds) {
      await tx.league.update({
        where: { id: league.id },
        data: { totalRounds: roundNumber },
      })
    }

    return tx.round.create({
      data: {
        leagueId: input.leagueId,
        roundNumber,
        theme: input.theme,
        description: input.description,
        songsPerPlayer: input.songsPerPlayer ?? 1,
        submissionDurationHours: input.submissionDurationHours,
        votingDurationHours: input.votingDurationHours,
      },
    })
  })

  // If the league is underway (some round has left `upcoming`) and no round is
  // currently active, the game stalled at the end — open this one immediately.
  const activeRound = await db.round.findFirst({
    where: {
      leagueId: input.leagueId,
      state: { in: ['submitting', 'voting'] },
    },
  })
  const started = await db.round.findFirst({
    where: { leagueId: input.leagueId, state: { not: 'upcoming' } },
  })

  if (started && !activeRound) {
    return openRoundForSubmissions(created, league)
  }

  return created
}

export const advanceRound: MutationResolvers['advanceRound'] = async ({
  id,
  state,
}) => {
  const found = await settleRound(id)
  if (!found) {
    throw new UserInputError('Round not found')
  }

  await requireLeagueRole(found.leagueId, ['creator', 'admin'])

  // Single forward steps only — multi-step jumps would skip transition side
  // effects (deadline stamps, next-round opening).
  if (STATE_ORDER.indexOf(state) !== STATE_ORDER.indexOf(found.state) + 1) {
    throw new UserInputError(
      `Cannot transition from '${found.state}' to '${state}'`
    )
  }

  const league = await db.league.findUnique({ where: { id: found.leagueId } })

  switch (state) {
    case 'submitting':
      return openRoundForSubmissions(found, league)
    case 'voting':
      return advanceToVoting(found, league)
    case 'results':
      return advanceToResults(found, league)
    default:
      throw new UserInputError(`Cannot transition to '${state}'`)
  }
}

export const Round: RoundRelationResolvers = {
  league: (_obj, { root }) => {
    return db.round.findUnique({ where: { id: root?.id } }).league()
  },
  submissionCount: (_obj, { root }) => {
    return db.submission.count({ where: { roundId: root?.id } })
  },
}
