import Link from 'next/link'
import { Calculator, ArrowLeft } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FiscalPT',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">FiscalPT</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
        <main>{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FiscalPT. Informação fiscal de carácter geral — não substitui
          aconselhamento profissional.
        </div>
      </footer>
    </>
  )
}
