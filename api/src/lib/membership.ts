import type { LeagueMember, Role } from 'api/db/generated/prisma/client.mts'

import { ForbiddenError } from '@cedarjs/graphql-server'

import { db } from './db.js'

/**
 * League roles are league-scoped, not global, so they're checked inline here
 * rather than via `@requireAuth(roles:)` (which only understands one global
 * role per user). Ported from `_check_membership` in the original FastAPI app.
 */
export const requireMembership = async (
  leagueId: string
): Promise<LeagueMember> => {
  const member = await db.leagueMember.findUnique({
    where: {
      leagueId_userId: { leagueId, userId: context.currentUser.id as string },
    },
  })

  if (!member) {
    throw new ForbiddenError('Not a member of this league')
  }

  return member
}

export const requireLeagueRole = async (
  leagueId: string,
  roles: Role[]
): Promise<LeagueMember> => {
  const member = await requireMembership(leagueId)

  if (!roles.includes(member.role)) {
    throw new ForbiddenError("You don't have permission to do that")
  }

  return member
}
