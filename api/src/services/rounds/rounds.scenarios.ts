import type { League, Prisma, Round, User } from 'api/db/generated/prisma'

type CreateArgs =
  | Prisma.UserCreateArgs
  | Prisma.LeagueCreateArgs
  | Prisma.RoundCreateArgs
  | Prisma.SubmissionCreateArgs

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000)

const user = (n: string) => ({
  data: {
    email: `${n}@example.com`,
    displayName: n,
    hashedPassword: 'hash',
    salt: 'salt',
  },
})

const leagueData = (
  name: string,
  scenario: Record<string, Record<string, { id: string }>>,
  extra: Record<string, unknown> = {}
) => ({
  data: {
    name,
    creatorId: scenario.user.alice.id,
    totalRounds: 3,
    members: {
      create: [
        { userId: scenario.user.alice.id, role: 'creator' as const },
        { userId: scenario.user.bob.id, role: 'player' as const },
      ],
    },
    ...extra,
  },
})

export const standard = defineScenario<CreateArgs>({
  user: {
    alice: user('alice'),
    bob: user('bob'),
  },
  league: {
    // Round 1 is submitting with an expired deadline (and has a submission).
    expired: (scenario) => leagueData('Expired Deadline League', scenario),
    // Round 1 is submitting with an expired deadline and NO submissions.
    empty: (scenario) => leagueData('Empty Round League', scenario),
    // Round 1 is voting; round 2 upcoming — for CAS idempotence tests.
    cas: (scenario) => leagueData('CAS League', scenario),
    // Scheduled start in the past; round 1 still upcoming.
    scheduled: (scenario) =>
      leagueData('Scheduled League', scenario, { startsAt: hoursAgo(1) }),
  },
  round: {
    expiredSubmitting: (scenario) => ({
      data: {
        leagueId: scenario.league.expired.id,
        roundNumber: 1,
        theme: 'Past deadline',
        state: 'submitting',
        submissionsOpen: hoursAgo(48),
        submissionsClose: hoursAgo(1),
      },
    }),
    expiredNext: (scenario) => ({
      data: {
        leagueId: scenario.league.expired.id,
        roundNumber: 2,
        theme: 'Next up',
        state: 'upcoming',
      },
    }),
    emptySubmitting: (scenario) => ({
      data: {
        leagueId: scenario.league.empty.id,
        roundNumber: 1,
        theme: 'Nobody submitted',
        state: 'submitting',
        submissionsOpen: hoursAgo(48),
        submissionsClose: hoursAgo(1),
      },
    }),
    casVoting: (scenario) => ({
      data: {
        leagueId: scenario.league.cas.id,
        roundNumber: 1,
        theme: 'CAS round',
        state: 'voting',
        votingClose: hoursFromNow(24),
      },
    }),
    casNext: (scenario) => ({
      data: {
        leagueId: scenario.league.cas.id,
        roundNumber: 2,
        theme: 'CAS next round',
        state: 'upcoming',
      },
    }),
    scheduledFirst: (scenario) => ({
      data: {
        leagueId: scenario.league.scheduled.id,
        roundNumber: 1,
        theme: 'Scheduled opener',
        state: 'upcoming',
      },
    }),
  },
  submission: {
    inExpired: (scenario) => ({
      data: {
        roundId: scenario.round.expiredSubmitting.id,
        userId: scenario.user.alice.id,
        platform: 'youtube',
        platformTrackId: 'expired-track',
        trackUrl: 'https://youtube.com/watch?v=expired',
        trackName: 'Late Song',
        artistName: 'Late Artist',
      },
    }),
  },
})

export type StandardScenario = {
  user: Record<'alice' | 'bob', User>
  league: Record<'expired' | 'empty' | 'cas' | 'scheduled', League>
  round: Record<
    | 'expiredSubmitting'
    | 'expiredNext'
    | 'emptySubmitting'
    | 'casVoting'
    | 'casNext'
    | 'scheduledFirst',
    Round
  >
}
