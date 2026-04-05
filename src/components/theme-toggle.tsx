'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useT()

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={
        mounted
          ? () => {
              const next = resolvedTheme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              trackEvent('theme_changed', { theme: next })
            }
          : undefined
      }
      aria-label={
        mounted ? (resolvedTheme === 'dark' ? t('theme.light') : t('theme.dark')) : t('theme.label')
      }
      suppressHydrationWarning
    >
      {mounted && resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  )
}
