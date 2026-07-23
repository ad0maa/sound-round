# Design system — "Organic" theme

This documents the design system as it's actually implemented, for anyone
extending it later. It grew out of a one-off design handoff (warm cream
palette, Caprasimo/Figtree type, pill buttons) but this doc reflects the
current codebase, including decisions and fixes made after that handoff —
treat this as the source of truth, not the original brief.

## Tokens

All colors, fonts, spacing, radii, and shadows are CSS custom properties in
[`web/src/index.css`](../web/src/index.css). They're consumed two ways:

- Directly, via Tailwind theme keys in
  [`web/config/tailwind.config.cjs`](../web/config/tailwind.config.cjs) —
  `brand-*` / `brand2-*` (accent ramps), `sand-*` (neutral ramp), plus the
  usual shadcn semantic tokens (`background`, `card`, `primary`, `muted`,
  `border`, etc.) which are now repointed at the new palette instead of the
  old purple/green shadcn defaults.
- Indirectly, through shadcn semantic tokens — `--primary` resolves to
  `--brand-600`, so any component still written in terms of `bg-primary`,
  `text-primary`, `border-primary/40` etc. automatically picks up the new
  look with no changes.

### Accent themes
Six palettes (`cherry` default, `grape`, `plum`, `marigold`, `terracotta`,
`teal`), each a `--brand`/`--brand2` pair with 100–900 ramps, defined as
`:root[data-theme='<id>']` overrides in `index.css`. The active theme is
just an attribute on `<html>`, managed by
[`web/src/lib/theme.tsx`](../web/src/lib/theme.tsx) (`ThemeProvider` /
`useTheme`), persisted to `localStorage`, and applied before first paint by
a small inline script in `web/index.html` (avoids a flash of the wrong
theme on reload). The picker itself is
[`ThemeSwitcher`](../web/src/components/ThemeSwitcher/ThemeSwitcher.tsx)
(swatch grid, or `showLabels` for the full list used on Settings), and it's
per-browser, not synced to the user's account.

### Light + dark mode
Both are implemented. Ground tokens (`--bg`/`--surface`/`--text`/`--divider`/
shadows) flip under a `.dark` class on `<html>` (Tailwind's `darkMode:
['class']`, already configured) — see the `.dark { … }` block in
`index.css`. **Accent ramp values don't change between modes** — a saturated
`brand-600` fill with white text reads fine on either background. What
*does* change is which ramp step a few specific surfaces reach for (tags,
avatars, round-number badges, the "you"/current-user row highlight, the
finished-league banner): light mode uses the light/pale end of the ramp,
dark mode the deep end, added inline as `dark:` Tailwind variants at each
call site (`Badge`, `Avatar`, and the round-badge/highlight logic in
`LeagueCell`/`LeaderboardCell`/`AppLayout`/`VoteCell`). If you add a new
surface using `brand-100`/`sand-200`/etc., check whether it needs a
`dark:` pair the same way — grep those files for `dark:bg-brand-900` for
the existing examples.

Mode is independent of the accent choice: `useTheme()` from
[`theme.tsx`](../web/src/lib/theme.tsx) exposes both `theme`/`setTheme`
(accent) and `mode`/`setMode` (`'light' | 'dark'`). Mode defaults to the OS
preference (`prefers-color-scheme`) until the user picks explicitly in
Settings, then persists to `localStorage` (`sr-mode`) same as the accent —
the blocking script in `index.html` applies both before first paint.

### Typography, spacing, radius
- Headings: Caprasimo. Body: Figtree. Both loaded via Google Fonts in
  `web/index.html`, applied via `font-heading` / `font-body` Tailwind
  utilities (see `tailwind.config.cjs`).
- Cards/dialogs use a large radius (`rounded-[28px]`); buttons, tags,
  inputs, and the segmented controls are full pills (`rounded-full`).
- The shell has a custom `nav` breakpoint (860px, in `tailwind.config.cjs`)
  where the layout swaps from mobile (sticky top bar + fixed bottom tab
  nav) to desktop (fixed sidebar).

## Primitives (`web/src/components/ui/`)
Same shadcn component API (`Button`, `Card`, `Badge`, `Progress`, `Avatar`,
`Input`, …) restyled to the tokens above — call sites don't need to change,
just the internals did.

**Gotcha:** `Card` owns its own horizontal padding (`px-5`, alongside
`py-5`) — `CardHeader`/`CardContent`/`CardFooter` do *not* add their own
`px-*` anymore. This was a real bug for a while: `Card` had **no**
horizontal padding at all unless you wrapped content in `CardContent`, so
every place that put plain children directly in `<Card>` rendered flush
against the rounded edges. If you're adding a new `Card` usage, you don't
need `CardContent` just to get padding — bare `<Card>{children}</Card>` is
correctly padded now.

**Card/league-grid gotcha:** don't reach for a fixed `grid-cols-N` for
lists that can have very few items (leagues, public leagues) — with fewer
items than columns, CSS grid leaves the unused columns as visible empty
space, which reads as a layout bug. Use an `auto-fit` grid instead:
`grid-cols-[repeat(auto-fit,minmax(240px,1fr))]` — a lone item fills the
row, and it still wraps into columns once there's enough content. See
[`LeaguesCell`](../web/src/components/LeaguesCell/LeaguesCell.tsx) /
[`PublicLeaguesCell`](../web/src/components/PublicLeaguesCell/PublicLeaguesCell.tsx).

## Shared layout pieces
- [`PageContainer`](../web/src/components/PageContainer/PageContainer.tsx) —
  the shared page padding/max-width/fade-in wrapper. **Own it at exactly one
  level** for a given screen — either the Cell wraps itself (`LeagueCell`,
  `RoundCell`, `VoteCell` do this) or the Page wraps the Cell (`LeaguesPage`,
  `LeaderboardPage` do this) — never both, or you get doubled padding.
- [`AppLayout`](../web/src/layouts/AppLayout/AppLayout.tsx) — the
  authenticated shell: sidebar/bottom-nav, the demo-mode banner, the
  profile chip (links to Settings) with a separate logout icon button
  (confirms via `window.confirm` before logging out).
- [`toastOptions`](../web/src/lib/toastOptions.ts) — shared style config
  every `<Toaster>` spreads in (pill shape, card background, brand-tinted
  success/error icons); all six `<Toaster>` instances use
  `position="top-right"`.

## Reference files
[`docs/design-tokens/`](./design-tokens/) has the original design deliverable's
token files, kept because they're self-contained and still accurate — no
retheme has happened since:
- `tokens.json` / `tokens.css` — same values as `index.css`, under the
  original `--color-*` naming rather than our renamed ones (`--color-bg` →
  `--bg`, `--color-accent-*` → `--brand-*`, `--color-neutral-*` → `--sand-*`).
  Useful as a naming cross-reference or for re-deriving the Tailwind config
  from scratch.
- `MAPPING.md` — the old-shadcn-token → new-token table this implementation
  was built from.

The rest of that design handoff (the two `.dc.html` prototypes, `sr-*.css`,
`ds-*.css`/`pal-*.css` explorations, `support.js`) wasn't kept — they need a
~66KB prototype runtime to render at all, they're explicitly marked
reference-only/do-not-port in the handoff's own README, and everything they
show is now either implemented (and better documented here) or superseded.

## Screens covered by the original design brief
My Leagues, League Hub, Round detail, Vote, Leaderboard, and the public
Landing page. Everything else (auth pages, New League/Round, Submit Song,
Results, Join, Settings) was built by extending these same tokens/primitives
rather than from an explicit visual spec — restyle those with the same
patterns described above if they need bespoke layout work later.
