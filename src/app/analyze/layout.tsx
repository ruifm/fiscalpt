import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Análise Fiscal',
  description:
    'Carregue os seus documentos fiscais e obtenha uma análise detalhada com recomendações de otimização para o seu IRS.',
  openGraph: {
    title: 'Análise Fiscal | FiscalPT',
    description:
      'Carregue os seus documentos fiscais e obtenha uma análise detalhada com recomendações de otimização para o seu IRS.',
  },
  alternates: {
    canonical: '/analyze',
  },
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children
}
