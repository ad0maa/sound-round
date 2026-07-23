import { THEMES, useTheme } from 'src/lib/theme'
import { cn } from 'src/lib/utils'

type ThemeSwitcherProps = {
  swatchSize?: number
  className?: string
}

/** Accent-palette picker — swaps `data-theme` on <html> and persists the choice. */
const ThemeSwitcher = ({ swatchSize = 26, className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme()

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
