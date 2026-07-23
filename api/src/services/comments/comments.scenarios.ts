import type {
  Comment,
  League,
  Prisma,
  Round,
  User,
} from 'api/db/generated/prisma'

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

type CreateArgs =
  | Prisma.UserCreateArgs
  | Prisma.LeagueCreateArgs
  | Prisma.RoundCreateArgs
  | Prisma.CommentCreateArgs

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
    outsider: user('outsider'),
  },
  league: {
    main: (scenario) => ({
      data: {
        name: 'Comment League',
        creatorId: scenario.user.alice.id,
        totalRounds: 2,
        members: {
          create: [
            { userId: scenario.user.alice.id, role: 'creator' as const },
            { userId: scenario.user.bob.id, role: 'player' as const },
          ],
        },
      },
    }),
  },
  round: {
    results: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 1,
        theme: 'Finished round',
        state: 'results' as const,
      },
    }),
    voting: (scenario) => ({
      data: {
        leagueId: scenario.league.main.id,
        roundNumber: 2,
        theme: 'Still voting',
        state: 'voting' as const,
        votingClose: hoursFromNow(24),
      },
    }),
  },
  comment: {
    fromBob: (scenario) => ({
      data: {
        roundId: scenario.round.results.id,
        userId: scenario.user.bob.id,
        body: 'What a round!',
      },
    }),
  },
})

export type StandardScenario = {
  user: Record<'alice' | 'bob' | 'outsider', User>
  league: Record<'main', League>
  round: Record<'results' | 'voting', Round>
  comment: Record<'fromBob', Comment>
}
