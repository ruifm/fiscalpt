import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Escalões de IRS 2025 — Tabela Completa com Parcelas e Exemplos',
  description:
    'Tabela completa dos escalões de IRS 2025 com taxas, parcelas a abater e exemplos práticos de cálculo. Compare com 2024 e perceba quanto paga de imposto.',
  openGraph: {
    title: 'Escalões de IRS 2025 — Tabela Completa com Parcelas e Exemplos',
    description:
      'Tabela completa dos escalões de IRS 2025 com taxas, parcelas a abater e exemplos práticos de cálculo. Compare com 2024.',
    url: `${SITE_URL}/guia/escaloes-irs-2025`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/escaloes-irs-2025',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Escalões de IRS 2025 — Tabela Completa e Exemplos Práticos',
  description:
    'Tabela completa dos escalões de IRS 2025 com taxas, parcelas a abater e exemplos práticos de cálculo. Compare com 2024 e perceba quanto paga de imposto.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-04-05',
  dateModified: '2025-04-05',
  mainEntityOfPage: `${SITE_URL}/guia/escaloes-irs-2025`,
  inLanguage: 'pt-PT',
}

export default function EscaloesIRS2025() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Escalões de IRS 2025 — Tabela Completa e Exemplos Práticos</h1>

        <p className="lead">
          Os escalões de IRS determinam quanto imposto paga sobre o seu rendimento. Em 2025, com as
          alterações do Orçamento do Estado (OE 2025), os escalões foram ajustados com taxas
          ligeiramente mais baixas e limites mais alargados. Neste guia, apresentamos a tabela
          completa, explicamos como funciona a tributação progressiva e mostramos exemplos práticos
          de cálculo.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="o-que-sao-escaloes">O Que São Escalões de IRS</h2>

        <p>
          O IRS em Portugal é um imposto <strong>progressivo</strong>. Isto significa que o
          rendimento de cada contribuinte é dividido em faixas (escalões) e cada faixa é tributada a
          uma taxa diferente. Quanto maior o rendimento, maior a taxa aplicada — mas apenas à
          parcela de rendimento que se insere nesse escalão, não à totalidade.
        </p>

        <p>
          Este sistema garante equidade fiscal: quem ganha mais paga proporcionalmente mais, mas
          ninguém é penalizado por ganhar &ldquo;um euro a mais&rdquo; que o coloque num escalão
          superior. Cada euro adicional é tributado apenas à taxa marginal desse escalão.
        </p>

        <p>
          O rendimento sobre o qual incidem os escalões chama-se{' '}
          <strong>rendimento coletável</strong>. É obtido a partir do rendimento bruto depois de
          subtraídas as deduções específicas de cada categoria (por exemplo, €4.104 para trabalho
          dependente).
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="tabela-2025">Tabela Completa dos Escalões de IRS 2025 (OE 2025)</h2>

        <p>
          A tabela seguinte aplica-se aos rendimentos de 2025, a declarar em 2026. São 9 escalões
          definidos no artigo 68.º do Código do IRS, conforme o Orçamento do Estado para 2025:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Rendimento Coletável</th>
                <th>Taxa Normal</th>
                <th>Parcela a Abater</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.º</td>
                <td>Até €8.059</td>
                <td>12,5%</td>
                <td>€0</td>
              </tr>
              <tr>
                <td>2.º</td>
                <td>€8.059 – €12.160</td>
                <td>16%</td>
                <td>€282,07</td>
              </tr>
              <tr>
                <td>3.º</td>
                <td>€12.160 – €17.233</td>
                <td>21,5%</td>
                <td>€950,87</td>
              </tr>
              <tr>
                <td>4.º</td>
                <td>€17.233 – €22.306</td>
                <td>24,4%</td>
                <td>€1.450,63</td>
              </tr>
              <tr>
                <td>5.º</td>
                <td>€22.306 – €28.400</td>
                <td>31,4%</td>
                <td>€3.012,04</td>
              </tr>
              <tr>
                <td>6.º</td>
                <td>€28.400 – €41.629</td>
                <td>34,9%</td>
                <td>€4.006,44</td>
              </tr>
              <tr>
                <td>7.º</td>
                <td>€41.629 – €44.987</td>
                <td>43,1%</td>
                <td>€7.419,81</td>
              </tr>
              <tr>
                <td>8.º</td>
                <td>€44.987 – €83.696</td>
                <td>44,6%</td>
                <td>€8.094,57</td>
              </tr>
              <tr>
                <td>9.º</td>
                <td>Mais de €83.696</td>
                <td>48%</td>
                <td>€10.939,83</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Nota:</strong> A parcela a abater é um valor que simplifica o cálculo do imposto.
          Em vez de calcular escalão a escalão, basta aplicar a taxa do escalão onde se insere o
          rendimento total e subtrair a parcela a abater correspondente. O resultado é exatamente o
          mesmo.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="tributacao-progressiva">Como Funciona a Tributação Progressiva</h2>

        <p>
          Um dos equívocos mais comuns sobre o IRS é pensar que, ao subir de escalão, todo o
          rendimento passa a ser tributado à taxa mais alta. <strong>Isto é falso.</strong>
        </p>

        <p>
          Vejamos um exemplo simples. Imagine que ganha um rendimento coletável de €8.060 — apenas
          €1 acima do limite do 1.º escalão (€8.059). Muitas pessoas pensam que todo o rendimento
          seria tributado a 16%. Na realidade:
        </p>

        <ul>
          <li>
            Os primeiros <strong>€8.059</strong> são tributados a <strong>12,5%</strong> = €1.007,38
          </li>
          <li>
            O €1 restante é tributado a <strong>16%</strong> = €0,16
          </li>
          <li>
            <strong>Total:</strong> €1.007,54
          </li>
        </ul>

        <p>
          Se todo o rendimento fosse tributado a 16%, o imposto seria €1.289,60 — quase €282 a mais!
          É exatamente este o papel da parcela a abater: corrigir essa diferença quando usamos a
          taxa marginal sobre o rendimento total.
        </p>

        <p>
          <strong>Conclusão:</strong> nunca perde dinheiro por ganhar &ldquo;um euro a mais&rdquo;.
          Cada euro adicional é tributado apenas à taxa do escalão onde se insere. O sistema é
          desenhado para ser justo e gradual.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="exemplo-pratico">Exemplo Prático Detalhado</h2>

        <p>
          Vamos calcular o IRS de um contribuinte solteiro, sem dependentes, com rendimento bruto de
          trabalho dependente (Categoria A) de <strong>€25.000</strong> anuais.
        </p>

        <h3>Passo 1: Determinar o rendimento coletável</h3>

        <p>
          Ao rendimento bruto subtrai-se a dedução específica da Categoria A, que é de €4.104
          (artigo 25.º do CIRS):
        </p>

        <p>
          <code>€25.000 − €4.104 = €20.896</code> (rendimento coletável)
        </p>

        <h3>Passo 2: Cálculo escalão a escalão</h3>

        <p>O rendimento coletável de €20.896 distribui-se pelos escalões da seguinte forma:</p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Parcela do Rendimento</th>
                <th>Taxa</th>
                <th>Imposto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.º (até €8.059)</td>
                <td>€8.059</td>
                <td>12,5%</td>
                <td>€1.007,38</td>
              </tr>
              <tr>
                <td>2.º (€8.059–€12.160)</td>
                <td>€4.101</td>
                <td>16%</td>
                <td>€656,16</td>
              </tr>
              <tr>
                <td>3.º (€12.160–€17.233)</td>
                <td>€5.073</td>
                <td>21,5%</td>
                <td>€1.090,70</td>
              </tr>
              <tr>
                <td>4.º (€17.233–€20.896)</td>
                <td>€3.663</td>
                <td>24,4%</td>
                <td>€893,77</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>€3.648,01</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h3>Passo 3: Verificação com parcela a abater</h3>

        <p>
          Em alternativa, podemos usar a fórmula rápida. O rendimento coletável de €20.896 insere-se
          no 4.º escalão (€17.233–€22.306), com taxa de 24,4% e parcela a abater de €1.450,63:
        </p>

        <p>
          <code>€20.896 × 24,4% − €1.450,63 = €5.098,62 − €1.450,63 = €3.647,99</code>
        </p>

        <p>
          A diferença de €0,02 deve-se a arredondamentos intermédios. Ambos os métodos produzem o
          mesmo resultado. A <strong>taxa efetiva</strong> deste contribuinte é:
        </p>

        <p>
          <code>€3.648 ÷ €20.896 = 17,46%</code>
        </p>

        <p>
          Ou seja, apesar de o escalão máximo atingido ter uma taxa de 24,4%, a taxa efetiva sobre o
          rendimento coletável é de apenas 17,46%. Sobre o rendimento bruto de €25.000, a taxa
          efetiva é ainda menor: <code>€3.648 ÷ €25.000 = 14,59%</code>.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="comparacao-2024-2025">Comparação dos Escalões: 2024 vs 2025</h2>

        <p>
          O OE 2025 trouxe ajustes nos escalões face a 2024. A tabela seguinte compara as duas
          tabelas lado a lado:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Limite 2024</th>
                <th>Taxa 2024</th>
                <th>Limite 2025</th>
                <th>Taxa 2025</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.º</td>
                <td>Até €7.703</td>
                <td>13,25%</td>
                <td>Até €8.059</td>
                <td>12,5%</td>
              </tr>
              <tr>
                <td>2.º</td>
                <td>€7.703–€11.623</td>
                <td>18%</td>
                <td>€8.059–€12.160</td>
                <td>16%</td>
              </tr>
              <tr>
                <td>3.º</td>
                <td>€11.623–€16.472</td>
                <td>23%</td>
                <td>€12.160–€17.233</td>
                <td>21,5%</td>
              </tr>
              <tr>
                <td>4.º</td>
                <td>€16.472–€21.321</td>
                <td>26%</td>
                <td>€17.233–€22.306</td>
                <td>24,4%</td>
              </tr>
              <tr>
                <td>5.º</td>
                <td>€21.321–€27.146</td>
                <td>32,75%</td>
                <td>€22.306–€28.400</td>
                <td>31,4%</td>
              </tr>
              <tr>
                <td>6.º</td>
                <td>€27.146–€39.791</td>
                <td>37%</td>
                <td>€28.400–€41.629</td>
                <td>34,9%</td>
              </tr>
              <tr>
                <td>7.º</td>
                <td>€39.791–€51.997</td>
                <td>43,50%</td>
                <td>€41.629–€44.987</td>
                <td>43,1%</td>
              </tr>
              <tr>
                <td>8.º</td>
                <td>€51.997–€81.199</td>
                <td>45%</td>
                <td>€44.987–€83.696</td>
                <td>44,6%</td>
              </tr>
              <tr>
                <td>9.º</td>
                <td>Mais de €81.199</td>
                <td>48%</td>
                <td>Mais de €83.696</td>
                <td>48%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Principais diferenças:</strong>
        </p>

        <ul>
          <li>
            <strong>Taxas mais baixas</strong> — Em todos os escalões (exceto o último, que se
            mantém em 48%), as taxas foram reduzidas. Por exemplo, o 1.º escalão baixou de 13,25%
            para 12,5%, e o 2.º de 18% para 16%.
          </li>
          <li>
            <strong>Limites mais alargados</strong> — Os limites superiores de cada escalão subiram,
            acompanhando a inflação e o crescimento salarial. O 1.º escalão passa de €7.703 para
            €8.059, por exemplo.
          </li>
          <li>
            <strong>Efeito prático</strong> — Para o mesmo rendimento, paga-se menos imposto em 2025
            do que em 2024. Um contribuinte com rendimento coletável de €20.000, por exemplo, pagava
            cerca de €3.759 em 2024 e paga cerca de €3.428 em 2025 — uma poupança de aproximadamente
            €331.
          </li>
        </ul>

        {/* ------------------------------------------------------------------ */}
        <h2 id="taxa-efetiva-vs-marginal">Taxa Efetiva vs Taxa Marginal</h2>

        <p>
          Estes dois conceitos são frequentemente confundidos, mas representam coisas muito
          diferentes:
        </p>

        <ul>
          <li>
            <strong>Taxa marginal</strong> — É a taxa aplicada ao <em>último euro</em> de
            rendimento. Corresponde à taxa do escalão mais alto que o rendimento atinge. Se o seu
            rendimento coletável é €20.896, a taxa marginal é 24,4% (4.º escalão).
          </li>
          <li>
            <strong>Taxa efetiva</strong> — É a percentagem real de imposto pago face ao rendimento
            total. Como os primeiros euros são tributados a taxas mais baixas, a taxa efetiva é
            sempre inferior à taxa marginal. No exemplo acima, a taxa efetiva é 17,46%.
          </li>
        </ul>

        <p>Vejamos como a taxa efetiva varia com diferentes níveis de rendimento coletável:</p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Rendimento Coletável</th>
                <th>Taxa Marginal</th>
                <th>Imposto</th>
                <th>Taxa Efetiva</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>€10.000</td>
                <td>16%</td>
                <td>€1.318,07</td>
                <td>13,18%</td>
              </tr>
              <tr>
                <td>€15.000</td>
                <td>21,5%</td>
                <td>€2.274,13</td>
                <td>15,16%</td>
              </tr>
              <tr>
                <td>€20.000</td>
                <td>24,4%</td>
                <td>€3.429,37</td>
                <td>17,15%</td>
              </tr>
              <tr>
                <td>€25.000</td>
                <td>31,4%</td>
                <td>€4.837,96</td>
                <td>19,35%</td>
              </tr>
              <tr>
                <td>€35.000</td>
                <td>34,9%</td>
                <td>€8.208,56</td>
                <td>23,45%</td>
              </tr>
              <tr>
                <td>€50.000</td>
                <td>44,6%</td>
                <td>€14.205,43</td>
                <td>28,41%</td>
              </tr>
              <tr>
                <td>€80.000</td>
                <td>44,6%</td>
                <td>€27.585,43</td>
                <td>34,48%</td>
              </tr>
              <tr>
                <td>€100.000</td>
                <td>48%</td>
                <td>€37.060,17</td>
                <td>37,06%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Repare como a taxa efetiva é sempre significativamente inferior à taxa marginal. Um
          contribuinte com rendimento coletável de €50.000, apesar de estar no 8.º escalão (taxa de
          44,6%), paga uma taxa efetiva de apenas 28,41%.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="escaloes-casados">Escalões para Contribuintes Casados</h2>

        <p>
          Quando um casal opta pela tributação conjunta, aplica-se o mecanismo do{' '}
          <strong>quociente conjugal</strong> (artigo 69.º do CIRS). O cálculo funciona em três
          passos:
        </p>

        <ol>
          <li>
            <strong>Somar</strong> os rendimentos coletáveis de ambos os cônjuges.
          </li>
          <li>
            <strong>Dividir por 2</strong> — obtém-se o rendimento per capita do casal.
          </li>
          <li>
            <strong>Aplicar os escalões</strong> ao rendimento per capita e{' '}
            <strong>multiplicar o imposto resultante por 2</strong>.
          </li>
        </ol>

        <h3>Exemplo: Casal com rendimentos diferentes</h3>

        <p>
          Imagine um casal em que o Sujeito Passivo A ganha €35.000 de rendimento coletável e o
          Sujeito Passivo B ganha €15.000.
        </p>

        <h4>Tributação separada</h4>

        <ul>
          <li>
            SP A: €35.000 × 34,9% − €4.006,44 = <strong>€8.208,56</strong>
          </li>
          <li>
            SP B: €15.000 × 21,5% − €950,87 = <strong>€2.274,13</strong>
          </li>
          <li>
            Total: <strong>€10.482,69</strong>
          </li>
        </ul>

        <h4>Tributação conjunta (quociente conjugal)</h4>

        <ul>
          <li>Rendimento total: €35.000 + €15.000 = €50.000</li>
          <li>Rendimento per capita: €50.000 ÷ 2 = €25.000</li>
          <li>Imposto per capita: €25.000 × 31,4% − €3.012,04 = €4.837,96</li>
          <li>
            Imposto do casal: €4.837,96 × 2 = <strong>€9.675,92</strong>
          </li>
        </ul>

        <p>
          Neste caso, a tributação conjunta poupa <strong>€806,77</strong> ao casal. Isto acontece
          porque o quociente conjugal &ldquo;puxa&rdquo; o rendimento mais alto para um escalão
          inferior, reduzindo o imposto global.
        </p>

        <p>
          <strong>Quando compensa a tributação conjunta?</strong> Geralmente quando há grande
          disparidade de rendimentos entre os cônjuges. Se ambos ganham valores semelhantes, a
          diferença é mínima ou nula. Para uma análise detalhada, consulte o nosso{' '}
          <Link href="/guia/conjunto-vs-separado" className="text-primary hover:underline">
            guia de tributação conjunta vs separada
          </Link>
          .
        </p>

        <h3>Atenção: os escalões aplicam-se ao rendimento per capita</h3>

        <p>
          Um erro comum é pensar que existem escalões diferentes para casados. Na realidade, a
          tabela de escalões é exatamente a mesma — o que muda é que o rendimento é dividido por 2
          antes de se aplicar a tabela, e o imposto resultante é multiplicado por 2 no final. Este
          mecanismo simples tem o efeito de baixar a taxa efetiva quando há assimetria de
          rendimentos.
        </p>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Calcule o Seu IRS com os Escalões 2025 Atualizados
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Carregue a sua declaração e veja automaticamente em que escalão se insere, qual a sua
            taxa efetiva, e se a tributação conjunta compensa.
          </p>
          <Link href="/analyze">
            <Button size="lg">
              Calcular o Meu IRS <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
