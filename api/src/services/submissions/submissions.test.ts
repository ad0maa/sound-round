import { UserInputError } from '@cedarjs/graphql-server'

import { db } from 'src/lib/db'

import {
  submissions,
  createSubmission,
  Submission as SubmissionResolvers,
} from './submissions.js'
import type { StandardScenario } from './submissions.scenarios.js'

const asUser = (user: { id: string; email: string; displayName: string }) =>
  mockCurrentUser({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isDemo: false,
    demoExpiresAt: null,
  })

// The relation resolvers receive the full Prisma row as `root` at runtime.
const asRoot = (submission: unknown) =>
  ({ root: submission, context: {}, info: {} }) as Parameters<
    typeof SubmissionResolvers.submitter
  >[1]

describe('blind submissions', () => {
  scenario(
    'during submitting, the list only contains your own submissions',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)
      expect(
        await submissions({ roundId: scenario.round.submitting.id })
      ).toHaveLength(0)

      asUser(scenario.user.bob)
      expect(
        await submissions({ roundId: scenario.round.submitting.id })
      ).toHaveLength(1)
    }
  )

  scenario(
    'during voting, identity and scores resolve to null but isMine works',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.bob)
      const sub = scenario.submission.aliceVoting

      expect(
        await SubmissionResolvers.submitter(undefined, asRoot(sub))
      ).toBeNull()
      expect(
        await SubmissionResolvers.totalPoints(undefined, asRoot(sub))
      ).toBeNull()
      expect(await SubmissionResolvers.votes(undefined, asRoot(sub))).toBeNull()
      expect(await SubmissionResolvers.isMine(undefined, asRoot(sub))).toBe(
        false
      )

      asUser(scenario.user.alice)
      expect(await SubmissionResolvers.isMine(undefined, asRoot(sub))).toBe(
        true
      )
    }
  )

  scenario(
    'at results, identity and scores are revealed',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.bob)
      const sub = scenario.submission.aliceResults

      const submitter = await SubmissionResolvers.submitter(
        undefined,
        asRoot(sub)
      )
      expect(submitter.displayName).toBe('alice')

      expect(
        await SubmissionResolvers.totalPoints(undefined, asRoot(sub))
      ).toBe(4)

      const votes = await SubmissionResolvers.votes(undefined, asRoot(sub))
      expect(votes).toEqual([{ voterName: 'bob', points: 4 }])
    }
  )
})

describe('createSubmission validation', () => {
  const validInput = (scenario: StandardScenario) => ({
    roundId: scenario.round.submitting.id,
    platform: 'spotify' as const,
    platformTrackId: 'new-track',
    trackUrl: 'https://open.spotify.com/track/new',
    trackName: 'A New Song',
    artistName: 'Fresh Artist',
  })

  scenario(
    'rejects a track already submitted in the round',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        createSubmission({
          input: {
            ...validInput(scenario),
            platform: 'youtube',
            platformTrackId: scenario.submission.bobSubmitting.platformTrackId,
          },
        })
      ).rejects.toThrow('already been submitted')
    }
  )

  scenario(
    'rejects a duplicate artist when uniqueArtists is on (case-insensitive)',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        createSubmission({
          input: { ...validInput(scenario), artistName: 'the bobs' },
        })
      ).rejects.toThrow('unique artists')
    }
  )

  scenario(
    'rejects submitting past the songs-per-player cap',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.bob)

      await expect(
        createSubmission({ input: validInput(scenario) })
      ).rejects.toThrow(UserInputError)
    }
  )

  scenario(
    'rejects submissions outside the submitting phase',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      await expect(
        createSubmission({
          input: {
            ...validInput(scenario),
            roundId: scenario.round.voting.id,
          },
        })
      ).rejects.toThrow('not accepting submissions')
    }
  )

  scenario(
    'accepts a valid submission and advances the round when everyone is in',
    async (scenario: StandardScenario) => {
      asUser(scenario.user.alice)

      // Alice is the last member to submit — auto-advance flips to voting.
      const created = await createSubmission({ input: validInput(scenario) })
      expect(created.trackName).toBe('A New Song')

      const round = await db.round.findUnique({
        where: { id: scenario.round.submitting.id },
      })
      expect(round.state).toBe('voting')
    }
  )
})
