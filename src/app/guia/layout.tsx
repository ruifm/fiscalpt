import Link from 'next/link'
import { Calculator, ArrowLeft, BookOpen } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

const guides = [
  {
    href: '/guia/como-funciona-irs',
    title: 'Como Funciona o IRS',
    description: 'Guia completo sobre o imposto sobre o rendimento em Portugal',
  },
  {
    href: '/guia/escaloes-irs-2025',
    title: 'Escalões de IRS 2025',
    description: 'Tabela completa com taxas, parcelas a abater e exemplos práticos',
  },
  {
    href: '/guia/como-preencher-irs',
    title: 'Como Preencher o IRS',
    description: 'Guia passo a passo para preencher a declaração de IRS',
  },
  {
    href: '/guia/irs-jovem',
    title: 'IRS Jovem',
    description: 'Benefício fiscal para jovens trabalhadores até 35 anos',
  },
  {
    href: '/guia/conjunto-vs-separado',
    title: 'Conjunto vs Separado',
    description: 'Quando compensa a tributação conjunta ou separada',
  },
  {
    href: '/guia/recibos-verdes',
    title: 'Recibos Verdes e Cat. B',
    description: 'Regime simplificado, coeficientes e Segurança Social',
  },
  {
    href: '/guia/deducoes-coleta',
    title: 'Deduções à Coleta',
    description: 'Saúde, educação, habitação, PPR e como maximizar',
  },
]

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Guias',
        item: `${SITE_URL}/guia`,
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
        {/* Article content */}
        <main>{children}</main>

        {/* Related guides */}
        <aside className="mt-16 border-t pt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-6">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            Outros Guias
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-lg border border-border/50 p-4 hover:border-primary/30 hover:bg-muted/30 transition-all"
              >
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {guide.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </aside>
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
