import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Deduções à Coleta — Como Maximizar as Suas Deduções de IRS em 2025',
  description:
    'Guia completo das deduções à coleta de IRS: despesas gerais, saúde, educação, habitação, PPR, dependentes, ascendentes. Limites atualizados para 2025.',
  openGraph: {
    title: 'Deduções à Coleta — Como Maximizar as Suas Deduções de IRS em 2025',
    description:
      'Todas as deduções à coleta de IRS com taxas, limites e dicas práticas para reduzir o imposto a pagar.',
    url: `${SITE_URL}/guia/deducoes-coleta`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/deducoes-coleta',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Deduções à Coleta — Como Maximizar as Suas Deduções de IRS em 2025',
  description:
    'Guia completo das deduções à coleta de IRS: categorias, taxas, limites e estratégias de otimização.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-15',
  dateModified: '2025-07-15',
  mainEntityOfPage: `${SITE_URL}/guia/deducoes-coleta`,
  inLanguage: 'pt-PT',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Qual é o limite máximo da dedução de saúde no IRS?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A dedução de saúde é de 15% das despesas, com um limite máximo de €1.000 por agregado familiar.',
      },
    },
    {
      '@type': 'Question',
      name: 'A dedução de PPR depende da idade?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. O limite da dedução PPR é de €400 para menores de 35 anos, €350 entre 35 e 50 anos, e €300 acima dos 50 anos (Art. 21 nº 3 EBF).',
      },
    },
    {
      '@type': 'Question',
      name: 'As deduções dos dependentes são divididas na tributação separada?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Nos casais com tributação separada, as deduções referentes a dependentes e ascendentes comuns são divididas em partes iguais (50/50), por força do Art. 78-A nº 3 CIRS.',
      },
    },
  ],
}

export default function DeducoesColeta() {
  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Deduções à Coleta — Guia Completo 2025</h1>

        <p className="lead">
          As deduções à coleta são o mecanismo que permite reduzir o imposto de IRS a pagar. Cada
          despesa que faz ao longo do ano — em saúde, educação, habitação, ou simplesmente no
          supermercado — pode traduzir-se numa redução direta no imposto final. O truque está em
          saber os limites, as taxas e os prazos. Este guia cobre tudo.
        </p>

        <h2 id="como-funciona">Como Funcionam as Deduções</h2>

        <p>
          O cálculo do IRS funciona em duas fases. Primeiro, o Estado determina o{' '}
          <strong>imposto bruto</strong> (coleta) aplicando os escalões ao rendimento coletável.
          Depois, subtrai as <strong>deduções à coleta</strong> — e o resultado é o imposto final a
          pagar.
        </p>

        <p>
          Cada categoria de despesa tem uma <strong>taxa de dedução</strong> (a percentagem da
          despesa que conta) e um <strong>limite máximo</strong> (o teto da dedução). Por exemplo,
          15% das despesas de saúde até um máximo de €1.000 — se gastou €10.000 em saúde, deduz
          €1.000 (o teto), não €1.500 (os 15%).
        </p>

        <h2 id="tabela-deducoes">Tabela de Deduções por Categoria</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Taxa</th>
                <th>Limite</th>
                <th>Base legal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Despesas gerais familiares</strong>
                </td>
                <td>35%</td>
                <td>€250/pessoa (€500/casal)</td>
                <td>Art. 78-C</td>
              </tr>
              <tr>
                <td>
                  <strong>Saúde</strong>
                </td>
                <td>15%</td>
                <td>€1.000/agregado</td>
                <td>Art. 78-C</td>
              </tr>
              <tr>
                <td>
                  <strong>Educação e formação</strong>
                </td>
                <td>30%</td>
                <td>€800/agregado</td>
                <td>Art. 78-D</td>
              </tr>
              <tr>
                <td>
                  <strong>Habitação (rendas)</strong>
                </td>
                <td>15%</td>
                <td>€502 (2025: €800)</td>
                <td>Art. 78-E</td>
              </tr>
              <tr>
                <td>
                  <strong>Habitação (juros crédito)</strong>
                </td>
                <td>15%</td>
                <td>€296</td>
                <td>Art. 78-E</td>
              </tr>
              <tr>
                <td>
                  <strong>PPR</strong>
                </td>
                <td>20%</td>
                <td>€400 / €350 / €300 (por idade)</td>
                <td>Art. 21 EBF</td>
              </tr>
              <tr>
                <td>
                  <strong>Lares e apoio domiciliário</strong>
                </td>
                <td>25%</td>
                <td>€403,75</td>
                <td>Art. 84</td>
              </tr>
              <tr>
                <td>
                  <strong>Pensões de alimentos</strong>
                </td>
                <td>20%</td>
                <td>Sem limite</td>
                <td>Art. 83-A</td>
              </tr>
              <tr>
                <td>
                  <strong>Exigência de fatura</strong>
                </td>
                <td>15%</td>
                <td>€250</td>
                <td>Art. 78-F</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="despesas-gerais">Despesas Gerais Familiares</h2>

        <p>
          A dedução mais universal: <strong>35%</strong> de todas as despesas gerais (supermercado,
          combustível, vestuário, telecomunicações, etc.), até um máximo de{' '}
          <strong>€250 por pessoa</strong> ou €500 para casais com tributação conjunta.
        </p>

        <p>
          Para atingir o teto de €250, basta gastar €714,29 em despesas gerais durante o ano (€714 ×
          35% = €250). Na prática, qualquer contribuinte que faça compras regulares atinge este
          limite. A questão é garantir que as despesas estão registadas no e-fatura.
        </p>

        <h2 id="saude">Saúde</h2>

        <p>
          Despesas de saúde incluem consultas médicas, medicamentos, óculos, seguros de saúde,
          tratamentos dentários e hospitalares. A taxa é <strong>15%</strong> com limite de{' '}
          <strong>€1.000</strong>.
        </p>

        <p>
          Para atingir o teto: €1.000 ÷ 15% = €6.667 em despesas de saúde. Quem tem seguro de saúde
          privado (o prémio conta integralmente) ou despesas médicas significativas pode atingir
          facilmente este valor. Despesas com IVA a 23% (por exemplo, certos tratamentos) precisam
          de receita médica para serem classificadas como saúde.
        </p>

        <h2 id="educacao">Educação e Formação</h2>

        <p>
          Inclui propinas, material escolar, manuais, creche, ATL, e cursos de formação
          profissional. Taxa de <strong>30%</strong>, limite de <strong>€800</strong>.
        </p>

        <p>
          Uma família com dois filhos na escola paga facilmente mais de €2.667 por ano em despesas
          de educação (€2.667 × 30% = €800), atingindo o teto. As rendas de estudantes deslocados
          também são dedutíveis como educação (até €300 adicionais por estudante deslocado, com
          acréscimo ao limite).
        </p>

        <h2 id="habitacao">Habitação</h2>

        <p>
          Para quem arrenda, <strong>15%</strong> da renda anual até <strong>€502</strong> (ou{' '}
          <strong>€800</strong> em 2025, com o aumento introduzido pelo OE 2025). Juros de crédito à
          habitação mantêm o limite de €296 (apenas para contratos anteriores a 2011).
        </p>

        <p>
          Com rendas mensais de €600, o gasto anual é €7.200. A dedução em 2025: min(€7.200 × 15%,
          €800) = <strong>€800</strong>. Mesmo rendas relativamente baixas atingem o teto
          rapidamente.
        </p>

        <h2 id="ppr">PPR — Plano Poupança Reforma</h2>

        <p>
          Os PPR são dos poucos instrumentos que permitem uma dedução direta controlável pelo
          contribuinte. Ao investir num PPR, deduz <strong>20%</strong> do valor investido, com
          limites que dependem da idade:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Idade</th>
                <th>Limite de dedução</th>
                <th>Investimento necessário</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Menos de 35 anos</td>
                <td>€400</td>
                <td>€2.000</td>
              </tr>
              <tr>
                <td>35 a 50 anos</td>
                <td>€350</td>
                <td>€1.750</td>
              </tr>
              <tr>
                <td>Mais de 50 anos</td>
                <td>€300</td>
                <td>€1.500</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A vantagem do PPR é dupla: a dedução no IRS do ano da contribuição, mais a eventual
          valorização do investimento. A taxa de retorno efetiva do benefício fiscal (€400 de
          dedução por €2.000 investidos, se tiver menos de 35) é de <strong>20% imediato</strong> —
          difícil encontrar um investimento com retorno garantido comparável.
        </p>

        <p>
          Cuidado com as condições de resgate: levantamentos fora das condições legais (reforma,
          desemprego de longa duração, doença grave) implicam devolução dos benefícios fiscais
          obtidos.
        </p>

        <h2 id="dependentes">Deduções por Dependentes</h2>

        <p>
          As deduções por dependentes são <strong>automáticas</strong> — não dependem de despesas,
          mas apenas do número e idade dos filhos no agregado:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Idade do dependente</th>
                <th>Dedução anual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Até 3 anos (inclusive)</td>
                <td>€900</td>
              </tr>
              <tr>
                <td>3 a 6 anos</td>
                <td>€726</td>
              </tr>
              <tr>
                <td>Mais de 6 anos</td>
                <td>€600</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Em caso de guarda partilhada, os valores são divididos ao meio entre os dois progenitores.
        </p>

        <h2 id="ascendentes">Deduções por Ascendentes</h2>

        <p>
          Contribuintes com ascendentes (pais, avós) a viver consigo e que aufiram rendimento
          inferior à pensão mínima anual podem deduzir <strong>€525</strong> por ascendente. Se
          coabitar com apenas um ascendente (e não com um casal), a dedução sobe para{' '}
          <strong>€635</strong> (€525 + €110 de bonificação).
        </p>

        <h2 id="efatura">e-Fatura: Validação de Despesas</h2>

        <p>
          Todo o sistema de deduções assenta na plataforma{' '}
          <strong>
            <a
              href="https://faturas.portaldasfinancas.gov.pt/home.action"
              target="_blank"
              rel="noopener noreferrer"
            >
              e-fatura
            </a>
          </strong>
          . As faturas emitidas com o seu NIF são automaticamente comunicadas à AT e aparecem na
          plataforma classificadas por setor de atividade do comerciante.
        </p>

        <p>Pontos a ter em atenção:</p>

        <ul>
          <li>
            <strong>Despesas pendentes</strong> — algumas faturas ficam como &ldquo;pendentes&rdquo;
            quando o comerciante opera em múltiplos setores (ex.: hipermercado que também tem
            farmácia). É necessário classificá-las manualmente no e-fatura.
          </li>
          <li>
            <strong>Prazo de validação</strong> — o prazo para validar despesas pendentes termina
            habitualmente em fevereiro do ano seguinte. Após esse prazo, ficam no setor por defeito
            e podem não contar para a categoria pretendida.
          </li>
          <li>
            <strong>Faturas em falta</strong> — se fez uma despesa e a fatura não aparece no
            e-fatura, pode registá-la manualmente. Mantenha sempre a fatura original como
            comprovativo.
          </li>
        </ul>

        <h2 id="tributacao-separada">Tributação Separada e Deduções</h2>

        <p>
          Nos casais com tributação separada, as deduções de despesas pessoais (saúde, educação,
          habitação) são atribuídas a cada cônjuge conforme o titular da despesa. Mas as deduções
          por <strong>dependentes e ascendentes</strong> comuns são obrigatoriamente divididas 50/50
          (Art. 78-A nº 3 CIRS) — não é possível atribuí-las a apenas um cônjuge.
        </p>

        <h2 id="erros-comuns">Erros Comuns a Evitar</h2>

        <ul>
          <li>
            <strong>Não pedir fatura com NIF</strong> — Sem NIF na fatura, a despesa não aparece no
            e-fatura e não conta para deduções. Peça NIF em tudo: farmácia, consultas, restaurantes,
            combustível.
          </li>
          <li>
            <strong>Ignorar despesas pendentes</strong> — Faturas não classificadas no e-fatura
            ficam tipicamente em &ldquo;despesas gerais&rdquo; — que atinge o teto de €250 com
            facilidade. Se a despesa é de saúde ou educação, vale a pena reclassificá-la.
          </li>
          <li>
            <strong>Não investir em PPR até ao limite</strong> — O PPR é uma dedução que depende de
            uma decisão ativa do contribuinte. Se tem margem financeira, investir €2.000 (se tiver
            menos de 35) dá um retorno fiscal imediato de €400.
          </li>
          <li>
            <strong>Confundir taxa de dedução com montante dedutível</strong> — &ldquo;15% de
            despesas de saúde&rdquo; não significa que deduz 15% do IRS. Significa que 15% do valor
            gasto em saúde é subtraído ao imposto a pagar, até ao teto.
          </li>
        </ul>

        <h2 id="perguntas-frequentes">Perguntas Frequentes</h2>

        <h3>As deduções funcionam se tiver IRS zero?</h3>

        <p>
          Não. As deduções à coleta subtraem ao imposto apurado — se o imposto apurado é zero (ou
          inferior ao total de deduções), as deduções excedem a coleta e não produzem reembolso. Não
          há deduções &ldquo;negativas&rdquo; no IRS.
        </p>

        <h3>Os seguros de saúde são dedutíveis?</h3>

        <p>
          Sim. Os prémios de seguro de saúde (total ou parcial pago pelo contribuinte) contam como
          despesa de saúde e são dedutíveis a 15%, dentro do limite de €1.000.
        </p>

        <h3>Posso deduzir despesas de educação dos meus filhos que estudam fora?</h3>

        <p>
          Sim. Além do limite geral de €800, as despesas com rendas de estudantes deslocados (fora
          do concelho da residência permanente) beneficiam de um acréscimo ao limite de até €300 por
          estudante.
        </p>

        <h3>O que acontece se mudar de casa a meio do ano?</h3>

        <p>
          As rendas de ambas as habitações (principal e anterior) são dedutíveis, desde que em ambos
          os casos a habitação seja permanente própria. O limite mantém-se (€502 ou €800 em 2025)
          sobre o total anual das rendas.
        </p>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Veja Quanto Está a Deduzir</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e descubra automaticamente todas as deduções aplicadas,
            incluindo oportunidades de poupança que pode estar a perder.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2">
              Simular Agora
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
