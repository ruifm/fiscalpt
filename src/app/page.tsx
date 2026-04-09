'use client'

import { useEffect } from 'react'
import { Navigation, HeroSection, TrustPillars } from '@/components/landing/hero-section'
import {
  HowItWorks,
  ProductPreview,
  FeaturesGrid,
  EngineTrust,
} from '@/components/landing/features-section'
import { SocialProof, PricingSection } from '@/components/landing/pricing-section'
import { GuidesSection, FaqSection, CtaSection, Footer } from '@/components/landing/footer-section'
import { trackEvent } from '@/lib/analytics'

export default function Home() {
  useEffect(() => {
    trackEvent('page_view')
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar para o conteúdo principal
      </a>

      <Navigation />

      <main id="main-content" className="flex-1">
        <HeroSection />
        <TrustPillars />
        <HowItWorks />
        <ProductPreview />
        <FeaturesGrid />
        <EngineTrust />
        <SocialProof />
        <PricingSection />
        <GuidesSection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}
