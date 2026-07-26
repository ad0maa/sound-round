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
 *
 * `league.pacing` decides how eagerly all of that happens:
 *
 *   chill    deadlines never move and phases never end early. The whole round
 *            is scheduled the moment it opens and plays out on the clock.
 *   fast     the schedule is fixed the same way, but a phase may end early once
 *            everyone has acted — results appear immediately while the next
 *            round still waits for its scheduled start.
 *   fastest  the original behaviour: every phase ends the moment everyone has
 *            acted and each deadline is recomputed as now + duration, so the
 *            whole league slides forward.
 */

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

const hoursAfter = (from: Date, hours: number) =>
  new Date(from.getTime() + hours * 60 * 60 * 1000)

/** Per-round duration overrides fall back to the league-level defaults. */
const submissionHours = (league: League, round: Round) =>
  round.submissionDurationHours ?? league.submissionDeadlineHours

const votingHours = (league: League, round: Round) =>
  round.votingDurationHours ?? league.votingDeadlineHours

/** Only `fastest` recomputes deadlines from "now" at each transition. */
const slidesDeadlines = (league: League) => league.pacing === 'fastest'

/** `chill` waits out every deadline; the other two cut a phase short. */
const advancesEarly = (league: League) => league.pacing !== 'chill'

/**
 * When a round should have opened. For scheduled pacing this anchors the whole
 * round to the previous round's voting deadline, so an early finish doesn't
 * drag the calendar forward and lateness doesn't accumulate.
 */
const scheduledOpenFor = async (
  round: Round,
  league: League
): Promise<Date> => {
  if (round.roundNumber > 1) {
    const previous = await db.round.findUnique({
      where: {
        leagueId_roundNumber: {
          leagueId: league.id,
          roundNumber: round.roundNumber - 1,
        },
      },
    })
    if (previous?.votingClose) {
      return previous.votingClose
    }
  }

  // Round 1 (or a league with a gap in its history) starts on the scheduled
  // start time if there is one and it has already passed.
  const now = new Date()
  if (league.startsAt && league.startsAt <= now) {
    return league.startsAt
  }
  return now
}

/** upcoming -> submitting. Returns the fresh round (unchanged if we lost the race). */
export const openRoundForSubmissions = async (
  round: Round,
  league: League
): Promise<Round> => {
  // Scheduled pacing stamps both deadlines up front — the voting deadline has
  // to exist before voting opens, because it's what the next round waits on.
  const schedule = slidesDeadlines(league)
    ? {
        submissionsOpen: new Date(),
        submissionsClose: hoursFromNow(submissionHours(league, round)),
      }
    : await (async () => {
        const open = await scheduledOpenFor(round, league)
        const close = hoursAfter(open, submissionHours(league, round))
        return {
          submissionsOpen: open,
          submissionsClose: close,
          votingClose: hoursAfter(close, votingHours(league, round)),
        }
      })()

  const { count } = await db.round.updateMany({
    where: { id: round.id, state: 'upcoming' },
    data: { state: 'submitting', ...schedule },
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
  // Under scheduled pacing the voting deadline was set when the round opened;
  // leaving it alone is what keeps the next round on schedule. The `!votingClose`
  // fallback covers a league switched to scheduled pacing mid-round, where the
  // round opened without one — without it the round could never settle.
  const votingClose = slidesDeadlines(league)
    ? hoursFromNow(votingHours(league, round))
    : round.votingClose
      ? null
      : hoursAfter(
          round.submissionsClose ?? new Date(),
          votingHours(league, round)
        )

  const { count } = await db.round.updateMany({
    where: { id: round.id, state: 'submitting' },
    data: {
      state: 'voting',
      ...(votingClose ? { votingClose } : {}),
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

    // Under scheduled pacing an early finish shows results straight away but
    // leaves the next round to open at its own time (settleLeagueRounds).
    if (slidesDeadlines(league) || nextRoundIsDue(fresh)) {
      await maybeOpenNextRound(league, round.roundNumber)
    }
  }

  return fresh
}

/** The next round is due once this one's scheduled voting deadline has passed. */
const nextRoundIsDue = (round: Round | null) =>
  !!round?.votingClose && round.votingClose <= new Date()

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
 * Open the league's next round if its start time has arrived. Round 1 waits on
 * `league.startsAt`; every later round waits on its predecessor's voting
 * deadline, which is what holds `chill` and `fast` leagues to their schedule
 * after an early finish. Returns whether anything opened.
 */
const openDueRound = async (league: League): Promise<boolean> => {
  const now = new Date()

  // Nothing opens while a round is still running.
  const active = await db.round.findFirst({
    where: { leagueId: league.id, state: { in: ['submitting', 'voting'] } },
  })
  if (active) {
    return false
  }

  const next = await db.round.findFirst({
    where: { leagueId: league.id, state: 'upcoming' },
    orderBy: { roundNumber: 'asc' },
  })
  if (!next) {
    return false
  }

  if (next.roundNumber === 1) {
    if (!league.startsAt || league.startsAt > now) {
      return false
    }
    await openRoundForSubmissions(next, league)
    return true
  }

  const previous = await db.round.findUnique({
    where: {
      leagueId_roundNumber: {
        leagueId: league.id,
        roundNumber: next.roundNumber - 1,
      },
    },
  })
  if (previous?.state !== 'results' || !nextRoundIsDue(previous)) {
    return false
  }

  await openRoundForSubmissions(next, league)
  return true
}

/**
 * Settle a league's active round (at most one exists), and open the next round
 * if it's due.
 *
 * Settling can cascade — a league nobody has loaded for a fortnight may have
 * several rounds whose deadlines have all passed — so this loops until the
 * league is up to date. The bound stops a bad schedule spinning a request.
 */
export const settleLeagueRounds = async (leagueId: string): Promise<void> => {
  const league = await db.league.findUnique({ where: { id: leagueId } })
  if (!league) {
    return
  }

  for (let pass = 0; pass < 20; pass++) {
    const now = new Date()

    const due = await db.round.findFirst({
      where: {
        leagueId,
        OR: [
          { state: 'submitting', submissionsClose: { lte: now } },
          { state: 'voting', votingClose: { lte: now } },
        ],
      },
      orderBy: { roundNumber: 'asc' },
    })
    if (due) {
      await settleRound(due.id)
      continue
    }

    if (await openDueRound(league)) {
      continue
    }

    return
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
  if (!advancesEarly(league)) {
    return null
  }

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
  if (!advancesEarly(league)) {
    return null
  }

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
