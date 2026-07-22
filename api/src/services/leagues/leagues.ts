import crypto from 'node:crypto'

import type {
  QueryResolvers,
  MutationResolvers,
  LeagueRelationResolvers,
} from 'types/graphql'

import { ForbiddenError, UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'

const generateInviteCode = () => crypto.randomBytes(8).toString('base64url')

const currentUserId = () => context.currentUser.id as string

export const myLeagues: QueryResolvers['myLeagues'] = () => {
  return db.league.findMany({
    where: { members: { some: { userId: currentUserId() } } },
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

  return found
}

export const createLeague: MutationResolvers['createLeague'] = ({ input }) => {
  // Creator automatically joins with the "creator" role
  return db.league.create({
    data: {
      ...input,
      creatorId: currentUserId(),
      inviteCode: generateInviteCode(),
      members: {
        create: { userId: currentUserId(), role: 'creator' },
      },
    },
  })
}

export const updateLeague: MutationResolvers['updateLeague'] = async ({
  id,
  input,
}) => {
  const found = await db.league.findUnique({ where: { id } })

  if (!found) {
    throw new UserInputError('League not found')
  }
  if (found.creatorId !== currentUserId()) {
    throw new ForbiddenError('Only the creator can edit this league')
  }

  return db.league.update({ where: { id }, data: input })
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
    const member = await db.leagueMember.findUnique({
      where: {
        leagueId_userId: { leagueId: root?.id, userId: currentUserId() },
      },
    })
    return member?.role ?? null
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
