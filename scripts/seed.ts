import { db } from 'api/src/lib/db.js'

import { hashPassword } from '@cedarjs/auth-dbauth-api'

// Seeds a playable demo world: five users (password: "password"), one league
// mid-season with two finished rounds + one in voting, and one public league
// that hasn't started. Idempotent — safe to re-run (upserts users, recreates
// the seed leagues from scratch).
//
// Apply with: yarn cedar prisma db seed

const PASSWORD = 'password'

const USERS = [
  { email: 'alice@example.com', displayName: 'Alice' },
  { email: 'bob@example.com', displayName: 'Bob' },
  { email: 'carol@example.com', displayName: 'Carol' },
  { email: 'dave@example.com', displayName: 'Dave' },
  { email: 'erin@example.com', displayName: 'Erin' },
]

type Track = {
  platform: 'spotify' | 'soundcloud' | 'youtube'
  platformTrackId: string
  trackUrl: string
  trackName: string
  artistName: string
}

const yt = (id: string, trackName: string, artistName: string): Track => ({
  platform: 'youtube',
  platformTrackId: id,
  trackUrl: `https://www.youtube.com/watch?v=${id}`,
  trackName,
  artistName,
})

const sp = (id: string, trackName: string, artistName: string): Track => ({
  platform: 'spotify',
  platformTrackId: id,
  trackUrl: `https://open.spotify.com/track/${id}`,
  trackName,
  artistName,
})

// Real, embeddable tracks so the players work against seed data.
const TRACKS: Record<number, Track[]> = {
  // Round 1: "Songs about rain"
  1: [
    yt(
      'GQKW6VUHmSI',
      'Have You Ever Seen the Rain',
      'Creedence Clearwater Revival'
    ),
    sp('4TOMI010Sd4ZAX4aZ5TS85', 'Umbrella', 'Rihanna'),
    yt('adLGHcj_fmA', 'Purple Rain', 'Prince'),
    sp('1Dr1fXbc2IxaK1Mu8P8Khz', 'Riders on the Storm', 'The Doors'),
    yt('Xz-UvQYAmbg', 'Why Does It Always Rain on Me?', 'Travis'),
  ],
  // Round 2: "One-hit wonders"
  2: [
    yt('fWNaR-rxAic', 'Take On Me', 'a-ha'),
    sp('6ECp64rv50XVz93WvxXMGF', 'Come On Eileen', 'Dexys Midnight Runners'),
    yt('K5G1FmU-ldg', 'Video Killed the Radio Star', 'The Buggles'),
    sp('2fuCquhmrzHpu5xcA1ci9x', 'Torn', 'Natalie Imbruglia'),
    yt('otCpCn0l4Wo', 'Somebody That I Used to Know', 'Gotye'),
  ],
  // Round 3 (in voting): "Guilty pleasures"
  3: [
    yt('dQw4w9WgXcQ', 'Never Gonna Give You Up', 'Rick Astley'),
    sp('0Ph6L4l8dYUuXFmb71Ajnd', 'Barbie Girl', 'Aqua'),
    yt('ZyhrYis509A', 'Mambo No. 5', 'Lou Bega'),
    sp('3vkQ5DAB1qQMYO4Mr9zJN6', 'Wannabe', 'Spice Girls'),
    yt('L_jWHffIx5E', 'All Star', 'Smash Mouth'),
  ],
}

const ROUND_THEMES = [
  'Songs about rain',
  'One-hit wonders',
  'Guilty pleasures',
  'Best opening track on an album',
  'Songs in a language you don’t speak',
]

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000)

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000)

export default async () => {
  try {
    const [hashedPassword, salt] = hashPassword(PASSWORD)

    const users = []
    for (const u of USERS) {
      users.push(
        await db.user.upsert({
          where: { email: u.email },
          update: {},
          create: { ...u, hashedPassword, salt },
        })
      )
    }
    const [alice] = users
    console.info(`  Seeded ${users.length} users (password: "${PASSWORD}")`)

    // Recreate the seed leagues from scratch so re-running stays predictable.
    await db.league.deleteMany({
      where: { name: { in: ['Friday Sound Club', 'Open Decks'] } },
    })

    const league = await db.league.create({
      data: {
        name: 'Friday Sound Club',
        description: 'Five friends, five rounds, zero shame.',
        creatorId: alice.id,
        inviteCode: 'friday-club',
        maxPlayers: 8,
        upvotesPerRound: 10,
        downvotesEnabled: true,
        downvotesPerRound: 3,
        maxPointsPerSong: 5,
        totalRounds: 5,
        members: {
          create: users.map((u, i) => ({
            userId: u.id,
            role: i === 0 ? ('creator' as const) : ('player' as const),
          })),
        },
      },
    })

    for (let n = 1; n <= 5; n++) {
      const isDone = n <= 2
      const isVoting = n === 3

      const round = await db.round.create({
        data: {
          leagueId: league.id,
          roundNumber: n,
          theme: ROUND_THEMES[n - 1],
          state: isDone ? 'results' : isVoting ? 'voting' : 'upcoming',
          submissionsOpen: isDone || isVoting ? hoursAgo(96 * (6 - n)) : null,
          submissionsClose: isDone || isVoting ? hoursAgo(48 * (6 - n)) : null,
          votingClose: isDone
            ? hoursAgo(24 * (6 - n))
            : isVoting
              ? hoursFromNow(48)
              : null,
        },
      })

      if (!isDone && !isVoting) continue

      const BLURBS = [
        'This one lives rent-free in my head.',
        'Trust me, wait for the chorus.',
        null,
        'My dad played this every Sunday.',
        null,
      ]

      const submissions = []
      for (let i = 0; i < users.length; i++) {
        submissions.push(
          await db.submission.create({
            data: {
              roundId: round.id,
              userId: users[i].id,
              ...TRACKS[n][i],
              blurb: BLURBS[i],
              submittedAt: hoursAgo(72 * (6 - n) - i),
            },
          })
        )
      }

      if (isDone) {
        // Everyone spreads their 10 points (plus the odd downvote) across the
        // other four submissions — deterministic but varied by voter index.
        const votes = []
        for (let v = 0; v < users.length; v++) {
          const targets = submissions.filter((s) => s.userId !== users[v].id)
          const spread =
            v % 2 === 0 ? [5, 3, 2, 0] : ([4, 4, 2, -1] as number[])
          for (let t = 0; t < targets.length; t++) {
            const points = spread[(t + v) % spread.length]
            if (points === 0) continue
            votes.push({
              roundId: round.id,
              voterId: users[v].id,
              submissionId: targets[t].id,
              points,
            })
          }
        }
        await db.vote.createMany({ data: votes })

        await db.comment.createMany({
          data: [
            {
              roundId: round.id,
              userId: users[1].id,
              body: 'That winner was inevitable from the first listen.',
              createdAt: hoursAgo(20 * (6 - n)),
            },
            {
              roundId: round.id,
              userId: users[3].id,
              body: 'I demand a recount.',
              createdAt: hoursAgo(19 * (6 - n)),
            },
          ],
        })
      }
    }
    console.info(
      `  Seeded "${league.name}": rounds 1-2 finished, round 3 in voting (invite code: ${league.inviteCode})`
    )

    const open = await db.league.create({
      data: {
        name: 'Open Decks',
        description: 'Public league — anyone can join. Starts when full.',
        creatorId: users[4].id,
        isPublic: true,
        inviteCode: 'open-decks',
        maxPlayers: 10,
        totalRounds: 3,
        members: { create: { userId: users[4].id, role: 'creator' } },
      },
    })
    await db.round.createMany({
      data: ROUND_THEMES.slice(0, 3).map((theme, i) => ({
        leagueId: open.id,
        roundNumber: i + 1,
        theme,
      })),
    })
    console.info(`  Seeded "${open.name}" (public, not started)\n`)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
