import type { League, Round } from 'api/db/generated/prisma'

import { db } from './db.js'

/**
 * Round state machine, ported from the original round_manager.py.
 * Rounds advance automatically when every league member has acted:
 *   submitting -> voting   (all members submitted)
 *   voting     -> results  (all members voted; next upcoming round auto-opens)
 */

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

/** After a submission: if all members have submitted, advance to voting. */
export const checkAutoAdvanceSubmission = async (
  roundId: string
): Promise<Round | null> => {
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round || round.state !== 'submitting') {
    return null
  }

  const league = await db.league.findUnique({ where: { id: round.leagueId } })

  const memberCount = await db.leagueMember.count({
    where: { leagueId: round.leagueId },
  })
  const submitters = await db.submission.findMany({
    where: { roundId },
    distinct: ['userId'],
    select: { userId: true },
  })

  if (submitters.length >= memberCount) {
    return db.round.update({
      where: { id: roundId },
      data: {
        state: 'voting',
        votingClose: hoursFromNow(league.votingDeadlineHours),
      },
    })
  }

  return null
}

/** After a vote: if all members have voted, advance to results + open next round. */
export const checkAutoAdvanceVoting = async (
  roundId: string
): Promise<Round | null> => {
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round || round.state !== 'voting') {
    return null
  }

  const league = await db.league.findUnique({ where: { id: round.leagueId } })

  const memberCount = await db.leagueMember.count({
    where: { leagueId: round.leagueId },
  })
  const voters = await db.vote.findMany({
    where: { roundId },
    distinct: ['voterId'],
    select: { voterId: true },
  })

  if (voters.length >= memberCount) {
    const updated = await db.round.update({
      where: { id: roundId },
      data: { state: 'results' },
    })

    await maybeOpenNextRound(league, round.roundNumber)

    return updated
  }

  return null
}

/** Flip the next pre-existing upcoming round to submitting, if any. */
export const maybeOpenNextRound = async (
  league: League,
  completedRoundNumber: number
): Promise<Round | null> => {
  if (completedRoundNumber >= league.totalRounds) {
    return null
  }

  const existing = await db.round.findUnique({
    where: {
      leagueId_roundNumber: {
        leagueId: league.id,
        roundNumber: completedRoundNumber + 1,
      },
    },
  })

  if (existing?.state === 'upcoming') {
    return db.round.update({
      where: { id: existing.id },
      data: {
        state: 'submitting',
        submissionsOpen: new Date(),
        submissionsClose: hoursFromNow(league.submissionDeadlineHours),
      },
    })
  }

  return existing
}
