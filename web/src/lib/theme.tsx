import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeId =
  | 'cherry'
  | 'grape'
  | 'plum'
  | 'marigold'
  | 'terracotta'
  | 'teal'

export const THEMES: { id: ThemeId; label: string; dot: string }[] = [
  { id: 'cherry', label: 'Cherry', dot: '#d83f4e' },
  { id: 'grape', label: 'Grape', dot: '#7d5cc6' },
  { id: 'plum', label: 'Plum', dot: '#b34a6d' },
  { id: 'marigold', label: 'Marigold', dot: '#d98828' },
  { id: 'terracotta', label: 'Terracotta', dot: '#c67139' },
  { id: 'teal', label: 'Teal', dot: '#2f8f86' },
]

const STORAGE_KEY = 'sr-theme'
const DEFAULT_THEME: ThemeId = 'cherry'

const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some((t) => t.id === value)

const ThemeContext = createContext<{
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}>({ theme: DEFAULT_THEME, setTheme: () => {} })

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isThemeId(stored) ? stored : DEFAULT_THEME
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (next: ThemeId) => setThemeState(next)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
