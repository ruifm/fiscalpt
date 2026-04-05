'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n'

const ONBOARDING_KEY = 'fiscalpt:onboarding-seen'

const STEP_KEYS = ['step1', 'step2', 'step3'] as const
const STEP_ICONS = ['📄', '❓', '📊']

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const t = useT()

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage check
      if (!seen) setVisible(true)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      // localStorage unavailable
    }
  }, [])

  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap: keep focus within the dialog
  useEffect(() => {
    if (!visible) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Focus the first focusable element
    const focusFirst = () => {
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable[0]?.focus()
    }
    focusFirst()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, currentStep, dismiss])

  if (!visible) return null

  const stepKey = STEP_KEYS[currentStep]
  const isLast = currentStep === STEP_KEYS.length - 1

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.dialogLabel')}
    >
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                {STEP_ICONS[currentStep]}
              </span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('common.step', { current: currentStep + 1, total: STEP_KEYS.length })}
                </p>
                <h2 className="text-lg font-semibold">{t(`onboarding.${stepKey}.title`)}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('onboarding.closeLabel')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(`onboarding.${stepKey}.description`)}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
            {STEP_KEYS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={dismiss}>
              {t('common.skip')}
            </Button>
            {isLast ? (
              <Button size="sm" onClick={dismiss} className="gap-1.5">
                {t('common.start')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)} className="gap-1.5">
                {t('common.next')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
