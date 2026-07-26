import { UserInputError } from '@cedarjs/graphql-server'

import {
  validateLeagueSettings,
  validateRoundSettings,
} from './leagueValidation'

// The forms guard these too, but the forms aren't the security boundary — a
// league with 0 points per round would make the vote budget unsatisfiable.

describe('validateLeagueSettings', () => {
  it('accepts a sensible league', () => {
    expect(() =>
      validateLeagueSettings({
        maxPlayers: 8,
        upvotesPerRound: 10,
        maxPointsPerSong: 5,
        downvotesEnabled: true,
        downvotesPerRound: 3,
        maxDownvotesPerSong: 2,
        totalRounds: 5,
        submissionDeadlineHours: 72,
        votingDeadlineHours: 48,
      })
    ).not.toThrow()
  })

  it('ignores fields that are absent, for partial updates', () => {
    expect(() => validateLeagueSettings({ maxPlayers: 8 })).not.toThrow()
  })

  it('rejects a league nobody can vote in', () => {
    expect(() => validateLeagueSettings({ upvotesPerRound: 0 })).toThrow(
      UserInputError
    )
  })

  it('rejects a negative per-song cap', () => {
    expect(() => validateLeagueSettings({ maxPointsPerSong: -5 })).toThrow(
      'Max points per song must be a whole number from 1 to 1000'
    )
  })

  it('rejects a fractional value', () => {
    expect(() => validateLeagueSettings({ upvotesPerRound: 2.5 })).toThrow(
      UserInputError
    )
  })

  it('rejects a one-player league', () => {
    expect(() => validateLeagueSettings({ maxPlayers: 1 })).toThrow(
      UserInputError
    )
  })

  it('rejects a zero-length deadline that would expire on open', () => {
    expect(() =>
      validateLeagueSettings({ submissionDeadlineHours: 0 })
    ).toThrow(UserInputError)
    expect(() => validateLeagueSettings({ votingDeadlineHours: -1 })).toThrow(
      UserInputError
    )
  })

  it('requires a downvote budget when downvotes are switched on', () => {
    expect(() =>
      validateLeagueSettings({ downvotesEnabled: true, downvotesPerRound: 0 })
    ).toThrow(UserInputError)
  })

  it('allows a zero downvote budget when downvotes are off', () => {
    expect(() =>
      validateLeagueSettings({ downvotesEnabled: false, downvotesPerRound: 0 })
    ).not.toThrow()
  })
})

describe('validateRoundSettings', () => {
  it('accepts league defaults (null durations)', () => {
    expect(() =>
      validateRoundSettings({
        songsPerPlayer: 1,
        submissionDurationHours: null,
        votingDurationHours: null,
      })
    ).not.toThrow()
  })

  it('rejects more songs per player than the submit form allows', () => {
    expect(() => validateRoundSettings({ songsPerPlayer: 99 })).toThrow(
      'Songs per player must be a whole number from 1 to 5'
    )
  })

  it('rejects a duration that would open the round already expired', () => {
    expect(() => validateRoundSettings({ submissionDurationHours: 0 })).toThrow(
      UserInputError
    )
  })
})
