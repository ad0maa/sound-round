# Design: Database "waking up" loader

**Date:** 2026-07-26
**Branch:** `feat/db-waking-loader`
**Status:** Approved for implementation

## Problem

The app runs on Vercel + Neon free tiers. Neon's compute autosuspends after
~5 min idle, so the first request after a lull pays a cold-start penalty (a few
seconds). Today that window shows a blank screen. The worst-felt case is a
returning user with a valid session cookie who lands directly on a protected
page (e.g. `/leagues`): Cedar's `getCurrentUser` query is the first thing to hit
the DB, and until it resolves the user sees nothing.

## Key insight

We do **not** try to detect "this is a Neon cold start" server-side — a
serverless request can't cleanly self-report that without adding latency, and
Vercel functions cold-start too. Instead we treat the signal the user actually
cares about: **a request is taking unusually long.** A client-side loader that
only appears after a short delay covers every slow-start cause at once, adds zero
latency, and never flashes on warm loads.

Cedar already does the hard half. `AuthenticatedRoute` (rendered by
`PrivateSet`) does **not** redirect to login while `useAuth().loading` is true —
it renders `whileLoadingAuth?.() || null`. So the "hold until currentUser
resolves" behaviour the loader needs is built in; we just supply the visual.

## Components

### 1. `<WakingLoader />` (`web/src/components/WakingLoader`)

A self-contained pixel-art loader: a hooded, beanie-wearing person walks to a
desk and boots a PC (monitor powers on with a boot bar); a golden retriever
trots in and settles into a dog bed; coffee steams on the desk. A caption
("Waking up the database…") sits below with a blinking dot.

- **Pure inline SVG + CSS keyframes.** No images, no libraries. Ships inside the
  existing JS bundle (~1–2 KB gzipped). Animations use only `transform` /
  `opacity` (GPU-composited) — negligible runtime cost.
- **Props:** `message?: string` (default "Waking up the database"),
  `delayMs?: number` (default 700). While within the delay window the component
  renders `null`, so warm loads that resolve quickly never show it.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, animations are
  disabled and the scene rests on a static "settled" frame (person at the desk,
  screen on, dog in the bed).
- **Accessibility:** wrapper is `role="status"` / `aria-live="polite"` with an
  `sr-only` summary; the SVG carries `role="img"` + `<title>`/`<desc>`.
- CSS classes are prefixed `wl-` and scoped under `.wl-root` to avoid collisions.

### 2. Auth-gate wiring (`web/src/Routes.tsx`)

Add `whileLoadingAuth={() => <WakingLoader />}` to the two `PrivateSet`s. This
handles the returning-user cold-start case: Cedar holds (no premature login
redirect) while `getCurrentUser` resolves, and now shows the loader after the
delay instead of a blank screen.

### 3. Login page (`web/src/pages/LoginPage`)

For unauthenticated visitors there's no `getCurrentUser` to hold on — the wake
happens on submit. Track a submitting flag and, after the same delay, surface a
lightweight "Waking up the database…" helper line while the login request is in
flight. Small, optional-polish change; reuses the same copy.

### 4. Preview page (`web/src/pages/LoaderPreviewPage`, route `/loader-preview`)

A public route (works locally **and** on Vercel preview/production deploys) for
testing without waiting for a real cold start:

- Renders `<WakingLoader delayMs={0} />` always-on so the animation and its
  performance can be inspected directly.
- Buttons to simulate the delayed-reveal behaviour: "Simulate warm load (400 ms)"
  and "Simulate cold start (4 s)" mount a loader with the real 700 ms delay so we
  can confirm warm loads never flash it and cold starts do show it.

This page is intentionally shippable so production performance can be checked on
the live deploy; it can be removed or dev-gated in a follow-up once we're happy.

## Testing strategy

- **Local:** dev server → `/loader-preview`, plus the simulate buttons.
- **Production-like:** the PR gets a Vercel preview deployment automatically; hit
  `/loader-preview` there to judge real-world performance and rendering. For the
  genuine cold-start path, leave Neon idle >5 min then load a protected route on
  the deploy.

## Out of scope (YAGNI)

- Server-side cold-start detection or a dedicated warmup ping. The `getCurrentUser`
  query already wakes Neon for the returning-user case; a separate ping only helps
  on the login page and isn't needed for v1.
- Global Cell `Loading` default — can adopt the same component later if in-app
  slow queries prove annoying.
