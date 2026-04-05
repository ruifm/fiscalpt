import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Como Funciona o IRS em Portugal — Guia Completo 2025',
  description:
    'Guia completo sobre o IRS em Portugal: quem deve declarar, categorias de rendimento, escalões, deduções, retenção na fonte e processo de entrega. Atualizado para 2025.',
  openGraph: {
    title: 'Como Funciona o IRS em Portugal — Guia Completo 2025',
    description:
      'Guia completo sobre o IRS em Portugal: escalões, categorias de rendimento, deduções e processo de entrega. Atualizado para 2025.',
    url: `${SITE_URL}/guia/como-funciona-irs`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/como-funciona-irs',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Como Funciona o IRS em Portugal — Guia Completo 2025',
  description:
    'Guia completo sobre o IRS em Portugal: quem deve declarar, categorias de rendimento, escalões, deduções, retenção na fonte e processo de entrega.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-01-15',
  dateModified: '2025-01-15',
  mainEntityOfPage: `${SITE_URL}/guia/como-funciona-irs`,
  inLanguage: 'pt-PT',
}

export default function ComoFuncionaIRS() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Como Funciona o IRS em Portugal</h1>

        <p className="lead">
          O Imposto sobre o Rendimento das Pessoas Singulares (IRS) é o principal imposto que incide
          sobre os rendimentos dos cidadãos em Portugal. Compreender como funciona é essencial para
          garantir que cumpre as suas obrigações fiscais e, ao mesmo tempo, aproveita todas as
          deduções e benefícios a que tem direito.
        </p>

        <h2 id="o-que-e-irs">O Que é o IRS?</h2>

        <p>
          O IRS é um imposto progressivo — quanto mais se ganha, maior é a taxa aplicada sobre a
          parcela de rendimento que ultrapassa cada escalão. É regulado pelo Código do IRS (CIRS) e
          administrado pela Autoridade Tributária e Aduaneira (AT). Incide sobre os rendimentos
          obtidos durante o ano civil anterior: em 2025, declaram-se os rendimentos de 2024.
        </p>

        <p>
          Ao contrário de um imposto fixo, o sistema progressivo garante que contribuintes com
          rendimentos mais baixos pagam proporcionalmente menos. Cada euro de rendimento é tributado
          à taxa do escalão em que se insere, não à taxa máxima.
        </p>

        <h2 id="quem-deve-declarar">Quem Deve Declarar IRS?</h2>

        <p>
          A obrigação de declarar aplica-se a todos os residentes fiscais em Portugal que tenham
          obtido rendimentos, com poucas exceções. São obrigados a declarar:
        </p>

        <ul>
          <li>
            Trabalhadores por conta de outrem (Categoria A) com rendimento anual acima do mínimo de
            existência
          </li>
          <li>Trabalhadores independentes (Categoria B), independentemente do valor</li>
          <li>
            Quem obteve rendimentos de capitais (E), prediais (F), mais-valias (G) ou pensões (H)
          </li>
          <li>Não residentes com rendimentos obtidos em Portugal</li>
        </ul>

        <p>
          Mesmo que não seja obrigado, pode ser vantajoso entregar a declaração para obter reembolso
          de retenções na fonte que excedam o imposto efetivamente devido.
        </p>

        <h3>Prazos de Entrega</h3>

        <p>
          A declaração Modelo 3 do IRS é entregue anualmente entre{' '}
          <strong>1 de abril e 30 de junho</strong> do ano seguinte ao dos rendimentos. A declaração
          automática (IRS Automático) está disponível para casos simples desde meados de março. Os
          reembolsos são processados tipicamente em 15 a 30 dias após a entrega.
        </p>

        <h2 id="categorias-rendimento">Categorias de Rendimento</h2>

        <p>
          O CIRS organiza os rendimentos em seis categorias, cada uma com regras próprias de
          determinação do rendimento tributável:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Tipo de Rendimento</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>A</strong>
                </td>
                <td>Trabalho dependente</td>
                <td>
                  Salários, vencimentos, subsídios de férias e Natal, gratificações. Dedução
                  específica de €4.104 ou contribuições para a Segurança Social, se superiores.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>B</strong>
                </td>
                <td>Trabalho independente / empresarial</td>
                <td>
                  Rendimentos de atividade profissional ou empresarial. Regime simplificado
                  (coeficientes do Art. 31.º) ou contabilidade organizada.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>E</strong>
                </td>
                <td>Capitais</td>
                <td>
                  Juros, dividendos, seguros de capitalização. Tributação autónoma a 28% ou opção
                  pelo englobamento.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>F</strong>
                </td>
                <td>Prediais</td>
                <td>
                  Rendas de imóveis. Tributação autónoma a 28% ou englobamento. Dedução de despesas
                  de conservação e manutenção.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>G</strong>
                </td>
                <td>Incrementos patrimoniais</td>
                <td>
                  Mais-valias imobiliárias (50% tributada) e mobiliárias (ações, criptoativos).
                  Tributação autónoma a 28% ou englobamento.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>H</strong>
                </td>
                <td>Pensões</td>
                <td>
                  Pensões de reforma, invalidez, sobrevivência. Dedução específica de €4.104 ou
                  contribuições sociais, se superiores.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="escaloes-irs-2025">Escalões de IRS — Taxas 2025</h2>

        <p>
          Para rendimentos de 2024 (declarados em 2025), aplicam-se os seguintes escalões
          progressivos de IRS:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Rendimento Coletável</th>
                <th>Taxa Normal</th>
                <th>Taxa Média</th>
                <th>Parcela a Abater</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Até €7.703</td>
                <td>13,25%</td>
                <td>13,250%</td>
                <td>€0</td>
              </tr>
              <tr>
                <td>€7.703 – €11.623</td>
                <td>18%</td>
                <td>14,852%</td>
                <td>€365,89</td>
              </tr>
              <tr>
                <td>€11.623 – €16.472</td>
                <td>23%</td>
                <td>17,251%</td>
                <td>€947,04</td>
              </tr>
              <tr>
                <td>€16.472 – €21.321</td>
                <td>26%</td>
                <td>19,240%</td>
                <td>€1.441,14</td>
              </tr>
              <tr>
                <td>€21.321 – €27.146</td>
                <td>32,75%</td>
                <td>22,139%</td>
                <td>€2.880,24</td>
              </tr>
              <tr>
                <td>€27.146 – €39.791</td>
                <td>37%</td>
                <td>26,862%</td>
                <td>€4.034,17</td>
              </tr>
              <tr>
                <td>€39.791 – €51.997</td>
                <td>43,50%</td>
                <td>30,768%</td>
                <td>€6.620,43</td>
              </tr>
              <tr>
                <td>€51.997 – €81.199</td>
                <td>45%</td>
                <td>35,886%</td>
                <td>€7.400,21</td>
              </tr>
              <tr>
                <td>Mais de €81.199</td>
                <td>48%</td>
                <td>—</td>
                <td>€9.836,45</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Exemplo:</strong> Um contribuinte solteiro com rendimento coletável de €25.000
          paga 13,25% sobre os primeiros €7.703, 18% sobre a parcela seguinte, 23% sobre a seguinte,
          26% até €21.321, e 32,75% sobre os restantes €3.679. O imposto total é cerca de €5.265 —
          uma taxa efetiva de ~21%.
        </p>

        <h2 id="estado-civil">Estado Civil e Tributação</h2>

        <p>
          Os contribuintes casados ou em união de facto podem optar por tributação conjunta ou
          separada:
        </p>

        <ul>
          <li>
            <strong>Tributação separada:</strong> cada cônjuge declara os seus rendimentos
            individualmente e é tributado de forma independente.
          </li>
          <li>
            <strong>Tributação conjunta:</strong> os rendimentos do casal são somados e divididos
            por dois (quociente conjugal). O imposto é calculado sobre metade do rendimento total e
            depois multiplicado por dois. Pode ser vantajoso quando há grande disparidade de
            rendimentos entre os cônjuges.
          </li>
        </ul>

        <p>
          Para mais detalhes sobre quando cada opção compensa, consulte o nosso{' '}
          <Link href="/guia/conjunto-vs-separado" className="text-primary hover:underline">
            guia de tributação conjunta vs separada
          </Link>
          .
        </p>

        <h2 id="deducoes">Deduções à Coleta</h2>

        <p>
          Após o cálculo do imposto bruto, aplicam-se deduções que reduzem diretamente o valor a
          pagar. As principais deduções para 2025:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Dedução</th>
                <th>Percentagem</th>
                <th>Limite por Sujeito Passivo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Despesas gerais familiares</td>
                <td>35%</td>
                <td>€250</td>
              </tr>
              <tr>
                <td>Saúde</td>
                <td>15%</td>
                <td>€1.000</td>
              </tr>
              <tr>
                <td>Educação e formação</td>
                <td>30%</td>
                <td>€800</td>
              </tr>
              <tr>
                <td>Habitação (rendas)</td>
                <td>15%</td>
                <td>€502</td>
              </tr>
              <tr>
                <td>Habitação (juros de empréstimo)</td>
                <td>15%</td>
                <td>€296</td>
              </tr>
              <tr>
                <td>Lares / apoio domiciliário</td>
                <td>25%</td>
                <td>€403,75</td>
              </tr>
              <tr>
                <td>Exigência de fatura (IVA)</td>
                <td>15% do IVA</td>
                <td>€250</td>
              </tr>
              <tr>
                <td>PPR (Planos Poupança Reforma)</td>
                <td>20%</td>
                <td>€300–€400 (conforme idade)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Deduções por Dependentes</h3>

        <p>
          Cada dependente dá direito a uma dedução fixa de <strong>€600</strong> (ou €726 para
          crianças até 3 anos). Famílias monoparentais beneficiam de deduções majoradas. Os
          dependentes devem ter NIF e estar identificados na declaração.
        </p>

        <h2 id="retencao-na-fonte">Retenção na Fonte</h2>

        <p>
          A retenção na fonte é o mecanismo pelo qual o imposto é cobrado antecipadamente ao longo
          do ano. As entidades empregadoras aplicam tabelas de retenção aprovadas anualmente pelo
          Governo, descontando o IRS estimado diretamente do salário mensal.
        </p>

        <p>
          No momento da declaração anual, o imposto final é apurado. Se as retenções excederam o
          imposto efetivamente devido, o contribuinte recebe um <strong>reembolso</strong>. Caso
          contrário, deve pagar a diferença. Por isso, o reembolso não é um &ldquo;presente&rdquo; —
          é a devolução de imposto pago a mais durante o ano.
        </p>

        <h2 id="declaracao-modelo-3">A Declaração Modelo 3</h2>

        <p>
          A Modelo 3 é o formulário principal de declaração de IRS, submetido através do Portal das
          Finanças (portal.portaldasfinancas.gov.pt). É composta por:
        </p>

        <ul>
          <li>
            <strong>Rosto:</strong> identificação do(s) sujeito(s) passivo(s), estado civil,
            dependentes
          </li>
          <li>
            <strong>Anexo A:</strong> rendimentos de trabalho dependente e pensões
          </li>
          <li>
            <strong>Anexo B:</strong> rendimentos de trabalho independente (regime simplificado)
          </li>
          <li>
            <strong>Anexo E:</strong> rendimentos de capitais
          </li>
          <li>
            <strong>Anexo F:</strong> rendimentos prediais
          </li>
          <li>
            <strong>Anexo G:</strong> mais-valias e outros incrementos patrimoniais
          </li>
          <li>
            <strong>Anexo H:</strong> benefícios fiscais e deduções
          </li>
          <li>
            <strong>Anexo J:</strong> rendimentos obtidos no estrangeiro
          </li>
        </ul>

        <p>
          Desde 2017, a AT disponibiliza o IRS Automático para contribuintes com situações simples
          (apenas Cat. A e/ou H, sem rendimentos estrangeiros). Se a declaração pré-preenchida
          estiver correta, basta confirmar.
        </p>

        <h2 id="beneficios-fiscais">Benefícios Fiscais Especiais</h2>

        <p>
          Para além das deduções padrão, existem regimes fiscais especiais que podem reduzir
          significativamente o imposto:
        </p>

        <ul>
          <li>
            <strong>IRS Jovem</strong> — Isenção parcial para jovens até 35 anos nos primeiros 10
            anos de carreira após conclusão de estudos. Saiba mais no nosso{' '}
            <Link href="/guia/irs-jovem" className="text-primary hover:underline">
              guia sobre IRS Jovem
            </Link>
            .
          </li>
          <li>
            <strong>Residente Não Habitual (NHR)</strong> — Taxa fixa de 20% sobre rendimentos de
            trabalho de atividades de elevado valor acrescentado, com isenção em diversos
            rendimentos estrangeiros (regime encerrado para novas inscrições desde 2024, mas
            aplicável a quem já está inscrito).
          </li>
          <li>
            <strong>Incentivo Fiscal à Investigação Científica e Inovação (IFICI)</strong> — Novo
            regime que substituiu parcialmente o NHR para investigadores e profissionais
            qualificados.
          </li>
        </ul>

        <h2 id="dicas-otimizacao">Dicas de Otimização</h2>

        <ul>
          <li>Valide as suas despesas no e-Fatura antes de 25 de fevereiro</li>
          <li>Compare tributação conjunta e separada se for casado/a</li>
          <li>Considere contribuições para PPR para beneficiar da dedução</li>
          <li>Se é jovem, verifique se se qualifica para o IRS Jovem</li>
          <li>Peça fatura com NIF para maximizar a dedução de IVA</li>
          <li>
            Se tem rendimentos Cat. E, F ou G, simule o englobamento — pode ser mais favorável
          </li>
        </ul>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Descubra Quanto Pode Poupar</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e receba uma análise personalizada com comparação de
            cenários e sugestões de otimização.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2">
              Analisar o Meu IRS
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
