import type {
  QueryResolvers,
  MutationResolvers,
  CommentRelationResolvers,
} from 'types/graphql'

import { UserInputError, ForbiddenError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import { requireMembership } from 'src/lib/membership'
import { settleRound } from 'src/lib/roundManager'

const currentUserId = () => context.currentUser.id as string

const MAX_BODY_LENGTH = 1000

const getRoundOrThrow = async (roundId: string) => {
  const round = await settleRound(roundId)
  if (!round) {
    throw new UserInputError('Round not found')
  }
  return round
}

export const comments: QueryResolvers['comments'] = async ({ roundId }) => {
  const round = await getRoundOrThrow(roundId)
  await requireMembership(round.leagueId)

  // Readable to members at any state (it's simply empty pre-results, since
  // creating is gated below).
  return db.comment.findMany({
    where: { roundId },
    orderBy: { createdAt: 'asc' },
  })
}

export const createComment: MutationResolvers['createComment'] = async ({
  input,
}) => {
  const round = await getRoundOrThrow(input.roundId)
  await requireMembership(round.leagueId)

  // Comments open with the results reveal — earlier discussion would leak
  // submitter identity and undermine blind voting.
  if (round.state !== 'results') {
    throw new UserInputError(
      'Comments open once the round results are revealed'
    )
  }

  const body = input.body.trim()
  if (!body) {
    throw new UserInputError('Comment cannot be empty')
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new UserInputError(
      `Comment must be ${MAX_BODY_LENGTH} characters or fewer`
    )
  }

  return db.comment.create({
    data: { roundId: input.roundId, body, userId: currentUserId() },
  })
}

export const deleteComment: MutationResolvers['deleteComment'] = async ({
  id,
}) => {
  const comment = await db.comment.findUnique({ where: { id } })
  if (!comment) {
    throw new UserInputError('Comment not found')
  }

  const round = await getRoundOrThrow(comment.roundId)
  const member = await requireMembership(round.leagueId)

  const isAuthor = comment.userId === currentUserId()
  const isManager = member.role === 'creator' || member.role === 'admin'
  if (!isAuthor && !isManager) {
    throw new ForbiddenError('Can only delete your own comments')
  }

  await db.comment.delete({ where: { id } })

  return true
}

export const Comment: CommentRelationResolvers = {
  user: (_obj, { root }) => {
    return db.comment.findUnique({ where: { id: root?.id } }).user()
  },
}
