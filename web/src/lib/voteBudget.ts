/**
 * Client mirror of `api/src/lib/voteBudget.ts`.
 *
 * The vote page has to gate its submit button on exactly the rule the server
 * enforces, and Vite has no alias for importing api code into the bundle, so the
 * arithmetic is duplicated here. The server is the source of truth: if these
 * ever drift, castVotes rejects the ballot with a specific message rather than
 * accepting something the rules don't allow. Keep the two in step.
 */

export type VoteBudgetLeague = {
  upvotesPerRound: number
  downvotesEnabled: boolean
  downvotesPerRound: number
  maxPointsPerSong?: number | null
  maxDownvotesPerSong?: number | null
}

/** Per-song ceilings, one per direction. Null means "the whole round budget". */
export const voteCaps = (league: VoteBudgetLeague) => ({
  capUp: league.maxPointsPerSong ?? league.upvotesPerRound,
  capDown: league.maxDownvotesPerSong ?? league.downvotesPerRound,
})

/**
 * What a voter can actually spend. A round can only absorb
 * `votableCount × cap` points, so in a small league the per-song cap decides
 * the allocation rather than the league's nominal per-round budget.
 */
export const effectiveBudget = (
  league: VoteBudgetLeague,
  votableCount: number
) => {
  const { capUp, capDown } = voteCaps(league)

  return {
    effectiveUp: Math.min(league.upvotesPerRound, votableCount * capUp),
    effectiveDown: league.downvotesEnabled
      ? Math.min(league.downvotesPerRound, votableCount * capDown)
      : 0,
  }
}

/**
 * How much of the ballot is left, and whether another point could still be
 * placed anywhere. A song holds one signed value, so "spend both budgets
 * exactly" is unsatisfiable in small leagues — asking whether anything further
 * can be placed means the same thing to a player and is always reachable.
 */
export const ballotRemaining = (league: VoteBudgetLeague, points: number[]) => {
  const { capUp, capDown } = voteCaps(league)
  const { effectiveUp, effectiveDown } = effectiveBudget(league, points.length)

  const upSpent = points.reduce((sum, p) => sum + Math.max(0, p), 0)
  const downSpent = points.reduce((sum, p) => sum + Math.max(0, -p), 0)

  const upRemaining = effectiveUp - upSpent
  const downRemaining = effectiveDown - downSpent

  return {
    capUp,
    capDown,
    effectiveUp,
    effectiveDown,
    upRemaining,
    downRemaining,
    // A song sitting at 0 is a candidate for either direction.
    canPlaceUp: upRemaining > 0 && points.some((p) => p >= 0 && p < capUp),
    canPlaceDown:
      downRemaining > 0 && points.some((p) => p <= 0 && -p < capDown),
  }
}
