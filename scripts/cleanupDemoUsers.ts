import { db } from 'api/src/lib/db.js'
import { cleanupExpiredDemoUsers } from 'api/src/lib/demoUsers.js'

// Deletes expired demo accounts (and everything they own, via cascade).
// Runs opportunistically on every demo login already, but wire this up to
// an external cron (Render/GitHub Actions/etc.) if you want a guaranteed
// sweep even when nobody's clicking "Try the demo".
// Run with: yarn cedar exec cleanupDemoUsers

export default async () => {
  try {
    const count = await cleanupExpiredDemoUsers()
    console.info(`Cleaned up ${count} expired demo user(s).`)
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}
