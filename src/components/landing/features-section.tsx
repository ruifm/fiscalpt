'use client'

import Image from 'next/image'
import {
  Calculator,
  FileUp,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  MessageCircle,
  Briefcase,
  BarChart3,
  FileText,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n'

const FEATURES = [
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

const STEPS = [
  { num: '01', key: 'step1' as const, icon: FileUp },
  { num: '02', key: 'step2' as const, icon: MessageCircle },
  { num: '03', key: 'step3' as const, icon: BarChart3 },
]

const ENGINE_POINTS = ['point1', 'point2', 'point3', 'point4', 'point5', 'point6'] as const

export function HowItWorks() {
  const t = useT()

  return (
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
          {STEPS.map((item, idx) => (
            <div key={item.num} className="relative text-center">
              {idx < STEPS.length - 1 && (
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
  )
}

export function ProductPreview() {
  const t = useT()

  return (
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
  )
}

export function FeaturesGrid() {
  const t = useT()

  return (
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
          {FEATURES.map((feature) => (
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
  )
}

export function EngineTrust() {
  const t = useT()

  return (
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
              {ENGINE_POINTS.map((key) => (
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
                  <div className="text-sm text-muted-foreground">{t('landing.engine.aiNote')}</div>
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
  )
}
