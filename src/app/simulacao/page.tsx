'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Calculator, ArrowLeft, FileText, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SimulationForm } from '@/components/simulation-form'
import { ResultsSkeleton } from '@/components/results-skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { useT } from '@/lib/i18n'
import type { SimulationInputs, SimulationResults } from '@/lib/tax/simulation'

const TaxResults = dynamic(() => import('@/components/tax-results').then((mod) => mod.TaxResults), {
  ssr: false,
  loading: () => <ResultsSkeleton />,
})

export default function SimulacaoPage() {
  const t = useT()
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [_inputs, setInputs] = useState<SimulationInputs | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleResults = useCallback((r: SimulationResults, i: SimulationInputs) => {
    setResults(r)
    setInputs(i)
  }, [])

  // Scroll to results when they appear
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [results])

  const handleBack = useCallback(() => {
    setResults(null)
  }, [])

  const handleReset = useCallback(() => {
    setResults(null)
    setInputs(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">FiscalPT</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <Link href="/analyze">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t('simulation.switchToFull')}</span>
              </Button>
            </Link>
            <LocaleToggle />
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4">
          {!results ? (
            <>
              {/* Title */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('simulation.title')}
                </h1>
                <p className="mt-2 text-muted-foreground">{t('simulation.subtitle')}</p>
              </div>

              {/* Form */}
              <SimulationForm onResults={handleResults} />

              {/* Disclaimer */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t('simulation.disclaimer')}
              </p>
            </>
          ) : (
            <div ref={resultsRef}>
              <TaxResults
                results={[results.optimized]}
                issues={[]}
                onBack={handleBack}
                onReset={handleReset}
                simulationMode
                simulationSavings={results.total_savings}
                currentResult={results.current}
              />

              {/* Conversion CTAs */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
                  <CardContent className="relative space-y-3 p-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="font-semibold">{t('simulation.fullAnalysisCta')}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('simulation.fullAnalysisDesc')}
                    </p>
                    <Link href="/analyze">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        {t('simulation.switchToFull')}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10" />
                  <CardContent className="relative space-y-3 p-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                      <h3 className="font-semibold">{t('simulation.aiConsultCta')}</h3>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {t('simulation.comingSoon')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('simulation.aiConsultDesc')}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 opacity-60 cursor-not-allowed"
                      aria-disabled="true"
                      tabIndex={-1}
                      onClick={(e) => e.preventDefault()}
                    >
                      {t('simulation.comingSoon')}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Disclaimer */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {t('simulation.disclaimer')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          {t('common.footer', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  )
}
