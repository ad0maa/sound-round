import { Check } from 'lucide-react'

import { THEMES, useTheme } from 'src/lib/theme'
import { cn } from 'src/lib/utils'

type ThemeSwitcherProps = {
  swatchSize?: number
  className?: string
  showLabels?: boolean
}

/** Accent-palette picker — swaps `data-theme` on <html> and persists the choice. */
const ThemeSwitcher = ({
  swatchSize = 26,
  className,
  showLabels = false,
}: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme()

  if (showLabels) {
    return (
      <div
        className={cn('grid grid-cols-2 gap-2.5 nav:grid-cols-3', className)}
      >
        {THEMES.map((t) => {
          const selected = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-full border-[1.5px] border-transparent px-3 py-2 text-left transition-colors',
                selected
                  ? 'border-foreground/80 bg-foreground/[0.06]'
                  : 'hover:bg-foreground/[0.04]'
              )}
            >
              <span
                className="grid size-6 flex-none place-items-center rounded-full"
                style={{ background: t.dot }}
              >
                {selected && (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                )}
              </span>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          aria-label={`${t.label} accent`}
          aria-pressed={theme === t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            'rounded-full border-2 border-transparent p-0 transition-transform hover:scale-105',
            theme === t.id &&
              'border-foreground outline outline-2 outline-background'
          )}
          style={{
            width: swatchSize,
            height: swatchSize,
            background: t.dot,
          }}
        />
      ))}
    </div>
  )
}

export default ThemeSwitcher
