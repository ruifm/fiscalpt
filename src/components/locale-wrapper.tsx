'use client'

import type { ReactNode } from 'react'
import { LocaleProvider } from '@/lib/i18n'
import { dictionaries } from '@/dictionaries'

export function LocaleWrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider dictionaries={dictionaries}>{children}</LocaleProvider>
}
