import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Tributação Conjunta vs Separada — Qual Compensa Mais?',
  description:
    'Descubra quando a tributação conjunta é mais vantajosa que a separada no IRS em Portugal. Exemplos práticos, impacto nas deduções e como alterar a opção.',
  openGraph: {
    title: 'Tributação Conjunta vs Separada — Qual Compensa Mais?',
    description:
      'Guia completo sobre tributação conjunta e separada no IRS: quando cada opção compensa, exemplos com números reais e como alterar.',
    url: `${SITE_URL}/guia/conjunto-vs-separado`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/conjunto-vs-separado',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Tributação Conjunta vs Separada — Qual Compensa Mais?',
  description:
    'Descubra quando a tributação conjunta é mais vantajosa que a separada no IRS em Portugal.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-01-15',
  dateModified: '2025-01-15',
  mainEntityOfPage: `${SITE_URL}/guia/conjunto-vs-separado`,
  inLanguage: 'pt-PT',
}

export default function ConjuntoVsSeparado() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Tributação Conjunta vs Separada</h1>

        <p className="lead">
          Os contribuintes casados ou em união de facto reconhecida têm de tomar uma decisão anual
          importante: tributação conjunta ou separada? A escolha errada pode custar centenas ou até
          milhares de euros. Neste guia, explicamos como funciona cada opção, quando cada uma
          compensa, e como simular o impacto na sua situação concreta.
        </p>

        <h2 id="como-funciona-conjunta">Como Funciona a Tributação Conjunta</h2>

        <p>
          Na tributação conjunta, os rendimentos de ambos os cônjuges (ou unidos de facto) são
          somados e divididos por dois — o chamado <strong>quociente conjugal</strong>. O imposto é
          calculado sobre essa metade e depois multiplicado por dois para obter o valor final.
        </p>

        <p>O mecanismo, passo a passo:</p>

        <ol>
          <li>Somar os rendimentos líquidos de ambos os cônjuges</li>
          <li>Dividir o total por 2 (quociente conjugal)</li>
          <li>Aplicar os escalões de IRS ao resultado</li>
          <li>Multiplicar o imposto obtido por 2</li>
          <li>Subtrair as deduções à coleta de ambos</li>
        </ol>

        <p>
          A lógica fiscal é que o casal constitui uma unidade económica e que a capacidade
          contributiva deve ser avaliada de forma conjunta. Na prática, este mecanismo
          &ldquo;puxa&rdquo; o rendimento mais elevado para escalões mais baixos.
        </p>

        <h2 id="como-funciona-separada">Como Funciona a Tributação Separada</h2>

        <p>
          Na tributação separada, cada cônjuge declara e é tributado de forma completamente
          independente, como se fosse solteiro. Cada um aplica os escalões ao seu próprio rendimento
          coletável e tem direito às suas deduções individuais.
        </p>

        <p>
          Os rendimentos dos dependentes (filhos) são divididos em partes iguais entre os dois
          cônjuges. As deduções dos dependentes são também repartidas: cada progenitor recebe metade
          da dedução de €600 por filho (€300 cada).
        </p>

        <h2 id="quando-conjunta-compensa">Quando a Tributação Conjunta Compensa</h2>

        <p>
          A tributação conjunta é geralmente mais vantajosa quando existe uma{' '}
          <strong>grande disparidade de rendimentos</strong> entre os cônjuges. Quanto maior a
          diferença, maior a poupança:
        </p>

        <ul>
          <li>Um cônjuge ganha significativamente mais que o outro</li>
          <li>Um dos cônjuges está desempregado, a estudar, ou é doméstico/a</li>
          <li>Um cônjuge tem rendimentos na Categoria H (pensões) e o outro na Cat. A</li>
          <li>Um cônjuge tem rendimento zero ou muito baixo</li>
        </ul>

        <p>
          Nestes cenários, o quociente conjugal permite que o rendimento elevado seja
          &ldquo;diluído&rdquo;, resultando numa taxa marginal mais baixa para a parcela superior.
        </p>

        <h2 id="quando-separada-compensa">Quando a Tributação Separada Compensa</h2>

        <p>A tributação separada tende a ser mais favorável quando:</p>

        <ul>
          <li>
            <strong>Rendimentos semelhantes</strong> — Se ambos os cônjuges ganham valores próximos,
            o quociente conjugal não produz efeito significativo, e a tributação separada pode até
            ser ligeiramente melhor.
          </li>
          <li>
            <strong>Regimes especiais</strong> — Se um dos cônjuges beneficia do IRS Jovem, NHR, ou
            de outro regime fiscal especial, a tributação separada permite isolar esse benefício sem
            afetar o outro cônjuge.
          </li>
          <li>
            <strong>Rendimentos de categorias diferentes</strong> — Se um cônjuge tem rendimentos
            maioritariamente de Cat. E, F ou G com tributação autónoma favorável, a separação evita
            o englobamento forçado.
          </li>
          <li>
            <strong>Limites de deduções</strong> — Algumas deduções têm limites por sujeito passivo.
            Em tributação separada, cada cônjuge tem o seu limite independente.
          </li>
        </ul>

        <h2 id="exemplo-comparativo">Exemplo Comparativo</h2>

        <p>
          Consideremos um casal em que a Ana ganha €40.000 brutos anuais e o Pedro ganha €12.000.
          Ambos são Cat. A. Vamos comparar as duas opções (valores aproximados, sem deduções à
          coleta para simplificar):
        </p>

        <h3>Cenário: Tributação Separada</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Ana</th>
                <th>Pedro</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Rendimento bruto</strong>
                </td>
                <td>€40.000</td>
                <td>€12.000</td>
                <td>€52.000</td>
              </tr>
              <tr>
                <td>
                  <strong>Dedução específica</strong>
                </td>
                <td>−€4.104</td>
                <td>−€4.104</td>
                <td></td>
              </tr>
              <tr>
                <td>
                  <strong>Rendimento coletável</strong>
                </td>
                <td>€35.896</td>
                <td>€7.896</td>
                <td></td>
              </tr>
              <tr>
                <td>
                  <strong>IRS apurado</strong>
                </td>
                <td>~€9.248</td>
                <td>~€1.046</td>
                <td>
                  <strong>~€10.294</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Cenário: Tributação Conjunta</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Casal (junto)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Rendimento bruto total</strong>
                </td>
                <td>€52.000</td>
              </tr>
              <tr>
                <td>
                  <strong>Deduções específicas</strong>
                </td>
                <td>−€8.208 (€4.104 × 2)</td>
              </tr>
              <tr>
                <td>
                  <strong>Rendimento líquido</strong>
                </td>
                <td>€43.792</td>
              </tr>
              <tr>
                <td>
                  <strong>Quociente conjugal (÷2)</strong>
                </td>
                <td>€21.896</td>
              </tr>
              <tr>
                <td>
                  <strong>IRS sobre metade</strong>
                </td>
                <td>~€4.191</td>
              </tr>
              <tr>
                <td>
                  <strong>IRS total (×2)</strong>
                </td>
                <td>
                  <strong>~€8.382</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="not-prose my-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-center font-semibold">
            Poupança com tributação conjunta:{' '}
            <span className="text-primary text-lg">~€1.912/ano</span>
          </p>
        </div>

        <p>
          Neste exemplo, a Ana — com rendimento elevado — pagaria uma taxa marginal de 37% em
          tributação separada. Com a tributação conjunta, o rendimento médio do casal cai para
          ~€22.000 por pessoa, reduzindo a taxa marginal para 32,75%.
        </p>

        <h3>E se os rendimentos fossem iguais?</h3>

        <p>Se a Ana e o Pedro ganhassem ambos €26.000 brutos (o mesmo total de €52.000):</p>

        <ul>
          <li>
            <strong>Separada:</strong> Cada um teria rendimento coletável de €21.896 → IRS total
            ~€8.382
          </li>
          <li>
            <strong>Conjunta:</strong> O quociente daria exatamente o mesmo valor → IRS total
            ~€8.382
          </li>
        </ul>

        <p>
          Quando os rendimentos são idênticos, a tributação conjunta não gera poupança — o quociente
          conjugal não altera nada. Por isso, nestes casos, a separada é preferível (ou indiferente)
          e mais simples.
        </p>

        <h2 id="impacto-deducoes">Impacto nas Deduções</h2>

        <p>A escolha entre tributação conjunta e separada afeta os limites das deduções:</p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Dedução</th>
                <th>Separada (por pessoa)</th>
                <th>Conjunta (casal)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Despesas gerais familiares</td>
                <td>€250</td>
                <td>€500 (€250 × 2)</td>
              </tr>
              <tr>
                <td>Saúde</td>
                <td>€1.000</td>
                <td>€2.000 (€1.000 × 2)</td>
              </tr>
              <tr>
                <td>Educação</td>
                <td>€800</td>
                <td>€1.600 (€800 × 2)</td>
              </tr>
              <tr>
                <td>Habitação (rendas)</td>
                <td>€502</td>
                <td>€1.004 (€502 × 2)</td>
              </tr>
              <tr>
                <td>Dependentes</td>
                <td>€300 por filho (metade)</td>
                <td>€600 por filho (total)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Em regra, os limites de deduções duplicam na tributação conjunta. Contudo, se um dos
          cônjuges não tem despesas suficientes para atingir o limite, pode haver desperdício. Na
          tributação separada, cada um usa apenas as suas despesas reais.
        </p>

        <h2 id="regimes-especiais">Interação com Regimes Especiais</h2>

        <p>
          A escolha do modo de tributação interage de forma importante com regimes fiscais
          especiais:
        </p>

        <ul>
          <li>
            <strong>IRS Jovem:</strong> Se um cônjuge tem direito ao{' '}
            <Link href="/guia/irs-jovem" className="text-primary hover:underline">
              IRS Jovem
            </Link>
            , a tributação conjunta pode diluir o benefício. Simule ambos os cenários.
          </li>
          <li>
            <strong>NHR / IFICI:</strong> Cônjuges com regime de Residente Não Habitual ou IFICI
            normalmente beneficiam mais da tributação separada, porque a taxa fixa de 20% não se
            combina favoravelmente com o rendimento do outro cônjuge.
          </li>
          <li>
            <strong>Categoria B:</strong> Se um dos cônjuges é trabalhador independente com
            rendimentos variáveis, a tributação separada isola o risco fiscal de cada um.
          </li>
        </ul>

        <h2 id="como-alterar">Como Alterar a Opção de Tributação</h2>

        <p>
          A opção entre tributação conjunta e separada é exercida anualmente no momento da entrega
          da declaração de IRS:
        </p>

        <ol>
          <li>Aceda ao Portal das Finanças e inicie a entrega da Modelo 3.</li>
          <li>No Rosto da declaração (Quadro 5A), selecione a opção de tributação desejada.</li>
          <li>
            Se já entregou e quer mudar, submeta uma <strong>declaração de substituição</strong>{' '}
            dentro do prazo legal (até 30 de junho, ou fora do prazo com possíveis penalizações).
          </li>
        </ol>

        <p>
          <strong>Importante:</strong> Em caso de união de facto, para exercer a tributação conjunta
          é necessário que a união de facto esteja registada há mais de dois anos e que ambos tenham
          o mesmo domicílio fiscal há pelo menos dois anos.
        </p>

        <h2 id="regra-pratica">Regra Prática</h2>

        <p>Uma regra empírica simples para decidir:</p>

        <ul>
          <li>
            <strong>Diferença de rendimentos &gt; 40%:</strong> a tributação conjunta provavelmente
            compensa. Quanto maior a diferença, maior a poupança.
          </li>
          <li>
            <strong>Diferença de rendimentos &lt; 20%:</strong> a tributação separada é
            provavelmente igual ou melhor. Menos complicação, mesmo resultado.
          </li>
          <li>
            <strong>Zona cinzenta (20-40%):</strong> depende das deduções, regimes especiais e
            categorias de rendimento. Nestes casos, a simulação é indispensável.
          </li>
        </ul>

        <p>
          A melhor abordagem é sempre <strong>simular ambos os cenários</strong> com os valores
          reais. É exatamente para isso que o FiscalPT existe.
        </p>

        <h2 id="unioes-facto">Uniões de Facto</h2>

        <p>
          As uniões de facto reconhecidas têm acesso à tributação conjunta nas mesmas condições que
          os casais, desde que:
        </p>

        <ul>
          <li>A união de facto esteja registada há mais de 2 anos</li>
          <li>Ambos os membros tenham o mesmo domicílio fiscal há pelo menos 2 anos</li>
          <li>Nenhum dos membros esteja casado com outra pessoa</li>
        </ul>

        <p>
          Se estes requisitos não forem cumpridos, cada membro do casal é tributado como solteiro.
        </p>

        <h2 id="resumo">Resumo</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Fator</th>
                <th>Favorece Conjunta</th>
                <th>Favorece Separada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rendimentos muito diferentes</td>
                <td>✅</td>
                <td></td>
              </tr>
              <tr>
                <td>Rendimentos semelhantes</td>
                <td></td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Um cônjuge sem rendimentos</td>
                <td>✅</td>
                <td></td>
              </tr>
              <tr>
                <td>IRS Jovem / NHR num cônjuge</td>
                <td></td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Simplicidade administrativa</td>
                <td></td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Maximizar deduções combinadas</td>
                <td>✅</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Compare Conjunta vs Separada Automaticamente</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue as declarações de ambos os cônjuges e o FiscalPT calcula qual opção resulta em
            menos imposto, com diferença ao cêntimo.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2">
              Comparar Cenários
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
