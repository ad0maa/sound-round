import {
  ballotComplete,
  ballotRemaining,
  effectiveBudget,
  voteCaps,
  type VoteBudgetLeague,
} from './voteBudget'

const league = (
  overrides: Partial<VoteBudgetLeague> = {}
): VoteBudgetLeague => ({
  upvotesPerRound: 10,
  downvotesEnabled: false,
  downvotesPerRound: 0,
  maxPointsPerSong: null,
  maxDownvotesPerSong: null,
  ...overrides,
})

describe('voteCaps', () => {
  it('falls back to the per-round budgets when no per-song cap is set', () => {
    expect(
      voteCaps(
        league({
          upvotesPerRound: 30,
          downvotesEnabled: true,
          downvotesPerRound: 4,
        })
      )
    ).toEqual({ capUp: 30, capDown: 4 })
  })

  it('keeps the two directions independent', () => {
    expect(
      voteCaps(
        league({
          maxPointsPerSong: 5,
          downvotesEnabled: true,
          downvotesPerRound: 4,
          maxDownvotesPerSong: 2,
        })
      )
    ).toEqual({ capUp: 5, capDown: 2 })
  })
})

describe('effectiveBudget', () => {
  it('lets the per-song cap bound a generous round budget', () => {
    // 3-player league: 2 votable songs × 5 = 10, not the nominal 30.
    const { effectiveUp } = effectiveBudget(
      league({ upvotesPerRound: 30, maxPointsPerSong: 5 }),
      2
    )
    expect(effectiveUp).toBe(10)
  })

  it('lets the round budget bound a roomy league', () => {
    // 50 votable songs could absorb 250, but only 30 points exist.
    const { effectiveUp } = effectiveBudget(
      league({ upvotesPerRound: 30, maxPointsPerSong: 5 }),
      50
    )
    expect(effectiveUp).toBe(30)
  })

  it('zeroes the downvote budget when downvotes are disabled', () => {
    const { effectiveDown } = effectiveBudget(
      league({ downvotesEnabled: false, downvotesPerRound: 3 }),
      5
    )
    expect(effectiveDown).toBe(0)
  })

  it('applies the same bounding to downvotes', () => {
    const { effectiveDown } = effectiveBudget(
      league({
        downvotesEnabled: true,
        downvotesPerRound: 6,
        maxDownvotesPerSong: 2,
      }),
      2
    )
    expect(effectiveDown).toBe(4)
  })

  it('gives nothing to spend when there is nothing to vote on', () => {
    expect(effectiveBudget(league({ upvotesPerRound: 10 }), 0)).toEqual({
      effectiveUp: 0,
      effectiveDown: 0,
    })
  })
})

describe('ballotComplete', () => {
  const capped = league({ upvotesPerRound: 30, maxPointsPerSong: 5 })

  it('is false while points remain and a song can still take them', () => {
    expect(ballotComplete({ league: capped, points: [5, 0] })).toBe(false)
  })

  it('is true once the effective budget is spent', () => {
    expect(ballotComplete({ league: capped, points: [5, 5] })).toBe(true)
  })

  it('is false for an empty ballot', () => {
    expect(ballotComplete({ league: capped, points: [0, 0] })).toBe(false)
  })

  it('is true when every song is capped even though budget nominally remains', () => {
    // 3 songs × 5 = 15 placed, against a nominal 30-point budget.
    const { upRemaining } = ballotRemaining({
      league: capped,
      points: [5, 5, 5],
    })
    expect(upRemaining).toBe(0)
    expect(ballotComplete({ league: capped, points: [5, 5, 5] })).toBe(true)
  })

  it('does not dead-end when upvotes consume every song downvotes needed', () => {
    // Two songs, both maxed with upvotes: there is nowhere left to downvote, so
    // the ballot has to count as complete or voting could never be submitted.
    const withDownvotes = league({
      upvotesPerRound: 10,
      maxPointsPerSong: 5,
      downvotesEnabled: true,
      downvotesPerRound: 3,
    })
    expect(ballotComplete({ league: withDownvotes, points: [5, 5] })).toBe(true)
  })

  it('still requires downvotes when songs are left over', () => {
    const withDownvotes = league({
      upvotesPerRound: 10,
      maxPointsPerSong: 5,
      downvotesEnabled: true,
      downvotesPerRound: 3,
      maxDownvotesPerSong: 3,
    })
    expect(
      ballotComplete({ league: withDownvotes, points: [5, 5, 0, 0, 0] })
    ).toBe(false)
    expect(
      ballotComplete({ league: withDownvotes, points: [5, 5, -3, 0, 0] })
    ).toBe(true)
  })

  it('is true when there is nothing to vote on at all', () => {
    expect(ballotComplete({ league: capped, points: [] })).toBe(true)
  })
})
