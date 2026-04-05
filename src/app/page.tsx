'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calculator,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  FileUp,
  Sparkles,
  FileText,
  Mail,
  BarChart3,
  MessageCircle,
  Briefcase,
  Clock,
  BookOpen,
  ChevronDown,
  Quote,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { useT } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

export default function Home() {
  const t = useT()

  useEffect(() => {
    trackEvent('page_view')
  }, [])

  const features = [
    { icon: FileUp, key: 'upload' as const },
    { icon: Users, key: 'joint' as const },
    { icon: TrendingUp, key: 'irsJovem' as const },
    { icon: Shield, key: 'nhr' as const },
    { icon: Calculator, key: 'engine' as const },
    { icon: Sparkles, key: 'recommendations' as const },
    { icon: MessageCircle, key: 'aiChat' as const },
    { icon: Briefcase, key: 'catB' as const },
    { icon: BarChart3, key: 'multiYear' as const },
    { icon: FileText, key: 'pdf' as const },
    { icon: CheckCircle, key: 'deductions' as const },
    { icon: ShieldCheck, key: 'privacy' as const },
  ]

  const steps = [
    { num: '01', key: 'step1' as const, icon: FileUp },
    { num: '02', key: 'step2' as const, icon: MessageCircle },
    { num: '03', key: 'step3' as const, icon: BarChart3 },
  ]

  const enginePoints = ['point1', 'point2', 'point3', 'point4', 'point5', 'point6'] as const

  const guides = [
    { key: 'irsGuide' as const, href: '/guia/como-funciona-irs' },
    { key: 'irsJovem' as const, href: '/guia/irs-jovem' },
    { key: 'jointFiling' as const, href: '/guia/conjunto-vs-separado' },
  ]

  const faqs = [
    { q: 'q1', a: 'a1' },
    { q: 'q2', a: 'a2' },
    { q: 'q3', a: 'a3' },
    { q: 'q4', a: 'a4' },
    { q: 'q5', a: 'a5' },
    { q: 'q6', a: 'a6' },
  ] as const

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar para o conteúdo principal
      </a>

      {/* Navigation */}
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

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
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

        {/* Trust Pillars */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
              {(
                [
                  { icon: Calculator, key: 'engine' },
                  { icon: ShieldCheck, key: 'privacy' },
                  {
                    icon: Code,
                    key: 'openSource',
                    href: 'https://github.com/ruifm/fiscalpt',
                  },
                  { icon: Clock, key: 'noSignup' },
                ] as const
              ).map((item) => (
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

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                {t('landing.howItWorks.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.howItWorks.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.howItWorks.subtitle')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((item, idx) => (
                <div key={item.num} className="relative text-center">
                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`landing.howItWorks.${item.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`landing.howItWorks.${item.key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section className="py-24 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                {t('landing.preview.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.preview.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.preview.subtitle')}
              </p>
            </div>
            <div className="relative mx-auto max-w-4xl">
              <div className="rounded-xl border bg-background shadow-2xl overflow-hidden">
                <Image
                  src="/screenshots/results-full.png"
                  alt={t('landing.preview.alt')}
                  className="w-full h-auto"
                  loading="lazy"
                  width={1280}
                  height={900}
                />
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-xl bg-primary/10" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                {t('landing.features.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.features.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.features.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.key}
                  className="group relative overflow-hidden border-border/50 transition-all hover:border-primary/20 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 font-semibold text-lg">
                      {t(`landing.features.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`landing.features.${feature.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Deterministic Engine — Trust Section */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  {t('landing.engine.badge')}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  {t('landing.engine.title')}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">{t('landing.engine.subtitle')}</p>
                <ul className="space-y-3">
                  {enginePoints.map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <CheckCircle
                        className="h-5 w-5 text-primary mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">{t(`landing.engine.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-semibold">AI-Enhanced</div>
                      <div className="text-sm text-muted-foreground">
                        {t('landing.engine.aiNote')}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                      <Calculator className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                      <span className="font-medium">
                        Motor Fiscal → Cálculos determinísticos verificados
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                      <MessageCircle className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                      <span className="font-medium">
                        Consultor AI → Explica os resultados em linguagem clara
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof — Real Stats + Founder Story */}
        <section className="py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                {t('landing.proof.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.proof.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.proof.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {(['stat1', 'stat2', 'stat3', 'stat4'] as const).map((key) => (
                <div key={key} className="text-center">
                  <div className="text-4xl font-bold text-primary mb-1">
                    {t(`landing.proof.${key}.value`)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t(`landing.proof.${key}.label`)}
                  </div>
                </div>
              ))}
            </div>

            <Card className="max-w-3xl mx-auto border-border/50">
              <CardContent className="p-8 md:p-10">
                <Quote className="h-8 w-8 text-primary/20 mb-4" aria-hidden="true" />
                <h3 className="font-semibold text-lg mb-3">{t('landing.proof.story.title')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('landing.proof.story.body')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    RM
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t('landing.proof.story.author')}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('landing.proof.story.role')}
                    </div>
                  </div>
                  <Link
                    href="/blog/como-recuperei-10000-euros"
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    {t('landing.proof.story.readMore')} →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                {t('landing.pricing.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.pricing.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.pricing.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Free tier */}
              <Card className="border-border/50">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="font-semibold text-xl">{t('landing.pricing.free.name')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('landing.pricing.free.description')}
                    </p>
                  </div>
                  <div className="mb-8">
                    <span className="text-5xl font-bold">{t('landing.pricing.free.price')}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {Array.from({ length: 6 }, (_, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle
                          className="h-4 w-4 text-primary mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        {t(`landing.pricing.free.f${i + 1}`)}
                      </li>
                    ))}
                  </ul>
                  <Link href="/analyze" className="block">
                    <Button variant="outline" className="w-full" size="lg">
                      {t('landing.pricing.free.cta')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro tier */}
              <Card className="border-primary shadow-lg shadow-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="font-semibold text-xl">{t('landing.pricing.pro.name')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('landing.pricing.pro.description')}
                    </p>
                  </div>
                  <div className="mb-8">
                    <span className="text-5xl font-bold">{t('landing.pricing.pro.price')}</span>
                    <span className="text-muted-foreground ml-2">
                      {t('landing.pricing.pro.period')}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {Array.from({ length: 6 }, (_, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle
                          className="h-4 w-4 text-primary mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        {t(`landing.pricing.pro.f${i + 1}`)}
                      </li>
                    ))}
                  </ul>
                  <Link href="/analyze" className="block">
                    <Button className="w-full" size="lg">
                      {t('landing.pricing.pro.cta')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Guides */}
        <section id="guides" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {t('landing.guides.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.guides.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landing.guides.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Link key={guide.key} href={guide.href}>
                  <Card className="h-full border-border/50 transition-all hover:border-primary/20 hover:shadow-lg group">
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="font-semibold text-lg mb-2">
                        {t(`landing.guides.${guide.key}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {t(`landing.guides.${guide.key}.description`)}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                        {t('landing.guides.readMore')}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-muted/30">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                {t('landing.faq.badge')}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.faq.title')}
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-background px-6 py-4 text-left font-medium hover:bg-accent/50 transition-colors">
                    {t(`landing.faq.${faq.q}`)}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-6 pb-4 pt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`landing.faq.${faq.a}`)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-2xl bg-primary px-6 py-10 sm:p-12 md:p-16 text-center text-primary-foreground">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                {t('landing.cta.title')}
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                {t('landing.cta.subtitle')}
              </p>
              <Link href="/analyze" className="block w-full sm:inline sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto gap-2 text-base px-8 h-12"
                >
                  {t('landing.cta.button')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12" aria-label={t('nav.footer')}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Calculator className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-semibold">FiscalPT</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/legal/termos" className="hover:text-foreground transition-colors">
                Termos de Serviço
              </Link>
              <Link href="/legal/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/carreiras" className="hover:text-foreground transition-colors">
                Carreiras
              </Link>
              <a
                href="https://github.com/ruifm/fiscalpt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="mailto:contact@fiscalpt.com"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contacto
              </a>
            </nav>
            <p className="text-sm text-muted-foreground">
              {t('common.footer', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
