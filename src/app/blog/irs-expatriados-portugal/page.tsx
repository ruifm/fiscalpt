import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'IRS para Expatriados — Guia para Quem se Mudou para Portugal',
  description:
    'Mudou-se para Portugal? Saiba quando se torna residente fiscal, como funciona o NHR, o que declarar no primeiro ano e os erros mais comuns.',
  openGraph: {
    title: 'IRS para Expatriados em Portugal — O Que Precisa de Saber',
    description:
      'Residência fiscal, NHR, primeiro ano de declaração, dupla tributação. Guia prático para quem se mudou para Portugal.',
    url: `${SITE_URL}/blog/irs-expatriados-portugal`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/blog/irs-expatriados-portugal',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'IRS para Expatriados — Guia para Quem se Mudou para Portugal',
  description:
    'Residência fiscal, NHR, primeiro ano de declaração e erros comuns para quem se muda para Portugal.',
  author: { '@type': 'Person', name: 'Rui Moreira' },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-15',
  dateModified: '2025-07-15',
  mainEntityOfPage: `${SITE_URL}/blog/irs-expatriados-portugal`,
  inLanguage: 'pt-PT',
}

export default function IrsExpatriadosPortugal() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Mudei-me para Portugal — E Agora, Como Declaro o IRS?</h1>

        <p className="lead text-muted-foreground">
          Por <strong>Rui Moreira</strong> · Julho 2025
        </p>

        <p>
          Todos os anos, milhares de pessoas mudam-se para Portugal — nómadas digitais, quadros
          internacionais de empresas, reformados europeus, emigrantes que regressam. Quase todos
          partilham a mesma dúvida: quando começo a pagar impostos em Portugal? E como?
        </p>

        <p>
          O sistema fiscal português para novos residentes não é particularmente complicado, mas tem
          armadilhas que podem custar dinheiro real. Este guia cobre o essencial.
        </p>

        <h2 id="residencia-fiscal">Quando Se Torna Residente Fiscal?</h2>

        <p>Torna-se residente fiscal em Portugal se cumprir um de dois critérios (Art. 16 CIRS):</p>

        <ol>
          <li>
            <strong>Permanência física:</strong> mais de <strong>183 dias</strong> em Portugal
            durante o ano civil (não precisam de ser consecutivos).
          </li>
          <li>
            <strong>Habitação permanente:</strong> em 31 de dezembro, ter uma habitação em Portugal
            em condições que sugiram intenção de a manter como residência habitual — mesmo que tenha
            estado menos de 183 dias.
          </li>
        </ol>

        <p>
          A residência fiscal é anual: ou é residente o ano inteiro, ou não é. Não há
          &ldquo;meio-ano residente&rdquo; em Portugal (ao contrário de outros países). Se cumpriu
          um dos critérios em 2025, é considerado residente fiscal em Portugal para todo o ano de
          2025.
        </p>

        <p>
          Isto tem uma consequência prática: se se mudou para Portugal em setembro e trabalhou em
          França de janeiro a agosto, Portugal tributa o rendimento do ano inteiro — incluindo o que
          ganhou em França.
        </p>

        <h2 id="primeiro-ano">O Primeiro Ano de Declaração</h2>

        <p>
          O ano em que se torna residente é o mais complexo. Precisa de declarar todos os
          rendimentos obtidos no ano — dentro e fora de Portugal — na declaração de IRS do ano
          seguinte (entre abril e junho).
        </p>

        <h3>O que declarar</h3>

        <ul>
          <li>
            <strong>Rendimentos obtidos em Portugal</strong> — Salários, honorários, rendas,
            dividendos. Entram nos anexos habituais (A, B, E, F, etc.).
          </li>
          <li>
            <strong>Rendimentos obtidos no estrangeiro</strong> — Entram no <strong>Anexo J</strong>
            . Inclui salários de empregadores estrangeiros, rendimentos de imóveis no estrangeiro,
            juros e dividendos de contas/investimentos fora de Portugal.
          </li>
          <li>
            <strong>Contas bancárias no estrangeiro</strong> — Devem ser declaradas no Anexo J
            (quadro 11), mesmo que não tenham gerado rendimento.
          </li>
        </ul>

        <h3>Crédito de imposto por dupla tributação</h3>

        <p>
          Se pagou imposto no país de origem sobre rendimentos que também são tributados em
          Portugal, pode deduzir esse imposto (total ou parcialmente) ao IRS português. O mecanismo
          é o <strong>crédito de imposto por dupla tributação</strong> (Art. 81 CIRS), que evita que
          pague imposto duas vezes sobre o mesmo rendimento.
        </p>

        <p>
          A dedução está limitada ao menor de dois valores: o imposto efetivamente pago no
          estrangeiro, ou a fração do IRS português correspondente a esse rendimento. Na prática, se
          a taxa do país de origem for inferior à taxa portuguesa, paga a diferença em Portugal; se
          for superior, perde o excesso.
        </p>

        <h2 id="nhr">NHR — Residente Não Habitual</h2>

        <p>
          O regime de Residente Não Habitual foi durante anos o grande atrativo fiscal de Portugal
          para novos residentes. Permitia uma <strong>taxa fixa de 20%</strong> sobre rendimentos de
          trabalho de &ldquo;atividades de elevado valor acrescentado&rdquo; (categorias A e B) e
          isenção ou taxa reduzida sobre certos rendimentos de fonte estrangeira.
        </p>

        <h3>Estado atual (2025)</h3>

        <p>
          O NHR clássico foi revogado para novas inscrições a partir de 2024. Quem obteve o estatuto
          antes dessa data continua a beneficiar durante os 10 anos de vigência. Um regime
          transitório (IFICI) foi criado para casos específicos, mas com condições mais restritivas.
        </p>

        <p>
          Se obteve o NHR antes da revogação, o seu rendimento de atividades de elevado valor
          acrescentado é tributado a 20% de forma autónoma — fora dos escalões progressivos. Na
          tributação conjunta, isto tem um efeito multiplicador: o rendimento NHR não entra no
          quociente conjugal, reduzindo a base tributável do cônjuge sem NHR.
        </p>

        <p>
          Para uma análise detalhada desta interação, consulte o nosso artigo sobre{' '}
          <Link href="/blog/nhr-tributacao-conjunta">NHR + Tributação Conjunta</Link>.
        </p>

        <h2 id="irs-jovem-regresso">IRS Jovem para Quem Regressa</h2>

        <p>
          Portugueses emigrados que regressam podem beneficiar do{' '}
          <strong>IRS Jovem (Art. 12.º-F CIRS)</strong>, desde que cumpram os requisitos: até 35
          anos, nos primeiros 10 anos de atividade profissional após conclusão dos estudos.
        </p>

        <p>
          Os anos de trabalho no estrangeiro contam para determinar em que ano de benefício se
          encontra. Se trabalhou 3 anos em Londres e regressa a Portugal, está no 4.º ano de IRS
          Jovem (isenção de 50% nos primeiros 5 anos, regras de 2025). Pode recuperar anos
          anteriores não reclamados via declaração de substituição.
        </p>

        <h2 id="erros-comuns">Erros Comuns</h2>

        <ul>
          <li>
            <strong>Não se registar como residente fiscal</strong> — A residência fiscal é
            obrigatória a partir do momento em que cumpre os critérios. Não comunicar à AT que se
            tornou residente não o isenta da obrigação de declarar.
          </li>
          <li>
            <strong>Perder o prazo do NHR</strong> — O pedido de inscrição no NHR devia ser
            apresentado até 31 de março do ano seguinte ao da mudança para Portugal. Quem perdeu o
            prazo ficou sem o benefício permanentemente (para o NHR clássico, já revogado).
          </li>
          <li>
            <strong>Esquecer o Anexo J</strong> — Mesmo que os rendimentos estrangeiros tenham sido
            tributados no país de origem, devem ser declarados em Portugal no Anexo J. A omissão
            pode resultar em penalizações.
          </li>
          <li>
            <strong>Não pedir crédito de imposto</strong> — Se pagou imposto no estrangeiro, tem
            direito a deduzi-lo ao IRS português. Mas precisa de o declarar e comprovar. Sem o
            pedido, paga imposto duas vezes.
          </li>
          <li>
            <strong>Assumir residência parcial</strong> — Portugal não tem split-year. Se é
            residente fiscal em 2025, todo o rendimento de 2025 é tributável em Portugal — mesmo o
            que ganhou antes de se mudar. A surpresa costuma ser desagradável para quem trabalhou em
            países com taxas mais altas e agora paga IRS progressivo sobre tudo.
          </li>
        </ul>

        <h2 id="checklist">Checklist para Novos Residentes</h2>

        <ol>
          <li>
            <strong>NIF português</strong> — Obter número de identificação fiscal na AT ou na Loja
            do Cidadão. Necessário para tudo: arrendar casa, abrir conta bancária, assinar contrato
            de trabalho.
          </li>
          <li>
            <strong>Morada fiscal</strong> — Atualizar a morada no Portal das Finanças para o
            endereço em Portugal.
          </li>
          <li>
            <strong>Segurança Social</strong> — Se trabalha por conta de outrem, o empregador trata
            da inscrição. Se é independente, deve inscrever-se por iniciativa própria.
          </li>
          <li>
            <strong>e-Fatura</strong> — Ativar no Portal das Finanças. Todas as faturas com o seu
            NIF alimentam as deduções automáticas.
          </li>
          <li>
            <strong>Guardar comprovativos</strong> — Certificados de imposto pago no estrangeiro,
            contrato de trabalho anterior, últimas declarações de impostos do país de origem.
            Precisará deles para o crédito de dupla tributação.
          </li>
        </ol>

        <h2 id="dupla-tributacao">Acordos de Dupla Tributação</h2>

        <p>
          Portugal tem acordos de dupla tributação (ADT) com dezenas de países, incluindo todos os
          membros da UE, EUA, Reino Unido, Brasil, China, Canadá e muitos outros. Estes acordos
          definem qual país tributa cada tipo de rendimento e garantem que não se paga imposto
          duplicado.
        </p>

        <p>
          A regra geral para rendimentos de trabalho dependente: o país onde o trabalho é exercido
          tributa em primeiro lugar, e o país de residência concede crédito pelo imposto pago. Mas
          há exceções — pensões, dividendos, royalties e mais-valias têm regras próprias em cada
          acordo.
        </p>

        <p>
          Se tem rendimentos significativos de fonte estrangeira, vale a pena verificar o ADT
          específico entre Portugal e o país em questão. Os textos completos estão disponíveis no{' '}
          <a
            href="https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/convencoes_evitar_dupla_tributacao/Pages/default.aspx"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portal das Finanças
          </a>
          .
        </p>

        {/* CTA */}
        <div className="not-prose rounded-xl bg-muted/50 p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">Analise a Sua Situação Fiscal em Portugal</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e veja automaticamente o impacto do NHR, créditos de
            dupla tributação e otimizações disponíveis para novos residentes.
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
