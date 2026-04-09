'use client'

import Link from 'next/link'
import { CheckCircle, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n'

export function SocialProof() {
  const t = useT()

  return (
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
              <div className="text-sm text-muted-foreground">{t(`landing.proof.${key}.label`)}</div>
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
                <div className="text-xs text-muted-foreground">{t('landing.proof.story.role')}</div>
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
  )
}

export function PricingSection() {
  const t = useT()

  return (
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
              <Link href="/simulacao" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  {t('landing.pricing.free.cta')}
                </Button>
              </Link>
            </CardContent>
          </Card>

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
  )
}
