import type {
  QueryResolvers,
  MutationResolvers,
  RoundRelationResolvers,
} from 'types/graphql'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireLeagueRole, requireMembership } from 'src/lib/membership'

const STATE_ORDER = ['upcoming', 'submitting', 'voting', 'results'] as const

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

export const rounds: QueryResolvers['rounds'] = async ({ leagueId }) => {
  await requireMembership(leagueId)

  return db.round.findMany({
    where: { leagueId },
    orderBy: { roundNumber: 'asc' },
  })
}

export const round: QueryResolvers['round'] = async ({ id }) => {
  const found = await db.round.findUnique({ where: { id } })
  if (!found) {
    throw new UserInputError('Round not found')
  }

  await requireMembership(found.leagueId)

  return found
}

export const roundProgress: QueryResolvers['roundProgress'] = async ({
  roundId,
}) => {
  const found = await db.round.findUnique({ where: { id: roundId } })
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

  // Fix for the original app's known bug: round 1 was created in `upcoming`
  // and nothing ever flipped it to `submitting` (leagues stalled forever).
  // Rounds >= 2 stay `upcoming` and are opened by maybeOpenNextRound.
  const firstRound = roundNumber === 1

  return db.round.create({
    data: {
      leagueId: input.leagueId,
      roundNumber,
      theme: input.theme,
      description: input.description,
      songsPerPlayer: input.songsPerPlayer ?? 1,
      ...(firstRound && {
        state: 'submitting' as const,
        submissionsOpen: new Date(),
        submissionsClose: hoursFromNow(league.submissionDeadlineHours),
      }),
    },
  })
}

export const advanceRound: MutationResolvers['advanceRound'] = async ({
  id,
  state,
}) => {
  const found = await db.round.findUnique({ where: { id } })
  if (!found) {
    throw new UserInputError('Round not found')
  }

  await requireLeagueRole(found.leagueId, ['creator', 'admin'])

  // Forward-only transitions
  if (STATE_ORDER.indexOf(state) <= STATE_ORDER.indexOf(found.state)) {
    throw new UserInputError(
      `Cannot transition from '${found.state}' to '${state}'`
    )
  }

  return db.round.update({ where: { id }, data: { state } })
}

export const Round: RoundRelationResolvers = {
  league: (_obj, { root }) => {
    return db.round.findUnique({ where: { id: root?.id } }).league()
  },
  submissionCount: (_obj, { root }) => {
    return db.submission.count({ where: { roundId: root?.id } })
  },
}
