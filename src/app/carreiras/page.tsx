import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code2, Brain, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'
import { ApplyForm } from '@/components/apply-form'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Carreiras — Junta-te à Equipa FiscalPT',
  description:
    'Procuramos engenheiros de software e especialistas fiscais para simplificar os impostos em Portugal. Projeto open-source com TypeScript, Next.js e React.',
  openGraph: {
    title: 'Carreiras — Junta-te à Equipa FiscalPT',
    description:
      'Oportunidades para engenheiros de software e especialistas fiscais. Projeto open-source em TypeScript e Next.js.',
    url: `${SITE_URL}/carreiras`,
    type: 'website',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/carreiras',
  },
}

const jobPostingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Carreiras — FiscalPT',
  description:
    'Oportunidades para contribuir com o FiscalPT, uma plataforma open-source de otimização fiscal.',
  url: `${SITE_URL}/carreiras`,
  publisher: {
    '@type': 'Organization',
    name: 'FiscalPT',
    url: SITE_URL,
  },
}

const VALUES = [
  {
    icon: Code2,
    title: 'Código aberto',
    description:
      'Todo o código é público no GitHub. Acreditamos que transparência gera confiança — especialmente quando se trata de impostos.',
  },
  {
    icon: Brain,
    title: 'Determinismo primeiro',
    description:
      'O motor de cálculo é 100% determinístico. Sem LLMs na matemática fiscal, sem magia negra. Cada cêntimo é verificável.',
  },
  {
    icon: Shield,
    title: 'Privacidade radical',
    description:
      'Os dados fiscais nunca saem do navegador do utilizador. Zero telemetria pessoal, zero bases de dados de dados fiscais.',
  },
  {
    icon: Users,
    title: 'Impacto real',
    description:
      'Ajudamos famílias portuguesas a poupar centenas ou milhares de euros por ano. Cada otimização encontrada é uma vitória concreta.',
  },
]

const ROLES = [
  {
    title: 'Engenheiro(a) Full-Stack',
    type: 'Contribuição open-source',
    description:
      'Ajuda-nos a construir a melhor experiência de simulação fiscal em Portugal. Trabalhamos com TypeScript, Next.js, React 19, Tailwind CSS e Vitest.',
    responsibilities: [
      'Desenvolvimento do motor de cálculo fiscal (funções puras, TDD rigoroso)',
      'Parsing de documentos AT (XML Modelo 3, PDFs de comprovativo e liquidação)',
      'Componentes React acessíveis e responsivos',
      'Cobertura de testes a 96%+ (atualmente 1050+ testes)',
    ],
    skills: [
      'TypeScript avançado',
      'React / Next.js',
      'Testes automatizados (Vitest, Playwright)',
      'Boas práticas de clean code e TDD',
    ],
  },
  {
    title: 'Especialista Fiscal / Contabilista',
    type: 'Consultoria técnica',
    description:
      'Precisamos de quem conheça o CIRS de trás para a frente para validar regras, identificar edge cases e garantir que o motor está correto.',
    responsibilities: [
      'Validação de regras fiscais implementadas no motor de cálculo',
      'Identificação de cenários fiscais complexos para testes',
      'Revisão de conteúdo educativo (guias, blog posts)',
      'Consultoria sobre alterações legislativas anuais (OE)',
    ],
    skills: [
      'Conhecimento profundo do CIRS e legislação fiscal portuguesa',
      'Experiência com IRS (Cat A, B, E, F, G, H)',
      'Familiaridade com regimes especiais (IRS Jovem, NHR)',
      'Capacidade de traduzir lei em especificações técnicas',
    ],
  },
  {
    title: 'Social Media Manager',
    type: 'Marketing & Comunicação',
    description:
      'Procuramos alguém para gerir a presença do FiscalPT nas redes sociais, criar conteúdo educativo sobre fiscalidade e fazer crescer a comunidade de utilizadores.',
    responsibilities: [
      'Gestão de redes sociais (LinkedIn, X/Twitter, Reddit, Instagram)',
      'Criação de conteúdo educativo sobre IRS e fiscalidade portuguesa',
      'Planeamento e execução de calendário editorial',
      'Interação com a comunidade e resposta a questões fiscais básicas',
    ],
    skills: [
      'Experiência em gestão de redes sociais e marketing digital',
      'Capacidade de comunicar temas complexos de forma simples e acessível',
      'Conhecimento básico de fiscalidade portuguesa (ou vontade de aprender)',
      'Português nativo com excelente escrita',
    ],
  },
]

export default function CareersPage() {
  return (
    <>
      <JsonLd data={jobPostingJsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Constrói connosco o futuro da fiscalidade em Portugal
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            O FiscalPT é um projeto open-source que ajuda famílias portuguesas a otimizar os seus
            impostos. Procuramos pessoas que partilhem a nossa missão de tornar a fiscalidade
            acessível a todos.{' '}
            <strong className="text-foreground">Todas as posições são 100% remotas.</strong>
          </p>
        </header>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-semibold mb-6">O que nos define</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="flex gap-4 rounded-lg border p-4 bg-card text-card-foreground"
              >
                <value.icon className="h-6 w-6 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-medium">{value.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stack */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-semibold mb-4">Stack tecnológico</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'TypeScript',
              'Next.js 16',
              'React 19',
              'Tailwind CSS',
              'Vitest',
              'Playwright',
              'Stripe',
              'Vercel',
              'Sentry',
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Open roles */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-semibold mb-6">Oportunidades</h2>
          <div className="space-y-8">
            {ROLES.map((role) => (
              <div key={role.title} className="rounded-lg border p-6 bg-card text-card-foreground">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold">{role.title}</h3>
                  <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                    {role.type}
                  </span>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                    100% Remoto
                  </span>
                </div>
                <p className="text-muted-foreground mb-4">{role.description}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-2">O que farás</h4>
                    <ul className="space-y-1">
                      {role.responsibilities.map((r) => (
                        <li
                          key={r}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary mt-1">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">O que procuramos</h4>
                    <ul className="space-y-1">
                      {role.skills.map((s) => (
                        <li
                          key={s}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <ApplyForm roleTitle={role.title} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to contribute */}
        <section className="mb-16 rounded-lg border bg-primary/5 p-8">
          <h2 className="font-heading text-2xl font-semibold mb-4">Como contribuir</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              O FiscalPT é open-source — não precisas de convite para começar. Abre o repositório,
              escolhe um issue, e submete um pull request.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Consulta os{' '}
                <a
                  href="https://github.com/ruifm/fiscalpt/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  issues abertos no GitHub
                </a>
              </li>
              <li>
                Lê o{' '}
                <a
                  href="https://github.com/ruifm/fiscalpt/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  guia de contribuição
                </a>
              </li>
              <li>Faz fork, implementa, testa, e abre um PR</li>
            </ol>
            <p>
              Para contribuições maiores ou parcerias, envia um email para{' '}
              <a href="mailto:ola@fiscalpt.com" className="text-primary hover:underline">
                ola@fiscalpt.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="https://github.com/ruifm/fiscalpt" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Ver repositório
            </Button>
          </a>
          <Link href="/analyze">
            <Button variant="outline" size="lg" className="gap-2">
              Experimentar o FiscalPT
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
