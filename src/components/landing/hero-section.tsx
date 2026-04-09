'use client'

import Link from 'next/link'
import {
  Calculator,
  ShieldCheck,
  Shield,
  Clock,
  Code,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { useT } from '@/lib/i18n'

const TRUST_PILLARS = [
  { icon: Calculator, key: 'engine' },
  { icon: ShieldCheck, key: 'privacy' },
  {
    icon: Code,
    key: 'openSource',
    href: 'https://github.com/ruifm/fiscalpt',
  },
  { icon: Clock, key: 'noSignup' },
] as const

export function Navigation() {
  const t = useT()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">FiscalPT</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8" aria-label={t('nav.mainNavigation')}>
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.features')}
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.howItWorks')}
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.pricing')}
          </a>
          <a
            href="#guides"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.guides')}
          </a>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.blog')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Link href="/analyze">
            <Button size="sm" className="gap-1">
              <span className="hidden sm:inline">{t('nav.startAnalysis')}</span>
              <span className="sm:hidden">{t('nav.analysis')}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function HeroSection() {
  const t = useT()

  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/30 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
          <Shield className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('landing.hero.badge')}
        </Badge>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t('landing.hero.title')}
          <span className="text-primary">{t('landing.hero.titleHighlight')}</span>
          {t('landing.hero.titleEnd')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
          {t('landing.hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/analyze" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-12">
              {t('landing.hero.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8 h-12"
            >
              {t('landing.hero.secondary')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}

export function TrustPillars() {
  const t = useT()

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {TRUST_PILLARS.map((item) => (
            <div key={item.key} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="font-semibold">
                {'href' in item && item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                  >
                    {t(`landing.trust.${item.key}`)}
                  </a>
                ) : (
                  t(`landing.trust.${item.key}`)
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`landing.trust.${item.key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
