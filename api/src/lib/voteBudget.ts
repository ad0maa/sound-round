/**
 * Vote budget arithmetic, shared by the castVotes service and mirrored by the
 * vote page so both agree on what a complete ballot looks like.
 *
 * The per-round budgets are only an upper bound: a round can physically absorb
 * `votableCount × cap` points, so in a small league the per-song cap decides the
 * allocation instead. A 3-player league with 30 points and a 5-point cap has two
 * votable songs, hence 10 points to spend — not 30.
 *
 * Pure functions, no DB access, so they're cheap to unit test and safe to port
 * to the client.
 */

export type VoteBudgetLeague = {
  upvotesPerRound: number
  downvotesEnabled: boolean
  downvotesPerRound: number
  maxPointsPerSong?: number | null
  maxDownvotesPerSong?: number | null
}

export type VoteCaps = {
  capUp: number
  capDown: number
}

export type EffectiveBudget = {
  effectiveUp: number
  effectiveDown: number
}

/**
 * Per-song ceilings for each direction. A null cap means "no separate cap",
 * which is equivalent to being able to sink the whole round budget into one
 * song.
 */
export const voteCaps = (league: VoteBudgetLeague): VoteCaps => ({
  capUp: league.maxPointsPerSong ?? league.upvotesPerRound,
  capDown: league.maxDownvotesPerSong ?? league.downvotesPerRound,
})

/** What this voter can actually spend, given how many songs they may vote on. */
export const effectiveBudget = (
  league: VoteBudgetLeague,
  votableCount: number
): EffectiveBudget => {
  const { capUp, capDown } = voteCaps(league)

  return {
    effectiveUp: Math.min(league.upvotesPerRound, votableCount * capUp),
    effectiveDown: league.downvotesEnabled
      ? Math.min(league.downvotesPerRound, votableCount * capDown)
      : 0,
  }
}

/** Points spent in each direction, both returned as positive numbers. */
export const tallyPoints = (points: number[]) => ({
  upSpent: points.reduce((sum, p) => sum + Math.max(0, p), 0),
  downSpent: points.reduce((sum, p) => sum + Math.max(0, -p), 0),
})

type BallotArgs = {
  league: VoteBudgetLeague
  /** Points for every votable submission, including the ones left at 0. */
  points: number[]
}

/**
 * Whether another point could still be legally placed anywhere on the ballot.
 *
 * A submission holds one signed value, so a song used for a downvote can't also
 * absorb upvotes. That makes "spend both budgets exactly" unsatisfiable in small
 * leagues (two songs, 10 upvote points at a cap of 5, plus any downvote). Asking
 * instead whether *any* further point can be placed means the same thing to a
 * player, is always reachable, and collapses to "spend everything" whenever
 * there are enough songs to go round.
 */
export const ballotRemaining = ({ league, points }: BallotArgs) => {
  const { capUp, capDown } = voteCaps(league)
  const { effectiveUp, effectiveDown } = effectiveBudget(league, points.length)
  const { upSpent, downSpent } = tallyPoints(points)

  const upRemaining = effectiveUp - upSpent
  const downRemaining = effectiveDown - downSpent

  // A song sitting at 0 is a candidate for either direction.
  const canPlaceUp = upRemaining > 0 && points.some((p) => p >= 0 && p < capUp)
  const canPlaceDown =
    downRemaining > 0 && points.some((p) => p <= 0 && -p < capDown)

  return {
    effectiveUp,
    effectiveDown,
    upSpent,
    downSpent,
    upRemaining,
    downRemaining,
    canPlaceUp,
    canPlaceDown,
  }
}

/** True once no further point can be placed in either direction. */
export const ballotComplete = (args: BallotArgs): boolean => {
  const { canPlaceUp, canPlaceDown } = ballotRemaining(args)
  return !canPlaceUp && !canPlaceDown
}
