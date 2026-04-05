import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'NHR + Tributação Conjunta: O Maior Hack Fiscal (Não Intencional) em Portugal',
  description:
    'Quando um cônjuge NHR opta pela tributação conjunta com um cônjuge sem NHR, o quociente conjugal aplica-se apenas ao rendimento progressivo — reduzindo drasticamente o IRS do casal. Explicamos a matemática.',
  openGraph: {
    title: 'NHR + Tributação Conjunta: O Maior Hack Fiscal em Portugal',
    description:
      'Quociente conjugal + tributação autónoma NHR = poupança massiva. A matemática por trás da combinação mais poderosa do IRS português.',
    url: `${SITE_URL}/blog/nhr-tributacao-conjunta`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/blog/nhr-tributacao-conjunta',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'NHR + Tributação Conjunta: O Maior Hack Fiscal (Não Intencional) em Portugal',
  description:
    'Quando um cônjuge NHR opta pela tributação conjunta com um cônjuge sem NHR, o quociente conjugal aplica-se apenas ao rendimento progressivo — reduzindo drasticamente o IRS do casal.',
  author: { '@type': 'Person', name: 'Rui Moreira' },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-14',
  dateModified: '2025-07-14',
  mainEntityOfPage: `${SITE_URL}/blog/nhr-tributacao-conjunta`,
  inLanguage: 'pt-PT',
}

export default function NhrTributacaoConjunta() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>NHR + Tributação Conjunta: O Maior Hack Fiscal (Não Intencional) em Portugal</h1>

        <p className="lead text-muted-foreground">
          Por <strong>Rui Moreira</strong> · Julho 2025
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* The Hook                                                         */}
        {/* ---------------------------------------------------------------- */}

        <p>
          Se um dos membros do casal tem o estatuto de Residente Não Habitual (NHR) e o outro não, a
          tributação conjunta não é apenas uma opção — é provavelmente a maior otimização fiscal
          legal disponível em Portugal. E a parte mais surpreendente? Quase ninguém fala sobre isto.
        </p>

        <p>
          Não é um loophole obscuro. Não é evasão fiscal. É o resultado natural de como duas regras
          perfeitamente legítimas — a tributação autónoma do NHR (Art. 72 CIRS) e o quociente
          conjugal (Art. 59 CIRS) — interagem quando aplicadas ao mesmo agregado familiar. E o
          impacto pode ser de milhares de euros.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                     */}
        {/* ---------------------------------------------------------------- */}

        <h2>Como funciona — passo a passo</h2>

        <p>Para perceber porque é que esta combinação é tão poderosa, vejamos cada peça:</p>

        <h3>Peça 1: O NHR é tributação autónoma</h3>

        <p>
          O rendimento de Categoria A e B de um NHR é tributado a uma taxa fixa de 20% (Art. 72
          CIRS). Este imposto é <strong>autónomo</strong> — não entra nos escalões progressivos, não
          se mistura com o rendimento do cônjuge, não participa no quociente conjugal.
        </p>

        <p>
          Na prática, o rendimento do cônjuge NHR <em>desaparece</em> da equação progressiva. A AT
          calcula os 20% à parte e pronto.
        </p>

        <h3>Peça 2: O quociente conjugal divide por 2</h3>

        <p>Na tributação conjunta, o cálculo do IRS progressivo funciona assim:</p>

        <ol>
          <li>
            Soma-se o <strong>rendimento coletável progressivo</strong> de ambos os cônjuges
          </li>
          <li>Divide-se por 2 (quociente conjugal)</li>
          <li>Aplicam-se os escalões ao resultado</li>
          <li>Multiplica-se o imposto por 2</li>
        </ol>

        <p>
          Isto foi desenhado para casais em que ambos trabalham — a ideia é que o casal não seja
          penalizado por ter dois rendimentos assimétricos.
        </p>

        <h3>Peça 3: O que acontece quando se combinam</h3>

        <p>
          Aqui está o génio (acidental) da coisa. Quando o NHR é tributado autonomamente, o seu
          rendimento Cat A/B não entra no &ldquo;rendimento coletável progressivo&rdquo;. Mas o
          quociente conjugal <strong>continua a dividir por 2</strong>.
        </p>

        <p>Resultado:</p>

        <ul>
          <li>O cônjuge NHR contribui com €0 para o rendimento progressivo</li>
          <li>
            O cônjuge não-NHR contribui com o seu rendimento total (digamos, €50.000 coletável)
          </li>
          <li>
            O quociente divide por 2: €50.000 / 2 = <strong>€25.000</strong>
          </li>
          <li>Os escalões são aplicados a €25.000 em vez de €50.000</li>
          <li>O imposto resultante é multiplicado por 2</li>
        </ul>

        <p>
          Mas como os escalões são <strong>progressivos</strong> (taxas maiores para rendimentos
          maiores), aplicar escalões a €25.000 e multiplicar por 2 resulta em{' '}
          <strong>muito menos imposto</strong> do que aplicar escalões diretamente a €50.000.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Numerical example                                                */}
        {/* ---------------------------------------------------------------- */}

        <h2>A matemática: um exemplo concreto (2025)</h2>

        <p>
          Vejamos um casal em que Ana tem NHR e ganha €60.000 brutos (Cat A), e Bruno não tem NHR e
          também ganha €60.000 brutos (Cat A). Ambos têm um filho de 8 anos.
        </p>

        <h3>Cenário A: Tributação separada</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Ana (NHR)</th>
                <th>Bruno</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rendimento bruto Cat A</td>
                <td>€60.000</td>
                <td>€60.000</td>
              </tr>
              <tr>
                <td>Dedução específica</td>
                <td>€4.104</td>
                <td>€4.104</td>
              </tr>
              <tr>
                <td>Rendimento coletável progressivo</td>
                <td>
                  <strong>€0</strong> (NHR autónomo)
                </td>
                <td>€55.896</td>
              </tr>
              <tr>
                <td>Imposto NHR (20%)</td>
                <td>€12.000</td>
                <td>—</td>
              </tr>
              <tr>
                <td>IRS progressivo</td>
                <td>€0</td>
                <td>~€17.770</td>
              </tr>
              <tr>
                <td>Dedução dependentes (÷2)</td>
                <td>−€300</td>
                <td>−€300</td>
              </tr>
              <tr>
                <td>
                  <strong>IRS total</strong>
                </td>
                <td>
                  <strong>€12.000</strong>
                </td>
                <td>
                  <strong>~€17.470</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Total casal (separado): ~€29.470</strong>
        </p>

        <p>
          Repare: na tributação separada, a dedução por dependente é dividida por 2 — cada cônjuge
          deduz €300 em vez de €600.
        </p>

        <h3>Cenário B: Tributação conjunta</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Casal (conjunto)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rendimento progressivo combinado</td>
                <td>
                  €0 (Ana NHR) + €55.896 (Bruno) = <strong>€55.896</strong>
                </td>
              </tr>
              <tr>
                <td>Quociente conjugal (÷2)</td>
                <td>
                  <strong>€27.948</strong>
                </td>
              </tr>
              <tr>
                <td>IRS sobre €27.948</td>
                <td>~€5.738</td>
              </tr>
              <tr>
                <td>Multiplicar por 2</td>
                <td>~€11.476</td>
              </tr>
              <tr>
                <td>NHR Ana (autónomo)</td>
                <td>€12.000</td>
              </tr>
              <tr>
                <td>Dedução dependentes (total, sem dividir)</td>
                <td>−€600</td>
              </tr>
              <tr>
                <td>Deduções pessoais (ambos os cônjuges)</td>
                <td>Aplicam-se totalmente</td>
              </tr>
              <tr>
                <td>
                  <strong>IRS total</strong>
                </td>
                <td>
                  <strong>~€22.876</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Total casal (conjunto): ~€22.876</strong>
        </p>

        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
          Poupança com tributação conjunta: ~€6.594/ano
        </p>

        <p>
          Seis mil e quinhentos euros. Todos os anos. Completamente legal. Bastou escolher a opção
          certa no Portal das Finanças.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Three effects                                                    */}
        {/* ---------------------------------------------------------------- */}

        <h2>Os três efeitos que se acumulam</h2>

        <p>A poupança não vem de uma única coisa — são três efeitos a trabalhar em conjunto:</p>

        <h3>1. O quociente reduz efetivamente o escalão do não-NHR</h3>

        <p>
          O rendimento de Bruno (€55.896) é dividido por 2 no quociente, caindo para €27.948. Isto
          coloca grande parte do rendimento em escalões mais baixos. A taxa marginal máxima cai de
          34,9% (escalão 6) para 31,4% (escalão 5). Numa tributação progressiva, isto faz uma
          diferença enorme.
        </p>

        <h3>2. As deduções do NHR passam a contar</h3>

        <p>
          Na tributação separada, as deduções pessoais da Ana (saúde, educação, despesas gerais) são
          inúteis — ela paga 20% fixo via NHR e não tem coleta progressiva contra a qual deduzir.
          €250 de dedução geral? Desperdiçados. €1.000 de saúde? Desperdiçados.
        </p>

        <p>
          Na tributação conjunta, essas deduções aplicam-se contra a coleta progressiva do{' '}
          <strong>casal</strong> — que agora existe graças ao rendimento do Bruno. As deduções da
          Ana deixam de ser desperdício e passam a reduzir efetivamente o imposto do agregado.
        </p>

        <h3>3. Deduções de dependentes não são divididas por 2</h3>

        <p>
          Na tributação separada, cada dependente vale €600, mas é dividido entre os dois cônjuges —
          cada um deduz €300. Com 2 filhos, o casal deduz €600 + €600 = €1.200, mas cada cônjuge
          apenas €600.
        </p>

        <p>
          Na tributação conjunta, a dedução total (€600 × número de dependentes) aplica-se{' '}
          <strong>integralmente</strong> contra a coleta do casal, sem divisão. Com as deduções da
          Ana a funcionar e os dependentes a contar na totalidade, o efeito multiplica-se.
        </p>

        <p>
          O mesmo aplica-se a deduções de ascendentes que vivam com o agregado — na tributação
          separada seriam divididas, na conjunta aplicam-se por inteiro.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Why it's unintentional                                           */}
        {/* ---------------------------------------------------------------- */}

        <h2>Porque é que isto é &ldquo;não intencional&rdquo;?</h2>

        <p>
          O NHR foi criado em 2009 para atrair profissionais qualificados e reformados para
          Portugal. O quociente conjugal existe desde sempre para não penalizar casais com
          rendimentos assimétricos. Nenhuma das duas regras foi desenhada a pensar na outra.
        </p>

        <p>
          O Art. 72 CIRS diz que o rendimento NHR é tributado autonomamente. O Art. 59 CIRS diz que
          o rendimento coletável é dividido por 2 em tributação conjunta. Quando um cônjuge tem NHR,
          o seu rendimento Cat A/B é removido do progressivo (Art. 72), mas o quociente de 2
          mantém-se (Art. 59) — porque o quociente é definido pelo número de membros do casal, não
          pelo rendimento.
        </p>

        <p>
          Ninguém no legislador pensou: &ldquo;e se um cônjuge tiver tributação autónoma a 20%
          enquanto o outro está nos escalões?&rdquo; A interação simplesmente resulta das regras
          como estão escritas.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* When does it work                                                */}
        {/* ---------------------------------------------------------------- */}

        <h2>Quando é que esta estratégia funciona?</h2>

        <p>A vantagem é máxima quando:</p>

        <ul>
          <li>
            <strong>O cônjuge não-NHR tem rendimento médio-alto</strong> — quanto mais alto o
            rendimento, mais beneficia da redução de escalão via quociente
          </li>
          <li>
            <strong>O cônjuge NHR tem deduções pessoais significativas</strong> — despesas de saúde,
            educação, PPR que seriam desperdiçadas em separado
          </li>
          <li>
            <strong>Existem dependentes ou ascendentes</strong> — as deduções deixam de ser
            divididas por 2
          </li>
        </ul>

        <p>A vantagem é menor (ou pode até inverter-se) quando:</p>

        <ul>
          <li>
            O cônjuge não-NHR tem rendimento muito baixo (já está em escalões baixos, o quociente
            não ajuda muito)
          </li>
          <li>Não existem dependentes nem deduções significativas do NHR</li>
          <li>
            O NHR tem rendimentos de Cat E/F/G/H que entrariam no progressivo e aumentariam a base
          </li>
        </ul>

        <p>
          <strong>Nota importante:</strong> O NHR foi revogado para novas inscrições a partir de 1
          de janeiro de 2024. Quem já tinha o estatuto mantém-no até ao fim dos 10 anos, mas novos
          beneficiários estão sujeitos ao regime IFICI (Incentivo Fiscal à Investigação Científica e
          Inovação), que tem regras diferentes.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Is it legal?                                                     */}
        {/* ---------------------------------------------------------------- */}

        <h2>É legal?</h2>

        <p>
          <strong>Sim, completamente.</strong> Não há nenhuma norma anti-abuso que se aplique. A
          escolha entre tributação conjunta e separada é um direito dos contribuintes casados (Art.
          59 CIRS). O regime NHR aplica-se conforme a lei (Art. 72 e 81 CIRS). A interação entre os
          dois é o resultado natural do enquadramento legal.
        </p>

        <p>
          A AT (Autoridade Tributária) calcula isto exatamente da mesma maneira — a tributação
          autónoma do NHR é separada, e o quociente aplica-se ao rendimento progressivo restante.
          Não há zona cinzenta.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* How FiscalPT helps                                               */}
        {/* ---------------------------------------------------------------- */}

        <h2>Como o FiscalPT calcula isto automaticamente</h2>

        <p>
          O motor fiscal do FiscalPT implementa exatamente esta lógica. Quando introduz os dados do
          agregado com um cônjuge NHR:
        </p>

        <ol>
          <li>
            Identifica o rendimento NHR e calcula o imposto autónomo a 20% (sem misturar com os
            escalões)
          </li>
          <li>Remove esse rendimento da base progressiva antes de aplicar o quociente conjugal</li>
          <li>Aplica os escalões apenas ao rendimento do cônjuge não-NHR, dividido por 2</li>
          <li>Aplica todas as deduções (de ambos os cônjuges + dependentes) contra a coleta</li>
          <li>Compara automaticamente tributação conjunta vs separada</li>
          <li>Mostra a poupança exata, ao cêntimo</li>
        </ol>

        <p>
          Tudo isto com um motor determinístico — sem IA a inventar números, sem estimativas, sem
          &ldquo;pode ser que&rdquo;. A matemática é verificada contra as tabelas oficiais da AT com
          margem de erro inferior a €0,01.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* CTA                                                              */}
        {/* ---------------------------------------------------------------- */}

        <hr />

        <div className="not-prose rounded-xl bg-muted/50 p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">
            Quer saber quanto poupa com tributação conjunta?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Introduza os dados do seu agregado e veja instantaneamente a comparação entre tributação
            conjunta e separada — com todas as interações NHR calculadas automaticamente.
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
