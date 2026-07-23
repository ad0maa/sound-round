# Mapping — old SoundRound (shadcn) tokens → new Organic tokens

The current app (`web/src/index.css`) stores colors as HSL triples under `:root` and `.dark`,
consumed by shadcn via Tailwind (`hsl(var(--background))` etc.). Replace those with the values in
`tokens.css`. Because the shadcn primitives read the semantic names below, most screens re-theme
automatically once the variables are swapped.

| shadcn var (old) | old value (purple/green) | new role | new source |
|---|---|---|---|
| `--background` | `0 0% 100%` | Background | `--color-bg` (L #f6ece0 / D #1e1815) |
| `--foreground` | `240 10% 3.9%` | Text | `--color-text` (L #2a221f / D #f2e8db) |
| `--card` / `--popover` | `0 0% 100%` | Surface | `--color-surface` |
| `--card-foreground` | `240 10% 3.9%` | Text | `--color-text` |
| `--primary` | `270 70% 50%` (purple) | Accent (button fill) | `--color-accent-600` |
| `--primary-foreground` | `0 0% 98%` | On-accent | `#ffffff` |
| `--secondary` | `142 70% 45%` (green) | Accent-2 | `--color-accent-2` |
| `--muted` | `240 4.8% 95.9%` | Muted fill | `--color-neutral-200` (D: `-800`) |
| `--muted-foreground` | `240 3.8% 46.1%` | Muted text | `--color-neutral-500` |
| `--accent` (hover bg) | `240 4.8% 95.9%` | Hover tint | `color-mix(text 6%)` or `--color-accent-100` |
| `--border` / `--input` | `240 5.9% 90%` | Divider | `--color-divider` |
| `--ring` | `270 70% 50%` | Focus ring | `--color-accent` |
| `--radius` | `0.5rem` | Radius | md `16px`; **buttons/inputs/tags → pill (999px)**, cards ~28–32px |

## Notes
- **Convert HSL → hex** (or switch the Tailwind color config to read raw hex): the new tokens are hex.
  If you keep `hsl(var(--x))` wrappers, store the tokens as HSL triples instead.
- **The gradient brand mark** (`from-purple-500 to-green-500` in `AppLayout`/`HomePage`) becomes a
  solid accent mark, or an `accent → accent-2` gradient if you want to keep a gradient.
- **Round/vote state colors** (blue/amber/green in `LeagueCell`/`RoundCell`) map to the tag ramps:
  results → `tag-accent-2`, voting → `tag-accent`, upcoming → `tag-neutral`.
- **Fonts:** add Caprasimo (display) + Figtree (body) via Google Fonts in `web/index.html`.
- **Dark mode:** the app currently forces `.dark` on `<html>`. Keep a toggle that sets `.dark` /
  `[data-theme=dark]` and persists to localStorage; default can follow the OS.
- **Accent picker:** the six `.t-*` classes are the user-selectable accents. Store the choice per
  user and apply the class on the app root.
