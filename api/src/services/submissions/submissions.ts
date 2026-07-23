import type { Submission as PrismaSubmission } from 'api/db/generated/prisma'
import type {
  QueryResolvers,
  MutationResolvers,
  SubmissionRelationResolvers,
} from 'types/graphql'

import { UserInputError, ForbiddenError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireMembership } from 'src/lib/membership'
import { checkAutoAdvanceSubmission, settleRound } from 'src/lib/roundManager'

const currentUserId = () => context.currentUser.id as string

// settleRound lazily applies any deadline-driven state transition, so the
// state guards below also enforce expired submission/voting windows.
const getRoundOrThrow = async (roundId: string) => {
  const round = await settleRound(roundId)
  if (!round) {
    throw new UserInputError('Round not found')
  }
  return round
}

export const submissions: QueryResolvers['submissions'] = async ({
  roundId,
}) => {
  const round = await getRoundOrThrow(roundId)
  await requireMembership(round.leagueId)

  // Blind while submitting: players only see their own submissions
  return db.submission.findMany({
    where: {
      roundId,
      ...(round.state === 'submitting' && { userId: currentUserId() }),
    },
    orderBy: { submittedAt: 'asc' },
  })
}

export const createSubmission: MutationResolvers['createSubmission'] = async ({
  input,
}) => {
  const round = await getRoundOrThrow(input.roundId)
  await requireMembership(round.leagueId)

  if (round.state !== 'submitting') {
    throw new UserInputError('Round is not accepting submissions')
  }

  const myCount = await db.submission.count({
    where: { roundId: round.id, userId: currentUserId() },
  })
  if (myCount >= round.songsPerPlayer) {
    throw new UserInputError(
      `You can only submit ${round.songsPerPlayer} song(s) per round`
    )
  }

  const dupTrack = await db.submission.findFirst({
    where: {
      roundId: round.id,
      platform: input.platform,
      platformTrackId: input.platformTrackId,
    },
  })
  if (dupTrack) {
    throw new UserInputError(
      'This song has already been submitted by another player in this round'
    )
  }

  const league = await db.league.findUnique({ where: { id: round.leagueId } })
  if (league?.uniqueArtists) {
    const dupArtist = await db.submission.findFirst({
      where: {
        roundId: round.id,
        artistName: { equals: input.artistName, mode: 'insensitive' },
      },
    })
    if (dupArtist) {
      throw new UserInputError(
        'A song by this artist has already been submitted in this round (unique artists rule)'
      )
    }
  }

  const submission = await db.submission.create({
    data: { ...input, userId: currentUserId() },
  })

  // All members submitted? Auto-advance to voting.
  await checkAutoAdvanceSubmission(round.id)

  return submission
}

export const deleteSubmission: MutationResolvers['deleteSubmission'] = async ({
  id,
}) => {
  const submission = await db.submission.findUnique({ where: { id } })
  if (!submission) {
    throw new UserInputError('Submission not found')
  }

  const round = await getRoundOrThrow(submission.roundId)
  await requireMembership(round.leagueId)

  if (round.state !== 'submitting') {
    throw new UserInputError('Can only delete during submission phase')
  }
  if (submission.userId !== currentUserId()) {
    throw new ForbiddenError('Can only delete your own submissions')
  }

  await db.submission.delete({ where: { id } })

  return true
}

/**
 * Blind-voting field resolvers: identity and scores stay hidden until the
 * round reaches results. (The original app leaked user_id during voting —
 * this closes that hole by never exposing userId at all.)
 */
export const Submission: SubmissionRelationResolvers = {
  isMine: (_obj, { root }) => {
    // The GraphQL type intentionally omits userId, but the runtime root is
    // the full Prisma row.
    return (root as unknown as PrismaSubmission).userId === currentUserId()
  },
  submitter: async (_obj, { root }) => {
    const round = await db.round.findUnique({ where: { id: root.roundId } })
    if (round?.state !== 'results') {
      return null
    }
    return db.user.findUnique({
      where: { id: (root as unknown as PrismaSubmission).userId },
    })
  },
  totalPoints: async (_obj, { root }) => {
    const round = await db.round.findUnique({ where: { id: root.roundId } })
    if (round?.state !== 'results') {
      return null
    }
    const agg = await db.vote.aggregate({
      _sum: { points: true },
      where: { submissionId: root.id },
    })
    return agg._sum.points ?? 0
  },
  votes: async (_obj, { root }) => {
    const round = await db.round.findUnique({ where: { id: root.roundId } })
    if (round?.state !== 'results') {
      return null
    }
    const votes = await db.vote.findMany({
      where: { submissionId: root.id },
      include: { voter: { select: { displayName: true } } },
      orderBy: { points: 'desc' },
    })
    return votes.map((v) => ({
      voterName: v.voter.displayName,
      points: v.points,
    }))
  },
}
