import { useContext } from 'react'
import { SettingsContext } from './settings'
import type { SettingsContextValue } from './settings'

export function useSettings(): SettingsContextValue {
  const settings = useContext(SettingsContext)
  if (!settings) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return settings
}
