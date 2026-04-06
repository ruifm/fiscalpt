import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Recibos Verdes e Categoria B — Guia Fiscal Completo 2025',
  description:
    'Guia prático sobre o regime simplificado de Categoria B: coeficientes Art. 31, despesas documentadas, Segurança Social, retenção na fonte e erros comuns.',
  openGraph: {
    title: 'Recibos Verdes e Categoria B — Guia Fiscal Completo 2025',
    description:
      'Coeficientes do regime simplificado, despesas documentadas (Art. 31 nº 13), Segurança Social e como otimizar o IRS como trabalhador independente.',
    url: `${SITE_URL}/guia/recibos-verdes`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/recibos-verdes',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Recibos Verdes e Categoria B — Guia Fiscal Completo 2025',
  description:
    'Guia prático sobre o regime simplificado de Categoria B: coeficientes, despesas documentadas, Segurança Social e otimização fiscal.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-15',
  dateModified: '2025-07-15',
  mainEntityOfPage: `${SITE_URL}/guia/recibos-verdes`,
  inLanguage: 'pt-PT',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Qual é o coeficiente do regime simplificado para prestação de serviços?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O coeficiente é 0,75 — o que significa que 75% do rendimento bruto é considerado rendimento tributável. Os restantes 25% são uma dedução automática para despesas presumidas.',
      },
    },
    {
      '@type': 'Question',
      name: 'O que acontece se as minhas despesas documentadas forem inferiores a 15% da faturação?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Se as despesas afetas à atividade forem inferiores a 15% do rendimento bruto, a diferença entre 15% e o valor real das despesas é adicionada ao rendimento tributável (acréscimo do Art. 31 nº 13 CIRS).',
      },
    },
    {
      '@type': 'Question',
      name: 'Quanto pago de Segurança Social como trabalhador independente?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A base de incidência é 70% do rendimento relevante, com taxa de 21,4%. Na prática, paga cerca de 15% do rendimento bruto — ou cerca de 11,2% nos primeiros 12 meses com a redução de 75%.',
      },
    },
  ],
}

export default function RecibosVerdes() {
  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Recibos Verdes e Categoria B — Guia Fiscal 2025</h1>

        <p className="lead">
          Quem trabalha por conta própria em Portugal — freelancers, consultores, profissionais
          liberais — enfrenta um sistema fiscal com regras próprias. Coeficientes, despesas
          documentadas, Segurança Social trimestral, retenção na fonte. Este guia explica cada peça
          para que saiba exatamente quanto vai pagar e como evitar surpresas.
        </p>

        <h2 id="regime-simplificado">O Regime Simplificado</h2>

        <p>
          A maioria dos trabalhadores independentes em Portugal está enquadrada no{' '}
          <strong>regime simplificado</strong> de Categoria B. Em vez de contabilizar receitas e
          despesas individualmente (como no regime de contabilidade organizada), o regime
          simplificado presume um nível de despesas automático através de coeficientes.
        </p>

        <p>
          O princípio é simples: o Estado aplica um coeficiente ao rendimento bruto para determinar
          a parcela tributável. O resto é considerado despesa presumida e não é tributado.
        </p>

        <h2 id="coeficientes">Coeficientes do Art. 31 CIRS</h2>

        <p>
          O coeficiente depende do tipo de rendimento. Para a grande maioria dos freelancers e
          profissionais liberais (código 403 — prestação de serviços), o coeficiente é{' '}
          <strong>0,75</strong>:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo de Rendimento</th>
                <th>Coeficiente</th>
                <th>Parcela tributável</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>403</td>
                <td>Prestação de serviços</td>
                <td>0,75</td>
                <td>75% do bruto</td>
              </tr>
              <tr>
                <td>401/402</td>
                <td>Venda de mercadorias e produtos</td>
                <td>0,15</td>
                <td>15% do bruto</td>
              </tr>
              <tr>
                <td>407</td>
                <td>Hotelaria e restauração</td>
                <td>0,15</td>
                <td>15% do bruto</td>
              </tr>
              <tr>
                <td>405</td>
                <td>Propriedade intelectual (não englobada)</td>
                <td>0,35</td>
                <td>35% do bruto</td>
              </tr>
              <tr>
                <td>404</td>
                <td>Propriedade intelectual (englobada)</td>
                <td>0,95</td>
                <td>95% do bruto</td>
              </tr>
              <tr>
                <td>406</td>
                <td>Subsídios à exploração</td>
                <td>0,10</td>
                <td>10% do bruto</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Exemplo: prestação de serviços</h3>

        <p>
          Um consultor com faturação bruta de <strong>€40.000</strong> no ano:
        </p>

        <ul>
          <li>
            Rendimento tributável = €40.000 × 0,75 = <strong>€30.000</strong>
          </li>
          <li>
            A dedução automática (os 25% restantes) = <strong>€10.000</strong> — o Estado presume
            que gastou isto para exercer a atividade
          </li>
        </ul>

        <p>
          Os €30.000 tributáveis entram depois nos escalões progressivos de IRS, tal como qualquer
          outro rendimento.
        </p>

        <h2 id="despesas-documentadas">A Armadilha das Despesas (Art. 31 nº 13)</h2>

        <p>
          O regime simplificado dá uma dedução automática de 25% — mas o Estado espera que consiga
          justificar pelo menos <strong>15% do rendimento bruto</strong> em despesas reais afetas à
          atividade. Se não o fizer, a diferença é adicionada ao rendimento tributável.
        </p>

        <p>
          É o chamado <strong>acréscimo do Art. 31 nº 13</strong>.
        </p>

        <h3>Como funciona na prática</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Sem acréscimo</th>
                <th>Com acréscimo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Faturação bruta</strong>
                </td>
                <td>€40.000</td>
                <td>€40.000</td>
              </tr>
              <tr>
                <td>
                  <strong>15% exigido</strong>
                </td>
                <td>€6.000</td>
                <td>€6.000</td>
              </tr>
              <tr>
                <td>
                  <strong>Despesas documentadas</strong>
                </td>
                <td>€7.000 ✓</td>
                <td>€2.000 ✗</td>
              </tr>
              <tr>
                <td>
                  <strong>Acréscimo</strong>
                </td>
                <td>€0</td>
                <td>€4.000 (€6.000 − €2.000)</td>
              </tr>
              <tr>
                <td>
                  <strong>Rendimento tributável</strong>
                </td>
                <td>€30.000</td>
                <td>€34.000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A diferença de €4.000 no rendimento tributável pode representar cerca de{' '}
          <strong>€1.200 a €1.800</strong> em imposto adicional, dependendo do escalão.
        </p>

        <h3>Que despesas contam?</h3>

        <p>As despesas aceites incluem:</p>

        <ul>
          <li>
            <strong>Despesas com pessoal</strong> — se tiver empregados ou subcontratantes
          </li>
          <li>
            <strong>Rendas de escritório</strong> — ou parte proporcional da renda de casa, se
            afetada à atividade
          </li>
          <li>
            <strong>VPT de imóveis</strong> afetos à atividade (valor patrimonial tributário)
          </li>
          <li>
            <strong>Aquisição de bens e serviços</strong> — equipamento informático, software,
            material de escritório, deslocações profissionais, comunicações
          </li>
        </ul>

        <p>
          Para validar, consulte as suas despesas no Portal das Finanças em{' '}
          <em>IRS → Consultar Despesas Afetas à Atividade</em>. O total deve igualar ou ultrapassar
          15% da faturação.
        </p>

        <h2 id="atividade-nova">Redução para Início de Atividade (Art. 31 nº 10)</h2>

        <p>
          Quem abre atividade pela primeira vez (ou após 5+ anos de inatividade) beneficia de uma
          redução nos dois primeiros anos completos:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Fator</th>
                <th>Efeito prático</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.º ano completo</td>
                <td>50%</td>
                <td>Só metade do rendimento simplificado é tributado</td>
              </tr>
              <tr>
                <td>2.º ano completo</td>
                <td>75%</td>
                <td>Três quartos do rendimento simplificado é tributado</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Para um consultor com €40.000 brutos no primeiro ano completo: rendimento tributável =
          €40.000 × 0,75 × 0,50 = <strong>€15.000</strong> (em vez de €30.000). Uma diferença
          substancial na fatura fiscal.
        </p>

        <h2 id="seguranca-social">Segurança Social</h2>

        <p>
          A Segurança Social para trabalhadores independentes funciona de forma diferente dos
          trabalhadores por conta de outrem. Não há desconto automático mensal — o contribuinte faz
          declarações trimestrais e paga com base no rendimento do trimestre anterior.
        </p>

        <h3>Cálculo da contribuição</h3>

        <ul>
          <li>
            <strong>Base de incidência:</strong> 70% do rendimento relevante (a faturação
            trimestral)
          </li>
          <li>
            <strong>Taxa contributiva:</strong> 21,4%
          </li>
          <li>
            <strong>Taxa efetiva:</strong> 70% × 21,4% ≈ <strong>15,0%</strong> do rendimento bruto
          </li>
          <li>
            <strong>Redução nos primeiros 12 meses:</strong> contribuição reduzida a 75% → taxa
            efetiva ≈ <strong>11,2%</strong>
          </li>
        </ul>

        <h3>Exemplo anual</h3>

        <p>
          Faturação de €40.000 (após o 1.º ano): contribuição anual ≈ €40.000 × 15,0% ={' '}
          <strong>€5.980</strong>.
        </p>

        <p>
          Compare com um trabalhador por conta de outrem com o mesmo bruto: 11% ={' '}
          <strong>€4.400</strong>. A diferença é um custo real de ser independente que muita gente
          subestima ao passar de recibo verde.
        </p>

        <h3>Isenção no primeiro ano</h3>

        <p>
          Quem abre atividade pela primeira vez está isento de contribuições para a Segurança Social
          durante os primeiros 12 meses. Após esse período, a obrigação de declaração trimestral
          entra em vigor.
        </p>

        <h2 id="retencao-na-fonte">Retenção na Fonte</h2>

        <p>
          Quando um trabalhador independente passa recibo verde a uma entidade com contabilidade
          organizada (empresa), é obrigado a reter IRS na fonte. A taxa de retenção para prestação
          de serviços é tipicamente <strong>25%</strong> (ou 11,5% para atos isolados de valor
          inferior).
        </p>

        <p>
          A retenção é um adiantamento ao Estado — não é o imposto final. Na declaração de IRS, a
          retenção é descontada ao imposto apurado. Se reteve a mais, recebe reembolso; se reteve a
          menos, paga a diferença.
        </p>

        <p>
          Trabalhadores independentes com faturação inferior a €14.500 podem pedir dispensa de
          retenção na fonte (Art. 101-B nº 1 CIRS).
        </p>

        <h2 id="irs-jovem-cat-b">IRS Jovem e Categoria B</h2>

        <p>
          O IRS Jovem (Art. 12.º-F CIRS) aplica-se também aos rendimentos de Categoria B. A isenção
          (50% nos primeiros 5 anos, 25% nos anos 6 a 10) incide sobre o rendimento líquido
          determinado após aplicação do coeficiente simplificado.
        </p>

        <p>
          Na prática, isto significa que o cálculo é: rendimento bruto → × coeficiente → − isenção
          IRS Jovem → escalões progressivos. Uma poupança que se acumula por cima da já favorável
          dedução automática do regime simplificado.
        </p>

        <h2 id="exemplo-completo">Exemplo Completo — Consultor, €40.000 anuais</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Rubrica</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Faturação bruta</td>
                <td>€40.000</td>
              </tr>
              <tr>
                <td>Coeficiente (serviços, 0,75)</td>
                <td>×0,75</td>
              </tr>
              <tr>
                <td>Rendimento tributável</td>
                <td>€30.000</td>
              </tr>
              <tr>
                <td>IRS (escalões 2025, solteiro, sem deduções)</td>
                <td>~€5.300</td>
              </tr>
              <tr>
                <td>Segurança Social (70% × 21,4%)</td>
                <td>~€5.980</td>
              </tr>
              <tr>
                <td>
                  <strong>Carga fiscal total (IRS + SS)</strong>
                </td>
                <td>
                  <strong>~€11.280</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Taxa efetiva sobre o bruto</strong>
                </td>
                <td>
                  <strong>~28,2%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Quase 30% do rendimento bruto vai para impostos e contribuições. Com deduções pessoais
          (saúde, educação, dependentes), o valor efetivo desce — mas o ponto de partida é este.
        </p>

        <h2 id="erros-comuns">Erros Comuns a Evitar</h2>

        <ul>
          <li>
            <strong>Ignorar o limite de 15% em despesas</strong> — Quem tem poucas despesas
            profissionais paga mais do que devia por causa do acréscimo do Art. 31 nº 13. Verifique
            as despesas no Portal das Finanças e considere afetar parte da renda de casa à
            atividade.
          </li>
          <li>
            <strong>Esquecer a Segurança Social</strong> — A SS para independentes não é um valor
            fixo. Aumenta com a faturação. Quem tem um bom ano sem provisionar fica com uma conta
            pesada no trimestre seguinte.
          </li>
          <li>
            <strong>Não pedir dispensa de retenção</strong> — Se fatura menos de €14.500, pode
            evitar o adiantamento de 25% e melhorar o cash flow ao longo do ano.
          </li>
          <li>
            <strong>Ignorar a redução de início de atividade</strong> — Nos dois primeiros anos, o
            rendimento tributável pode ser 50% ou 75% do normal. É uma poupança significativa que
            exige apenas que a atividade tenha sido aberta pela primeira vez (ou reaberta após 5+
            anos).
          </li>
          <li>
            <strong>Não considerar o IRS Jovem</strong> — Muitos freelancers jovens não sabem que o
            benefício se aplica a rendimentos de Categoria B. A combinação do coeficiente
            simplificado com a isenção do IRS Jovem pode reduzir a taxa efetiva para metade.
          </li>
        </ul>

        <h2 id="perguntas-frequentes">Perguntas Frequentes</h2>

        <h3>Qual o limite de faturação para o regime simplificado?</h3>

        <p>
          O regime simplificado aplica-se a rendimentos anuais de Categoria B até €200.000. Acima
          desse valor, é obrigatório passar para contabilidade organizada.
        </p>

        <h3>Posso ter rendimentos de Categoria A e B em simultâneo?</h3>

        <p>
          Sim. Muitas pessoas trabalham por conta de outrem e passam recibos verdes como atividade
          secundária. Os rendimentos de cada categoria são calculados separadamente (dedução
          específica para Cat A, coeficiente simplificado para Cat B) e depois somados para
          determinação do rendimento coletável total.
        </p>

        <h3>Compensa mais o regime simplificado ou a contabilidade organizada?</h3>

        <p>
          Depende das despesas reais. Se as suas despesas de atividade excedem 25% do rendimento
          bruto, a contabilidade organizada permite deduzir mais. Se são inferiores a 25%, o regime
          simplificado é mais vantajoso. Regra prática: margens de lucro acima de 75% favorecem o
          regime simplificado.
        </p>

        <h3>Os recibos verdes para clientes estrangeiros também contam?</h3>

        <p>
          Sim. Rendimentos de Categoria B faturados a clientes no estrangeiro são declarados
          normalmente em Portugal se for residente fiscal português. A retenção na fonte pode não se
          aplicar (depende se o cliente tem ou não sede em território nacional), mas o rendimento
          entra na declaração.
        </p>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Calcule o Seu IRS como Independente</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e descubra automaticamente o impacto do regime
            simplificado, incluindo o acréscimo do Art. 31 e possíveis otimizações.
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
