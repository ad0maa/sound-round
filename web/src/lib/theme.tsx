import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeId =
  | 'cherry'
  | 'grape'
  | 'plum'
  | 'marigold'
  | 'terracotta'
  | 'teal'

export type ThemeMode = 'light' | 'dark'

export const THEMES: { id: ThemeId; label: string; dot: string }[] = [
  { id: 'cherry', label: 'Cherry', dot: '#d83f4e' },
  { id: 'grape', label: 'Grape', dot: '#7d5cc6' },
  { id: 'plum', label: 'Plum', dot: '#b34a6d' },
  { id: 'marigold', label: 'Marigold', dot: '#d98828' },
  { id: 'terracotta', label: 'Terracotta', dot: '#c67139' },
  { id: 'teal', label: 'Teal', dot: '#2f8f86' },
]

const THEME_STORAGE_KEY = 'sr-theme'
const MODE_STORAGE_KEY = 'sr-mode'
const DEFAULT_THEME: ThemeId = 'cherry'

const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some((t) => t.id === value)

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark'

const prefersDarkMode = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

const ThemeContext = createContext<{
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  mode: 'light',
  setMode: () => {},
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(stored) ? stored : DEFAULT_THEME
  })

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY)
    if (isThemeMode(stored)) return stored
    return prefersDarkMode() ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    window.localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  const setTheme = (next: ThemeId) => setThemeState(next)
  const setMode = (next: ThemeMode) => setModeState(next)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
