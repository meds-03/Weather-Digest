import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

function readStoredValue<T>(key: string, initialValue: T): T {
  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue === null ? initialValue : (JSON.parse(storedValue) as T)
  } catch {
    return initialValue
  }
}

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Keep the in-memory setting usable when storage is unavailable.
    }
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorage
