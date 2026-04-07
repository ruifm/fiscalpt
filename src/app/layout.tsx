import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { LocaleWrapper } from '@/components/locale-wrapper'
import { JsonLd } from '@/components/json-ld'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_URL = 'https://fiscalpt.com'
const SITE_NAME = 'FiscalPT'
const SITE_DESCRIPTION =
  'Simulador de IRS para contribuintes portugueses. Carregue a sua declaração, compare cenários de tributação conjunta vs separada, IRS Jovem e NHR, e receba recomendações acionáveis. Motor de cálculo determinístico verificado ao cêntimo.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Otimização Fiscal Inteligente`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'IRS',
    'impostos',
    'otimização fiscal',
    'Portugal',
    'simulador IRS',
    'IRS Jovem',
    'NHR',
    'declaração IRS',
    'reembolso IRS',
    'tributação conjunta',
    'tributação separada',
    'calcular IRS',
    'escalões IRS 2025',
    'Cat B simplificado',
    'deduções IRS',
    'Segurança Social',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} — Otimização Fiscal Inteligente`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Otimização Fiscal Inteligente`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
}

const webApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  inLanguage: 'pt-PT',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18070272762"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18070272762');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <JsonLd data={webApplicationJsonLd} />
        <ThemeProvider>
          <LocaleWrapper>{children}</LocaleWrapper>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
