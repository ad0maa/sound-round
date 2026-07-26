import { UserInputError } from '@cedarjs/graphql-server'

/**
 * Numeric bounds for league and round settings.
 *
 * The vote budget maths assumes sane values — a league with 0 points per round
 * or a negative per-song cap makes `effectiveBudget` meaningless and can leave
 * a ballot that no one can complete. The forms guard against it, but the forms
 * aren't the security boundary, so the rules live here and both createLeague
 * and updateLeague run them.
 */

/** 30 days: long enough for any sane cadence, short enough to catch a typo. */
const MAX_WINDOW_HOURS = 30 * 24

type LeagueSettings = {
  maxPlayers?: number | null
  upvotesPerRound?: number | null
  maxPointsPerSong?: number | null
  downvotesEnabled?: boolean | null
  downvotesPerRound?: number | null
  maxDownvotesPerSong?: number | null
  totalRounds?: number | null
  submissionDeadlineHours?: number | null
  votingDeadlineHours?: number | null
}

const between = (
  value: number | null | undefined,
  min: number,
  max: number,
  label: string
) => {
  if (value == null) {
    return
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new UserInputError(
      `${label} must be a whole number from ${min} to ${max}`
    )
  }
}

/**
 * Validate whatever settings are present. `updateLeague` sends partial input,
 * so callers merge it over the stored league first — cross-field rules (a
 * downvote budget only matters when downvotes are on) need both halves.
 */
export const validateLeagueSettings = (settings: LeagueSettings) => {
  between(settings.maxPlayers, 2, 100, 'Max players')
  between(settings.upvotesPerRound, 1, 1000, 'Upvote points per round')
  between(settings.maxPointsPerSong, 1, 1000, 'Max points per song')
  between(settings.totalRounds, 1, 50, 'Rounds')
  between(
    settings.submissionDeadlineHours,
    1,
    MAX_WINDOW_HOURS,
    'Submission window (hours)'
  )
  between(
    settings.votingDeadlineHours,
    1,
    MAX_WINDOW_HOURS,
    'Voting window (hours)'
  )

  if (settings.downvotesEnabled) {
    between(settings.downvotesPerRound, 1, 1000, 'Downvote points per round')
    between(settings.maxDownvotesPerSong, 1, 1000, 'Max downvotes per song')
    if (settings.downvotesPerRound == null) {
      throw new UserInputError('Set how many downvote points each round allows')
    }
  } else {
    between(settings.downvotesPerRound, 0, 1000, 'Downvote points per round')
  }
}

type RoundSettings = {
  songsPerPlayer?: number | null
  submissionDurationHours?: number | null
  votingDurationHours?: number | null
}

export const validateRoundSettings = (settings: RoundSettings) => {
  between(settings.songsPerPlayer, 1, 5, 'Songs per player')
  between(
    settings.submissionDurationHours,
    1,
    MAX_WINDOW_HOURS,
    'Submission window (hours)'
  )
  between(
    settings.votingDurationHours,
    1,
    MAX_WINDOW_HOURS,
    'Voting window (hours)'
  )
}
