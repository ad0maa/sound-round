import type { League, Round } from 'api/db/generated/prisma'

import { db } from './db.js'
import { notifyRoundTransition } from './roundNotifications.js'

/**
 * Round state machine, ported from the original round_manager.py.
 * Rounds advance when every league member has acted:
 *   submitting -> voting   (all members submitted)
 *   voting     -> results  (all members voted; next upcoming round auto-opens)
 * or lazily when a deadline passes — settleRound/settleLeagueRounds are called
 * at the top of round-related queries and mutations, so expired rounds advance
 * on the next read/write without needing a background job.
 *
 * Transitions are optimistic compare-and-sets (updateMany filtered on the
 * expected current state) so concurrent serverless invocations can't
 * double-apply a transition's side effects.
 */

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

/** Per-round duration overrides fall back to the league-level defaults. */
const submissionHours = (league: League, round: Round) =>
  round.submissionDurationHours ?? league.submissionDeadlineHours

const votingHours = (league: League, round: Round) =>
  round.votingDurationHours ?? league.votingDeadlineHours

/** upcoming -> submitting. Returns the fresh round (unchanged if we lost the race). */
export const openRoundForSubmissions = async (
  round: Round,
  league: League
): Promise<Round> => {
  const { count } = await db.round.updateMany({
    where: { id: round.id, state: 'upcoming' },
    data: {
      state: 'submitting',
      submissionsOpen: new Date(),
      submissionsClose: hoursFromNow(submissionHours(league, round)),
    },
  })
  const fresh = await db.round.findUnique({ where: { id: round.id } })

  // Only the compare-and-set winner notifies, so a transition emails once.
  if (count > 0) {
    await notifyRoundTransition('submitting', fresh)
  }

  return fresh
}

/** submitting -> voting. */
export const advanceToVoting = async (
  round: Round,
  league: League
): Promise<Round> => {
  const { count } = await db.round.updateMany({
    where: { id: round.id, state: 'submitting' },
    data: {
      state: 'voting',
      votingClose: hoursFromNow(votingHours(league, round)),
    },
  })
  const fresh = await db.round.findUnique({ where: { id: round.id } })

  if (count > 0) {
    await notifyRoundTransition('voting', fresh)
  }

  return fresh
}

/** voting (or submitting, for empty rounds) -> results, then open the next round. */
export const advanceToResults = async (
  round: Round,
  league: League
): Promise<Round> => {
  const { count } = await db.round.updateMany({
    where: { id: round.id, state: { in: ['submitting', 'voting'] } },
    data: { state: 'results' },
  })
  const fresh = await db.round.findUnique({ where: { id: round.id } })

  // Only the invocation that won the compare-and-set opens the next round
  // (and notifies).
  if (count > 0) {
    await notifyRoundTransition('results', fresh)
    await maybeOpenNextRound(league, round.roundNumber)
  }

  return fresh
}

/**
 * Lazily apply any deadline-driven transition for a round.
 * Returns the fresh round, or null if it doesn't exist.
 */
export const settleRound = async (roundId: string): Promise<Round | null> => {
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round) {
    return null
  }

  const now = new Date()

  if (
    round.state === 'submitting' &&
    round.submissionsClose &&
    round.submissionsClose <= now
  ) {
    const league = await db.league.findUnique({
      where: { id: round.leagueId },
    })
    const submissionCount = await db.submission.count({ where: { roundId } })
    // Nothing to vote on — skip straight to results so the league can't stall.
    return submissionCount === 0
      ? advanceToResults(round, league)
      : advanceToVoting(round, league)
  }

  if (
    round.state === 'voting' &&
    round.votingClose &&
    round.votingClose <= now
  ) {
    const league = await db.league.findUnique({
      where: { id: round.leagueId },
    })
    return advanceToResults(round, league)
  }

  return round
}

/**
 * Settle a league's active round (at most one exists), and open round 1 if the
 * league's scheduled start time has passed.
 */
export const settleLeagueRounds = async (leagueId: string): Promise<void> => {
  const now = new Date()

  const due = await db.round.findFirst({
    where: {
      leagueId,
      OR: [
        { state: 'submitting', submissionsClose: { lte: now } },
        { state: 'voting', votingClose: { lte: now } },
      ],
    },
  })
  if (due) {
    await settleRound(due.id)
    return
  }

  // Scheduled start: open round 1 once startsAt has passed.
  const league = await db.league.findUnique({ where: { id: leagueId } })
  if (league?.startsAt && league.startsAt <= now) {
    const firstRound = await db.round.findUnique({
      where: { leagueId_roundNumber: { leagueId, roundNumber: 1 } },
    })
    if (firstRound?.state === 'upcoming') {
      await openRoundForSubmissions(firstRound, league)
    }
  }
}

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
    return advanceToVoting(round, league)
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
    return advanceToResults(round, league)
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
    return openRoundForSubmissions(existing, league)
  }

  return existing
}
