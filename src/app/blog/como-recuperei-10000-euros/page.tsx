import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'

const SITE_URL = 'https://fiscalpt.com'

export const metadata: Metadata = {
  title: 'Como Recuperei €10.000 em Impostos — A História do FiscalPT',
  description:
    'A história pessoal por trás do FiscalPT: como descobri que podia recuperar €10.000 em impostos com declarações de substituição, e porque construí uma plataforma para ajudar todos os contribuintes portugueses.',
  openGraph: {
    title: 'Como Recuperei €10.000 em Impostos — A História do FiscalPT',
    description:
      'Como descobri que podia recuperar €10.000 em impostos com declarações de substituição, e porque construí o FiscalPT.',
    url: `${SITE_URL}/blog/como-recuperei-10000-euros`,
    type: 'article',
    locale: 'pt_PT',
  },
  alternates: {
    canonical: '/blog/como-recuperei-10000-euros',
  },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Como Recuperei €10.000 em Impostos — A História do FiscalPT',
  description:
    'A história pessoal por trás do FiscalPT: como descobri que podia recuperar €10.000 em impostos com declarações de substituição, e porque construí uma plataforma para ajudar todos os contribuintes portugueses.',
  author: { '@type': 'Person', name: 'Rui Moreira' },
  publisher: { '@type': 'Organization', name: 'FiscalPT', url: SITE_URL },
  datePublished: '2025-07-14',
  dateModified: '2025-07-14',
  mainEntityOfPage: `${SITE_URL}/blog/como-recuperei-10000-euros`,
  inLanguage: 'pt-PT',
}

export default function ComoRecuperei10000Euros() {
  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
        <h1>Como Recuperei €10.000 em Impostos — E Porque Criei o FiscalPT</h1>

        <p className="lead text-muted-foreground">
          Por <strong>Rui Moreira</strong> · Julho 2025
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* The Hook                                                         */}
        {/* ---------------------------------------------------------------- */}

        <p>
          Eu nunca me preocupei com otimização fiscal. Era demasiado trabalhoso, demasiado confuso —
          uma batalha desigual contra um sistema opaco. Até que um dia me sentei e descobri que
          podia recuperar dez mil euros.
        </p>

        <p>
          Não dez mil euros ao longo de uma carreira inteira. Dez mil euros em impostos pagos a mais
          nos últimos três anos. Dinheiro que já era meu, que me tinha sido devolvido a menos, e que
          eu podia reclamar com declarações de substituição. Dinheiro que ficou na mesa porque eu
          nunca tinha olhado para o problema com atenção.
        </p>

        <p>
          Esta é a história de como isso aconteceu — e de como essa descoberta me levou a construir
          o FiscalPT.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* O Piloto Automático                                              */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="piloto-automatico">O Piloto Automático</h2>

        <p>
          Durante anos, a minha relação com o IRS era igual à da maioria dos portugueses: abrir o
          Portal das Finanças em abril, confirmar os dados pré-preenchidos, clicar em
          &ldquo;submeter&rdquo;, e esquecer o assunto até ao reembolso aparecer na conta. O IRS
          automático era uma bênção — não tinha de pensar em nada.
        </p>

        <p>
          Nunca me perguntei se a declaração automática era ótima. Assumia que a AT, com acesso a
          todos os meus dados, calculava a melhor opção. Não é assim que um serviço público deveria
          funcionar? Eles têm a informação, fazem as contas, eu pago o que devo ou recebo o que me
          devem.
        </p>

        <p>Essa assunção estava completamente errada.</p>

        <p>
          O IRS automático não otimiza nada. Calcula <em>uma</em> versão — normalmente tributação
          separada, sem benefícios opcionais — e apresenta-a como se fosse a única. Se a tributação
          conjunta fosse mais favorável? Azar. Se tivesse direito ao IRS Jovem? Não é aplicado
          automaticamente. Se o englobamento de certos rendimentos reduzisse o imposto? Nem sequer é
          mencionado.
        </p>

        <p>
          A AT não trabalha para si. A AT calcula o imposto com base no que <em>você</em> declara.
          Se não declara da forma mais favorável, paga mais. Simples.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* O Problema                                                       */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="o-problema">O Problema Que Não Sabia Que Tinha</h2>

        <p>
          O meu perfil fiscal não é especialmente complexo. Sou trabalhador por conta de outrem
          (Categoria A), com alguns rendimentos adicionais. Casado. Sem situações exóticas. O tipo
          de contribuinte que assume que o sistema funciona automaticamente.
        </p>

        <p>
          Mas por baixo dessa simplicidade aparente, havia decisões que nunca tinha tomado
          conscientemente:
        </p>

        <ul>
          <li>
            <strong>Tributação conjunta vs. separada</strong> — Nunca tinha comparado. Submetia
            sempre em separado porque era o que o IRS automático sugeria.
          </li>
          <li>
            <strong>IRS Jovem</strong> — Sabia vagamente que existia, mas nunca verifiquei se me
            qualificava. Achava que era só para quem acabou de entrar no mercado de trabalho.
          </li>
          <li>
            <strong>Deduções</strong> — Confiava que o e-Fatura tratava de tudo. Nunca verifiquei se
            as despesas estavam corretamente categorizadas ou se havia deduções por declarar.
          </li>
          <li>
            <strong>Englobamento</strong> — Nem sabia o que significava. Descobri depois que, para
            certos rendimentos, pode compensar incluí-los no rendimento global em vez de os tributar
            à taxa liberatória.
          </li>
        </ul>

        <p>
          Cada uma destas decisões tem impacto direto no imposto final. E eu não estava a tomar
          nenhuma delas — estava a deixar a AT decidir por mim, com a opção mais conservadora.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* A Descoberta                                                     */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="a-descoberta">O Fim de Semana Que Mudou Tudo</h2>

        <p>
          Um fim de semana de chuva, sem planos, decidi finalmente perceber o que se passava com o
          meu IRS. Não por curiosidade académica — tinha uma sensação persistente de que estava a
          deixar dinheiro na mesa.
        </p>

        <p>
          Comecei por descarregar as declarações dos últimos três anos do Portal das Finanças. Abri
          o Código do IRS. E comecei a fazer contas.
        </p>

        <p>
          As primeiras horas foram frustrantes. O CIRS é denso, as remissões são constantes, e os
          artigos relevantes estão espalhados por todo o código. O artigo 68.º remete para o 69.º
          que tem exceções no 12.º-F que depende de condições definidas noutro decreto-lei. Não é um
          documento pensado para ser lido por cidadãos normais.
        </p>

        <p>
          Mas à medida que fui compreendendo a mecânica, os números começaram a revelar uma história
          alarmante.
        </p>

        <h3 id="descoberta-1">Descoberta #1 — Tributação conjunta</h3>

        <p>
          A tributação conjunta divide o rendimento coletável por dois antes de aplicar os escalões
          (o chamado quociente conjugal). Para casais com rendimentos desiguais, isto pode baixar
          significativamente a taxa efetiva. No meu caso, a diferença entre conjunto e separado era
          de vários milhares de euros — a favor do conjunto.
        </p>

        <p>
          Três anos a pagar mais porque nunca comparei as duas opções. A AT sabe os rendimentos de
          ambos os cônjuges. Poderia, no mínimo, avisar. Não avisa.
        </p>

        <h3 id="descoberta-2">Descoberta #2 — IRS Jovem</h3>

        <p>
          O IRS Jovem (artigo 12.º-F do CIRS) é um benefício fiscal que isenta parcialmente os
          rendimentos de trabalho dependente durante os primeiros anos de carreira. A isenção é
          generosa: 100% no primeiro ano, 75% nos dois seguintes, e 50% nos dois a seguir (nas
          regras pré-2025). Para quem se qualifica, a diferença pode ser brutal.
        </p>

        <p>
          Eu qualificava-me. E nunca tinha ativado o benefício. Ninguém me disse. O IRS automático
          não o aplica. Não aparece nenhum aviso no Portal das Finanças. É um benefício que existe
          na lei mas que, na prática, só beneficia quem sabe que existe e sabe como o ativar.
        </p>

        <h3 id="descoberta-3">Descoberta #3 — Deduções por reclamar</h3>

        <p>
          Ao validar o e-Fatura, encontrei despesas mal categorizadas que reduziam as deduções
          disponíveis. Faturas de saúde classificadas como &ldquo;outros&rdquo;. Rendas que não
          estavam a ser deduzidas porque faltava o NIF do senhorio na declaração. Valores que, no
          conjunto, faziam diferença.
        </p>

        <h3 id="o-total">O Total</h3>

        <p>
          Somei tudo: a diferença de tributação conjunta vs. separada ao longo de três anos, o IRS
          Jovem não aplicado, as deduções corrigidas. O total recuperável através de declarações de
          substituição: aproximadamente <strong>dez mil euros</strong>.
        </p>

        <p>
          Dez mil euros. Não por fraude, não por esquemas, não por interpretações criativas da lei.
          Simplesmente por preencher a declaração da forma mais favorável — algo que a lei
          explicitamente permite e que a AT não faz por nós.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* A Frustração                                                     */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="a-frustracao">A Frustração</h2>

        <p>
          A descoberta veio acompanhada de uma frustração profunda. Não comigo — comigo mesmo,
          obviamente, por não ter prestado atenção antes. Mas sobretudo com o sistema.
        </p>

        <p>
          As regras fiscais em Portugal não são secretas. Estão no CIRS, publicado no Diário da
          República, acessível a qualquer pessoa. Mas estão escritas numa linguagem jurídica que
          exige formação específica para decifrar. O artigo 12.º-F, por exemplo, com as suas
          remissões, condições, exceções e alterações anuais, é um labirinto para qualquer cidadão
          comum.
        </p>

        <p>
          A alternativa? Pagar a um contabilista. Entre 50€ e 200€ por declaração, dependendo da
          complexidade. Para muitas famílias, especialmente as que mais beneficiariam de otimização
          fiscal, este custo é uma barreira real. É um contra-senso: quem mais precisa de ajuda é
          quem menos pode pagá-la.
        </p>

        <p>
          E mesmo quem contrata um contabilista nem sempre é bem servido. Muitos profissionais,
          sobrecarregados com centenas de clientes na época do IRS, fazem o básico: submetem a
          declaração sem comparar cenários, sem verificar benefícios opcionais, sem otimizar. Não
          por incompetência, mas por falta de tempo e de ferramentas adequadas.
        </p>

        <p>
          O que mais me incomodou foi perceber que{' '}
          <strong>a maioria dos portugueses nem sabe que pode corrigir declarações passadas</strong>
          . A declaração de substituição é um mecanismo legal, previsto no artigo 59.º da Lei Geral
          Tributária. Permite corrigir erros ou omissões em declarações já submetidas, dentro de
          determinados prazos. E, se a correção resultar em imposto pago a mais, o Estado é obrigado
          a devolver.
        </p>

        <p>
          Mas quem sabe disto? Quem é que, ao receber o reembolso do IRS, pensa &ldquo;se calhar
          devia ter declarado de outra forma&rdquo;? Quase ninguém. Porque o sistema não promove
          literacia fiscal. Promove conformidade silenciosa.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Porque Não Existe Isto?                                          */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="porque-nao-existe">Porque É Que Isto Não Existia?</h2>

        <p>
          Depois de passar aquele fim de semana a fazer cálculos em folhas de cálculo, a primeira
          pergunta que me fiz foi: porque é que ninguém automatizou isto?
        </p>

        <p>
          Os dados existem — a AT tem tudo em XML estruturado. As fórmulas existem — estão no CIRS,
          artigo por artigo. As comparações são determinísticas — dado um conjunto de inputs, o
          resultado é sempre o mesmo. Não há ambiguidade, não há julgamento, não há incerteza. É
          pura matemática.
        </p>

        <p>
          E no entanto, em 2025, a forma mais comum de &ldquo;otimizar&rdquo; o IRS continua a ser:
          perguntar a um amigo que perceba de finanças, consultar artigos vagos na imprensa
          generalista, ou pagar a alguém para fazer as contas por nós. Numa era em que fazemos
          transferências bancárias instantâneas pelo telemóvel, continuamos a tratar o IRS como se
          estivéssemos em 1995.
        </p>

        <p>
          Existem calculadoras online, claro. Mas são limitadas: pedem inputs manuais que o
          contribuinte muitas vezes não sabe preencher, não comparam cenários automaticamente, não
          implementam a totalidade das regras, e não são verificadas contra dados reais. São úteis
          para estimativas grosseiras, não para decisões informadas.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* A Solução                                                        */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="a-solucao">A Solução — FiscalPT</h2>

        <p>
          Decidi construir a ferramenta que eu próprio precisava. Uma plataforma que fizesse
          exatamente o que eu fiz naquele fim de semana — mas em cinco minutos em vez de dois dias.
        </p>

        <p>
          O conceito é simples: o contribuinte descarrega a sua declaração do Portal das Finanças
          (um ficheiro XML que a AT disponibiliza), carrega-o no FiscalPT, e recebe instantaneamente
          uma análise completa da sua situação fiscal.
        </p>

        <h3 id="motor-fiscal">O Motor Fiscal</h3>

        <p>
          O coração do FiscalPT é um motor de cálculo fiscal determinístico. Não usa inteligência
          artificial, não adivinha, não aproxima. Implementa as fórmulas exatas do CIRS — os mesmos
          cálculos que a AT faz internamente.
        </p>

        <p>
          Isto não é uma distinção académica. Quando estamos a falar de decisões financeiras com
          impacto de milhares de euros, &ldquo;aproximadamente correto&rdquo; não é suficiente. O
          motor precisa de produzir exatamente os mesmos valores que o Portal das Finanças — ao
          cêntimo.
        </p>

        <p>
          Para garantir esta precisão, cada cálculo é verificado contra documentos reais de
          liquidação da AT. Se a AT diz que o imposto é 3.427,19€, o FiscalPT tem de calcular
          3.427,19€. Nem mais um cêntimo, nem menos. Atualmente, o motor tem mais de 970 testes
          automatizados que validam esta correspondência.
        </p>

        <h3 id="comparacao-cenarios">Comparação de Cenários</h3>

        <p>
          A funcionalidade mais importante não é calcular o imposto — é comparar alternativas. Para
          cada declaração carregada, o FiscalPT calcula automaticamente:
        </p>

        <ul>
          <li>
            <strong>Tributação conjunta vs. separada</strong> — Qual a opção mais favorável? Quanto
            se poupa? Para casais, esta é frequentemente a otimização de maior impacto.
          </li>
          <li>
            <strong>Elegibilidade para IRS Jovem</strong> — Qualifica-se? Qual seria o benefício? O
            FiscalPT verifica as condições automaticamente e calcula a diferença.
          </li>
          <li>
            <strong>Taxa efetiva real</strong> — Não a taxa marginal do último escalão, mas a taxa
            efetiva sobre o rendimento total. A métrica que realmente importa.
          </li>
          <li>
            <strong>Decomposição por pessoa</strong> — Num casal, quanto paga cada um? Onde estão as
            maiores oportunidades de otimização?
          </li>
        </ul>

        <h3 id="nao-e-ia">Não é IA — É Matemática</h3>

        <p>
          Vivemos numa época em que tudo é &ldquo;powered by AI&rdquo;. O FiscalPT deliberadamente
          não usa IA para cálculos fiscais. E há uma razão simples: a fiscalidade não é um domínio
          de probabilidades — é um domínio de regras. O artigo 68.º do CIRS não diz &ldquo;o imposto
          é provavelmente X&rdquo;. Diz &ldquo;o imposto é X&rdquo;, com fórmulas precisas e sem
          margem para interpretação.
        </p>

        <p>
          Usar um LLM para calcular impostos seria como usar um gerador de texto para resolver
          equações matemáticas — pode acertar na maioria das vezes, mas quando errar, ninguém
          consegue explicar porquê. E quando se trata do seu dinheiro, &ldquo;na maioria das
          vezes&rdquo; não chega.
        </p>

        <p>
          O motor do FiscalPT é código TypeScript puro, determinístico, testável. Dado o mesmo
          input, produz sempre o mesmo output. Cada regra está mapeada ao artigo do CIRS
          correspondente. Cada cálculo pode ser auditado e verificado.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* A Filosofia                                                      */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="a-filosofia">A Filosofia</h2>

        <p>Quero ser claro sobre o que o FiscalPT é e o que não é.</p>

        <p>
          <strong>Otimização fiscal não é evasão fiscal.</strong> Não estamos a falar de esconder
          rendimentos, criar esquemas artificiais, ou explorar lacunas da lei. Estamos a falar de
          usar as opções que a própria lei disponibiliza — tributação conjunta, IRS Jovem,
          englobamento — da forma mais favorável ao contribuinte.
        </p>

        <p>
          O legislador criou estas opções deliberadamente. A tributação conjunta existe para
          beneficiar agregados familiares. O IRS Jovem existe para aliviar a carga fiscal dos jovens
          trabalhadores. O englobamento existe para dar flexibilidade a contribuintes com diferentes
          tipos de rendimento. São instrumentos legítimos, previstos na lei, que o Estado{' '}
          <em>quer</em> que os cidadãos usem.
        </p>

        <p>
          O problema é que a maioria dos contribuintes não sabe que estas opções existem, não
          percebe quando se aplicam à sua situação, e não consegue calcular o impacto de cada uma. O
          resultado é que ficam com a opção por defeito — que é quase sempre a menos favorável.
        </p>

        <p>
          O FiscalPT existe para colmatar essa assimetria de informação. Para dar a cada
          contribuinte a mesma visibilidade que um bom contabilista daria — mas sem o custo, sem a
          espera, e sem a incerteza de não saber se todas as opções foram consideradas.
        </p>

        <h3 id="responsabilidade">A Responsabilidade É Sua — E Isso É Uma Coisa Boa</h3>

        <p>
          Uma das realidades do sistema fiscal português que poucas pessoas compreendem: a
          responsabilidade pela declaração correta do IRS é inteiramente do contribuinte. Não da AT,
          não do contabilista (exceto em casos de negligência profissional), não do software que
          usou. Sua.
        </p>

        <p>
          Isto pode parecer injusto — e, em parte, é. Mas também significa que <em>você</em> tem o
          poder de declarar da forma mais favorável. A AT não vai otimizar por si, mas também não o
          pode impedir de otimizar por conta própria, desde que cumpra a lei.
        </p>

        <p>
          O FiscalPT não submete declarações nem toma decisões por si. Mostra-lhe as opções, calcula
          os cenários, e explica as diferenças. A decisão é sempre sua. E para tomar boas decisões,
          precisa de boa informação — é isso que a plataforma fornece.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* O Que Aprendi                                                    */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="o-que-aprendi">O Que Aprendi Pelo Caminho</h2>

        <p>
          Construir um motor fiscal que replica os cálculos da AT ensinou-me algumas coisas sobre o
          sistema fiscal português que quero partilhar.
        </p>

        <h3 id="sistema-complexo">O sistema é desnecessariamente complexo</h3>

        <p>
          Os escalões do IRS mudaram quase todos os anos na última década. O IRS Jovem foi alterado
          substancialmente em 2025. As regras da Categoria B são um labirinto de coeficientes,
          reduções e exceções. Cada alteração legislativa é mais uma camada de complexidade que o
          cidadão comum não tem como acompanhar.
        </p>

        <p>
          Esta complexidade não é inevitável. Outros países têm sistemas fiscais mais simples, mais
          transparentes, e igualmente progressivos. A complexidade do sistema português beneficia
          quem tem recursos para a navegar — contabilistas, consultores, software especializado — e
          prejudica quem não tem.
        </p>

        <h3 id="irs-automatico-falha">O IRS automático dá uma falsa sensação de segurança</h3>

        <p>
          O IRS automático foi apresentado como uma simplificação — e é, num sentido limitado. Poupa
          tempo a quem tem uma situação fiscal simples e não quer pensar no assunto.
        </p>

        <p>
          Mas cria um problema sério: transmite a ideia de que o Estado otimiza por si. Que se o IRS
          automático diz que deve receber 847€ de reembolso, então 847€ é o máximo que pode receber.
          Não é. É simplesmente o resultado de uma das opções possíveis — e frequentemente não é a
          melhor.
        </p>

        <h3 id="substituicao">As declarações de substituição são subutilizadas</h3>

        <p>
          Quantas pessoas sabem que podem corrigir a declaração de IRS dos últimos anos? Que se
          descobrirem que deviam ter declarado em conjunto em vez de separado, podem submeter uma
          declaração de substituição e receber a diferença? O prazo geral é de quatro anos após a
          data de entrega.
        </p>

        <p>
          Isto significa que, em 2025, ainda pode corrigir as declarações de 2021, 2022, 2023 e
          2024. Se esteve a pagar a mais em cada um desses anos, o valor acumulado pode ser
          substancial.
        </p>

        <p>É exatamente o que eu fiz. E é exatamente o que o FiscalPT ajuda a identificar.</p>

        {/* ---------------------------------------------------------------- */}
        {/* O Caminho em Frente                                              */}
        {/* ---------------------------------------------------------------- */}

        <h2 id="caminho-em-frente">O Caminho em Frente</h2>

        <p>
          O FiscalPT começou como uma ferramenta pessoal — algo que construí para resolver o meu
          próprio problema. Mas à medida que falei com amigos, família e colegas, percebi que o
          problema é universal. Toda a gente tem a mesma história: &ldquo;nunca olhei para
          isso&rdquo;, &ldquo;assumo que está correto&rdquo;, &ldquo;não percebo as regras&rdquo;.
        </p>

        <p>
          A visão para o FiscalPT é simples: qualquer contribuinte português, independentemente dos
          seus conhecimentos fiscais ou recursos financeiros, deve poder compreender a sua situação
          fiscal e tomar decisões informadas. Sem jargão, sem custos proibitivos, sem confiança cega
          no sistema.
        </p>

        <p>
          O motor fiscal já cobre as principais áreas — IRS progressivo, tributação conjunta vs.
          separada, IRS Jovem, Categoria A e B, deduções, segurança social, mínimo de existência,
          taxa de solidariedade. E continua a crescer, com cada nova funcionalidade validada contra
          documentos reais da AT.
        </p>

        <p>
          Se chegou até aqui, provavelmente é porque também tem a sensação de que pode estar a pagar
          mais do que devia. Essa sensação é provavelmente correta. A maioria dos contribuintes
          portugueses está numa de duas situações: ou nunca comparou cenários alternativos, ou
          comparou mas não tem certeza de que os cálculos estão corretos.
        </p>

        <p>
          Em ambos os casos, o FiscalPT pode ajudar. Carregue a sua declaração, veja os números, e
          tome as suas próprias conclusões. Os dados são seus, a análise é instantânea, e a decisão
          é sempre sua.
        </p>

        {/* CTA */}
        <div className="not-prose mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Descubra Quanto Está a Pagar a Mais</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Se nunca verificou se está a pagar a mais, provavelmente está. Carregue a sua declaração
            e descubra em 5 minutos.
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
