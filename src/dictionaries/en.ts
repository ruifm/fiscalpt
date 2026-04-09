import type { DictShape } from '@/lib/i18n'
import type { PtDict } from './pt'

const en: DictShape<PtDict> = {
  common: {
    back: 'Back',
    continue: 'Continue',
    close: 'Close',
    skip: 'Skip',
    next: 'Next',
    start: 'Start',
    yes: 'Yes',
    no: 'No',
    print: 'Print',
    downloadPdf: 'Download PDF',
    newAnalysis: 'New analysis',
    footer: '© {year} FiscalPT. Tax information, not advice. Consult a certified accountant.',
    progress: 'Progress',
    step: 'Step {current} of {total}',
  },

  nav: {
    features: 'Features',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    guides: 'Guides',
    blog: 'Blog',
    startAnalysis: 'Start Analysis',
    analysis: 'Analysis',
    mainNavigation: 'Main navigation',
    footer: 'Footer',
  },

  landing: {
    hero: {
      badge: 'Deterministic tax engine · 2025 tables',
      title: 'Find out how much you are ',
      titleHighlight: 'overpaying',
      titleEnd: ' in taxes',
      subtitle:
        'Upload your IRS declaration and receive a complete analysis in minutes. Calculation engine verified to the cent, automatic scenario comparison, and actionable recommendations with Portal das Finanças links.',
      cta: 'Start free analysis',
      secondary: 'How it works',
    },

    trust: {
      engine: 'Deterministic engine',
      engineDesc:
        'No AI in calculations — only verified math with official IRS tables. Over 1,000 automated tests, 94% code coverage.',
      privacy: 'Total privacy',
      privacyDesc: 'Your documents are processed locally in the browser. Zero servers, zero risk.',
      openSource: 'Open source',
      openSourceDesc:
        'Source code public on GitHub. View the logic, report issues, contribute. Full transparency.',
      noSignup: 'No registration',
      noSignupDesc: 'Start your analysis immediately. No account, no email, no hassle.',
    },

    howItWorks: {
      badge: 'How It Works',
      title: 'From declaration to savings in 3 steps',
      subtitle:
        'Upload your tax documents and the engine does the rest. No complications, no registration.',
      step1: {
        title: 'Upload documents',
        description:
          'Modelo 3 XML, comprovativo PDF, or liquidação statement. The system extracts everything automatically.',
      },
      step2: {
        title: 'Complete the data',
        description:
          "The smart questionnaire identifies what's missing — dependents, special regimes, deductions — and only asks what's needed.",
      },
      step3: {
        title: 'Receive the analysis',
        description:
          'Joint vs separate comparison, IRS Jovem, NHR, effective rate, identified savings, and PDF report.',
      },
    },

    preview: {
      badge: 'See It in Action',
      title: 'Clear results, concrete savings',
      subtitle:
        'Each analysis shows your current situation vs the optimized scenario, with the exact amount you can save.',
      alt: 'Example tax analysis result showing comparison between current situation and optimized scenario with savings over €4,000',
    },

    features: {
      badge: 'Features',
      title: 'Everything you need to optimize your IRS',
      subtitle: 'Deterministic calculation engine verified to the cent against AT values.',
      upload: {
        title: 'Document Upload',
        description:
          'Upload Modelo 3 XML, comprovativo PDF, or liquidação statement. Supports multiple years for historical analysis.',
      },
      joint: {
        title: 'Joint vs Separate',
        description:
          'Automatic comparison of both filing scenarios. See exactly how much you save with each option.',
      },
      irsJovem: {
        title: 'IRS Jovem',
        description:
          'Eligibility check and impact calculation. 50% exemption for the first 5 years, 25% for the next 5.',
      },
      nhr: {
        title: 'NHR Regime',
        description:
          'Non-Habitual Resident simulation with 20% autonomous rate on high-value activities.',
      },
      engine: {
        title: 'Exact Calculation',
        description:
          '2024 and 2025 brackets, minimum subsistence, solidarity surcharge, deductions — verified to the cent.',
      },
      recommendations: {
        title: 'Actionable Recommendations',
        description:
          'Step-by-step instructions with direct links to Portal das Finanças. Know exactly what to change.',
      },
      aiChat: {
        title: 'AI Tax Consultant',
        description:
          'Ask questions about your results with the AI consultant. Calculations are from the engine — AI only explains.',
      },
      catB: {
        title: 'Self-Employment',
        description:
          'Activity-based coefficients, 15% expense rule, new activity reductions, Social Security.',
      },
      multiYear: {
        title: 'Multi-Year Analysis',
        description:
          'Compare up to 5 years in parallel. See your tax burden evolution and identify opportunities.',
      },
      pdf: {
        title: 'PDF Report',
        description:
          'Export the complete analysis as a professional PDF. Includes all scenarios, deductions and recommendations.',
      },
      deductions: {
        title: 'Optimized Deductions',
        description:
          'Health, education, housing, PPR, e-fatura — gap analysis to maximize each deduction within legal limits.',
      },
      privacy: {
        title: 'Total Privacy',
        description:
          'Documents processed locally in the browser. Personal data not sent to servers. Verify with Ctrl+U.',
      },
    },

    engine: {
      badge: 'Tax Engine',
      title: 'Verified calculations, not estimates',
      subtitle:
        'FiscalPT does not use AI to calculate taxes. Every cent is calculated with the same formulas and tables as the Tax Authority.',
      point1: 'Official 2024 and 2025 brackets (Lei 33/2024 and OE 2025)',
      point2: 'Cross-validation against real liquidação statements',
      point3: 'Minimum subsistence, solidarity surcharge, Art. 81 credit',
      point4: 'Self-employment coefficients by activity code (Art. 31 CIRS)',
      point5: 'IRS Jovem Art. 12-F with pre and post 2025 rules',
      point6: 'NHR autonomous rate Art. 72 with separate taxation',
      aiNote:
        'AI is used only after calculation — to explain results and answer questions. Never to do math.',
    },

    proof: {
      badge: 'Why FiscalPT',
      title: 'Built to be rigorous',
      subtitle:
        "Not a prototype — it's a tax engine with real test coverage and validation against official data.",
      stat1: { value: '1050+', label: 'Automated tests' },
      stat2: { value: '97%', label: 'Code coverage' },
      stat3: { value: '€0.01', label: 'Maximum margin of error' },
      stat4: { value: '6', label: 'Income categories' },
      story: {
        title: 'The origin story',
        body: 'FiscalPT was born from a personal experience. The creator never bothered with tax optimization — it was too much work and too confusing, an unfair battle. Until he sat down, analyzed the last 3 years of tax returns, and discovered he could recover €10,000 by filing amended declarations. This project exists so that no one loses money due to lack of accessible information.',
        author: 'Rui Moreira',
        role: 'Creator of FiscalPT',
        readMore: 'Read the full story',
      },
    },

    pricing: {
      badge: 'Pricing',
      title: 'Simple and transparent',
      subtitle: 'Full analysis for free. Only pay for actionable recommendations.',
      free: {
        name: 'Free Analysis',
        price: '€0',
        description: 'Complete tax analysis, no limits',
        f1: 'Joint vs separate comparison',
        f2: 'IRS Jovem and NHR with impact calculation',
        f3: 'All scenarios and effective rates',
        f4: 'Upload XML, PDF, or portal data',
        f5: 'Multi-year analysis (up to 5 years)',
        f6: 'Exportable PDF report',
        cta: 'Start Free',
      },
      pro: {
        name: 'Pro Recommendations',
        price: '€9.99',
        period: 'per consultation',
        description: 'Step-by-step guide to implement the optimizations',
        f1: 'Everything in the free analysis',
        f2: 'Actionable recommendations with detailed steps',
        f3: 'Direct links to Portal das Finanças',
        f4: 'Estimated impact of each change in €',
        f5: 'AI tax consultant (20 messages)',
        f6: 'Money-back guarantee if unsatisfied',
        cta: 'Unlock Recommendations',
      },
    },

    guides: {
      badge: 'Tax Guides',
      title: 'Learn about Portuguese IRS',
      subtitle: 'Free educational guides to understand how the tax system works.',
      irsGuide: {
        title: 'How IRS Works',
        description: 'Income categories, brackets, deductions, and the filing process.',
      },
      irsJovem: {
        title: 'IRS Jovem 2025',
        description:
          'Eligibility, exemption rates, limits, and how to activate the benefit on the Portal.',
      },
      jointFiling: {
        title: 'Joint vs Separate',
        description: 'When does joint filing pay off? Practical examples with real numbers.',
      },
      readMore: 'Read guide',
    },

    faq: {
      badge: 'FAQ',
      title: 'Common questions',
      q1: 'Is FiscalPT really free?',
      a1: 'Yes. The full tax analysis — including scenario comparison, IRS Jovem, NHR, effective rates, and PDF report — is 100% free with no registration. Actionable recommendations with detailed steps are a paid extra (€9.99 per consultation).',
      q2: 'Is my data secure?',
      a2: 'The documents you upload are processed locally in your browser. They never leave your computer. Tax calculation is entirely local. Only if you opt into the AI consultant are anonymized data (no names) sent to generate responses.',
      q3: 'What does "deterministic engine" mean?',
      a3: "It means FiscalPT does not use AI to do math. Calculations use the same official tables and formulas as the Tax Authority, implemented in verified code with hundreds of tests. Results are predictable and reproducible — they don't depend on probabilities.",
      q4: 'Can I trust the results?',
      a4: 'The tax engine is validated against real AT liquidação statements. Accuracy is verified to the cent. However, FiscalPT is an informational tool — we always recommend consulting a certified accountant for final decisions.',
      q5: 'What documents can I upload?',
      a5: 'Modelo 3 XML (declaration file), comprovativo de entrega PDF, demonstração de liquidação PDF, or copy/paste expense data from Portal das Finanças. XML is the most complete format.',
      q6: 'Does AI do the tax calculations?',
      a6: "No. AI is used only as a consultant to explain the deterministic engine's results. It never does calculations, never invents numbers. Personal data is anonymized before being shared with the language model.",
    },

    cta: {
      title: 'Stop overpaying',
      subtitle:
        'Upload your declaration and discover in minutes how much you can save. Free, no registration, no commitment.',
      button: 'Start free analysis',
    },
  },

  analyze: {
    steps: {
      upload: 'Upload',
      questionnaire: 'Complete',
      results: 'Results',
    },
    stepLabel: 'Step {step}: {name}',
    stepCompleted: '{label} (completed, click to go back)',
    progressLabel: 'Progress',
    title: 'Tax Analysis',
    subtitle: 'Upload your tax documents (Modelo 3 XML, certificates or settlement statements).',
    docsLoaded: 'Documents loaded',
    fiscalYear: 'Fiscal year {year}',
    fiscalYears: '{count} fiscal years ({years})',
    loadNewDocs: 'Load new documents',
    errorTitle: 'Calculation error',
    calcError: 'Error calculating taxes. Check the data and try again.',
    calcErrorPrefix: 'Calculation error: {message}',
    reportMismatch: 'Report discrepancy',
    reportSent: 'Reported ✓',
  },

  upload: {
    docTypes: {
      xml: 'XML Modelo 3',
      comprovativo: 'Delivery Certificate',
      liquidacao: 'Settlement Statement',
      unknown: 'Unrecognized document',
    },
    filingStatus: {
      joint: 'Married – joint filing',
      separate: 'Married – separate filing',
      single: 'Single',
    },
    deductionCategories: {
      general: 'General family',
      health: 'Health',
      education: 'Education',
      housing: 'Housing',
      careHome: 'Care homes',
      invoiceRequirement: 'Invoice requirement',
      domesticWork: 'Domestic work',
    },
    memberRoles: {
      taxpayer: 'Taxpayer',
      dependent: 'Dependent',
      ascendant: 'Ascendant',
    },
    dropzone: 'Drag or click to upload',
    remove: 'Remove',
    processing: 'Processing…',
    unknownYear: 'Unknown year',
    howToGet: 'How to get this file?',
    openPortal: 'Open in Portal',
    openPortalStep: 'Open Portal das Finanças',
    copyPasteStep: 'Select all (Ctrl+A), copy (Ctrl+C) and paste below (Ctrl+V)',
    selectYear: 'Select year',
    pasteHere: 'Paste here the content from the Portal das Finanças page (Ctrl+V)…',
    pasteDeductionsFor: 'Paste deductions for NIF {nif}, year {year}',
    paste: 'Paste',
    clipboardBlocked: 'The browser blocked clipboard access. Use',
    clipboardBlockedSuffix: 'in the field above.',
    endSession: 'End session and',
    startSession: 'sign in to the Portal with',
    oneYear: '1 year',
    nYears: '{n} years',
    required: 'Required',
    optional: 'Optional',
    recommended: 'Recommended',
    allHaveLiquidacao:
      'All declarations have a settlement — general, health, education and invoice deductions will be derived automatically. Paste Portal data only if you have expenses for',
    housing: 'housing',
    careHomes: 'care homes',
    domesticWork: 'domestic work',
    xmlDetected: 'XML detected — this section accepts only the settlement PDF.',
    wrongDocType:
      'This file appears to be a settlement, not a declaration. Upload it in the "Settlement Statement" section.',
    notLiquidacao: 'This file does not appear to be a settlement statement.',
    unrecognizedDoc:
      'Unrecognized document type. Expected: IRS declaration (XML or certificate PDF) or settlement statement (PDF).',
    maxFiles: 'Maximum of {max} files in this section.',
    duplicateFile: 'Duplicate file: {name}',
    needDeclaration: 'You need to upload at least one IRS declaration.',
    waitProcessing: 'Wait for all files to finish processing.',
    deductionExpenses: 'Deduction Expenses',
    deductionExpensesRequired:
      'Deduction expenses are required for taxpayers without settlement: {names}. Open the "Deduction Expenses" section and paste the data from Portal das Finanças.',
    pdfFallbackNote:
      'Data extracted from certificate PDF. The XML Modelo 3 file allows more complete and reliable extraction. The PDF may not include birth dates, specific deductions, or unsupported annexes (E, F, G, H). We recommend using XML for more accurate results.',
    liquidacaoYearMismatch:
      'The settlement is from year {liqYear}, but the declaration is from {declYear}. Upload the settlement for the same year.',
    liquidacao: 'Settlement',
    duplicateYearWarning:
      'Year {year} appears in both the main declaration and previous years. The main declaration will be used.',
    extractionFailed:
      'Could not extract data. Upload the XML Modelo 3 IRS file (available on Portal das Finanças).',
    portalInstructions:
      'For each household member, check expenses on Portal das Finanças and paste the page content. Group all years by NIF to minimize session changes.',
    taxpayers: 'Taxpayers',
    dependents: 'Dependents',
    dependentsHelp:
      "Expenses in the name of dependents can increase household deductions (health, education, etc.). Sign in with the dependent's NIF (not the parents').",
    ascendants: 'Ascendants',
    ascendantsHelp:
      "Health and care home expenses in the name of ascendants can be deducted from household tax. Sign in with the ascendant's NIF.",
    declarationTitle: 'IRS Declaration',
    declarationRequired: 'Required',
    declarationDesc: 'IRS declaration as submitted on Portal das Finanças',
    declarationSpouseNote:
      'If the household has two holders (married/civil union), upload declarations from both — even for separate filing.',
    xmlFile: 'XML File',
    pdfFile: 'Certificate PDF',
    xmlDesc:
      'The XML file contains the complete declaration in structured format. Supports all annexes.',
    openPortalFinancas: 'Open on Portal das Finanças',
    xmlInstructions:
      '1. Go to irs.portaldasfinancas.gov.pt and sign in\n2. Navigate to IRS → Submit Declaration → Correct Declaration\n3. Select the desired year and the holders\' NIFs\n4. Click "Continue"\n5. In the open declaration, click the save button (floppy disk) to download the XML\n6. Upload the file here',
    pdfDesc:
      'The certificate PDF is the alternative when XML is unavailable. It contains the declaration data, but extraction is less complete.',
    pdfInstructions:
      '1. Go to irs.portaldasfinancas.gov.pt and sign in\n2. Navigate to IRS → Get Certificates\n3. In the list of declarations, click the "COMPROVATIVO" button for the desired year\n4. The PDF will download automatically\n5. Upload the file here',
    pdfAnnexNote:
      'Supports Annexes A, B, J, L and SS. For declarations with Annexes E, F, G or H, use the XML file.',
    liquidacaoTitle: 'Settlement Statement',
    liquidacaoDesc:
      'Validates calculations and derives deductions automatically, without manual input.',
    liquidacaoInstructions:
      '1. Go to irs.portaldasfinancas.gov.pt and sign in\n2. Navigate to IRS → Consult Declaration\n3. Select the year and click "Search"\n4. Click "View Detail" on the desired declaration\n5. Click the download icon next to the Settlement Number\n6. Upload the file here',
    guideSteps: {
      login: 'Go to the Portal das Finanças and sign in with your NIF and password.',
      multiAuth:
        'Choose your authentication method (password, Mobile Digital Key, or Citizen Card).',
      xmlSubmittedTitle: 'For already submitted years:',
      xmlCorrigirDeclaracao:
        'In the sidebar, click "Entregar Declaração" then "Corrigir Declaração" for the desired year.',
      xmlCorrigirGravar:
        'With the declaration open, click the save icon (floppy disk) in the toolbar to download the XML file.',
      xmlCurrentTitle: 'For the current year (not yet submitted):',
      xmlCurrentEntregarDeclaracao:
        'In the sidebar, click "Entregar Declaração" and select "Preencher Declaração" for the current year.',
      xmlCurrentPrefill:
        'Request the automatic pre-fill. Validate the data, fill in any missing fields, and validate again.',
      xmlCurrentGravar:
        'Click the save icon (floppy disk) to download the XML — no need to submit. In this case, there is no settlement document (liquidação).',
      pdfComprovativo:
        'In the declarations list, click the "COMPROVATIVO" button for the desired year to download the PDF.',
      liqConsultar:
        'Select the year, click "Pesquisar" then "VER DETALHE" on the desired declaration.',
      liqDownload:
        'In the detail window, click the download icon next to the Settlement Number to get the PDF.',
    },
    previousYears: 'Previous Years',
    previousYearsDesc:
      'Uploading declarations and settlements from previous years ({years}) for all household holders enables us to:',
    previousYearsBenefit1: '✓ Validate calculations against known official results',
    previousYearsBenefit2: '✓ Detect patterns (e.g., not the first year of Cat. B income)',
    previousYearsBenefit3: '✓ Optimize declarations that can still be corrected',
    amendableNote:
      'Declarations from years that can still be corrected ({years}) may generate replacement recommendations. The rest are for validation and context.',
    limitReached: 'Limit reached ({max})',
    processingDocs: 'Processing documents...',
    advance: 'Advance',
    annexes: 'Annexes',
    documentSingular: 'document',
    documentPlural: 'documents',
    liquidacaoAvailable: 'Settlement available',
    person: 'Person',
    categoriesCount: '{count} categories',
    removePastedData: 'Remove pasted data',
    noExpenses: 'No expenses reported for this year.',
    selectYearHintPrefix: 'Select year',
    selectYearHintSuffix: 'from the link above, press Ctrl+A → Ctrl+C and paste here (Ctrl+V).',
    loginHintLiqOptional:
      'Optional — the settlement covers general, health, education and invoice deductions. Paste only if you have housing, care home or domestic work expenses.',
    loginHintLiqOptionalShort:
      'Optional — the settlement already contains deduction data (general, health, education, invoice). Paste Portal data only if you have housing, care home or domestic work expenses.',
    nifMismatch:
      'The NIF in the pasted text ({pastedNif}) does not match the expected one ({expectedNif}). Make sure you are signed in to the Portal with the correct NIF.',
    yearMismatchPaste:
      'The year in the pasted text ({pastedYear}) does not match the expected one ({expectedYear}). Select year {expectedYear} in the Portal before copying.',
    yearNotAccepted: 'Year {year} not accepted in this section. {hint}',
    yearHintPrevious: 'Accepts years from {range}.',
    yearHintAmendable: 'Only years that can still be submitted or corrected ({range}).',
    fileTooLarge: '"{name}" exceeds the {max} MB limit.',
    fileEmpty: '"{name}" is empty.',
    liquidacaoPdfOnly: '"{name}": the settlement must be a PDF file.',
    errorProcessingFile: 'Error processing file',
    effectiveRateLabel: 'Effective rate',
    or: 'or',
  },

  questionnaire: {
    title: 'Additional Information',
    subtitle: 'We need some data not found in the documents for a more accurate calculation.',
    progress: 'Progress:',
    answered: '{answered} / {total} answered',
    criticalSingular: '{count} required question',
    criticalPlural: '{count} required questions',
    undo: 'Undo',
    redo: 'Redo',
    estimatedValue: 'Estimated value',
    why: 'Why?',
    selectPlaceholder: '— Select —',
    yearPlaceholder: 'E.g.: 1990',
    defaultValue: 'Default',
    priority: {
      critical: 'Required',
      important: 'Important',
      optional: 'Optional',
    },
    dataComplete: 'Data Complete',
    dataCompleteDesc: 'All necessary information was extracted from the documents.',
    skipWarningCritical:
      'There are {count} required question(s) unanswered. The calculation may be inaccurate.',
    skipWarningImportant:
      'There are important unanswered questions. The calculation may be less accurate.',
    backToQuestions: 'Back to questions',
    continueAnyway: 'Continue anyway',
    answerRequired: 'Answer the required questions to continue.',
    incomeCategories: {
      A: 'Employment income (Cat. A)',
      B: 'Self-employment income (Cat. B)',
      E: 'Capital income (Cat. E)',
      F: 'Rental income (Cat. F)',
      G: 'Capital gains (Cat. G)',
      H: 'Pensions (Cat. H)',
    },
    incomeCategoryDescriptions: {
      A: 'Wages and salaries from employment — what you earn as an employee.',
      B: 'Freelance, self-employed, and independent professional activity.',
      E: 'Bank interest, dividends, and other financial investment income.',
      F: 'Rent received from leased properties (houses, apartments, shops).',
      G: 'Profits from selling property, shares, cryptocurrency, or other assets.',
      H: 'Retirement pensions, old-age, disability, or survivor pensions.',
    },
    projection: {
      title: 'Tax Projection {year}',
      description:
        "Project next year's taxes based on current data. Uses the most recent known tax rules.",
      adjustHint:
        'Adjust the expected gross income for {year}. Values are pre-filled from year {primaryYear}.',
    },
  },

  results: {
    title: 'Analysis Results',
    dataWarningTitle: 'Some data may be incomplete',
    totalSavings: 'Total potential savings: {amount}',
    projected: 'Projected',
    projectedNote: 'Estimate based on the most recent known tax rules',
    historical: 'historical',
    historicalNote: 'Correction deadline expired — for reference only',
    currentProjection: 'Current Projection',
    currentSituation: 'Current Situation',
    submittedDeclaration: 'Submitted Declaration',
    optimizedScenario: 'Optimized Scenario',
    saves: 'saves {amount}',
    fiscalYear: 'Fiscal year {year}',
    household: 'Household',
    income: 'Income',
    irs: 'IRS',
    effectiveRate: 'Effective rate',
    rate: 'Rate',
    refund: 'Refund',
    toPay: 'To pay',
    historicalEvolution: 'Historical Evolution',
    combined: 'Combined',
    incomeAndIrs: 'Income & IRS',
    incomeAndIrsOptimized: 'Income & IRS: Current vs Optimized',
    effectiveRateTitle: 'Effective Rate',
    effectiveRateOptimized: 'Effective Rate: Current vs Optimized',
    result: 'Result',
    resultOptimized: 'Result: Current vs Optimized',
    current: 'Current',
    optimized: 'Optimized',
    irsCurrentLabel: 'Current IRS',
    irsOptimizedLabel: 'Optimized IRS',
    notAmendable: 'Not amendable',
    year: 'Year',
  },

  error: {
    title: 'An unexpected error occurred',
    defaultMessage: 'Something went wrong. Try again or reload the page.',
    retry: 'Try again',
    reload: 'Reload page',
  },

  onboarding: {
    dialogLabel: 'Getting started guide',
    closeLabel: 'Close guide',
    step1: {
      title: 'Upload documents',
      description:
        'Start by uploading your tax documents — Modelo 3 XML, certificate PDFs, or settlement statements.',
    },
    step2: {
      title: 'Complete information',
      description:
        'The system identifies missing data and asks relevant questions. You can skip this step if you have no additional information.',
    },
    step3: {
      title: 'See results',
      description:
        'Receive a detailed analysis: joint vs separate filing comparison, IRS Jovem, NHR, and concrete savings suggestions.',
    },
  },

  skeleton: {
    calculating: 'Calculating taxes...',
  },

  review: {
    pageTitle: 'Review Extracted Data',
    pageSubtitle: 'Confirm or correct the data extracted from your documents.',
    householdTitle: 'Household',
    closeEdit: 'Close editing',
    edit: 'Edit',
    fiscalYear: 'Fiscal year',
    filingLabel: 'Filing',
    filingType: 'Filing type',
    filing: {
      single: 'Single',
      joint: 'Joint',
      separate: 'Separate',
    },
    taxpayers: 'Taxpayers',
    grossIncome: 'Gross income',
    name: 'Name',
    incomes: 'Incomes',
    category: 'Category',
    gross: 'Gross (€)',
    withholding: 'Withholding (€)',
    withholdingLabel: 'withholding:',
    ssLabel: 'SS:',
    removeIncome: 'Remove income',
    income: 'Income',
    deductions: 'Deductions',
    valuePlaceholder: 'Amount (€)',
    removeDeduction: 'Remove deduction',
    deduction: 'Deduction',
    specialRegimes: 'Special regimes',
    irsJovem: 'IRS Jovem',
    nhr: 'NHR',
    benefitYear: 'Benefit year (1-10)',
    nhrStartYear: 'NHR start year',
    dependents: 'Dependents',
    addDependent: 'Add',
    noDependents: 'No dependents registered.',
    defaultDependent: 'Dependent {n}',
    birthYear: 'Birth year',
    birthLabel: 'born:',
    removeDependent: 'Remove dependent',
    confirmAndCalculate: 'Confirm and Calculate',
    incomeCategories: {
      A: 'Employment income (Cat. A)',
      B: 'Self-employment income (Cat. B)',
      E: 'Capital income (Cat. E)',
      F: 'Rental income (Cat. F)',
      G: 'Capital gains (Cat. G)',
      H: 'Pensions (Cat. H)',
    },
    incomeCategoryDescriptions: {
      A: 'Wages and salaries from employment — what you earn as an employee.',
      B: 'Freelance, self-employed, and independent professional activity.',
      E: 'Bank interest, dividends, and other financial investment income.',
      F: 'Rent received from leased properties (houses, apartments, shops).',
      G: 'Profits from selling property, shares, cryptocurrency, or other assets.',
      H: 'Retirement pensions, old-age, disability, or survivor pensions.',
    },
    deductionCategories: {
      general: 'General expenses',
      health: 'Health',
      education: 'Education',
      housing: 'Housing',
      care_home: 'Care homes',
      ppr: 'PPR',
      alimony: 'Alimony',
      fatura: 'Invoice (VAT)',
      trabalho_domestico: 'Domestic work',
      disability_rehab: 'Rehabilitation (disability)',
      disability_insurance: 'Life insurance (disability)',
      sindical: 'Union dues',
    },
  },

  theme: {
    label: 'Change theme',
    light: 'Switch to light theme',
    dark: 'Switch to dark theme',
  },

  pdf: {
    reportTitle: 'Tax Analysis Report',
    tagline: 'Intelligent tax optimization',
    member: 'Member',
    grossIncome: 'Gross Income',
    taxableIncome: 'Taxable Income',
    withholding: 'Withholding',
    socialSecurity: 'Social Security',
    refundResult: 'Result',
    total: 'Total',
    optimizations: 'Optimization Opportunities',
    noOptimizations: 'No additional optimizations identified for this scenario.',
    optimizationsTeaser:
      '{count} optimizations identified with estimated savings of {amount}. Unlock recommendations at fiscalpt.com.',
    recommendations: 'Personalized Recommendations',
    priority_high: 'High Priority',
    priority_medium: 'Medium Priority',
    priority_low: 'Low Priority',
    disclaimer: 'Tax information, not advice. Consult a certified accountant.',
  },

  locale: {
    switchToEn: 'Switch to English',
    switchToPt: 'Mudar para Português',
  },

  privacy: {
    badge: '100% local — your data never leaves the browser',
    footerNote:
      'All processing happens in your browser. No data is sent to any server. Verify in the Network tab (F12).',
    landingFeatureTitle: 'Total Privacy',
    landingFeatureDesc:
      'Your tax documents never leave your computer. All processing is done locally in the browser — zero servers, zero risk.',
  },

  legal: {
    backToHome: 'Back to home',
    seeAlsoTerms: 'See also our',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
    termos: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: {date}',
      section1Title: '1. Description of the Service',
      section1P1:
        'FiscalPT is a tax information and simulation platform for individual taxpayers and households in Portugal. The platform allows the upload of tax documents (XML Modelo 3 IRS, comprovativo PDFs, liquidação PDFs), automatic data extraction, and tax optimization scenario simulation.',
      section1P2Bold:
        'FiscalPT is an informational tool and does NOT constitute professional tax advice.',
      section1P2After:
        'The results presented do not replace consultation with a certified accountant or qualified tax advisor.',
      section2Title: '2. User Responsibilities',
      section2P1: 'By using FiscalPT, the user agrees to:',
      section2Li1: 'Provide correct and complete tax data;',
      section2Li2: 'Verify all results and simulations before making any tax decision;',
      section2Li3:
        'Consult a certified accountant or tax advisor to validate the results obtained;',
      section2Li4: 'Not use the platform for illegal or fraudulent purposes;',
      section2Li5:
        'Assume full responsibility for tax decisions made based on the results presented.',
      section3Title: '3. Disclaimer',
      section3P1:
        'The calculations and simulations presented by FiscalPT are for informational purposes only. Despite all efforts to ensure the accuracy of calculations based on current Portuguese tax legislation:',
      section3Li1: 'Results may contain errors or inaccuracies;',
      section3Li2: 'Tax legislation may be changed without prior notice;',
      section3Li3: 'Specific tax situations may not be covered by the platform;',
      section3Li4:
        'FiscalPT assumes no responsibility for losses, damages, or penalties resulting from the use of the results presented.',
      section3P2Bold: "The use of FiscalPT is entirely at the user's own risk.",
      section4Title: '4. Data Processing',
      section4P1Before: 'All uploaded tax documents are processed ',
      section4P1Bold: "entirely in the user's browser (client-side)",
      section4P1After:
        '. No tax document or personal IRS data is sent to our servers or to third parties.',
      section4P2Before:
        'The only data sent to our servers are analytics events (pages visited, anonymous platform usage) for service improvement purposes. For more information, see our ',
      section4P2After: '.',
      section5Title: '5. Payment',
      section5P1:
        'FiscalPT may offer premium features through a one-time payment processed via Stripe. As this is a digital product with immediate delivery, returns or refunds are not accepted after payment completion, except as required by law.',
      section6Title: '6. Intellectual Property',
      section6P1Before: 'The FiscalPT source code is made available under the ',
      section6P1Bold: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
      section6P1After:
        '. The user may view, modify, and redistribute the code in accordance with the terms of this license.',
      section6P2:
        'The name "FiscalPT", logo, and visual identity are the property of their creators and are not covered by the open-source license.',
      section7Title: '7. Governing Law and Jurisdiction',
      section7P1:
        'These Terms of Service are governed by Portuguese law. For the resolution of any dispute arising from these terms, the courts of the Lisbon district shall have exclusive jurisdiction, with express waiver of any other forum.',
      section8Title: '8. Changes to the Terms',
      section8P1:
        'FiscalPT reserves the right to modify these Terms of Service at any time. Changes take effect upon publication on this page. Continued use of the service after publication of changes constitutes acceptance of the new terms.',
      section9Title: '9. Contact',
      section9P1Before: 'For questions related to these Terms of Service, contact us at ',
      section9P1After: '.',
    },
    privacidade: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: {date}',
      section1Title: '1. Data Controller',
      section1P1Before:
        'The data controller is {dataController}, operator of the FiscalPT platform. For questions related to data protection, contact the Data Protection Officer (DPO) at ',
      section1P1After: '.',
      section2Title: '2. GDPR Compliance',
      section2P1:
        'This policy is drafted in compliance with the General Data Protection Regulation (GDPR — Regulation (EU) 2016/679) and Portuguese data protection legislation (Law No. 58/2019).',
      section3Title: '3. Data Processed in the Browser (Client-Side)',
      section3P1Before:
        'Tax documents (XML Modelo 3 IRS, comprovativo PDFs, liquidação PDFs) uploaded to the platform are processed ',
      section3P1Bold: "entirely in the user's browser",
      section3P1After: '. This means that:',
      section3Li1: 'No tax document is sent to FiscalPT servers or to third parties;',
      section3Li2:
        'No personal IRS data (income, deductions, NIF, etc.) is transmitted over the network;',
      section3Li3: "All calculations and simulations are performed locally on the user's device;",
      section3Li4:
        'Data remains exclusively in the browser and is deleted when the user closes the page or clears browser data.',
      section4Title: '4. Data Sent to Servers',
      section4P1: 'The following data is sent to our servers or to third-party services:',
      section4Li1Bold: 'Analytics events:',
      section4Li1Text:
        ' pages visited, anonymous actions on the platform (e.g., "user started simulation"), device type and browser. This data is anonymized and does not contain personal tax information;',
      section4Li2Bold: 'Payment data:',
      section4Li2TextBefore:
        ' when the user makes a payment, the data is processed directly by Stripe. FiscalPT does not store credit or debit card data. See the ',
      section4Li2Link: 'Stripe Privacy Policy',
      section4Li2TextAfter: '.',
      section5Title: '5. Cookies',
      section5P1:
        'FiscalPT uses only essential cookies for platform operation (e.g., theme preference, language). We do not use tracking cookies, advertising cookies, or third-party cookies.',
      section6Title: '6. Data Retention',
      section6P1Bold: 'Tax data:',
      section6P1Text:
        " not retained — processed exclusively in the user's browser and never stored on our servers.",
      section6P2Bold: 'Analytics data:',
      section6P2Text:
        ' anonymized events are retained for the period necessary for analysis and service improvement, and are periodically deleted.',
      section6P3Bold: 'Payment data:',
      section6P3Text:
        ' retained by Stripe in accordance with their policies and legal obligations.',
      section7Title: '7. User Rights (GDPR — Articles 15 to 20)',
      section7P1:
        'Under the GDPR, the user has the following rights regarding their personal data:',
      section7Li1Bold: 'Right of access',
      section7Li1Text: ' (Art. 15) — request information about personal data processed;',
      section7Li2Bold: 'Right to rectification',
      section7Li2Text: ' (Art. 16) — request correction of inaccurate data;',
      section7Li3Bold: 'Right to erasure',
      section7Li3Text: ' (Art. 17) — request deletion of personal data;',
      section7Li4Bold: 'Right to restriction of processing',
      section7Li4Text: ' (Art. 18) — request restriction of data processing;',
      section7Li5Bold: 'Right to data portability',
      section7Li5Text:
        ' (Art. 20) — receive personal data in a structured, machine-readable format.',
      section7P2Before: 'To exercise any of these rights, contact us at ',
      section7P2After: '. We will respond within 30 days.',
      section8Title: '8. How to Verify',
      section8P1:
        'The user can verify that their tax documents are not sent to external servers. To do so:',
      section8Li1: 'Open the browser Developer Tools (F12 key);',
      section8Li2Before: 'Select the ',
      section8Li2Bold: 'Network',
      section8Li2After: ' tab;',
      section8Li3: 'Upload a tax document to the platform;',
      section8Li4:
        'Verify that no network requests are made with the document content — all processing occurs locally.',
      section9Title: '9. Supervisory Authority',
      section9P1Before:
        'If you believe that the processing of your personal data violates the GDPR, you have the right to file a complaint with the Portuguese Data Protection Authority (CNPD): ',
      section9P1Link: 'www.cnpd.pt',
      section9P1After: '.',
      section10Title: '10. Changes to the Privacy Policy',
      section10P1:
        'FiscalPT reserves the right to modify this Privacy Policy at any time. Changes take effect upon publication on this page.',
      section11Title: '11. Contact',
      section11P1Before:
        'For questions related to data protection, contact the Data Protection Officer (DPO) at ',
      section11P1After: '.',
    },
  },

  share: {
    button: 'Share results',
    title: 'Share',
    textWithSavings:
      '💰 I found I can save {amount} on my {years} taxes with FiscalPT — {count} optimizations found!',
    textNoSavings: '✅ I checked my {years} taxes with FiscalPT — all optimized!',
    copyLink: 'Copy text',
    copied: 'Copied!',
  },

  chat: {
    open: 'Open tax consultant',
    close: 'Close chat',
    title: 'AI Tax Consultant',
    welcome: 'Have questions about your analysis? Ask me!',
    suggestion1: 'Why does joint filing save more?',
    suggestion2: 'What is IRS Jovem and does it apply to me?',
    suggestion3: 'How can I reduce my IRS next year?',
    placeholder: 'Type your question...',
    limitPlaceholder: 'Message limit reached',
    inputLabel: 'Question for tax consultant',
    send: 'Send message',
    error: 'Error processing message. Please try again.',
    limitReached:
      'You have reached the limit of {limit} messages for this consultation. For further support, contact a certified accountant.',
    disclaimer: 'AI-enhanced · Does not replace professional tax advice',
    ctaDescription:
      'Ask questions about your results with our AI tax consultant. Answers grounded in your actual analysis.',
    openButton: 'Talk to the consultant',
    trustEngine: 'Results verified by tax engine',
    trustAi: 'AI only explains and answers',
    trustPrivacy: 'Personal data not shared',
    trustBanner:
      '🔒 Results are computed by a deterministic tax engine. AI only explains — your personal data is not shared.',
  },

  paywall: {
    teaserOptimization: '{count} optimization found',
    teaserOptimizations: '{count} optimizations found',
    teaserUnlockPrefix: 'Unlock the step-by-step guide to save',
    teaserChatHint: '+ AI tax consultant',
    teaserCta: 'See how',

    title: 'Personalized Recommendations',
    description:
      'We identified {count} {label} for your household. Unlock the step-by-step guide to implement each one.',
    optimizationSingular: 'optimization',
    optimizationPlural: 'optimizations',
    featureSteps: 'Step-by-step instructions on the Tax Portal',
    featureImpact: 'Estimated impact of each change',
    featureLinks: 'Direct links to the relevant forms',
    featureChat: 'AI tax consultant included — ask questions about your results',
    unlockWithDiscount: 'Unlock with {percent}% discount',
    unlockPrice: 'Unlock for €9.99',
    hasDiscount: 'Have a discount code?',
    discountLabel: 'Discount code',
    discountPlaceholder: 'Discount code',
    discountApply: 'Apply',
    discountChecking: '...',
    footer: 'One-time payment · No subscription · Guaranteed refund if unsatisfied',
    poweredBy: 'Powered by Stripe',

    generating: 'Generating your recommendations...',
    paymentNotVerified: 'Payment not verified',
    recommendationsError: 'Error generating recommendations',
    unknownError: 'Unknown error',
    tryAgain: 'Try again',
    discountValidationError: 'Error validating code',
    discountError: 'Error',

    checkoutTitle: 'Unlock Recommendations',
    checkoutCancel: 'Cancel',

    unlockedTitle: 'Personalized Recommendations',
    yearLabel: 'Year {year}',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    openPortal: 'Open in Portal',

    reportLink: 'Recommendations not applicable? Report a problem',
    reportTitle: 'Report a problem',
    reportDescription:
      'If the recommendations are not applicable to your situation or contain errors, describe the problem below. We will review the case and, if justified, process a refund.',
    reportEmailLabel: 'Contact email',
    reportEmailPlaceholder: 'your@email.com',
    reportDescriptionLabel: 'Problem description',
    reportDescriptionPlaceholder:
      'Describe why the recommendations are not applicable to your situation...',
    reportCancel: 'Cancel',
    reportSending: 'Sending...',
    reportSend: 'Send',
    reportSentTitle: 'Message sent',
    reportSentDescription: 'We will review your situation and respond by email shortly.',
  },
}

export default en
