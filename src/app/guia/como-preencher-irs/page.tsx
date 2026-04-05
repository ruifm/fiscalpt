import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Como Preencher o IRS 2025 — Guia Passo a Passo Completo',
  description:
    'Guia completo para preencher a declaração de IRS 2025: documentos necessários, prazos, Modelo 3 passo a passo, erros comuns e dicas para maximizar o reembolso.',
  openGraph: {
    title: 'Como Preencher o IRS 2025 — Guia Passo a Passo Completo',
    description:
      'Guia completo para preencher a declaração de IRS 2025: documentos necessários, prazos, Modelo 3 e dicas para maximizar o reembolso.',
    url: `${SITE_URL}/guia/como-preencher-irs`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/guia/como-preencher-irs',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Como Preencher a Declaração de IRS — Guia Passo a Passo 2025',
  description:
    'Guia completo para preencher a declaração de IRS 2025: documentos necessários, prazos, Modelo 3 passo a passo, erros comuns e dicas para maximizar o reembolso.',
  author: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-04-05',
  dateModified: '2025-04-05',
  mainEntityOfPage: `${SITE_URL}/guia/como-preencher-irs`,
  inLanguage: 'pt-PT',
}

export default function ComoPreencherIRS() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Como Preencher a Declaração de IRS — Guia Passo a Passo 2025</h1>

        <p className="lead">
          Todos os anos, milhões de portugueses entregam a declaração de IRS sem saber se estão a
          deixar dinheiro na mesa. A verdade é que a maioria das pessoas aceita o IRS Automático ou
          preenche o Modelo 3 à pressa — e perde centenas de euros em deduções, regimes e
          otimizações que nem sabia que existiam. Este guia mostra-lhe como preencher a declaração
          de forma correta e como tirar o máximo partido do sistema.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="antes-de-comecar">Antes de Começar — Documentos Necessários</h2>

        <p>
          Antes de iniciar o preenchimento da sua declaração, reúna toda a informação necessária.
          Ter tudo preparado evita erros e esquecimentos que podem custar-lhe dinheiro.
        </p>

        <h3>Dados pessoais</h3>

        <ul>
          <li>
            <strong>NIF</strong> (Número de Identificação Fiscal) de todos os sujeitos passivos —
            titular, cônjuge (se aplicável) e dependentes
          </li>
          <li>
            <strong>Senha de acesso ao Portal das Finanças</strong> — se não tem, pode solicitar
            online em <em>portaldasfinancas.gov.pt</em> ou presencialmente num serviço de finanças
          </li>
          <li>
            <strong>IBAN</strong> — para receber o reembolso por transferência bancária (mais
            rápido)
          </li>
        </ul>

        <h3>Documentos de rendimento</h3>

        <ul>
          <li>
            <strong>Declaração de rendimentos do empregador</strong> — documento emitido pela
            entidade patronal com o resumo anual de salários, retenções na fonte e contribuições
            para a Segurança Social. Deve estar disponível até 20 de janeiro.
          </li>
          <li>
            <strong>Recibos verdes / faturação</strong> — se tem atividade independente (Categoria
            B), os seus rendimentos estão registados no Portal das Finanças
          </li>
          <li>
            <strong>Declarações de rendimentos de capitais</strong> — extratos bancários com juros,
            dividendos ou rendimentos de investimentos (Categoria E)
          </li>
          <li>
            <strong>Recibos de rendas</strong> — se é proprietário com rendimentos prediais
            (Categoria F)
          </li>
          <li>
            <strong>Documentação de mais-valias</strong> — escrituras, comprovativos de venda de
            imóveis ou ativos financeiros (Categoria G)
          </li>
        </ul>

        <h3>Informação sobre deduções</h3>

        <ul>
          <li>
            <strong>e-Fatura validada</strong> — confirme que todas as suas faturas estão
            corretamente classificadas em <em>efatura.portaldasfinancas.gov.pt</em> até 25 de
            fevereiro
          </li>
          <li>
            <strong>Recibos de despesas de saúde</strong> — especialmente despesas isentas de IVA
            (consultas médicas privadas) que poderão não estar no e-Fatura
          </li>
          <li>
            <strong>Comprovativo de rendas pagas</strong> — se é inquilino, confirme que o senhorio
            emitiu os recibos eletrónicos
          </li>
          <li>
            <strong>Comprovativos de PPR</strong> — se fez entregas para Planos Poupança Reforma
          </li>
        </ul>

        {/* ------------------------------------------------------------------ */}
        <h2 id="prazos">Prazos de Entrega em 2025</h2>

        <p>
          Desde 2024, o prazo de entrega da declaração de IRS é{' '}
          <strong>único para todas as categorias de rendimento</strong>:
        </p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Evento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>25 de fevereiro</strong>
                </td>
                <td>Prazo limite para validar faturas no e-Fatura</td>
              </tr>
              <tr>
                <td>
                  <strong>15 de março</strong>
                </td>
                <td>AT disponibiliza dados de despesas para consulta</td>
              </tr>
              <tr>
                <td>
                  <strong>31 de março</strong>
                </td>
                <td>Prazo para reclamar valores de despesas junto da AT</td>
              </tr>
              <tr>
                <td>
                  <strong>1 de abril</strong>
                </td>
                <td>Início do período de entrega da declaração Modelo 3</td>
              </tr>
              <tr>
                <td>
                  <strong>30 de junho</strong>
                </td>
                <td>Fim do período de entrega</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Penalidades por atraso</h3>

        <p>
          Se não entregar dentro do prazo, fica sujeito a coima que pode variar entre{' '}
          <strong>€150 e €3.750</strong>, dependendo da gravidade e do valor em causa. Se o atraso
          for inferior a 30 dias e for a primeira vez, pode beneficiar de redução da coima. A
          entrega voluntária fora de prazo, antes de qualquer notificação da AT, tem coimas mais
          reduzidas.
        </p>

        <p>
          <strong>Dica:</strong> Não deixe para o último dia. As primeiras declarações entregues
          tendem a ser processadas mais rapidamente, com reembolsos pagos em 15 a 20 dias. Quem
          entrega perto de 30 de junho pode esperar 30 a 60 dias pelo reembolso.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="passo-1-portal">Passo 1: Aceder ao Portal das Finanças</h2>

        <ol>
          <li>
            Aceda a <strong>portaldasfinancas.gov.pt</strong>
          </li>
          <li>
            Faça login com o seu NIF e senha de acesso (ou Chave Móvel Digital / Cartão de Cidadão)
          </li>
          <li>
            No menu principal, selecione <strong>Cidadãos</strong> →{' '}
            <strong>Entregar Declaração</strong> → <strong>IRS</strong>
          </li>
          <li>
            Escolha o ano de rendimentos (para 2025, escolherá o ano <strong>2024</strong>)
          </li>
        </ol>

        <p>
          Se tem direito ao IRS Automático, o sistema apresentará logo uma declaração pré-preenchida
          para confirmar. Caso contrário, será direcionado para o preenchimento manual do Modelo 3.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="passo-2-automatico-vs-manual">
          Passo 2: Declaração Automática vs Preenchimento Manual
        </h2>

        <p>
          O <strong>IRS Automático</strong> é uma declaração pré-preenchida pela AT que pode ser
          confirmada com um clique. Está disponível para contribuintes com situações fiscais
          simples.
        </p>

        <h3>Quando se aplica o IRS Automático</h3>

        <ul>
          <li>
            Rendimentos exclusivamente de <strong>Categoria A</strong> (trabalho dependente) e/ou{' '}
            <strong>Categoria H</strong> (pensões)
          </li>
          <li>Rendimentos obtidos apenas em Portugal</li>
          <li>Não pretende optar pelo englobamento de rendimentos</li>
          <li>Sem alterações na composição do agregado familiar face ao ano anterior</li>
          <li>Não tem deduções que precise de declarar manualmente no Anexo H</li>
          <li>Residente fiscal em Portugal durante todo o ano</li>
        </ul>

        <h3>Quando DEVE preencher manualmente</h3>

        <ul>
          <li>
            Tem rendimentos de <strong>Categoria B</strong> (trabalho independente / recibos verdes)
          </li>
          <li>
            Tem rendimentos de <strong>Categoria E</strong> (capitais), <strong>F</strong> (rendas)
            ou <strong>G</strong> (mais-valias)
          </li>
          <li>Obteve rendimentos no estrangeiro</li>
          <li>
            Quer optar por <strong>tributação conjunta</strong> (casados/unidos de facto)
          </li>
          <li>
            Quer beneficiar do <strong>IRS Jovem</strong>
          </li>
          <li>Houve alteração no agregado familiar (nascimento, casamento, divórcio)</li>
          <li>Pretende declarar deduções adicionais no Anexo H</li>
        </ul>

        <p>
          <strong>Nota importante:</strong> Mesmo que tenha direito ao IRS Automático, pode sempre
          optar pelo preenchimento manual se considerar que a declaração pré-preenchida não está
          completa ou se quer fazer opções específicas (como tributação conjunta ou englobamento).
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="passo-3-modelo-3">Passo 3: Preencher o Modelo 3</h2>

        <p>
          O Modelo 3 é composto por uma folha de rosto e vários anexos. Só precisa de preencher os
          anexos relevantes para a sua situação.
        </p>

        <h3>Rosto (folha de rosto)</h3>

        <p>A folha de rosto contém a informação essencial da declaração:</p>

        <ul>
          <li>
            <strong>Ano dos rendimentos</strong> — confirme que corresponde ao ano correto
          </li>
          <li>
            <strong>Sujeito passivo A</strong> — o titular principal (NIF preenchido
            automaticamente)
          </li>
          <li>
            <strong>Sujeito passivo B</strong> — o cônjuge ou unido de facto, se aplicável
          </li>
          <li>
            <strong>Estado civil fiscal</strong> — solteiro, casado, unido de facto, divorciado,
            viúvo
          </li>
          <li>
            <strong>Opção de tributação</strong> — separada ou conjunta (para casados/unidos de
            facto)
          </li>
          <li>
            <strong>Dependentes</strong> — filhos ou outros dependentes a cargo, com respetivos NIFs
            e datas de nascimento
          </li>
          <li>
            <strong>Ascendentes</strong> — pais ou avós que vivam em comunhão de habitação (dá
            direito a dedução)
          </li>
          <li>
            <strong>IBAN</strong> — para receber o reembolso
          </li>
        </ul>

        <h3>Anexo A — Rendimentos de Trabalho Dependente (Categoria A)</h3>

        <p>
          Se é trabalhador por conta de outrem, os seus rendimentos são declarados no Anexo A. Na
          maioria dos casos, a AT já tem esta informação pré-preenchida com base na comunicação da
          entidade patronal.
        </p>

        <ul>
          <li>
            <strong>Quadro 4A</strong> — rendimentos de trabalho dependente e pensões, com indicação
            do NIF da entidade pagadora, rendimento bruto, retenções na fonte e contribuições
            obrigatórias para a Segurança Social
          </li>
          <li>
            <strong>Verifique os valores</strong> — compare com a declaração anual de rendimentos
            que recebeu do empregador
          </li>
          <li>
            <strong>Retenções na fonte</strong> — é o imposto que já pagou ao longo do ano; garanta
            que está correto
          </li>
        </ul>

        <h3>Anexo B — Rendimentos de Trabalho Independente (Categoria B)</h3>

        <p>
          Se passou recibos verdes ou tem atividade empresarial em nome individual, precisa do Anexo
          B:
        </p>

        <ul>
          <li>
            <strong>Regime simplificado</strong> — a AT aplica coeficientes automáticos sobre o
            rendimento bruto (por exemplo, 0,75 para prestações de serviços, 0,15 para vendas de
            mercadorias). Não precisa de discriminar despesas.
          </li>
          <li>
            <strong>Contabilidade organizada</strong> — se optou por este regime, o preenchimento é
            mais complexo e geralmente feito com apoio de um contabilista certificado
          </li>
          <li>
            <strong>Quadro 4A</strong> — rendimentos brutos da atividade, separados por tipo (venda
            de bens, prestação de serviços, outros)
          </li>
          <li>
            <strong>Retenções</strong> — se clientes fizeram retenção na fonte sobre os seus recibos
          </li>
        </ul>

        <h3>Anexo H — Benefícios Fiscais e Deduções</h3>

        <p>
          O Anexo H é utilizado quando pretende declarar deduções que não foram automaticamente
          consideradas pela AT, ou quando quer exercer opções específicas:
        </p>

        <ul>
          <li>
            <strong>Quadro 6C</strong> — despesas de saúde, educação e outros encargos que queira
            declarar manualmente (por exemplo, despesas no estrangeiro)
          </li>
          <li>
            <strong>Quadro 7</strong> — benefícios fiscais como PPR, donativos, regime do Residente
            Não Habitual
          </li>
          <li>
            <strong>Quadro 8</strong> — rendimentos isentos sujeitos a englobamento
          </li>
          <li>
            <strong>IRS Jovem</strong> — se se qualifica, é no Anexo H que indica a opção pelo
            benefício
          </li>
        </ul>

        <p>
          <strong>Dica:</strong> Se todas as suas despesas estão corretamente no e-Fatura e não tem
          opções especiais a fazer, pode não precisar de preencher o Anexo H — a AT considera
          automaticamente as despesas comunicadas.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="erros-comuns">Erros Comuns a Evitar</h2>

        <p>
          Estes erros custam reembolsos todos os anos — e a maioria são fáceis de evitar se souber o
          que procurar:
        </p>

        <ol>
          <li>
            <strong>Não validar o e-Fatura a tempo</strong> — O prazo é 25 de fevereiro e não há
            exceções. Faturas &ldquo;pendentes&rdquo; (setores com múltiplas categorias como óticas
            ou supermercados) contam como zero se não as classificar.
          </li>
          <li>
            <strong>Estado civil ou cônjuge incorretos</strong> — O estado civil fiscal é o de 31 de
            dezembro do ano dos rendimentos. Se casou, divorciou-se ou enviuvou durante o ano, não
            se engane neste campo. E em tributação conjunta, não se esqueça de identificar ambos os
            cônjuges — sem isso, o quociente conjugal não funciona.
          </li>
          <li>
            <strong>Dependentes em falta</strong> — Cada dependente vale no mínimo €600 de dedução.
            Se nasceu um filho durante o ano, certifique-se de que tem NIF atribuído e está na
            declaração.
          </li>
          <li>
            <strong>Rendimentos de trabalho independente esquecidos</strong> — Se fez um único
            recibo verde durante o ano, esse rendimento deve ir ao Anexo B. A AT cruza dados e
            encontra discrepâncias.
          </li>
          <li>
            <strong>Não simular conjunta vs separada</strong> — Muitos casais escolhem
            &ldquo;separada&rdquo; por defeito quando a conjunta lhes pouparia centenas de euros (ou
            vice-versa). Demora 2 minutos a simular.
          </li>
          <li>
            <strong>Ignorar o IRS Jovem</strong> — Até 35 anos e nos primeiros 10 anos de carreira?
            A isenção pode chegar a 50% nos primeiros 5 anos. Consulte o nosso{' '}
            <Link href="/guia/irs-jovem" className="text-primary hover:underline">
              guia sobre IRS Jovem
            </Link>
            .
          </li>
          <li>
            <strong>IBAN não associado ao NIF</strong> — Sem IBAN registado no Portal das Finanças,
            o reembolso vem por cheque. Demora semanas a mais.
          </li>
        </ol>

        {/* ------------------------------------------------------------------ */}
        <h2 id="conjunta-vs-separada">Tributação Conjunta vs Separada</h2>

        <p>
          Se é casado ou vive em união de facto, tem de escolher entre tributação conjunta e
          separada. Esta é uma das decisões mais importantes da declaração, pois pode ter um impacto
          significativo no imposto final.
        </p>

        <ul>
          <li>
            <strong>Tributação separada</strong> — Cada cônjuge declara e é tributado
            individualmente, como se fossem solteiros. É o regime por defeito.
          </li>
          <li>
            <strong>Tributação conjunta</strong> — Os rendimentos são somados e divididos por 2
            (quociente conjugal). O imposto é calculado sobre metade e multiplicado por 2. Compensa
            quando há grande diferença de rendimentos entre os cônjuges.
          </li>
        </ul>

        <p>
          Para uma análise detalhada com exemplos numéricos, consulte o nosso{' '}
          <Link href="/guia/conjunto-vs-separado" className="text-primary hover:underline">
            guia completo sobre tributação conjunta vs separada
          </Link>
          .
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="declaracao-substituicao">Declaração de Substituição</h2>

        <p>
          Cometeu um erro na declaração? Esqueceu-se de declarar um rendimento ou uma dedução? Não
          se preocupe — pode corrigir a declaração submetendo uma{' '}
          <strong>declaração de substituição</strong>.
        </p>

        <h3>Prazos para substituição</h3>

        <ul>
          <li>
            <strong>Dentro do prazo de entrega</strong> (até 30 de junho) — Pode submeter quantas
            declarações de substituição quiser sem qualquer penalidade. A AT considera sempre a
            última versão.
          </li>
          <li>
            <strong>Até 2 anos após o prazo</strong> — Pode corrigir a declaração, mas pode haver
            coima se a correção resultar em imposto adicional a pagar.
          </li>
          <li>
            <strong>Até 4 anos</strong> — Em determinadas circunstâncias (por exemplo, factos
            supervenientes), pode pedir revisão da declaração junto da AT.
          </li>
        </ul>

        <h3>Para que serve na prática?</h3>

        <p>
          A declaração de substituição é o mecanismo que lhe permite{' '}
          <strong>recuperar imposto pago a mais</strong> em anos anteriores. Se descobre que se
          esqueceu de uma dedução, que não optou por tributação conjunta quando deveria, ou que
          tinha direito ao IRS Jovem e não o pediu, pode corrigir e receber a diferença.
        </p>

        <p>
          <strong>Como fazer:</strong> No Portal das Finanças, selecione a opção &ldquo;Declaração
          de Substituição&rdquo; e escolha o ano que pretende corrigir. Preencha de novo toda a
          declaração com os dados corretos.
        </p>

        {/* ------------------------------------------------------------------ */}
        <h2 id="dicas-reembolso">Dicas para Maximizar o Reembolso</h2>

        <p>
          O reembolso de IRS não é um bónus — é a devolução de imposto que pagou a mais durante o
          ano. Ainda assim, muitas pessoas deixam dinheiro na mesa simplesmente porque não conhecem
          as regras. Eis as que fazem mais diferença:
        </p>

        <h3>O e-Fatura é a base de tudo</h3>
        <p>
          Se há um único conselho a reter deste guia, é este: valide as faturas no{' '}
          <a
            href="https://faturas.portaldasfinancas.gov.pt"
            target="_blank"
            rel="noopener noreferrer"
          >
            e-Fatura
          </a>{' '}
          até 25 de fevereiro. Despesas com saúde, educação e habitação só contam para deduções se
          estiverem na categoria certa. Preste atenção especial às faturas &ldquo;pendentes&rdquo; —
          óticas, farmácias e supermercados muitas vezes têm múltiplas categorias possíveis e ficam
          a zero se não as classificar. Além disso, peça sempre fatura com NIF em restaurantes,
          oficinas e cabeleireiros. A dedução do IVA nestes setores pode chegar a €250 por pessoa.
        </p>

        <h3>Casados: não escolham &ldquo;separada&rdquo; por defeito</h3>
        <p>
          É surpreendente quantos casais entregam a declaração em separado sem simular a conjunta.
          Quando há grande disparidade de rendimentos entre cônjuges, a tributação conjunta pode
          poupar centenas ou milhares de euros. E o inverso também é verdade — se ambos ganham
          valores semelhantes, a separada costuma ser melhor. Não adivinhe:{' '}
          <Link href="/analyze" className="text-primary hover:underline">
            simule ambos os cenários
          </Link>
          .
        </p>

        <h3>IRS Jovem e PPR: deduções que poucos usam</h3>
        <p>
          Se tem até 35 anos e está nos primeiros 10 anos de carreira após conclusão dos estudos, o{' '}
          <Link href="/guia/irs-jovem" className="text-primary hover:underline">
            IRS Jovem
          </Link>{' '}
          pode isentar até 50% do rendimento nos primeiros 5 anos. É dinheiro significativo que
          muitos jovens desconhecem. Paralelamente, contribuições para Planos Poupança Reforma (PPR)
          dão direito a dedução de 20% do valor investido — até €400 para menores de 35 anos.
        </p>

        <h3>Englobamento: vale a pena fazer contas</h3>
        <p>
          Rendimentos de capitais (juros, dividendos), rendas e mais-valias são tributados
          autonomamente a 28%. Mas se a sua taxa marginal de IRS for inferior a 28%, o englobamento
          compensa — integra esses rendimentos na declaração e paga menos. Quem ganha menos de
          €28.400 brutos (em 2025) está abaixo do escalão de 31.4%, pelo que vale a pena simular.
        </p>

        <h3>Não se esqueça destes detalhes</h3>
        <ul>
          <li>
            Declare todos os dependentes — cada filho vale pelo menos €600 de dedução (€726 se tiver
            entre 3 e 6 anos, €900 abaixo dos 3).
          </li>
          <li>
            Se é inquilino, confirme que o senhorio emitiu recibos eletrónicos. As rendas dão
            dedução de 15% até €502.
          </li>
          <li>Despesas de saúde noutro país da UE podem ser declaradas manualmente no Anexo H.</li>
          <li>
            Confirme que o seu IBAN está associado ao NIF no Portal das Finanças — caso contrário, o
            reembolso sai por cheque (muito mais lento).
          </li>
          <li>
            Entregar cedo não muda o valor do reembolso, mas as declarações de início de abril são
            processadas mais depressa.
          </li>
        </ul>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Carregue a Sua Declaração e Veja se Está a Pagar a Mais
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            O FiscalPT analisa a sua declaração de IRS, compara cenários de tributação conjunta vs
            separada e identifica otimizações que podem aumentar o seu reembolso.
          </p>
          <Link href="/analyze">
            <Button size="lg">
              Analisar o Meu IRS <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </article>
    </>
  )
}
