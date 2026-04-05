import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type Locale = 'pt' | 'en'

export const DEFAULT_LOCALE: Locale = 'pt'
const LOCALE_STORAGE_KEY = 'fiscalpt:locale'

// Deeply nested dictionary type — keys are strings, leaves are strings
type DictValue = string | { [key: string]: DictValue }
export type Dictionary = Record<string, DictValue>

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function resolvePath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.')
  let current: DictValue = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, DictValue>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  )
}

export function LocaleProvider({
  children,
  dictionaries,
}: {
  children: ReactNode
  dictionaries: Record<Locale, Dictionary>
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Sync from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration sync
      if (saved === 'pt' || saved === 'en') setLocaleState(saved)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = resolvePath(dictionaries[locale], key)
      if (value === undefined) {
        // Fallback to Portuguese, then to the key itself
        const fallback = resolvePath(dictionaries.pt, key)
        if (fallback !== undefined) return params ? interpolate(fallback, params) : fallback
        return key
      }
      return params ? interpolate(value, params) : value
    },
    [locale, dictionaries],
  )

  return <LocaleContext value={{ locale, setLocale, t }}>{children}</LocaleContext>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  return useLocale().t
}
