import { db } from './db.js'

// How long a demo session's data lives before it's eligible for cleanup.
export const DEMO_SESSION_MS = 2 * 60 * 60 * 1000 // 2 hours

// Deletes any demo user whose session has expired. Cascades (User -> League,
// LeagueMember, Submission, Vote, Comment) take care of everything they own.
export const cleanupExpiredDemoUsers = async () => {
  const { count } = await db.user.deleteMany({
    where: {
      isDemo: true,
      demoExpiresAt: { lt: new Date() },
    },
  })

  return count
}
