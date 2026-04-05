import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Blog — FiscalPT',
  description:
    'Artigos sobre otimização fiscal em Portugal: IRS, NHR, tributação conjunta, IRS Jovem, e como poupar nos impostos.',
  openGraph: {
    title: 'Blog — FiscalPT',
    description: 'Artigos sobre otimização fiscal em Portugal.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/blog',
  },
}

const posts = [
  {
    slug: 'nhr-tributacao-conjunta',
    title: 'NHR + Tributação Conjunta: O Maior Hack Fiscal (Não Intencional) em Portugal',
    description:
      'Quando um cônjuge NHR opta pela tributação conjunta, o quociente conjugal aplica-se apenas ao rendimento progressivo — reduzindo drasticamente o IRS do casal.',
    date: 'Julho 2025',
  },
  {
    slug: 'como-recuperei-10000-euros',
    title: 'Como Recuperei €10.000 em Impostos — E Porque Criei o FiscalPT',
    description:
      'A história pessoal por trás do FiscalPT: como descobri que podia recuperar €10.000 em impostos com declarações de substituição.',
    date: 'Julho 2025',
  },
]

export default function BlogIndex() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Artigos sobre otimização fiscal, dicas práticas e histórias reais.
        </p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <Card className="transition-colors group-hover:border-primary/50">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">{post.date}</p>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{post.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                  Ler artigo
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
