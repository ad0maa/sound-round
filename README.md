# SoundRound

A music-league game: create a league, invite friends, and each round everyone
submits a song for the week's theme (Spotify, YouTube, or SoundCloud), then
votes on their favorites. Built with [CedarJS](https://cedarjs.com) (a
RedwoodJS-style full-stack framework), Prisma/Postgres, and Tailwind.

## Getting started

```
yarn install
yarn cedar prisma migrate dev
yarn cedar dev
```

The app opens at [http://localhost:8910](http://localhost:8910).

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — random string used to sign auth session cookies
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — for Spotify track search
- `YOUTUBE_API_KEY` — for YouTube track search
- `SOUNDCLOUD_CLIENT_ID` / `SOUNDCLOUD_CLIENT_SECRET` — for SoundCloud track search

Track search degrades gracefully per-platform if a credential is missing
(that platform just returns no results), but at least one set of
credentials is needed for submitting songs to work.

## Demo mode

The login page has a "Try the demo" button that signs visitors in as a
throwaway guest account — no signup required. Demo accounts are flagged in
the database with an expiry (`User.isDemo` / `User.demoExpiresAt`, default
2 hours) and are cleaned up automatically:

- opportunistically, on every new demo login
- on demand via `yarn cedar exec cleanupDemoUsers`, which can be wired up to
  an external cron if you want a guaranteed sweep independent of traffic
