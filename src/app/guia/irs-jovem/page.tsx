import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'IRS Jovem 2025 — Guia Completo do Benefício Fiscal',
  description:
    'Tudo sobre o IRS Jovem em 2025: quem pode beneficiar, taxas de isenção (50% e 25%), limite de €28.737,50, como ativar na declaração e exemplos práticos de poupança.',
  openGraph: {
    title: 'IRS Jovem 2025 — Guia Completo do Benefício Fiscal',
    description:
      'Guia completo sobre o IRS Jovem: elegibilidade, taxas de isenção, limites e como ativar. Atualizado para 2025.',
    url: `${SITE_URL}/guia/irs-jovem`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/irs-jovem',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'IRS Jovem 2025 — Guia Completo do Benefício Fiscal',
  description:
    'Tudo sobre o IRS Jovem em 2025: elegibilidade, taxas de isenção, limites, ativação e exemplos práticos.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-01-15',
  dateModified: '2025-01-15',
  mainEntityOfPage: `${SITE_URL}/guia/irs-jovem`,
  inLanguage: 'pt-PT',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quem pode beneficiar do IRS Jovem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Jovens até 35 anos, nos primeiros 10 anos de obtenção de rendimentos de trabalho após a conclusão de um ciclo de estudos igual ou superior ao ensino secundário.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual é a percentagem de isenção do IRS Jovem em 2025?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nos primeiros 5 anos a isenção é de 50% do rendimento, e nos anos 6 a 10 é de 25%, até ao limite de 55 × IAS (€28.737,50 em 2025).',
      },
    },
    {
      '@type': 'Question',
      name: 'O IRS Jovem é automático?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não. O contribuinte deve indicar na declaração de IRS que pretende beneficiar do IRS Jovem, preenchendo os campos adequados no Anexo A (Quadro 4A).',
      },
    },
  ],
}

export default function IRSJovem() {
  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>IRS Jovem — Guia Completo 2025</h1>

        <p className="lead">
          O IRS Jovem é um benefício fiscal que permite aos jovens trabalhadores pagar
          significativamente menos imposto nos primeiros anos de carreira profissional. Com as
          regras atualizadas para 2025, a isenção pode representar uma poupança de milhares de euros
          por ano. Neste guia, explicamos tudo o que precisa de saber.
        </p>

        <h2 id="o-que-e">O Que é o IRS Jovem?</h2>

        <p>
          O IRS Jovem, previsto no Artigo 12.º-F do Código do IRS (CIRS), é um regime de isenção
          parcial de imposto sobre o rendimento de trabalho (categorias A e B) destinado a jovens
          que estejam nos primeiros anos de atividade profissional após a conclusão dos estudos.
        </p>

        <p>
          O objetivo do regime é aliviar a carga fiscal dos jovens na fase de entrada no mercado de
          trabalho, incentivando a permanência em Portugal e reduzindo o impacto financeiro da
          transição entre a vida académica e a vida profissional.
        </p>

        <h2 id="elegibilidade">Critérios de Elegibilidade</h2>

        <p>
          Para beneficiar do IRS Jovem em 2025, é necessário cumprir todos os seguintes requisitos:
        </p>

        <ol>
          <li>
            <strong>Idade:</strong> ter até <strong>35 anos</strong> (inclusive) no ano a que
            respeita a declaração.
          </li>
          <li>
            <strong>Habilitações:</strong> ter concluído, pelo menos, o ensino secundário (ou
            equivalente) — nível 3 do Quadro Nacional de Qualificações ou superior.
          </li>
          <li>
            <strong>Primeiros 10 anos de rendimentos:</strong> a isenção aplica-se nos primeiros 10
            anos em que o jovem obtém rendimentos de trabalho (categorias A ou B) após a conclusão
            do ciclo de estudos.
          </li>
          <li>
            <strong>Não ser dependente:</strong> o jovem não pode constar como dependente na
            declaração de outra pessoa.
          </li>
          <li>
            <strong>Rendimentos elegíveis:</strong> aplica-se apenas a rendimentos das categorias A
            (trabalho dependente) e B (trabalho independente).
          </li>
        </ol>

        <p>
          <strong>Nota importante:</strong> Ao contrário das versões anteriores do regime, a partir
          de 2025 já não é necessário que o rendimento coletável do jovem não exceda o limite do 4.º
          escalão de IRS. A isenção aplica-se até ao limite anual, independentemente do rendimento
          total.
        </p>

        <h2 id="taxas-isencao">Taxas de Isenção</h2>

        <p>
          A partir de 2025, o IRS Jovem aplica um modelo simplificado com duas fases de isenção:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Anos</th>
                <th>Isenção</th>
                <th>Tributação Efetiva</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.ª fase</td>
                <td>1.º ao 5.º ano</td>
                <td>50%</td>
                <td>Paga IRS sobre apenas 50% do rendimento</td>
              </tr>
              <tr>
                <td>2.ª fase</td>
                <td>6.º ao 10.º ano</td>
                <td>25%</td>
                <td>Paga IRS sobre 75% do rendimento</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Limite Anual de Isenção</h3>

        <p>
          A isenção está sujeita a um limite máximo anual de <strong>55 × IAS</strong> (Indexante
          dos Apoios Sociais). Com o IAS fixado em <strong>€522,50</strong> para 2025:
        </p>

        <p className="text-lg font-semibold text-center">
          Limite anual = 55 × €522,50 = <strong>€28.737,50</strong>
        </p>

        <p>
          Isto significa que, no máximo, €28.737,50 de rendimento bruto podem beneficiar da isenção
          em cada ano. Qualquer rendimento acima deste valor é tributado normalmente.
        </p>

        <h2 id="exemplo-pratico">Exemplo Prático</h2>

        <p>Vejamos um exemplo concreto para um jovem no 2.º ano de trabalho (isenção de 50%):</p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Sem IRS Jovem</th>
                <th>Com IRS Jovem</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Rendimento bruto Cat. A</strong>
                </td>
                <td>€25.000</td>
                <td>€25.000</td>
              </tr>
              <tr>
                <td>
                  <strong>Dedução específica</strong>
                </td>
                <td>−€4.104</td>
                <td>−€4.104</td>
              </tr>
              <tr>
                <td>
                  <strong>Rendimento após dedução</strong>
                </td>
                <td>€20.896</td>
                <td>€20.896</td>
              </tr>
              <tr>
                <td>
                  <strong>Isenção IRS Jovem (50%)</strong>
                </td>
                <td>—</td>
                <td>−€10.448</td>
              </tr>
              <tr>
                <td>
                  <strong>Rendimento coletável</strong>
                </td>
                <td>€20.896</td>
                <td>€10.448</td>
              </tr>
              <tr>
                <td>
                  <strong>Imposto (antes deduções à coleta)</strong>
                </td>
                <td>~€3.980</td>
                <td>~€1.457</td>
              </tr>
              <tr>
                <td className="text-primary font-semibold">
                  <strong>Poupança estimada</strong>
                </td>
                <td></td>
                <td className="text-primary font-semibold">
                  <strong>~€2.523/ano</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A poupança real varia conforme o rendimento, as deduções pessoais e o ano de benefício,
          mas para muitos jovens o IRS Jovem representa uma redução de <strong>30% a 60%</strong> no
          imposto a pagar.
        </p>

        <h2 id="como-ativar">Como Ativar o IRS Jovem na Declaração</h2>

        <p>
          O IRS Jovem <strong>não é automático</strong>. Para beneficiar, o contribuinte deve:
        </p>

        <ol>
          <li>Entregar a declaração Modelo 3 manualmente (não pode usar o IRS Automático).</li>
          <li>
            No <strong>Anexo A</strong>, Quadro 4A, assinalar que pretende beneficiar do Art. 12.º-F
            e indicar o ano de benefício (1.º, 2.º, 3.º, etc.).
          </li>
          <li>Indicar o ano de conclusão dos estudos e o nível de habilitações.</li>
          <li>A AT pode solicitar comprovativos — conserve o certificado de habilitações.</li>
        </ol>

        <p>
          <strong>Dica:</strong> Mesmo que tenha confirmado o IRS Automático, pode submeter uma
          declaração de substituição dentro do prazo para ativar o IRS Jovem.
        </p>

        <h2 id="perguntas-frequentes">Perguntas Frequentes</h2>

        <h3>Posso beneficiar se já trabalho há vários anos?</h3>

        <p>
          Sim, desde que esteja dentro dos primeiros 10 anos de obtenção de rendimentos de trabalho
          após a conclusão dos estudos e tenha até 35 anos. Se já usufruiu de anos anteriores no
          regime antigo, esses anos contam. Se nunca usufruiu, pode começar a beneficiar no ano
          correspondente à sua situação.
        </p>

        <h3>O IRS Jovem é compatível com a tributação conjunta?</h3>

        <p>
          Sim. Se estiver casado/a e optar pela tributação conjunta, a isenção do IRS Jovem
          aplica-se apenas ao rendimento do cônjuge elegível. O outro cônjuge é tributado
          normalmente.
        </p>

        <h3>Aplica-se a trabalhadores independentes?</h3>

        <p>
          Sim, os rendimentos da Categoria B (trabalho independente) também são elegíveis para o IRS
          Jovem, nas mesmas condições. A isenção aplica-se sobre o rendimento líquido determinado
          após aplicação do coeficiente do regime simplificado.
        </p>

        <h3>Posso beneficiar se conclui apenas o ensino secundário?</h3>

        <p>
          Sim. A partir de 2025, o requisito mínimo é a conclusão do ensino secundário (12.º ano ou
          equivalente). Não é necessário ter licenciatura ou grau superior.
        </p>

        <h3>E se mudar de emprego durante o ano?</h3>

        <p>
          A mudança de emprego não afeta o benefício. O IRS Jovem é aplicado na declaração anual,
          independentemente de quantos empregadores teve durante o ano. As retenções na fonte
          durante o ano podem não refletir o benefício — a regularização ocorre na liquidação final.
        </p>

        <h3>Posso reclamar anos anteriores em que não ativei o IRS Jovem?</h3>

        <p>
          Pode submeter declarações de substituição para os últimos 4 anos, desde que cumprisse os
          requisitos na altura. No entanto, as regras do regime podem ter sido diferentes (o modelo
          anterior tinha escalões e percentagens distintas).
        </p>

        <h2 id="erros-comuns">Erros Comuns a Evitar</h2>

        <ul>
          <li>
            <strong>Aceitar o IRS Automático</strong> — O IRS Automático não aplica o IRS Jovem. Se
            aceitar sem entregar a Modelo 3 manualmente, perde o benefício.
          </li>
          <li>
            <strong>Não indicar o ano correto de início</strong> — Contar o ano de início de
            trabalho a partir da data errada pode resultar em isenção incorreta.
          </li>
          <li>
            <strong>Esquecer de guardar comprovativos</strong> — A AT pode pedir prova das
            habilitações e do início de atividade. Guarde certificados e recibos.
          </li>
          <li>
            <strong>Confundir com isenção total</strong> — O IRS Jovem reduz o rendimento
            tributável, não elimina o imposto na totalidade.
          </li>
        </ul>

        <h2 id="evolucao-regime">Evolução do Regime</h2>

        <p>
          O IRS Jovem sofreu alterações significativas ao longo dos anos. Antes de 2025, o regime
          previa percentagens escalonadas mais baixas (30%, 20%, 10%) e aplicava-se apenas durante 5
          anos. A reforma de 2025 alargou o período para 10 anos e aumentou as percentagens de
          isenção, tornando o benefício substancialmente mais generoso.
        </p>

        <p>
          É fundamental aplicar as regras do ano correto: rendimentos de 2024 seguem as regras de
          2024; rendimentos de 2025 seguem as novas regras. O FiscalPT calcula automaticamente o
          regime aplicável a cada ano.
        </p>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Calcule a Sua Poupança com IRS Jovem</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Carregue a sua declaração de IRS e descubra automaticamente se é elegível para o IRS
            Jovem e quanto pode poupar.
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
