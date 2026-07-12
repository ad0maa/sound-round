import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'api/db/generated/prisma/client.mts'

import { emitLogLevels, handlePrismaLogging } from '@cedarjs/api/logger'

import { logger } from './logger.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prismaClient = new PrismaClient({
  log: emitLogLevels(['info', 'warn', 'error']),
  adapter,
})

handlePrismaLogging({
  db: prismaClient,
  logger,
  logLevels: ['info', 'warn', 'error'],
})

export const db = prismaClient
