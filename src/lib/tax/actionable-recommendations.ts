import type { AnalysisResult, ScenarioResult } from './types'
import { round2 } from './utils'

// ─── Types ───────────────────────────────────────────────────

export interface ActionableStep {
  order: number
  title: string
  description: string
  portal_path?: string
  estimated_impact: number
}

export interface ActionableRecommendation {
  id: string
  category: 'filing' | 'regime' | 'deduction' | 'income' | 'general'
  priority: 'high' | 'medium' | 'low'
  title: string
  summary: string
  steps: ActionableStep[]
  total_savings: number
}

export interface ActionableReport {
  year: number
  recommendations: ActionableRecommendation[]
  total_savings: number
  current_filing: string
  optimal_filing: string
}

// ─── Helpers ─────────────────────────────────────────────────

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function filingLabel(status: string): string {
  switch (status) {
    case 'married_joint':
      return 'Tributação Conjunta'
    case 'married_separate':
      return 'Tributação Separada'
    default:
      return 'Tributação Individual'
  }
}

// ─── Recommendation Generators ───────────────────────────────

function filingStatusRecommendation(
  result: AnalysisResult,
  current: ScenarioResult,
  optimal: ScenarioResult,
): ActionableRecommendation | undefined {
  if (current.filing_status === optimal.filing_status) return undefined

  const savings = round2(current.total_tax_burden - optimal.total_tax_burden)
  if (savings <= 0) return undefined

  const isAmendment = true
  const targetLabel = filingLabel(optimal.filing_status)
  const currentLabel = filingLabel(current.filing_status)

  const steps: ActionableStep[] = [
    {
      order: 1,
      title: 'Aceder ao Portal das Finanças',
      description: `Inicie sessão em irs.portaldasfinancas.gov.pt com as credenciais de um dos titulares.`,
      portal_path: 'https://irs.portaldasfinancas.gov.pt',
      estimated_impact: 0,
    },
  ]

  if (isAmendment) {
    steps.push({
      order: 2,
      title: 'Submeter declaração de substituição',
      description: `Vá a "Entregar Declaração" → selecione o ano ${result.year}. Escolha "Declaração de substituição".`,
      portal_path: 'https://irs.portaldasfinancas.gov.pt/entregaIRSForm.action',
      estimated_impact: 0,
    })
  }

  steps.push({
    order: steps.length + 1,
    title: `Alterar para ${targetLabel}`,
    description: `No Quadro 5A da Folha de Rosto, altere a opção de "${currentLabel}" para "${targetLabel}". ${
      optimal.filing_status === 'married_joint'
        ? 'Ambos os cônjuges devem assinar/confirmar a declaração conjunta.'
        : 'Cada cônjuge submeterá a sua própria declaração individual.'
    }`,
    estimated_impact: savings,
  })

  steps.push({
    order: steps.length + 1,
    title: 'Validar e submeter',
    description: `Reveja todos os campos, valide a declaração, e submeta. O reembolso adicional de ${formatEuro(savings)} será processado pela AT.`,
    estimated_impact: 0,
  })

  return {
    id: `filing-${result.year}`,
    category: 'filing',
    priority: 'high',
    title: `Alterar para ${targetLabel}`,
    summary: `A sua declaração de ${result.year} foi submetida em ${currentLabel}. Ao alterar para ${targetLabel}, poupa ${formatEuro(savings)} em IRS.`,
    steps,
    total_savings: savings,
  }
}

function irsJovemRecommendation(result: AnalysisResult): ActionableRecommendation | undefined {
  if (!result.irs_jovem_savings || result.irs_jovem_savings <= 0) return undefined

  const savings = round2(result.irs_jovem_savings)

  // Check if any member is already using IRS Jovem
  const membersUsingIt = result.household.members.filter((m) =>
    m.special_regimes.includes('irs_jovem'),
  )
  const membersEligible = result.household.members.filter(
    (m) => !m.special_regimes.includes('irs_jovem') && m.irs_jovem_year !== undefined,
  )

  if (membersUsingIt.length > 0 && membersEligible.length === 0) return undefined

  const targetMembers =
    membersEligible.length > 0
      ? membersEligible
      : result.household.members.filter(
          (m) =>
            m.birth_year && result.year - m.birth_year <= 35 && !m.special_regimes.includes('nhr'),
        )

  if (targetMembers.length === 0) return undefined

  const steps: ActionableStep[] = [
    {
      order: 1,
      title: 'Verificar elegibilidade',
      description: `Confirme que completou a qualificação (licenciatura, mestrado, doutoramento ou equivalente) nos últimos 10 anos e que tinha ≤ 35 anos no primeiro ano de benefício.`,
      estimated_impact: 0,
    },
    {
      order: 2,
      title: 'Ativar IRS Jovem na declaração',
      description: `No Anexo A (rendimentos Cat. A), marque a opção "IRS Jovem - Art.º 12.º-F do CIRS" para ${targetMembers.map((m) => m.name).join(' e ')}. Indique o ano de benefício aplicável.`,
      portal_path: 'https://irs.portaldasfinancas.gov.pt/entregaIRSForm.action',
      estimated_impact: savings,
    },
    {
      order: 3,
      title: 'Submeter e aguardar',
      description: `Valide e submeta a declaração. A isenção parcial de IRS Jovem será aplicada automaticamente pela AT.`,
      estimated_impact: 0,
    },
  ]

  return {
    id: `irs-jovem-${result.year}`,
    category: 'regime',
    priority: 'high',
    title: 'Ativar IRS Jovem',
    summary: `${targetMembers.map((m) => m.name).join(' e ')} pode${targetMembers.length > 1 ? 'm' : ''} beneficiar do regime IRS Jovem, poupando ${formatEuro(savings)}.`,
    steps,
    total_savings: savings,
  }
}

function nhrRecommendation(result: AnalysisResult): ActionableRecommendation | undefined {
  if (!result.nhr_savings || result.nhr_savings <= 0) return undefined

  const savings = round2(result.nhr_savings)

  return {
    id: `nhr-${result.year}`,
    category: 'regime',
    priority: 'high',
    title: 'Aplicar regime NHR',
    summary: `O regime de Residente Não Habitual permite uma taxa fixa de 20% sobre rendimentos elegíveis, poupando ${formatEuro(savings)}.`,
    steps: [
      {
        order: 1,
        title: 'Confirmar inscrição NHR',
        description:
          'Verifique que a inscrição no regime NHR está ativa no Portal das Finanças (Dados Pessoais → Situação Cadastral).',
        portal_path: 'https://sitfiscal.portaldasfinancas.gov.pt',
        estimated_impact: 0,
      },
      {
        order: 2,
        title: 'Declarar rendimentos como NHR',
        description:
          'No Anexo L, declare os rendimentos elegíveis para tributação autónoma à taxa de 20%. Os rendimentos de atividades de elevado valor acrescentado qualificam automaticamente.',
        estimated_impact: savings,
      },
    ],
    total_savings: savings,
  }
}

function deductionRecommendations(result: AnalysisResult): ActionableRecommendation[] {
  const recs: ActionableRecommendation[] = []

  for (const opt of result.optimizations) {
    if (opt.estimated_savings <= 0) continue

    const steps: ActionableStep[] = [
      {
        order: 1,
        title: opt.title,
        description: opt.description,
        estimated_impact: opt.estimated_savings,
      },
    ]

    // Categorize based on optimization ID
    let category: ActionableRecommendation['category'] = 'deduction'
    if (opt.id.startsWith('cat-b')) category = 'income'

    recs.push({
      id: opt.id,
      category,
      priority: opt.estimated_savings > 100 ? 'medium' : 'low',
      title: opt.title,
      summary: opt.description,
      steps,
      total_savings: opt.estimated_savings,
    })
  }

  return recs
}

// ─── Main ────────────────────────────────────────────────────

export function generateActionableRecommendations(result: AnalysisResult): ActionableReport {
  const current =
    result.scenarios.find((s) => s.filing_status === result.household.filing_status) ??
    result.scenarios[0]
  const optimal = result.scenarios.reduce((a, b) =>
    a.total_tax_burden <= b.total_tax_burden ? a : b,
  )

  const recommendations: ActionableRecommendation[] = []

  // Filing status change (highest impact)
  const filingRec = filingStatusRecommendation(result, current, optimal)
  if (filingRec) recommendations.push(filingRec)

  // Special regimes
  const irsJovemRec = irsJovemRecommendation(result)
  if (irsJovemRec) recommendations.push(irsJovemRec)

  const nhrRec = nhrRecommendation(result)
  if (nhrRec) recommendations.push(nhrRec)

  // Deduction optimizations
  recommendations.push(...deductionRecommendations(result))

  // Sort by savings (highest first)
  recommendations.sort((a, b) => b.total_savings - a.total_savings)

  const totalSavings = round2(recommendations.reduce((sum, r) => sum + r.total_savings, 0))

  return {
    year: result.year,
    recommendations,
    total_savings: totalSavings,
    current_filing: filingLabel(current.filing_status),
    optimal_filing: filingLabel(optimal.filing_status),
  }
}
