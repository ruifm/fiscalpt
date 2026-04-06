import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'O Teu Patrão Desconta X% — Mas Quanto Pagas Realmente de IRS?',
  description:
    'Taxa marginal vs taxa efetiva: porque é que estar no escalão de 43,5% não significa que pagas 43,5% de imposto. Exemplos reais com números de 2025.',
  openGraph: {
    title: 'Taxa Efetiva vs Taxa Marginal — Quanto Pagas Realmente de IRS?',
    description:
      'Estar no escalão de 43,5% não significa pagar 43,5%. Explicamos a diferença com exemplos concretos.',
    url: `${SITE_URL}/blog/taxa-efetiva-vs-marginal`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/blog/taxa-efetiva-vs-marginal',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'O Teu Patrão Desconta X% — Mas Quanto Pagas Realmente de IRS?',
  description:
    'Taxa marginal vs taxa efetiva: porque é que estar no escalão de 43,5% não significa que pagas 43,5% de imposto.',
  author: { '@type': 'Person', name: 'Rui Moreira' },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-15',
  dateModified: '2025-07-15',
  mainEntityOfPage: `${SITE_URL}/blog/taxa-efetiva-vs-marginal`,
  inLanguage: 'pt-PT',
}

export default function TaxaEfetivaVsMarginal() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>O Teu Patrão Desconta X% — Mas Quanto Pagas Realmente de IRS?</h1>

        <p className="lead text-muted-foreground">
          Por <strong>Rui Moreira</strong> · Julho 2025
        </p>

        <p>
          &ldquo;Estou no escalão de 43,5%.&rdquo; Quantas vezes já ouviste isto numa conversa sobre
          salários? A frase soa dramática — quase metade do ordenado para o Estado. Mas não é assim
          que o IRS funciona. E perceber a diferença entre a <strong>taxa marginal</strong> e a{' '}
          <strong>taxa efetiva</strong> muda completamente a forma como olhas para o teu recibo de
          vencimento.
        </p>

        <h2 id="o-mito">O Mito dos 43,5%</h2>

        <p>
          Portugal tem um sistema de imposto <strong>progressivo por escalões</strong>. Cada escalão
          aplica-se apenas à fatia de rendimento que lhe corresponde — não ao rendimento inteiro.
          Quem diz &ldquo;estou no escalão de 43,5%&rdquo; está a referir-se à taxa do{' '}
          <strong>último euro</strong> que ganha. Mas os primeiros euros que ganhou foram tributados
          a 12,5%.
        </p>

        <p>É a diferença entre duas coisas completamente distintas:</p>

        <ul>
          <li>
            <strong>Taxa marginal</strong> — a taxa aplicada ao próximo euro ganho. Define o escalão
            em que te &ldquo;encaixas&rdquo;.
          </li>
          <li>
            <strong>Taxa efetiva</strong> — o imposto total dividido pelo rendimento total. O que
            realmente pagas em percentagem.
          </li>
        </ul>

        <h2 id="exemplo-real">Um Exemplo com Números Reais</h2>

        <p>
          Vejamos alguém com um rendimento coletável de <strong>€30.000</strong> em 2025. Usando os
          escalões de 2025 (OE 2025):
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Fatia</th>
                <th>Taxa</th>
                <th>Imposto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Até €8.059</td>
                <td>€8.059</td>
                <td>12,5%</td>
                <td>€1.007</td>
              </tr>
              <tr>
                <td>€8.059 → €12.160</td>
                <td>€4.101</td>
                <td>16%</td>
                <td>€656</td>
              </tr>
              <tr>
                <td>€12.160 → €17.233</td>
                <td>€5.073</td>
                <td>21,5%</td>
                <td>€1.091</td>
              </tr>
              <tr>
                <td>€17.233 → €22.306</td>
                <td>€5.073</td>
                <td>24,4%</td>
                <td>€1.238</td>
              </tr>
              <tr>
                <td>€22.306 → €28.400</td>
                <td>€6.094</td>
                <td>31,4%</td>
                <td>€1.914</td>
              </tr>
              <tr>
                <td>€28.400 → €30.000</td>
                <td>€1.600</td>
                <td>34,9%</td>
                <td>€558</td>
              </tr>
              <tr className="font-semibold">
                <td>Total</td>
                <td>€30.000</td>
                <td></td>
                <td>€6.464</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A <strong>taxa marginal</strong> é 34,9% — cada euro adicional acima de €28.400 é
          tributado a essa taxa. Mas o <strong>imposto total</strong> é €6.464 em €30.000, o que dá
          uma taxa efetiva de <strong>21,5%</strong>.
        </p>

        <p className="text-lg font-semibold text-center">
          Taxa marginal: 34,9% · Taxa efetiva: <strong>21,5%</strong>
        </p>

        <p>
          A diferença é brutal: 34,9% vs 21,5%. Quem confunde as duas pensa que paga muito mais do
          que realmente paga.
        </p>

        <h2 id="retencao">A Retenção na Fonte Não Ajuda</h2>

        <p>
          Parte da confusão vem do recibo de vencimento. A retenção na fonte (o &ldquo;desconto de
          IRS&rdquo; mensal) é calculada com base em tabelas que tentam aproximar o imposto final,
          mas raramente acertam. O resultado é que muita gente paga a mais durante o ano e recebe
          reembolso, ou paga a menos e é surpreendida pela liquidação.
        </p>

        <p>
          A retenção depende do número de titulares do agregado, do estado civil, e de se indicou ou
          não dependentes ao empregador. Não depende das deduções reais (saúde, educação,
          habitação). Por isso, a taxa de retenção quase nunca corresponde à taxa efetiva final.
        </p>

        <h2 id="carga-total">A Carga Fiscal Total: IRS + Segurança Social</h2>

        <p>
          Quando se fala em &ldquo;quanto pago de impostos&rdquo;, faz sentido incluir a Segurança
          Social. Um trabalhador por conta de outrem paga <strong>11%</strong> do salário bruto para
          a SS, e a entidade empregadora paga <strong>23,75%</strong>. O empregador não te mostra
          essa parcela no recibo, mas ela existe e é calculada sobre o teu salário.
        </p>

        <p>
          Para os mesmos €30.000 de rendimento coletável (antes da dedução específica o salário
          bruto seria cerca de €34.100):
        </p>

        <ul>
          <li>IRS efetivo: ~€6.464 (21,5%)</li>
          <li>SS do trabalhador (11%): ~€3.751</li>
          <li>
            <strong>Carga total do trabalhador</strong>: ~€10.215 (~30%)
          </li>
        </ul>

        <p>
          Se contarmos a contribuição patronal (23,75%), a carga fiscal sobre o custo total de mão
          de obra sobe para cerca de 43%. Mas isso é a carga sobre o empregador, não sobre o
          trabalhador.
        </p>

        <h2 id="como-calcular">Como Saber a Tua Taxa Efetiva Real</h2>

        <p>Há duas formas:</p>

        <ol>
          <li>
            <strong>Olhar para a liquidação de IRS</strong> — O documento de liquidação que a AT
            emite após processar a declaração mostra a taxa efetiva diretamente. É o número oficial.
          </li>
          <li>
            <strong>Calcular manualmente</strong> — Imposto liquidado ÷ rendimento coletável. Se o
            imposto liquidado (antes de deduções à coleta) foi €6.464 e o rendimento coletável foi
            €30.000, a taxa efetiva é 6.464 ÷ 30.000 = 21,5%.
          </li>
        </ol>

        <p>
          A taxa efetiva <em>após</em> deduções à coleta é ainda mais baixa. Deduções por
          dependentes, saúde, educação e PPR podem reduzir o imposto efetivo em vários pontos
          percentuais.
        </p>

        <h2 id="por-que-importa">Porque É Que Isto Importa</h2>

        <p>
          Perceber a taxa efetiva muda decisões concretas. Quem recusa um aumento porque &ldquo;vai
          para um escalão mais alto&rdquo; está a pensar na taxa marginal — e a confundi-la com uma
          penalização que não existe. Um aumento <strong>nunca</strong> reduz o rendimento líquido.
          O escalão mais alto aplica-se apenas à diferença, não a tudo o que ganhou antes.
        </p>

        <p>
          Também muda a perceção de justiça fiscal. Quando alguém diz &ldquo;pago 45% de
          impostos&rdquo; referindo-se à taxa marginal do último escalão, está a transmitir uma
          imagem distorcida. A taxa efetiva de IRS em Portugal raramente ultrapassa 35%, mesmo para
          rendimentos muito elevados — e com deduções pode ficar nos 25-30%.
        </p>

        <h2 id="taxa-por-escalao">Taxas Efetivas Aproximadas por Nível de Rendimento</h2>

        <p>
          Para um contribuinte solteiro, sem deduções além da dedução específica de €4.104 (Cat A),
          com os escalões de 2025:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Salário bruto anual</th>
                <th>Rendimento coletável</th>
                <th>Taxa marginal</th>
                <th>Taxa efetiva IRS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>€14.000</td>
                <td>€9.896</td>
                <td>16%</td>
                <td>~12,5%</td>
              </tr>
              <tr>
                <td>€20.000</td>
                <td>€15.896</td>
                <td>21,5%</td>
                <td>~16,1%</td>
              </tr>
              <tr>
                <td>€30.000</td>
                <td>€25.896</td>
                <td>31,4%</td>
                <td>~20,8%</td>
              </tr>
              <tr>
                <td>€50.000</td>
                <td>€45.896</td>
                <td>43,1%</td>
                <td>~28,6%</td>
              </tr>
              <tr>
                <td>€80.000</td>
                <td>€75.896</td>
                <td>44,6%</td>
                <td>~34,4%</td>
              </tr>
              <tr>
                <td>€120.000</td>
                <td>€115.896</td>
                <td>48%</td>
                <td>~38,2%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Mesmo no rendimento coletável de €115.896 (o que corresponde a um salário bruto anual de
          €120.000 — bem acima da média), a taxa efetiva é 38%, não 48%. E com deduções à coleta, o
          número final será ainda menor.
        </p>

        {/* CTA */}
        <div className="not-prose rounded-xl bg-muted/50 p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">Descubra a Sua Taxa Efetiva Real</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e veja automaticamente a taxa efetiva por cenário:
            tributação conjunta, separada, com e sem IRS Jovem.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2">
              Analisar impostos gratuitamente
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
