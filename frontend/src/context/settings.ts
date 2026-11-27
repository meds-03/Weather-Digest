import { createContext } from 'react'

export type TemperatureUnit = 'C' | 'F'
export type ColorTheme = 'light' | 'dark'
export type ThemePreference = ColorTheme | 'system'

export interface SettingsContextValue {
  temperatureUnit: TemperatureUnit
  theme: ColorTheme
  toggleTemperatureUnit: () => void
  toggleTheme: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
