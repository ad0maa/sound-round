import { Prisma } from 'api/db/generated/prisma'
import type { MutationResolvers } from 'types/graphql'

import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'

export const updateProfile: MutationResolvers['updateProfile'] = async ({
  input,
}) => {
  const displayName = input.displayName.trim()

  if (!displayName) {
    throw new UserInputError('Display name is required')
  }

  try {
    return await db.user.update({
      where: { id: context.currentUser.id as string },
      data: { displayName },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new UserInputError('That display name is already taken')
    }
    throw error
  }
}
