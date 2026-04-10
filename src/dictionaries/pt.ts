import type { Dictionary } from '@/lib/i18n'

const pt = {
  common: {
    back: 'Voltar',
    continue: 'Continuar',
    close: 'Fechar',
    skip: 'Saltar',
    advance: 'Avançar',
    next: 'Seguinte',
    start: 'Começar',
    yes: 'Sim',
    no: 'Não',
    print: 'Imprimir',
    downloadPdf: 'Descarregar PDF',
    newAnalysis: 'Nova análise',
    footer:
      '© {year} FiscalPT. Informação fiscal, não aconselhamento. Consulte um contabilista certificado.',
    progress: 'Progresso',
    step: 'Passo {current} de {total}',
  },

  nav: {
    features: 'Funcionalidades',
    howItWorks: 'Como Funciona',
    pricing: 'Preços',
    guides: 'Guias',
    blog: 'Blog',
    startAnalysis: 'Começar Análise',
    analysis: 'Análise',
    mainNavigation: 'Navegação principal',
    footer: 'Rodapé',
  },

  landing: {
    hero: {
      badge: 'Motor fiscal determinístico · Tabelas 2025',
      title: 'Descubra quanto está a ',
      titleHighlight: 'pagar a mais',
      titleEnd: ' em impostos',
      subtitle:
        'Carregue a sua declaração de IRS e receba uma análise completa em minutos. Motor de cálculo verificado ao cêntimo, comparação automática de cenários, e recomendações acionáveis com links para o Portal das Finanças.',
      cta: 'Simulação Rápida — 2 minutos',
      ctaFull: 'Análise Personalizada',
      secondary: 'Como funciona',
    },

    trust: {
      engine: 'Motor determinístico',
      engineDesc:
        'Sem IA nos cálculos — apenas matemática verificada com as tabelas oficiais do IRS. Mais de 1000 testes automatizados, 94% de cobertura de código.',
      privacy: 'Privacidade total',
      privacyDesc:
        'Os seus documentos são processados localmente no browser. Zero servidores, zero risco.',
      openSource: 'Código aberto',
      openSourceDesc:
        'Código-fonte público no GitHub. Veja a lógica, reporte problemas, contribua. Transparência total.',
      noSignup: 'Sem registo',
      noSignupDesc: 'Comece a análise imediatamente. Sem conta, sem email, sem complicações.',
    },

    howItWorks: {
      badge: 'Como Funciona',
      title: 'Da declaração às poupanças em 3 passos',
      subtitle:
        'Carregue os seus documentos fiscais e o motor faz o resto. Sem complicações, sem registos.',
      step1: {
        title: 'Carregue os documentos',
        description:
          'XML do Modelo 3, PDF do comprovativo, ou demonstração de liquidação. O sistema extrai tudo automaticamente.',
      },
      step2: {
        title: 'Complete os dados',
        description:
          'O questionário inteligente identifica o que falta — dependentes, regimes especiais, deduções — e pergunta apenas o necessário.',
      },
      step3: {
        title: 'Receba a análise',
        description:
          'Comparação conjunta vs separada, IRS Jovem, NHR, taxa efetiva, poupanças identificadas, e relatório PDF.',
      },
    },

    preview: {
      badge: 'Veja em Ação',
      title: 'Resultados claros, poupanças concretas',
      subtitle:
        'Cada análise mostra a situação atual vs cenário otimizado, com o valor exato que pode poupar.',
      alt: 'Exemplo de resultado de análise fiscal mostrando comparação entre situação atual e cenário otimizado com poupança de mais de 4000€',
    },

    features: {
      badge: 'Funcionalidades',
      title: 'Tudo o que precisa para otimizar o seu IRS',
      subtitle: 'Motor de cálculo determinístico verificado ao cêntimo contra os valores da AT.',
      upload: {
        title: 'Upload de Documentos',
        description:
          'Carregue o XML do Modelo 3, PDF do comprovativo, ou demonstração de liquidação. Suporta múltiplos anos para análise histórica.',
      },
      joint: {
        title: 'Conjunta vs Separada',
        description:
          'Comparação automática de ambos os cenários de tributação. Veja exatamente quanto poupa com cada opção.',
      },
      irsJovem: {
        title: 'IRS Jovem',
        description:
          'Verificação de elegibilidade e cálculo do impacto. 50% de isenção nos primeiros 5 anos, 25% nos seguintes 5.',
      },
      nhr: {
        title: 'Regime NHR',
        description:
          'Simulação do Residente Não Habitual com taxa autónoma de 20% em atividades de alto valor acrescentado.',
      },
      engine: {
        title: 'Cálculo Exato',
        description:
          'Escalões 2024 e 2025, mínimo de existência, sobretaxa de solidariedade, deduções — verificado ao cêntimo.',
      },
      recommendations: {
        title: 'Recomendações Acionáveis',
        description:
          'Instruções passo-a-passo com links diretos para o Portal das Finanças. Saiba exatamente o que alterar.',
      },
      aiChat: {
        title: 'Consultor Fiscal AI',
        description:
          'Tire dúvidas sobre os seus resultados com o consultor AI. Os cálculos são do motor — a AI só explica.',
      },
      catB: {
        title: 'Trabalhadores Independentes',
        description:
          'Coeficientes por atividade, regra dos 15% de despesas, reduções de atividade nova, Segurança Social.',
      },
      multiYear: {
        title: 'Análise Multi-Ano',
        description:
          'Compare até 5 anos em paralelo. Veja a evolução da sua carga fiscal e identifique oportunidades.',
      },
      pdf: {
        title: 'Relatório PDF',
        description:
          'Exporte a análise completa em PDF profissional. Inclui todos os cenários, deduções e recomendações.',
      },
      deductions: {
        title: 'Deduções Otimizadas',
        description:
          'Saúde, educação, habitação, PPR, e-fatura — análise de gaps para maximizar cada dedução dentro dos limites legais.',
      },
      privacy: {
        title: 'Privacidade Total',
        description:
          'Documentos processados localmente no browser. Dados pessoais não enviados para servidores. Verifique com Ctrl+U.',
      },
    },

    engine: {
      badge: 'Motor Fiscal',
      title: 'Cálculos verificados, não estimativas',
      subtitle:
        'O FiscalPT não usa IA para calcular impostos. Cada cêntimo é calculado com as mesmas fórmulas e tabelas da Autoridade Tributária.',
      point1: 'Escalões oficiais 2024 e 2025 (Lei 33/2024 e OE 2025)',
      point2: 'Validação cruzada contra demonstrações de liquidação reais',
      point3: 'Mínimo de existência, sobretaxa de solidariedade, Art. 81 crédito',
      point4: 'Coeficientes de trabalho independente por código de atividade (Art. 31 CIRS)',
      point5: 'IRS Jovem Art. 12-F com regras pré e pós 2025',
      point6: 'Taxa autónoma NHR Art. 72 com tributação separada',
      aiNote:
        'A IA é usada apenas após o cálculo — para explicar os resultados e responder a dúvidas. Nunca para fazer contas.',
    },

    proof: {
      badge: 'Porquê o FiscalPT',
      title: 'Construído para ser rigoroso',
      subtitle:
        'Não é um protótipo — é um motor fiscal com cobertura de testes real e validação contra dados oficiais.',
      stat1: { value: '1050+', label: 'Testes automatizados' },
      stat2: { value: '97%', label: 'Cobertura de código' },
      stat3: { value: '€0,01', label: 'Margem de erro máxima' },
      stat4: { value: '6', label: 'Categorias de rendimento' },
      story: {
        title: 'A história de origem',
        body: 'O FiscalPT nasceu de uma experiência pessoal. O criador nunca se preocupou com otimização fiscal — era demasiado trabalhoso e confuso, uma batalha desigual. Até que se sentou, analisou as declarações dos últimos 3 anos, e descobriu que podia recuperar €10.000 com declarações de substituição. Este projeto existe para que ninguém perca dinheiro por falta de informação acessível.',
        author: 'Rui Moreira',
        role: 'Criador do FiscalPT',
        readMore: 'Ler a história completa',
      },
    },

    pricing: {
      badge: 'Preços',
      title: 'Simples e transparente',
      subtitle: 'Análise completa gratuita. Pague apenas pelas recomendações acionáveis.',
      free: {
        name: 'Análise Gratuita',
        price: '€0',
        description: 'Análise fiscal completa, sem limites',
        f1: 'Comparação conjunta vs separada',
        f2: 'IRS Jovem e NHR com cálculo de impacto',
        f3: 'Todos os cenários e taxas efetivas',
        f4: 'Upload de XML, PDF, ou portal',
        f5: 'Análise multi-ano (até 5 anos)',
        f6: 'Relatório PDF exportável',
        cta: 'Começar Grátis',
      },
      pro: {
        name: 'Recomendações Pro',
        price: '€9,99',
        period: 'por consulta',
        description: 'Guia passo-a-passo para implementar as otimizações',
        f1: 'Tudo da análise gratuita',
        f2: 'Recomendações acionáveis com passos detalhados',
        f3: 'Links diretos para o Portal das Finanças',
        f4: 'Impacto estimado de cada alteração em €',
        f5: 'Consultor fiscal AI (20 mensagens)',
        f6: 'Reembolso garantido se insatisfeito',
        cta: 'Desbloquear Recomendações',
      },
    },

    guides: {
      badge: 'Guias Fiscais',
      title: 'Aprenda sobre o IRS português',
      subtitle: 'Guias educativos gratuitos para entender como funciona o sistema fiscal.',
      irsGuide: {
        title: 'Como Funciona o IRS',
        description: 'Categorias de rendimento, escalões, deduções, e o processo de entrega.',
      },
      irsJovem: {
        title: 'IRS Jovem 2025',
        description:
          'Elegibilidade, taxas de isenção, limites, e como ativar o benefício no Portal.',
      },
      jointFiling: {
        title: 'Conjunta vs Separada',
        description: 'Quando compensa a tributação conjunta? Exemplos práticos com números reais.',
      },
      readMore: 'Ler guia',
    },

    faq: {
      badge: 'Perguntas Frequentes',
      title: 'Dúvidas comuns',
      q1: 'O FiscalPT é mesmo gratuito?',
      a1: 'Sim. A análise fiscal completa — incluindo comparação de cenários, IRS Jovem, NHR, taxas efetivas, e relatório PDF — é 100% gratuita e sem registo. As recomendações acionáveis com passos detalhados são um extra pago (€9,99 por consulta).',
      q2: 'Os meus dados estão seguros?',
      a2: 'Os documentos que carrega são processados localmente no seu browser. Nunca saem do seu computador. O cálculo fiscal é inteiramente local. Apenas se optar pelo consultor AI é que dados anonimizados (sem nomes) são enviados para gerar respostas.',
      q3: 'O que significa "motor determinístico"?',
      a3: 'Significa que o FiscalPT não usa IA para fazer contas. Os cálculos usam as mesmas tabelas e fórmulas oficiais da Autoridade Tributária, implementadas em código verificado com centenas de testes. O resultado é previsível e reprodutível — não depende de probabilidades.',
      q4: 'Posso confiar nos resultados?',
      a4: 'O motor fiscal é validado contra demonstrações de liquidação reais da AT. A precisão é verificada ao cêntimo. No entanto, o FiscalPT é uma ferramenta informativa — recomendamos sempre a consulta de um contabilista certificado para decisões finais.',
      q5: 'Que documentos posso carregar?',
      a5: 'XML do Modelo 3 (ficheiro da declaração), PDF do comprovativo de entrega, PDF da demonstração de liquidação, ou copiar/colar os dados de despesas do Portal das Finanças. O XML é o formato mais completo.',
      q6: 'A IA faz os cálculos fiscais?',
      a6: 'Não. A IA é usada apenas como consultor para explicar os resultados do motor determinístico. Nunca faz cálculos, nunca inventa números. Os dados pessoais são anonimizados antes de serem partilhados com o modelo de linguagem.',
    },

    cta: {
      title: 'Pare de pagar mais do que deve',
      subtitle:
        'Carregue a sua declaração e descubra em minutos quanto pode poupar. Gratuito, sem registo, sem compromisso.',
      button: 'Simular agora — é grátis',
    },
  },

  analyze: {
    steps: {
      upload: 'Carregar',
      questionnaire: 'Completar',
      results: 'Resultados',
    },
    stepLabel: 'Passo {step}: {name}',
    stepCompleted: '{label} (concluído, clique para voltar)',
    progressLabel: 'Progresso',
    title: 'Análise Fiscal',
    subtitle:
      'Carregue os seus documentos fiscais (XML do Modelo 3, comprovativos ou demonstrações de liquidação).',
    docsLoaded: 'Documentos carregados',
    fiscalYear: 'Ano fiscal {year}',
    fiscalYears: '{count} anos fiscais ({years})',
    loadNewDocs: 'Carregar novos documentos',
    errorTitle: 'Erro no cálculo',
    calcError: 'Erro ao calcular impostos. Verifique os dados e tente novamente.',
    calcErrorPrefix: 'Erro no cálculo: {message}',
    reportMismatch: 'Reportar diferença',
    reportSent: 'Reportado ✓',
    skipToResults: 'Analisar agora',
    skipToResultsDesc: 'Usar valores predefinidos conservadores',
    defaultsUsedWarning:
      'A utilizar valores predefinidos — personalize o questionário para resultados mais precisos',
    spouseIncompleteWarning:
      'Declaração do cônjuge não carregada — a comparação conjunta/separada não está disponível. Carregue a declaração do cônjuge para uma análise completa.',
    approximateResultsWarning:
      'Com base na informação fornecida, os resultados são apenas indicativos. Para uma análise mais precisa, preencha o questionário e forneça o máximo de documentação possível.',
    missingDeductionsWarning:
      'Deduções não fornecidas — a utilizar o valor predefinido de €250 (despesas gerais). Carregue o documento de liquidação ou preencha as deduções para resultados mais precisos.',
    noDocuments:
      'Não tem os documentos à mão? Experimente a Simulação Rápida para uma estimativa instantânea — pode voltar aqui depois com os documentos.',
    noDocumentsCta: 'Simulação Rápida',
    draftXmlTip:
      'Dica: para o ano corrente (2025), pode obter o XML como rascunho no Portal das Finanças sem submeter a declaração. Não precisa de entregar o IRS para usar esta ferramenta.',
  },

  upload: {
    docTypes: {
      xml: 'XML Modelo 3',
      comprovativo: 'Comprovativo de Entrega',
      liquidacao: 'Demonstração de Liquidação',
      unknown: 'Documento não reconhecido',
    },
    filingStatus: {
      joint: 'Casado – tributação conjunta',
      separate: 'Casado – tributação separada',
      single: 'Singular',
    },
    deductionCategories: {
      general: 'Gerais familiares',
      health: 'Saúde',
      education: 'Educação',
      housing: 'Imóveis',
      careHome: 'Lares',
      invoiceRequirement: 'Exigência de fatura',
      domesticWork: 'Trabalho doméstico',
    },
    memberRoles: {
      taxpayer: 'Contribuinte',
      dependent: 'Dependente',
      ascendant: 'Ascendente',
    },
    dropzone: 'Arraste ou clique para carregar',
    remove: 'Remover',
    processing: 'A processar…',
    unknownYear: 'Ano desconhecido',
    howToGet: 'Como obter este ficheiro?',
    openPortal: 'Abrir no Portal',
    openPortalStep: 'Abrir Portal das Finanças',
    copyPasteStep: 'Selecione tudo (Ctrl+A), copie (Ctrl+C) e cole abaixo (Ctrl+V)',
    selectYear: 'Selecione o ano',
    pasteHere: 'Cole aqui o conteúdo da página do Portal das Finanças (Ctrl+V)…',
    pasteDeductionsFor: 'Colar deduções para NIF {nif}, ano {year}',
    paste: 'Colar',
    clipboardBlocked: 'O navegador bloqueou o acesso à área de transferência. Use',
    clipboardBlockedSuffix: 'no campo acima.',
    endSession: 'Terminar sessão e',
    startSession: 'iniciar sessão no Portal com',
    oneYear: '1 ano',
    nYears: '{n} anos',
    required: 'Obrigatório',
    optional: 'Opcional',
    recommended: 'Recomendado',
    allHaveLiquidacao:
      'Todas as declarações têm liquidação — as deduções de gerais, saúde, educação e fatura serão derivadas automaticamente. Cole os dados do Portal apenas se tiver despesas de',
    housing: 'habitação',
    careHomes: 'lares',
    domesticWork: 'trabalho doméstico',
    xmlDetected: 'XML detetado — esta secção aceita apenas a liquidação em PDF.',
    wrongDocType:
      'Este ficheiro parece ser uma liquidação, não uma declaração. Carregue-o na secção "Demonstração de Liquidação".',
    notLiquidacao: 'Este ficheiro não parece ser uma demonstração de liquidação.',
    unrecognizedDoc:
      'Tipo de documento não reconhecido. Esperado: declaração IRS (XML ou comprovativo PDF) ou demonstração de liquidação (PDF).',
    maxFiles: 'Máximo de {max} ficheiros nesta secção.',
    duplicateFile: 'Ficheiro duplicado: {name}',
    needDeclaration: 'É necessário carregar pelo menos uma declaração de IRS.',
    waitProcessing: 'Aguarde o processamento de todos os ficheiros.',
    deductionExpenses: 'Despesas para Deduções',
    deductionExpensesRequired:
      'É necessário fornecer as despesas para deduções dos contribuintes sem liquidação: {names}. Abra a secção "Despesas para Deduções" e cole os dados do Portal das Finanças.',
    pdfFallbackNote:
      'Dados extraídos do comprovativo PDF. O ficheiro XML do Modelo 3 permite uma extração mais completa e fiável. O PDF pode não incluir datas de nascimento, deduções específicas, ou anexos não suportados (E, F, G, H). Recomendamos usar o XML para resultados mais precisos.',
    liquidacaoYearMismatch:
      'A liquidação é do ano {liqYear}, mas a declaração é de {declYear}. Carregue a liquidação correspondente ao mesmo ano.',
    liquidacao: 'Liquidação',
    duplicateYearWarning:
      'O ano {year} aparece tanto na declaração principal como nos anos anteriores. A declaração principal será usada.',
    extractionFailed:
      'Não foi possível extrair dados. Carregue o ficheiro XML do Modelo 3 IRS (disponível no Portal das Finanças).',
    portalInstructions:
      'Para cada pessoa do agregado, consulte as despesas no Portal das Finanças e cole o conteúdo da página. Agrupe todos os anos por NIF para minimizar mudanças de sessão.',
    taxpayers: 'Contribuintes',
    dependents: 'Dependentes',
    dependentsHelp:
      'As despesas em nome de dependentes podem aumentar as deduções à coleta do agregado (saúde, educação, etc.). Inicie sessão com o NIF do dependente (não o dos pais).',
    ascendants: 'Ascendentes',
    ascendantsHelp:
      'As despesas de saúde e lares em nome de ascendentes podem ser deduzidas à coleta do agregado. Inicie sessão com o NIF do ascendente.',
    declarationTitle: 'Declaração de IRS',
    declarationRequired: 'Obrigatório',
    declarationDesc: 'Declaração de IRS tal como submetida no Portal das Finanças',
    declarationSpouseNote:
      'Se o agregado tem dois titulares (casados/unidos de facto), carregue as declarações de ambos — mesmo em tributação separada.',
    xmlFile: 'Ficheiro XML',
    pdfFile: 'Comprovativo PDF',
    xmlDesc:
      'O ficheiro XML contém a declaração completa em formato estruturado. Suporta todos os anexos.',
    openPortalFinancas: 'Abrir no Portal das Finanças',
    xmlInstructions:
      '1. Aceda a irs.portaldasfinancas.gov.pt e autentique-se\n2. Vá a IRS → Entregar Declaração → Corrigir Declaração\n3. Selecione o ano pretendido e os NIFs dos titulares\n4. Clique em "Continuar"\n5. Na declaração aberta, clique no botão de gravar (disquete) para descarregar o XML\n6. Carregue o ficheiro aqui',
    pdfDesc:
      'O comprovativo PDF é a alternativa quando o XML não está disponível. Contém os dados da declaração, mas a extração é menos completa.',
    pdfInstructions:
      '1. Aceda a irs.portaldasfinancas.gov.pt e autentique-se\n2. Vá a IRS → Obter Comprovativos\n3. Na lista de declarações, clique no botão "COMPROVATIVO" do ano pretendido\n4. O PDF será descarregado automaticamente\n5. Carregue o ficheiro aqui',
    pdfAnnexNote:
      'Suporta Anexos A, B, J, L e SS. Para declarações com Anexos E, F, G ou H, utilize o ficheiro XML.',
    liquidacaoTitle: 'Demonstração de Liquidação',
    liquidacaoDesc:
      'Valida os cálculos e permite derivar deduções automaticamente, sem preenchimento manual.',
    liquidacaoInstructions:
      '1. Aceda a irs.portaldasfinancas.gov.pt e autentique-se\n2. Vá a IRS → Consultar Declaração\n3. Selecione o ano e clique em "Pesquisar"\n4. Clique em "Ver Detalhe" na declaração pretendida\n5. Clique no ícone de download junto ao Número de Liquidação\n6. Carregue o ficheiro aqui',
    guideSteps: {
      login: 'Aceda ao Portal das Finanças e autentique-se com o seu NIF e senha.',
      multiAuth:
        'Escolha o método de autenticação (senha, Chave Móvel Digital, ou Cartão de Cidadão).',
      xmlSubmittedTitle: 'Para anos já submetidos:',
      xmlCorrigirDeclaracao:
        'No menu lateral, clique em "Entregar Declaração" e depois em "Corrigir Declaração" para o ano pretendido.',
      xmlCorrigirGravar:
        'Com a declaração aberta, clique no ícone de gravar (disquete) na barra de ferramentas para descarregar o ficheiro XML.',
      xmlCurrentTitle: 'Para o ano corrente (ainda não submetido):',
      xmlCurrentEntregarDeclaracao:
        'No menu lateral, clique em "Entregar Declaração" e selecione "Preencher Declaração" para o ano corrente.',
      xmlCurrentPrefill:
        'Solicite o pré-preenchimento automático. Valide os dados, preencha o que faltar, e valide novamente.',
      xmlCurrentGravar:
        'Clique no ícone de gravar (disquete) para descarregar o XML — não é necessário submeter. Neste caso, não existe demonstração de liquidação.',
      pdfComprovativo:
        'Na lista de declarações, clique no botão "COMPROVATIVO" do ano pretendido para descarregar o PDF.',
      liqConsultar:
        'Selecione o ano, clique em "Pesquisar" e depois em "VER DETALHE" na declaração pretendida.',
      liqDownload:
        'Na janela de detalhe, clique no ícone de download junto ao Número de Liquidação para obter o PDF.',
    },
    previousYears: 'Anos Anteriores',
    previousYearsDesc:
      'Carregar declarações e liquidações de anos anteriores ({years}) de todos os titulares do agregado permite-nos:',
    previousYearsBenefit1: '✓ Validar cálculos com resultados oficiais conhecidos',
    previousYearsBenefit2: '✓ Detetar padrões (ex: não é o 1.º ano de rendimentos Cat. B)',
    previousYearsBenefit3: '✓ Otimizar declarações que ainda podem ser corrigidas',
    amendableNote:
      'Declarações de anos que ainda podem ser corrigidos ({years}) podem gerar recomendações de substituição. Os restantes servem para validação e contexto.',
    limitReached: 'Limite atingido ({max})',
    processingDocs: 'A processar documentos...',
    advance: 'Avançar',
    annexes: 'Anexos',
    documentSingular: 'documento',
    documentPlural: 'documentos',
    liquidacaoAvailable: 'Liquidação disponível',
    person: 'Pessoa',
    categoriesCount: '{count} categorias',
    removePastedData: 'Remover dados colados',
    noExpenses: 'Sem despesas comunicadas para este ano.',
    selectYearHintPrefix: 'Selecione o ano',
    selectYearHintSuffix: 'no link acima, faça Ctrl+A → Ctrl+C e cole aqui (Ctrl+V).',
    loginHintLiqOptional:
      'Opcional — a liquidação cobre gerais, saúde, educação e fatura. Cole apenas se tiver despesas de habitação, lares ou trabalho doméstico.',
    loginHintLiqOptionalShort:
      'Opcional — a liquidação já contém dados de deduções (gerais, saúde, educação, fatura). Cole os dados do Portal apenas se tiver despesas de habitação, lares ou trabalho doméstico.',
    nifMismatch:
      'O NIF no texto colado ({pastedNif}) não corresponde ao esperado ({expectedNif}). Certifique-se de que iniciou sessão no Portal com o NIF correto.',
    yearMismatchPaste:
      'O ano no texto colado ({pastedYear}) não corresponde ao esperado ({expectedYear}). Selecione o ano {expectedYear} no Portal antes de copiar.',
    yearNotAccepted: 'Ano {year} não aceite nesta secção. {hint}',
    yearHintPrevious: 'Aceita anos de {range}.',
    yearHintAmendable: 'Apenas anos que ainda podem ser submetidos ou corrigidos ({range}).',
    fileTooLarge: '"{name}" excede o limite de {max} MB.',
    fileEmpty: '"{name}" está vazio.',
    liquidacaoPdfOnly: '"{name}": a liquidação deve ser um ficheiro PDF.',
    errorProcessingFile: 'Erro a processar ficheiro',
    effectiveRateLabel: 'Taxa efetiva',
    or: 'ou',
  },

  questionnaire: {
    title: 'Informação Adicional',
    subtitle:
      'Precisamos de alguns dados que não foram encontrados nos documentos para um cálculo mais preciso.',
    progress: 'Progresso:',
    answered: '{answered} / {total} respondidas',
    criticalSingular: '{count} pergunta obrigatória',
    criticalPlural: '{count} perguntas obrigatórias',
    undo: 'Desfazer',
    redo: 'Refazer',
    estimatedValue: 'Valor estimado',
    why: 'Porquê?',
    selectPlaceholder: '— Selecionar —',
    yearPlaceholder: 'Ex: 1990',
    defaultValue: 'Predefinido',
    priority: {
      critical: 'Obrigatório',
      important: 'Importante',
      optional: 'Opcional',
    },
    dataComplete: 'Dados Completos',
    dataCompleteDesc: 'Toda a informação necessária foi extraída dos documentos.',
    skipWarningCritical:
      'Existem {count} pergunta(s) obrigatória(s) não respondida(s). O cálculo poderá ser impreciso.',
    skipWarningImportant:
      'Existem perguntas importantes não respondidas. O cálculo poderá ser menos preciso.',
    backToQuestions: 'Voltar às perguntas',
    continueAnyway: 'Continuar mesmo assim',
    answerRequired: 'Responda às perguntas obrigatórias para continuar.',
    incomeCategories: {
      A: 'Trabalho dependente (Cat. A)',
      B: 'Trabalho independente (Cat. B)',
      E: 'Rendimentos de capitais (Cat. E)',
      F: 'Rendimentos prediais (Cat. F)',
      G: 'Mais-valias (Cat. G)',
      H: 'Pensões (Cat. H)',
    },
    incomeCategoryDescriptions: {
      A: 'Salários e vencimentos de trabalho por conta de outrem — o que recebe como empregado(a).',
      B: 'Recibos verdes, freelance e atividade profissional independente.',
      E: 'Juros bancários, dividendos e outros rendimentos de investimentos financeiros.',
      F: 'Rendas recebidas de imóveis arrendados (casas, apartamentos, lojas).',
      G: 'Lucros da venda de imóveis, ações, criptomoedas ou outros ativos.',
      H: 'Reformas, pensões de velhice, invalidez ou sobrevivência.',
    },
    projection: {
      title: 'Projeção Fiscal {year}',
      description:
        'Projetar os impostos do próximo ano com base nos dados atuais. Utiliza as regras fiscais mais recentes disponíveis.',
      adjustHint:
        'Ajuste os rendimentos brutos esperados para {year}. Os valores estão pré-preenchidos com os do ano {primaryYear}.',
    },
  },

  results: {
    title: 'Resultado da Análise',
    dataWarningTitle: 'Alguns dados podem estar incompletos',
    totalSavings: 'Poupança potencial total: {amount}',
    proactiveSavingsFootnote:
      'A projeção otimizada assume que todas as recomendações são seguidas na totalidade.',
    projected: 'Projetado',
    projectedNote: 'Estimativa baseada nas regras fiscais mais recentes conhecidas',
    historical: 'histórico',
    historicalNote: 'Prazo de correção expirado — apenas para consulta',
    currentProjection: 'Projeção Atual',
    currentSituation: 'Situação Atual',
    submittedDeclaration: 'Declaração Submetida',
    optimizedScenario: 'Cenário Otimizado',
    saves: 'poupa {amount}',
    fiscalYear: 'Ano fiscal {year}',
    household: 'Agregado Familiar',
    income: 'Rendimento',
    irs: 'IRS',
    effectiveRate: 'Taxa efetiva',
    rate: 'Taxa',
    refund: 'Reembolso',
    toPay: 'A pagar',
    historicalEvolution: 'Evolução Histórica',
    combined: 'Agregado',
    incomeAndIrs: 'Rendimento & IRS',
    incomeAndIrsOptimized: 'Rendimento & IRS: Atual vs Otimizado',
    effectiveRateTitle: 'Taxa Efetiva',
    effectiveRateOptimized: 'Taxa Efetiva: Atual vs Otimizado',
    result: 'Resultado',
    resultOptimized: 'Resultado: Atual vs Otimizado',
    current: 'Atual',
    optimized: 'Otimizado',
    irsCurrentLabel: 'IRS Atual',
    irsOptimizedLabel: 'IRS Otimizado',
    notAmendable: 'Não alterável',
    year: 'Ano',
  },

  error: {
    title: 'Ocorreu um erro inesperado',
    defaultMessage: 'Algo correu mal. Tente novamente ou recarregue a página.',
    retry: 'Tentar novamente',
    reload: 'Recarregar página',
  },

  onboarding: {
    dialogLabel: 'Guia de introdução',
    closeLabel: 'Fechar guia',
    step1: {
      title: 'Carregar documentos',
      description:
        'Comece por carregar os seus documentos fiscais — XML do Modelo 3, comprovativos em PDF, ou demonstrações de liquidação.',
    },
    step2: {
      title: 'Completar informação',
      description:
        'O sistema identifica dados em falta e faz-lhe perguntas relevantes. Pode saltar este passo se não tiver informação adicional.',
    },
    step3: {
      title: 'Ver resultados',
      description:
        'Receba uma análise detalhada: comparação entre tributação conjunta e separada, IRS Jovem, NHR, e sugestões de poupança concretas.',
    },
  },

  skeleton: {
    calculating: 'A calcular impostos...',
  },

  review: {
    pageTitle: 'Verificar Dados Extraídos',
    pageSubtitle: 'Confirme ou corrija os dados extraídos dos seus documentos.',
    householdTitle: 'Agregado Familiar',
    closeEdit: 'Fechar edição',
    edit: 'Editar',
    fiscalYear: 'Ano fiscal',
    filingLabel: 'Tributação',
    filingType: 'Tipo de tributação',
    filing: {
      single: 'Individual',
      joint: 'Conjunta',
      separate: 'Separada',
    },
    taxpayers: 'Contribuintes',
    grossIncome: 'Rendimento bruto',
    name: 'Nome',
    incomes: 'Rendimentos',
    category: 'Categoria',
    gross: 'Bruto (€)',
    withholding: 'Retenção (€)',
    withholdingLabel: 'retenção:',
    ssLabel: 'SS:',
    removeIncome: 'Remover rendimento',
    income: 'Rendimento',
    deductions: 'Deduções',
    valuePlaceholder: 'Valor (€)',
    removeDeduction: 'Remover dedução',
    deduction: 'Dedução',
    specialRegimes: 'Regimes especiais',
    irsJovem: 'IRS Jovem',
    nhr: 'NHR',
    benefitYear: 'Ano de benefício (1-10)',
    nhrStartYear: 'Ano de início NHR',
    dependents: 'Dependentes',
    addDependent: 'Adicionar',
    noDependents: 'Sem dependentes registados.',
    defaultDependent: 'Dependente {n}',
    birthYear: 'Nascimento',
    birthLabel: 'nascimento:',
    removeDependent: 'Remover dependente',
    confirmAndCalculate: 'Confirmar e Calcular',
    incomeCategories: {
      A: 'Trabalho dependente (Cat. A)',
      B: 'Trabalho independente (Cat. B)',
      E: 'Rendimentos de capitais (Cat. E)',
      F: 'Rendimentos prediais (Cat. F)',
      G: 'Mais-valias (Cat. G)',
      H: 'Pensões (Cat. H)',
    },
    incomeCategoryDescriptions: {
      A: 'Salários e vencimentos de trabalho por conta de outrem — o que recebe como empregado(a).',
      B: 'Recibos verdes, freelance e atividade profissional independente.',
      E: 'Juros bancários, dividendos e outros rendimentos de investimentos financeiros.',
      F: 'Rendas recebidas de imóveis arrendados (casas, apartamentos, lojas).',
      G: 'Lucros da venda de imóveis, ações, criptomoedas ou outros ativos.',
      H: 'Reformas, pensões de velhice, invalidez ou sobrevivência.',
    },
    deductionCategories: {
      general: 'Despesas gerais',
      health: 'Saúde',
      education: 'Educação',
      housing: 'Habitação',
      care_home: 'Lares',
      ppr: 'PPR',
      alimony: 'Pensão de alimentos',
      fatura: 'Fatura (IVA)',
      trabalho_domestico: 'Trabalho doméstico',
      disability_rehab: 'Reabilitação (deficiência)',
      disability_insurance: 'Seguro de vida (deficiência)',
      sindical: 'Quotizações sindicais',
    },
  },

  theme: {
    label: 'Mudar tema',
    light: 'Mudar para tema claro',
    dark: 'Mudar para tema escuro',
  },

  pdf: {
    reportTitle: 'Relatório de Análise Fiscal',
    tagline: 'Otimização fiscal inteligente',
    member: 'Membro',
    grossIncome: 'Rend. Bruto',
    taxableIncome: 'Rend. Coletável',
    withholding: 'Retenções',
    socialSecurity: 'Seg. Social',
    refundResult: 'Resultado',
    total: 'Total',
    optimizations: 'Oportunidades de Otimização',
    noOptimizations: 'Nenhuma otimização adicional identificada para este cenário.',
    optimizationsTeaser:
      '{count} otimizações identificadas com poupança estimada de {amount}. Desbloqueie as recomendações em fiscalpt.com.',
    recommendations: 'Recomendações Personalizadas',
    priority_high: 'Prioridade Alta',
    priority_medium: 'Prioridade Média',
    priority_low: 'Prioridade Baixa',
    disclaimer: 'Informação fiscal, não aconselhamento. Consulte um contabilista certificado.',
  },

  locale: {
    switchToEn: 'Switch to English',
    switchToPt: 'Mudar para Português',
  },

  privacy: {
    badge: '100% local — os seus dados nunca saem do browser',
    footerNote:
      'Todo o processamento é feito no seu browser. Nenhum dado é enviado para servidores. Verifique no separador Rede (F12).',
    landingFeatureTitle: 'Privacidade Total',
    landingFeatureDesc:
      'Os seus documentos fiscais nunca saem do seu computador. Todo o processamento é feito localmente no browser — zero servidores, zero risco.',
  },

  legal: {
    backToHome: 'Voltar ao início',
    seeAlsoTerms: 'Consulte também os nossos',
    termsLink: 'Termos de Serviço',
    privacyLink: 'Política de Privacidade',
    termos: {
      title: 'Termos de Serviço',
      lastUpdated: 'Última atualização: {date}',
      section1Title: '1. Descrição do Serviço',
      section1P1:
        'O FiscalPT é uma plataforma de informação e simulação fiscal para contribuintes individuais e agregados familiares em Portugal. A plataforma permite o carregamento de documentos fiscais (XML Modelo 3 IRS, comprovativos PDF, liquidações PDF), a extração automática de dados, e a simulação de cenários de otimização fiscal.',
      section1P2Bold:
        'O FiscalPT é uma ferramenta informativa e NÃO constitui aconselhamento fiscal profissional.',
      section1P2After:
        'Os resultados apresentados não substituem a consulta de um contabilista certificado ou consultor fiscal habilitado.',
      section2Title: '2. Responsabilidades do Utilizador',
      section2P1: 'Ao utilizar o FiscalPT, o utilizador compromete-se a:',
      section2Li1: 'Fornecer dados fiscais corretos e completos;',
      section2Li2:
        'Verificar todos os resultados e simulações antes de tomar qualquer decisão fiscal;',
      section2Li3:
        'Consultar um contabilista certificado ou consultor fiscal para validação dos resultados obtidos;',
      section2Li4: 'Não utilizar a plataforma para fins ilegais ou fraudulentos;',
      section2Li5:
        'Assumir total responsabilidade pelas decisões fiscais tomadas com base nos resultados apresentados.',
      section3Title: '3. Isenção de Responsabilidade',
      section3P1:
        'Os cálculos e simulações apresentados pelo FiscalPT têm carácter exclusivamente informativo. Apesar de todos os esforços para garantir a precisão dos cálculos com base na legislação fiscal portuguesa em vigor:',
      section3Li1: 'Os resultados podem conter erros ou imprecisões;',
      section3Li2: 'A legislação fiscal pode ser alterada sem aviso prévio;',
      section3Li3: 'Situações fiscais específicas podem não ser abrangidas pela plataforma;',
      section3Li4:
        'O FiscalPT não assume qualquer responsabilidade por perdas, danos ou penalizações resultantes da utilização dos resultados apresentados.',
      section3P2Bold:
        'A utilização do FiscalPT é feita inteiramente por conta e risco do utilizador.',
      section4Title: '4. Processamento de Dados',
      section4P1Before: 'Todos os documentos fiscais carregados são processados ',
      section4P1Bold: 'inteiramente no navegador do utilizador (client-side)',
      section4P1After:
        '. Nenhum documento fiscal ou dado pessoal de IRS é enviado para os nossos servidores ou para terceiros.',
      section4P2Before:
        'Os únicos dados enviados para os nossos servidores são eventos de analítica (páginas visitadas, utilização anónima da plataforma) para fins de melhoria do serviço. Para mais informações, consulte a nossa ',
      section4P2After: '.',
      section5Title: '5. Pagamento',
      section5P1:
        'O FiscalPT pode oferecer funcionalidades premium mediante pagamento único processado através do Stripe. Por se tratar de um produto digital com entrega imediata, não são aceites devoluções ou reembolsos após a conclusão do pagamento, exceto nos casos previstos por lei.',
      section6Title: '6. Propriedade Intelectual',
      section6P1Before: 'O código-fonte do FiscalPT é disponibilizado sob a licença ',
      section6P1Bold: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
      section6P1After:
        '. O utilizador pode consultar, modificar e redistribuir o código de acordo com os termos desta licença.',
      section6P2:
        'O nome "FiscalPT", logótipo e identidade visual são propriedade dos seus criadores e não estão abrangidos pela licença de código aberto.',
      section7Title: '7. Lei Aplicável e Jurisdição',
      section7P1:
        'Os presentes Termos de Serviço regem-se pela legislação portuguesa. Para a resolução de qualquer litígio emergente dos presentes termos, são competentes os tribunais da comarca de Lisboa, com renúncia expressa a qualquer outro foro.',
      section8Title: '8. Alterações aos Termos',
      section8P1:
        'O FiscalPT reserva-se o direito de alterar os presentes Termos de Serviço a qualquer momento. As alterações entram em vigor após a sua publicação nesta página. A continuação da utilização do serviço após a publicação de alterações constitui aceitação dos novos termos.',
      section9Title: '9. Contacto',
      section9P1Before:
        'Para questões relacionadas com estes Termos de Serviço, contacte-nos através de ',
      section9P1After: '.',
    },
    privacidade: {
      title: 'Política de Privacidade',
      lastUpdated: 'Última atualização: {date}',
      section1Title: '1. Responsável pelo Tratamento',
      section1P1Before:
        'O responsável pelo tratamento dos dados pessoais é {dataController}, operador da plataforma FiscalPT. Para questões relacionadas com a proteção de dados, contacte o Encarregado de Proteção de Dados (DPO) através de ',
      section1P1After: '.',
      section2Title: '2. Conformidade com o RGPD',
      section2P1:
        'A presente política é elaborada em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento (UE) 2016/679) e com a legislação portuguesa de proteção de dados pessoais (Lei n.º 58/2019).',
      section3Title: '3. Dados Processados no Navegador (Client-Side)',
      section3P1Before:
        'Os documentos fiscais (XML Modelo 3 IRS, comprovativos PDF, liquidações PDF) carregados na plataforma são processados ',
      section3P1Bold: 'inteiramente no navegador do utilizador',
      section3P1After: '. Isto significa que:',
      section3Li1:
        'Nenhum documento fiscal é enviado para os servidores do FiscalPT ou para terceiros;',
      section3Li2:
        'Nenhum dado pessoal de IRS (rendimentos, deduções, NIF, etc.) é transmitido pela rede;',
      section3Li3:
        'Todos os cálculos e simulações são executados localmente no dispositivo do utilizador;',
      section3Li4:
        'Os dados permanecem exclusivamente no navegador e são eliminados quando o utilizador fecha a página ou limpa os dados do navegador.',
      section4Title: '4. Dados Enviados para Servidores',
      section4P1:
        'Os seguintes dados são enviados para os nossos servidores ou para serviços de terceiros:',
      section4Li1Bold: 'Eventos de analítica:',
      section4Li1Text:
        ' páginas visitadas, ações anónimas na plataforma (ex.: "utilizador iniciou simulação"), tipo de dispositivo e navegador. Estes dados são anonimizados e não contêm informação fiscal pessoal;',
      section4Li2Bold: 'Dados de pagamento:',
      section4Li2TextBefore:
        ' quando o utilizador efetua um pagamento, os dados são processados diretamente pelo Stripe. O FiscalPT não armazena dados de cartão de crédito ou débito. Consulte a ',
      section4Li2Link: 'Política de Privacidade do Stripe',
      section4Li2TextAfter: '.',
      section5Title: '5. Cookies',
      section5P1:
        'O FiscalPT utiliza apenas cookies essenciais ao funcionamento da plataforma (ex.: preferência de tema, idioma). Não utilizamos cookies de rastreamento, cookies publicitários ou cookies de terceiros.',
      section6Title: '6. Retenção de Dados',
      section6P1Bold: 'Dados fiscais:',
      section6P1Text:
        ' não são retidos — são processados exclusivamente no navegador do utilizador e nunca armazenados nos nossos servidores.',
      section6P2Bold: 'Dados de analítica:',
      section6P2Text:
        ' os eventos anonimizados são retidos pelo período necessário para análise e melhoria do serviço, sendo eliminados periodicamente.',
      section6P3Bold: 'Dados de pagamento:',
      section6P3Text: ' retidos pelo Stripe de acordo com as suas políticas e obrigações legais.',
      section7Title: '7. Direitos do Utilizador (RGPD — Artigos 15.º a 20.º)',
      section7P1:
        'Nos termos do RGPD, o utilizador tem os seguintes direitos relativamente aos seus dados pessoais:',
      section7Li1Bold: 'Direito de acesso',
      section7Li1Text: ' (Art. 15.º) — solicitar informação sobre os dados pessoais tratados;',
      section7Li2Bold: 'Direito de retificação',
      section7Li2Text: ' (Art. 16.º) — solicitar a correção de dados inexatos;',
      section7Li3Bold: 'Direito ao apagamento',
      section7Li3Text: ' (Art. 17.º) — solicitar a eliminação dos dados pessoais;',
      section7Li4Bold: 'Direito à limitação do tratamento',
      section7Li4Text: ' (Art. 18.º) — solicitar a restrição do tratamento dos dados;',
      section7Li5Bold: 'Direito à portabilidade',
      section7Li5Text:
        ' (Art. 20.º) — receber os dados pessoais num formato estruturado e legível por máquina.',
      section7P2Before: 'Para exercer qualquer um destes direitos, contacte-nos através de ',
      section7P2After: '. Responderemos no prazo de 30 dias.',
      section8Title: '8. Como Verificar',
      section8P1:
        'O utilizador pode verificar que os seus documentos fiscais não são enviados para servidores externos. Para isso:',
      section8Li1: 'Abra as Ferramentas de Programador do navegador (tecla F12);',
      section8Li2Before: 'Selecione o separador ',
      section8Li2Bold: 'Network',
      section8Li2After: ' (Rede);',
      section8Li3: 'Carregue um documento fiscal na plataforma;',
      section8Li4:
        'Verifique que não são efetuados pedidos de rede com o conteúdo do documento — todo o processamento ocorre localmente.',
      section9Title: '9. Autoridade de Controlo',
      section9P1Before:
        'Se considerar que o tratamento dos seus dados pessoais viola o RGPD, tem o direito de apresentar uma reclamação junto da Comissão Nacional de Proteção de Dados (CNPD): ',
      section9P1Link: 'www.cnpd.pt',
      section9P1After: '.',
      section10Title: '10. Alterações à Política de Privacidade',
      section10P1:
        'O FiscalPT reserva-se o direito de alterar a presente Política de Privacidade a qualquer momento. As alterações entram em vigor após a sua publicação nesta página.',
      section11Title: '11. Contacto',
      section11P1Before:
        'Para questões relacionadas com a proteção de dados, contacte o Encarregado de Proteção de Dados (DPO) através de ',
      section11P1After: '.',
    },
  },

  share: {
    button: 'Partilhar resultados',
    title: 'Partilhar',
    textWithSavings:
      '💰 Descobri que posso poupar {amount} nos impostos de {years} com o FiscalPT — {count} otimizações encontradas!',
    textNoSavings: '✅ Verifiquei os meus impostos de {years} com o FiscalPT — tudo otimizado!',
    copyLink: 'Copiar texto',
    copied: 'Copiado!',
  },

  chat: {
    open: 'Abrir consultor fiscal',
    close: 'Fechar chat',
    title: 'Consultor Fiscal AI',
    welcome: 'Tem dúvidas sobre a sua análise? Pergunte-me!',
    suggestion1: 'Porque é que a tributação conjunta poupa mais?',
    suggestion2: 'O que é o IRS Jovem e aplica-se a mim?',
    suggestion3: 'Como posso reduzir o IRS no próximo ano?',
    placeholder: 'Escreva a sua pergunta...',
    limitPlaceholder: 'Limite de mensagens atingido',
    inputLabel: 'Pergunta ao consultor fiscal',
    send: 'Enviar mensagem',
    error: 'Erro ao processar a mensagem. Tente novamente.',
    limitReached:
      'Atingiu o limite de {limit} mensagens para esta consulta. Para mais apoio, contacte um contabilista certificado.',
    disclaimer: 'AI-enhanced · Não substitui aconselhamento fiscal profissional',
    ctaDescription:
      'Tire dúvidas sobre os seus resultados com o nosso consultor fiscal AI. Respostas baseadas na sua análise real.',
    openButton: 'Falar com o consultor',
    trustEngine: 'Resultados verificados pelo motor fiscal',
    trustAi: 'AI apenas explica e responde',
    trustPrivacy: 'Dados pessoais não partilhados',
    trustBanner:
      '🔒 Os resultados são calculados por um motor fiscal determinístico. A AI apenas explica — os seus dados pessoais não são partilhados.',
  },

  paywall: {
    // Teaser card (top of results)
    teaserOptimization: '{count} otimização encontrada',
    teaserOptimizations: '{count} otimizações encontradas',
    teaserUnlockPrefix: 'Desbloqueie o guia passo-a-passo para poupar',
    teaserChatHint: '+ consultor fiscal AI',
    teaserCta: 'Ver como',

    // Locked paywall card
    title: 'Recomendações Personalizadas',
    description:
      'Identificámos {count} {label} para o seu agregado. Desbloqueie o guia passo-a-passo para implementar cada uma.',
    optimizationSingular: 'otimização',
    optimizationPlural: 'otimizações',
    featureSteps: 'Instruções passo-a-passo no Portal das Finanças',
    featureImpact: 'Impacto estimado de cada alteração',
    featureLinks: 'Links diretos para os formulários relevantes',
    featureChat: 'Consultor fiscal AI incluído — tire dúvidas sobre os resultados',
    unlockWithDiscount: 'Desbloquear com desconto de {percent}%',
    unlockPrice: 'Desbloquear por €9,99',
    hasDiscount: 'Tem um código de desconto?',
    discountLabel: 'Código de desconto',
    discountPlaceholder: 'Código de desconto',
    discountApply: 'Aplicar',
    discountChecking: '...',
    footer: 'Pagamento único · Sem subscrição · Reembolso garantido se insatisfeito',
    poweredBy: 'Powered by Stripe',

    // Loading & error states
    generating: 'A gerar as suas recomendações...',
    paymentNotVerified: 'Pagamento não verificado',
    recommendationsError: 'Erro ao gerar recomendações',
    unknownError: 'Erro desconhecido',
    tryAgain: 'Tentar novamente',
    discountValidationError: 'Erro ao validar código',
    discountError: 'Erro',

    // Checkout state
    checkoutTitle: 'Desbloquear Recomendações',
    checkoutCancel: 'Cancelar',
    stripeEmailNote:
      'O email pedido a seguir é exigido pelo Stripe, o nosso processador de pagamentos. O FiscalPT não armazena nem necessita do seu email.',

    // No-optimizations state
    noOptTitle: 'Declaração otimizada',
    noOptDescription:
      'Não identificámos otimizações adicionais. A sua situação fiscal já está bem configurada.',
    aiAssistantTitle: 'Assistente Fiscal AI',
    chatQuestion: 'Tem dúvidas sobre a sua declaração ou quer explorar cenários alternativos?',
    chatCta: 'Consultar assistente fiscal AI · €9,99',
    unlockFree: 'Desbloquear gratuitamente',

    // Unlocked display
    unlockedTitle: 'Recomendações Personalizadas',
    yearLabel: 'Ano {year}',
    priorityHigh: 'Alta',
    priorityMedium: 'Média',
    priorityLow: 'Baixa',
    openPortal: 'Abrir no Portal',

    // Report a problem
    reportLink: 'As recomendações não são aplicáveis? Reportar um problema',
    reportTitle: 'Reportar um problema',
    reportDescription:
      'Se as recomendações não são aplicáveis à sua situação ou contêm erros, descreva o problema abaixo. Analisaremos o caso e, se justificado, processaremos o reembolso.',
    reportEmailLabel: 'Email de contacto',
    reportEmailPlaceholder: 'seu@email.com',
    reportDescriptionLabel: 'Descrição do problema',
    reportDescriptionPlaceholder:
      'Descreva porque as recomendações não são aplicáveis à sua situação...',
    reportCancel: 'Cancelar',
    reportSending: 'A enviar...',
    reportSend: 'Enviar',
    reportSentTitle: 'Mensagem enviada',
    reportSentDescription: 'Iremos analisar a sua situação e responder por email em breve.',
  },
  simulation: {
    title: 'Simulação Rápida',
    subtitle: 'Estime o seu IRS em menos de 2 minutos',
    filingStatus: 'Situação Fiscal',
    single: 'Solteiro/a',
    married: 'Casado/a',
    taxYear: 'Ano Fiscal',
    income: 'Rendimentos',
    personLabel: 'Sujeito Passivo {letter}',
    singleLabel: 'Contribuinte',
    birthYear: 'Ano de nascimento',
    grossCatA: 'Cat A (trabalho dependente)',
    grossCatAHelp: 'Rendimento bruto anual de trabalho dependente (antes de impostos)',
    grossCatB: 'Cat B (trabalho independente)',
    grossCatBHelp: 'Rendimento bruto anual de trabalho independente (recibos verdes)',
    nhr: 'Residente Não Habitual (NHR)?',
    nhrHelp:
      'Se tem estatuto de Residente Não Habitual, taxa fixa de 20% sobre rendimentos qualificados',
    dependents: 'Dependentes',
    dependentsUnder3: 'Filhos < 3 anos',
    dependents3to6: 'Filhos 3–6 anos',
    dependentsOver6: 'Filhos > 6 anos',
    calculate: 'Calcular',
    calculating: 'A calcular...',
    resultsTitle: 'Simulação Fiscal',
    disclaimer:
      '* Valores estimados com base em pressupostos padrão. Para resultados precisos, faça uma Análise Personalizada com os seus documentos fiscais.',
    fullAnalysisCta: 'Resultados mais precisos',
    fullAnalysisDesc:
      'Carregue os seus documentos da AT para uma análise detalhada com valores reais de retenção, deduções e comparação com anos anteriores.',
    aiConsultCta: 'Consulta fiscal com IA',
    aiConsultDesc:
      'Fale com o nosso consultor fiscal AI para recomendações personalizadas à sua situação específica.',
    switchToFull: 'Análise Personalizada',
    switchToSim: 'Simulação Rápida',
    birthYearError: 'Ano de nascimento inválido',
    incomeError: 'Introduza pelo menos um rendimento',
    share: 'Partilhar',
    shareCopied: 'Link copiado!',
    shareNote: 'O link contém apenas os valores inseridos, sem dados pessoais.',
    savingsFound: 'Poupança identificada',
    teaserOptimization: '{count} otimização identificada',
    teaserOptimizations: '{count} otimizações identificadas',
    teaserSavingsPrefix: 'Poupe até',
    teaserSavingsSuffix: 'com a análise personalizada',
    teaserCta: 'Analisar agora',
    examplesLabel: 'Ou experimente com um exemplo:',
    example_employee: 'Trabalhador',
    example_employee_desc: 'Solteiro, €25k Cat A',
    example_coupleKids: 'Casal com filhos',
    example_coupleKids_desc: '€30k + €22k, 2 filhos',
    example_irsJovem: 'IRS Jovem',
    example_irsJovem_desc: '26 anos, €20k Cat A',
    example_selfEmployed: 'Recibo verde',
    example_selfEmployed_desc: 'Solteiro, €35k Cat B',
    example_mixedCouple: 'Casal misto',
    example_mixedCouple_desc: '€28k Cat A + €18k Cat B',
  },
} as const satisfies Dictionary

export default pt
export type PtDict = typeof pt
