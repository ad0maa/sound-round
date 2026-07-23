import type {
  League,
  Prisma,
  Round,
  Submission,
  User,
} from 'api/db/generated/prisma'

type CreateArgs =
  | Prisma.UserCreateArgs
  | Prisma.LeagueCreateArgs
  | Prisma.RoundCreateArgs
  | Prisma.SubmissionCreateArgs

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

const user = (n: string) => ({
  data: {
    email: `${n}@example.com`,
    displayName: n,
    hashedPassword: 'hash',
    salt: 'salt',
  },
})

export const standard = defineScenario<CreateArgs>({
  user: {
    alice: user('alice'),
    bob: user('bob'),
  },
  league: {
    main: (scenario) => ({
      data: {
        name: 'Main League',
        creatorId: scenario.user.alice.id,
        uniqueArtists: true,
        totalRounds: 3,
        members: {
          create: [
            { userId: scenario.user.alice.id, role: 'creator' },
            { userId: scenario.user.bob.id, role: 'player' },
          ],
        },
      },
    }),
  },
  round: {
    submitting: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 1,
        theme: 'Openers',
        state: 'submitting',
        submissionsClose: hoursFromNow(24),
      },
    }),
    voting: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 2,
        theme: 'Blind round',
        state: 'voting',
        votingClose: hoursFromNow(24),
      },
    }),
    results: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 3,
        theme: 'Finished round',
        state: 'results',
      },
    }),
  },
  submission: {
    // Only bob has submitted in the `submitting` round, so alice can still
    // exercise duplicate-track / duplicate-artist rejections.
    bobSubmitting: (scenario) => ({
      data: {
        roundId: scenario.round.submitting.id,
        userId: scenario.user.bob.id,
        platform: 'youtube',
        platformTrackId: 'bob-open-track',
        trackUrl: 'https://youtube.com/watch?v=bobopen',
        trackName: 'Bob Opener',
        artistName: 'The Bobs',
      },
    }),
    aliceVoting: (scenario) => ({
      data: {
        roundId: scenario.round.voting.id,
        userId: scenario.user.alice.id,
        platform: 'spotify',
        platformTrackId: 'alice-blind-track',
        trackUrl: 'https://open.spotify.com/track/aliceblind',
        trackName: 'Alice Blind Song',
        artistName: 'Alice Artist',
      },
    }),
    aliceResults: (scenario) => ({
      data: {
        roundId: scenario.round.results.id,
        userId: scenario.user.alice.id,
        platform: 'youtube',
        platformTrackId: 'alice-final-track',
        trackUrl: 'https://youtube.com/watch?v=alicefinal',
        trackName: 'Alice Finale',
        artistName: 'Alice Artist',
        votes: {
          create: [
            {
              roundId: scenario.round.results.id,
              voterId: scenario.user.bob.id,
              points: 4,
            },
          ],
        },
      },
    }),
  },
})

export type StandardScenario = {
  user: Record<'alice' | 'bob', User>
  league: Record<'main', League>
  round: Record<'submitting' | 'voting' | 'results', Round>
  submission: Record<
    'bobSubmitting' | 'aliceVoting' | 'aliceResults',
    Submission
  >
}
