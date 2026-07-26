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

// `main` league: downvotes enabled, capped points. Round 1 is mid-voting with
// a future deadline (castVotes settles first — a past deadline would flip the
// round out from under the tests). Round 2 exists so auto-advance can open it.
//
// Budgets are deliberately set so the caps bite without pinning the ballot to a
// single legal allocation: with 2 votable songs, 6 upvote points and a 5-point
// cap there are several ways to spend out, which the re-casting tests rely on.
export const standard = defineScenario<CreateArgs>({
  user: {
    alice: user('alice'),
    bob: user('bob'),
    carol: user('carol'),
    dave: user('dave'),
  },
  league: {
    main: (scenario) => ({
      data: {
        name: 'Main League',
        creatorId: scenario.user.alice.id,
        upvotesPerRound: 6,
        downvotesEnabled: true,
        downvotesPerRound: 3,
        maxPointsPerSong: 5,
        maxDownvotesPerSong: 2,
        totalRounds: 2,
        members: {
          create: [
            { userId: scenario.user.alice.id, role: 'creator' },
            { userId: scenario.user.bob.id, role: 'player' },
            { userId: scenario.user.carol.id, role: 'player' },
          ],
        },
      },
    }),
    // No downvotes and no per-song cap, so a voter can sink the whole budget
    // into one song and leave another at zero.
    noDown: (scenario) => ({
      data: {
        name: 'No Downvotes League',
        creatorId: scenario.user.alice.id,
        upvotesPerRound: 10,
        downvotesEnabled: false,
        members: {
          create: [
            { userId: scenario.user.alice.id, role: 'creator' },
            { userId: scenario.user.bob.id, role: 'player' },
            { userId: scenario.user.dave.id, role: 'player' },
          ],
        },
      },
    }),
  },
  round: {
    voting: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 1,
        theme: 'Songs about rain',
        state: 'voting',
        votingClose: hoursFromNow(24),
      },
    }),
    next: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 2,
        theme: 'One-hit wonders',
        state: 'upcoming',
      },
    }),
    noDownVoting: (scenario) => ({
      data: {
        leagueId: scenario.league.noDown.id,
        roundNumber: 1,
        theme: 'Covers',
        state: 'voting',
        votingClose: hoursFromNow(24),
      },
    }),
    noDownSubmitting: (scenario) => ({
      data: {
        leagueId: scenario.league.noDown.id,
        roundNumber: 2,
        theme: 'Duets',
        state: 'submitting',
        submissionsClose: hoursFromNow(24),
      },
    }),
  },
  submission: {
    fromAlice: (scenario) => ({
      data: {
        roundId: scenario.round.voting.id,
        userId: scenario.user.alice.id,
        platform: 'youtube',
        platformTrackId: 'alice-track',
        trackUrl: 'https://youtube.com/watch?v=alice',
        trackName: 'Alice Song',
        artistName: 'Alice Artist',
      },
    }),
    fromBob: (scenario) => ({
      data: {
        roundId: scenario.round.voting.id,
        userId: scenario.user.bob.id,
        platform: 'youtube',
        platformTrackId: 'bob-track',
        trackUrl: 'https://youtube.com/watch?v=bob',
        trackName: 'Bob Song',
        artistName: 'Bob Artist',
      },
    }),
    fromCarol: (scenario) => ({
      data: {
        roundId: scenario.round.voting.id,
        userId: scenario.user.carol.id,
        platform: 'spotify',
        platformTrackId: 'carol-track',
        trackUrl: 'https://open.spotify.com/track/carol',
        trackName: 'Carol Song',
        artistName: 'Carol Artist',
      },
    }),
    noDownFromBob: (scenario) => ({
      data: {
        roundId: scenario.round.noDownVoting.id,
        userId: scenario.user.bob.id,
        platform: 'youtube',
        platformTrackId: 'nodown-bob-track',
        trackUrl: 'https://youtube.com/watch?v=nodownbob',
        trackName: 'NoDown Bob Song',
        artistName: 'NoDown Bob Artist',
      },
    }),
    noDownFromDave: (scenario) => ({
      data: {
        roundId: scenario.round.noDownVoting.id,
        userId: scenario.user.dave.id,
        platform: 'soundcloud',
        platformTrackId: 'nodown-dave-track',
        trackUrl: 'https://soundcloud.com/nodowndave',
        trackName: 'NoDown Dave Song',
        artistName: 'NoDown Dave Artist',
      },
    }),
  },
})

export type StandardScenario = {
  user: Record<'alice' | 'bob' | 'carol' | 'dave', User>
  league: Record<'main' | 'noDown', League>
  round: Record<'voting' | 'next' | 'noDownVoting' | 'noDownSubmitting', Round>
  submission: Record<
    'fromAlice' | 'fromBob' | 'fromCarol' | 'noDownFromBob' | 'noDownFromDave',
    Submission
  >
}
