/**
 * Shared state shape for the league Rules form, used by both the new-league
 * wizard and League Settings.
 *
 * Numbers are held as raw strings while the user types. Coercing on every
 * keystroke (`parseInt(value) || 1`) meant clearing a field snapped it back to
 * its fallback, so you had to highlight and overtype — the values are parsed
 * once, on submit, instead.
 */

export type Pacing = 'chill' | 'fast' | 'fastest'

export type LeagueRulesValues = {
  maxPlayers: string
  upvotesPerRound: string
  maxPointsPerSong: string
  downvotesEnabled: boolean
  downvotesPerRound: string
  maxDownvotesPerSong: string
  uniqueArtists: boolean
  pacing: Pacing
  submissionDays: number
  votingDays: number
}

export const HOURS_PER_DAY = 24
export const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

/** Hours as stored on the league, shown as the nearest whole-day option. */
export const hoursToDays = (hours: number) =>
  Math.min(7, Math.max(1, Math.round(hours / HOURS_PER_DAY)))

export const daysToHours = (days: number) => days * HOURS_PER_DAY

/** Parsed value, or null when the field is empty or not a number. */
export const parseOptionalInt = (raw: string): number | null => {
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export const defaultRules = (): LeagueRulesValues => ({
  maxPlayers: '20',
  upvotesPerRound: '10',
  maxPointsPerSong: '',
  downvotesEnabled: false,
  downvotesPerRound: '0',
  maxDownvotesPerSong: '',
  uniqueArtists: false,
  pacing: 'fastest',
  submissionDays: 3,
  votingDays: 2,
})

export type LeagueRulesInput = {
  maxPlayers: number
  upvotesPerRound: number
  maxPointsPerSong: number | null
  downvotesEnabled: boolean
  downvotesPerRound: number
  maxDownvotesPerSong: number | null
  uniqueArtists: boolean
  pacing: Pacing
  submissionDeadlineHours: number
  votingDeadlineHours: number
}

/**
 * Validate the raw form values and build the GraphQL input. Returns an error
 * message instead of throwing so callers can toast it.
 */
export const toLeagueRulesInput = (
  values: LeagueRulesValues
): { input: LeagueRulesInput } | { error: string } => {
  const maxPlayers = parseOptionalInt(values.maxPlayers)
  const upvotesPerRound = parseOptionalInt(values.upvotesPerRound)
  const maxPointsPerSong = parseOptionalInt(values.maxPointsPerSong)
  const downvotesPerRound = parseOptionalInt(values.downvotesPerRound)
  const maxDownvotesPerSong = parseOptionalInt(values.maxDownvotesPerSong)

  if (maxPlayers == null || maxPlayers < 2) {
    return { error: 'A league needs room for at least 2 players' }
  }
  if (upvotesPerRound == null || upvotesPerRound < 1) {
    return { error: 'Voters need at least 1 point per round' }
  }
  if (maxPointsPerSong != null && maxPointsPerSong < 1) {
    return { error: 'Max points per song must be at least 1, or left empty' }
  }
  if (values.downvotesEnabled) {
    if (downvotesPerRound == null || downvotesPerRound < 1) {
      return { error: 'Set how many downvote points each round allows' }
    }
    if (maxDownvotesPerSong != null && maxDownvotesPerSong < 1) {
      return {
        error: 'Max downvotes per song must be at least 1, or left empty',
      }
    }
  }

  return {
    input: {
      maxPlayers,
      upvotesPerRound,
      maxPointsPerSong,
      downvotesEnabled: values.downvotesEnabled,
      downvotesPerRound: values.downvotesEnabled ? downvotesPerRound : 0,
      maxDownvotesPerSong: values.downvotesEnabled ? maxDownvotesPerSong : null,
      uniqueArtists: values.uniqueArtists,
      pacing: values.pacing,
      submissionDeadlineHours: daysToHours(values.submissionDays),
      votingDeadlineHours: daysToHours(values.votingDays),
    },
  }
}
