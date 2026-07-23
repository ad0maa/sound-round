import crypto from 'node:crypto'

import type {
  QueryResolvers,
  MutationResolvers,
  LeagueRelationResolvers,
} from 'types/graphql'

import { ForbiddenError, UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireLeagueRole } from 'src/lib/membership'
import {
  openRoundForSubmissions,
  settleLeagueRounds,
} from 'src/lib/roundManager'

const generateInviteCode = () => crypto.randomBytes(8).toString('base64url')

const currentUserId = () => context.currentUser.id as string

export const myLeagues: QueryResolvers['myLeagues'] = () => {
  return db.league.findMany({
    where: { members: { some: { userId: currentUserId() } } },
    orderBy: { createdAt: 'desc' },
  })
}

/** Discoverable leagues anyone can browse and join directly (no invite needed). */
export const publicLeagues: QueryResolvers['publicLeagues'] = () => {
  return db.league.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const league: QueryResolvers['league'] = async ({ id }) => {
  const found = await db.league.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!found) {
    throw new UserInputError('League not found')
  }

  const isMember = found.members.some((m) => m.userId === currentUserId())
  if (!isMember && !found.isPublic) {
    throw new ForbiddenError('Not a member of this league')
  }

  // Lazily apply any due deadline transitions (and scheduled start) so the
  // league page always reflects settled round states.
  await settleLeagueRounds(id)

  return found
}

export const createLeague: MutationResolvers['createLeague'] = async ({
  input,
}) => {
  const { rounds, totalRounds: _ignored, ...leagueData } = input

  if (!rounds || rounds.length < 1) {
    throw new UserInputError('A league needs at least one round')
  }
  if (rounds.some((r) => !r.theme.trim())) {
    throw new UserInputError('Every round needs a theme')
  }

  // Creator automatically joins with the "creator" role. All rounds are
  // created upfront in `upcoming` — round 1 opens via startLeague, the
  // scheduled startsAt, or automatically when the league fills up.
  return db.$transaction(async (tx) => {
    const created = await tx.league.create({
      data: {
        ...leagueData,
        totalRounds: rounds.length,
        creatorId: currentUserId(),
        inviteCode: generateInviteCode(),
        members: {
          create: { userId: currentUserId(), role: 'creator' },
        },
      },
    })

    await tx.round.createMany({
      data: rounds.map((r, i) => ({
        leagueId: created.id,
        roundNumber: i + 1,
        theme: r.theme.trim(),
        description: r.description,
        submissionDurationHours: r.submissionDurationHours,
        votingDurationHours: r.votingDurationHours,
      })),
    })

    return created
  })
}

export const startLeague: MutationResolvers['startLeague'] = async ({ id }) => {
  await requireLeagueRole(id, ['creator', 'admin'])

  const found = await db.league.findUnique({ where: { id } })
  if (!found) {
    throw new UserInputError('League not found')
  }

  const firstRound = await db.round.findUnique({
    where: { leagueId_roundNumber: { leagueId: id, roundNumber: 1 } },
  })
  if (!firstRound) {
    throw new UserInputError('League has no rounds')
  }
  if (firstRound.state !== 'upcoming') {
    throw new UserInputError('League has already started')
  }

  await openRoundForSubmissions(firstRound, found)

  return found
}

export const updateLeague: MutationResolvers['updateLeague'] = async ({
  id,
  input,
}) => {
  await requireLeagueRole(id, ['creator', 'admin'])

  const found = await db.league.findUnique({ where: { id } })
  if (!found) {
    throw new UserInputError('League not found')
  }

  if (input.maxPlayers != null) {
    const memberCount = await db.leagueMember.count({
      where: { leagueId: id },
    })
    if (input.maxPlayers < memberCount) {
      throw new UserInputError(
        `League already has ${memberCount} members — max players can't go below that`
      )
    }
  }

  return db.league.update({ where: { id }, data: input })
}

export const removeMember: MutationResolvers['removeMember'] = async ({
  leagueId,
  userId,
}) => {
  const me = await requireLeagueRole(leagueId, ['creator', 'admin'])

  if (userId === currentUserId()) {
    throw new UserInputError('Use "leave league" to remove yourself')
  }

  const target = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  })
  if (!target) {
    throw new UserInputError('Not a member')
  }
  if (target.role === 'creator') {
    throw new ForbiddenError('The creator cannot be removed')
  }
  if (target.role === 'admin' && me.role !== 'creator') {
    throw new ForbiddenError('Only the creator can remove an admin')
  }

  // Their past submissions and votes stay — the leaderboard already tolerates
  // departed members.
  await db.leagueMember.delete({
    where: { leagueId_userId: { leagueId, userId } },
  })

  return true
}

export const updateMemberRole: MutationResolvers['updateMemberRole'] = async ({
  leagueId,
  userId,
  role,
}) => {
  await requireLeagueRole(leagueId, ['creator'])

  if (role === 'creator') {
    throw new UserInputError('A league has exactly one creator')
  }

  const target = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  })
  if (!target) {
    throw new UserInputError('Not a member')
  }
  if (target.role === 'creator') {
    throw new UserInputError("The creator's role cannot be changed")
  }

  return db.leagueMember.update({
    where: { leagueId_userId: { leagueId, userId } },
    data: { role },
  })
}

/** Invalidates the old invite link (e.g. if it leaked) by minting a new code. */
export const rotateInviteCode: MutationResolvers['rotateInviteCode'] = async ({
  id,
}) => {
  await requireLeagueRole(id, ['creator', 'admin'])

  return db.league.update({
    where: { id },
    data: { inviteCode: generateInviteCode() },
  })
}

const joinAsPlayer = async (leagueId: string, maxPlayers: number) => {
  const existing = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId: currentUserId() } },
  })
  if (existing) {
    throw new UserInputError('Already a member')
  }

  const memberCount = await db.leagueMember.count({ where: { leagueId } })
  if (memberCount >= maxPlayers) {
    throw new UserInputError('League is full')
  }

  await db.leagueMember.create({
    data: { leagueId, userId: currentUserId(), role: 'player' },
  })

  // Auto-start: when the league fills up, open round 1.
  if (memberCount + 1 >= maxPlayers) {
    const league = await db.league.findUnique({ where: { id: leagueId } })
    const firstRound = await db.round.findUnique({
      where: { leagueId_roundNumber: { leagueId, roundNumber: 1 } },
    })
    if (league && firstRound?.state === 'upcoming') {
      await openRoundForSubmissions(firstRound, league)
    }
  }
}

export const joinLeague: MutationResolvers['joinLeague'] = async ({ id }) => {
  const found = await db.league.findUnique({ where: { id } })
  if (!found) {
    throw new UserInputError('League not found')
  }

  await joinAsPlayer(found.id, found.maxPlayers)

  return found
}

export const joinLeagueByInvite: MutationResolvers['joinLeagueByInvite'] =
  async ({ inviteCode }) => {
    const found = await db.league.findUnique({ where: { inviteCode } })
    if (!found) {
      throw new UserInputError('Invalid invite code')
    }

    await joinAsPlayer(found.id, found.maxPlayers)

    return found
  }

export const leaveLeague: MutationResolvers['leaveLeague'] = async ({ id }) => {
  const member = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: currentUserId() } },
  })

  if (!member) {
    throw new UserInputError('Not a member')
  }
  if (member.role === 'creator') {
    throw new UserInputError('Creator cannot leave the league')
  }

  await db.leagueMember.delete({
    where: { leagueId_userId: { leagueId: id, userId: currentUserId() } },
  })

  return true
}

export const League: LeagueRelationResolvers = {
  creator: (_obj, { root }) => {
    return db.league.findUnique({ where: { id: root?.id } }).creator()
  },
  members: (_obj, { root }) => {
    return db.leagueMember.findMany({
      where: { leagueId: root?.id },
      orderBy: { joinedAt: 'asc' },
    })
  },
  rounds: (_obj, { root }) => {
    return db.round.findMany({
      where: { leagueId: root?.id },
      orderBy: { roundNumber: 'asc' },
    })
  },
  memberCount: (_obj, { root }) => {
    return db.leagueMember.count({ where: { leagueId: root?.id } })
  },
  myRole: async (_obj, { root }) => {
    // publicLeagues is browsable without auth, so this may run with no
    // currentUser — treat that as "not a member" rather than throwing.
    if (!context.currentUser) {
      return null
    }
    const member = await db.leagueMember.findUnique({
      where: {
        leagueId_userId: { leagueId: root?.id, userId: currentUserId() },
      },
    })
    return member?.role ?? null
  },
  hasStarted: async (_obj, { root }) => {
    // Started = round 1 has left `upcoming`.
    const firstRound = await db.round.findUnique({
      where: { leagueId_roundNumber: { leagueId: root?.id, roundNumber: 1 } },
    })
    return firstRound ? firstRound.state !== 'upcoming' : false
  },
  isFinished: async (_obj, { root }) => {
    const found = await db.league.findUnique({ where: { id: root?.id } })
    const completed = await db.round.count({
      where: { leagueId: root?.id, state: 'results' },
    })
    return completed >= (found?.totalRounds ?? Infinity)
  },
}

export const LeagueMember = {
  user: (
    _obj: unknown,
    { root }: { root: { leagueId: string; userId: string } }
  ) => {
    return db.user.findUnique({ where: { id: root.userId } })
  },
}
