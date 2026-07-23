import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'
import {
  advanceToResults,
  settleLeagueRounds,
  settleRound,
} from 'src/lib/roundManager'

import { advanceRound } from './rounds.js'
import type { StandardScenario } from './rounds.scenarios.js'

const asUser = (user: { id: string; email: string; displayName: string }) =>
  mockCurrentUser({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isDemo: false,
    demoExpiresAt: null,
  })

describe('deadline settlement', () => {
  scenario(
    'a submitting round past its deadline advances to voting with a deadline stamped',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      const settled = await settleRound(scenario.round.expiredSubmitting.id)

      expect(settled.state).toBe('voting')
      expect(settled.votingClose).not.toBeNull()
      expect(settled.votingClose.getTime()).toBeGreaterThan(Date.now())
    }
  )

  scenario(
    'an expired submitting round with no submissions skips straight to results',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      const settled = await settleRound(scenario.round.emptySubmitting.id)

      expect(settled.state).toBe('results')
    }
  )

  scenario(
    'settleLeagueRounds opens round 1 once the scheduled start has passed',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await settleLeagueRounds(scenario.league.scheduled.id)

      const first = await db.round.findUnique({
        where: { id: scenario.round.scheduledFirst.id },
      })
      expect(first.state).toBe('submitting')
      expect(first.submissionsClose).not.toBeNull()
    }
  )
})

describe('compare-and-set idempotence', () => {
  scenario(
    'advanceToResults opens the next round exactly once when applied twice',
    async (scenario: StandardScenario) => {
      const league = scenario.league.cas
      const round = scenario.round.casVoting

      const first = await advanceToResults(round, league)
      expect(first.state).toBe('results')

      let next = await db.round.findUnique({
        where: { id: scenario.round.casNext.id },
      })
      expect(next.state).toBe('submitting')

      // Reset the next round to `upcoming` as a sentinel: if a second
      // advanceToResults re-fired the side effects, it would re-open it.
      await db.round.update({
        where: { id: next.id },
        data: { state: 'upcoming', submissionsOpen: null },
      })

      const second = await advanceToResults(first, league)
      expect(second.state).toBe('results')

      next = await db.round.findUnique({
        where: { id: scenario.round.casNext.id },
      })
      expect(next.state).toBe('upcoming')
    }
  )
})

describe('advanceRound', () => {
  scenario(
    'rejects multi-step state jumps',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        advanceRound({ id: scenario.round.casNext.id, state: 'voting' })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects transitions from non-managers',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.bob)

      await expect(
        advanceRound({ id: scenario.round.casNext.id, state: 'submitting' })
      ).rejects.toThrow("You don't have permission to do that")
    }
  )

  scenario(
    'a manager can open an upcoming round for submissions',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      const opened = await advanceRound({
        id: scenario.round.expiredNext.id,
        state: 'submitting',
      })

      expect(opened.state).toBe('submitting')
      expect(opened.submissionsClose).not.toBeNull()
    }
  )
})
