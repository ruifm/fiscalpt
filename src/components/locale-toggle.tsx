'use client'

import { useLocale, type Locale } from '@/lib/i18n'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
}

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  const t = useT()
  const nextLocale: Locale = locale === 'pt' ? 'en' : 'pt'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setLocale(nextLocale)
        trackEvent('locale_changed', { from: locale, to: nextLocale })
      }}
      aria-label={locale === 'pt' ? t('locale.switchToEn') : t('locale.switchToPt')}
      className="gap-1.5 text-xs"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {LOCALE_LABELS[nextLocale]}
    </Button>
  )
}
