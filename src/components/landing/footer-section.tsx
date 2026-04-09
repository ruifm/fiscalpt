'use client'

import Link from 'next/link'
import { Calculator, BookOpen, ArrowRight, ChevronDown, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n'

const GUIDES = [
  { key: 'irsGuide' as const, href: '/guia/como-funciona-irs' },
  { key: 'irsJovem' as const, href: '/guia/irs-jovem' },
  { key: 'jointFiling' as const, href: '/guia/conjunto-vs-separado' },
]

const FAQS = [
  { q: 'q1', a: 'a1' },
  { q: 'q2', a: 'a2' },
  { q: 'q3', a: 'a3' },
  { q: 'q4', a: 'a4' },
  { q: 'q5', a: 'a5' },
  { q: 'q6', a: 'a6' },
] as const

export function GuidesSection() {
  const t = useT()

  return (
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
          {GUIDES.map((guide) => (
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
  )
}

export function FaqSection() {
  const t = useT()

  return (
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
          {FAQS.map((faq) => (
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
  )
}

export function CtaSection() {
  const t = useT()

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl bg-primary px-6 py-10 sm:p-12 md:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">{t('landing.cta.subtitle')}</p>
          <Link href="/simulacao" className="block w-full sm:inline sm:w-auto">
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
  )
}

export function Footer() {
  const t = useT()

  return (
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
  )
}
