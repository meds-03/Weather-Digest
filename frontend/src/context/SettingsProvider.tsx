import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { SettingsContext } from './settings'
import type {
  ColorTheme,
  ThemePreference,
  TemperatureUnit,
} from './settings'

function getSystemTheme(): ColorTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [temperatureUnit, setTemperatureUnit] =
    useLocalStorage<TemperatureUnit>('weather-temperature-unit', 'C')
  const [themePreference, setThemePreference] =
    useLocalStorage<ThemePreference>('weather-theme', 'system')
  const [systemTheme, setSystemTheme] = useState<ColorTheme>(getSystemTheme)
  const theme =
    themePreference === 'system' ? systemTheme : themePreference

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const value = {
    temperatureUnit,
    theme,
    toggleTemperatureUnit: () =>
      setTemperatureUnit((currentUnit) => (currentUnit === 'C' ? 'F' : 'C')),
    toggleTheme: () =>
      setThemePreference(theme === 'dark' ? 'light' : 'dark'),
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
