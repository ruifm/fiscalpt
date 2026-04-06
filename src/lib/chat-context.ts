import type { Locale } from '@/lib/i18n'
import type { AnalysisResult } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'

// ─── PII Redaction ────────────────────────────────────────────

const MEMBER_LABELS = 'ABCDEFGHIJ'.split('')

interface PiiMap {
  members: Map<string, string>
  dependents: Map<string, string>
}

function buildPiiMap(results: AnalysisResult[]): PiiMap {
  const members = new Map<string, string>()
  const dependents = new Map<string, string>()

  let memberIdx = 0
  let depIdx = 0

  for (const r of results) {
    for (const m of r.household.members) {
      if (!members.has(m.name)) {
        members.set(m.name, `Contribuinte ${MEMBER_LABELS[memberIdx] ?? memberIdx + 1}`)
        memberIdx++
      }
    }
    for (const d of r.household.dependents) {
      if (!dependents.has(d.name)) {
        depIdx++
        dependents.set(d.name, `Dependente ${depIdx}`)
      }
    }
  }

  return { members, dependents }
}

function redactName(name: string, pii: PiiMap): string {
  return pii.members.get(name) ?? pii.dependents.get(name) ?? name
}

// ─── Section Builders ─────────────────────────────────────────

function buildInputsSection(results: AnalysisResult[], pii: PiiMap): string {
  const lines: string[] = []

  for (const r of results) {
    const h = r.household
    lines.push(`### Ano ${h.year}${h.projected ? ' (projeção)' : ''}`)
    lines.push(`Estado civil: ${h.filing_status}`)

    for (const m of h.members) {
      const label = redactName(m.name, pii)
      lines.push(`\n#### ${label}`)
      if (m.birth_year) lines.push(`Ano de nascimento: ${m.birth_year}`)

      if (m.special_regimes.length > 0) {
        const regimes = m.special_regimes.map((sr) => {
          if (sr === 'irs_jovem') {
            const parts = [`irs_jovem (ano ${m.irs_jovem_year ?? '?'})`]
            if (m.irs_jovem_first_work_year)
              parts.push(`início de atividade: ${m.irs_jovem_first_work_year}`)
            return parts.join(', ')
          }
          if (sr === 'nhr') return `nhr (início: ${m.nhr_start_year ?? '?'})`
          return sr
        })
        lines.push(`Regimes especiais: ${regimes.join(', ')}`)
      }

      if (m.disability_degree) lines.push(`Grau de incapacidade: ${m.disability_degree}%`)

      for (const inc of m.incomes) {
        const parts = [`Cat ${inc.category}: bruto=${inc.gross}`]
        if (inc.withholding) parts.push(`retenção=${inc.withholding}`)
        if (inc.ss_paid) parts.push(`SS pago=${inc.ss_paid}`)
        if (inc.cat_b_regime) parts.push(`regime=${inc.cat_b_regime}`)
        if (inc.englobamento) parts.push('englobamento=sim')
        if (inc.rental_contract_duration)
          parts.push(`duração contrato=${inc.rental_contract_duration} anos`)
        lines.push(`Rendimento: ${parts.join(', ')}`)
      }

      if (m.deductions.length > 0) {
        const deds = m.deductions.map((d) => `${d.category}=${d.amount}`).join(', ')
        lines.push(`Deduções: ${deds}`)
      }
    }

    if (h.dependents.length > 0) {
      lines.push('\n#### Dependentes')
      for (const d of h.dependents) {
        const label = redactName(d.name, pii)
        const parts = [label]
        if (d.birth_year) parts.push(`nascimento=${d.birth_year}`)
        if (d.disability_degree) parts.push(`incapacidade=${d.disability_degree}%`)
        lines.push(`- ${parts.join(', ')}`)
      }
    }

    if (h.ascendants && h.ascendants.length > 0) {
      lines.push('\n#### Ascendentes')
      for (let i = 0; i < h.ascendants.length; i++) {
        const a = h.ascendants[i]
        const parts = [`Ascendente ${i + 1}`]
        if (a.birth_year) parts.push(`nascimento=${a.birth_year}`)
        if (a.income != null) parts.push(`rendimento=${a.income}`)
        lines.push(`- ${parts.join(', ')}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

function buildResultsSection(results: AnalysisResult[], pii: PiiMap): string {
  const lines: string[] = []

  for (const r of results) {
    lines.push(`### Ano ${r.year}`)
    lines.push(`Cenário recomendado: ${r.recommended_scenario}`)

    if (r.joint_vs_separate_savings != null) {
      lines.push(`Poupança conjunta vs separada: €${r.joint_vs_separate_savings}`)
    }
    if (r.irs_jovem_savings != null) {
      lines.push(`Poupança IRS Jovem: €${r.irs_jovem_savings}`)
    }
    if (r.nhr_savings != null) {
      lines.push(`Poupança NHR: €${r.nhr_savings}`)
    }

    for (const s of r.scenarios) {
      lines.push(`\n#### Cenário: ${s.label}`)
      lines.push(
        `Totais: bruto=${s.total_gross}, tributável=${s.total_taxable}, ` +
          `IRS=${s.total_irs}, SS=${s.total_ss}, deduções=${s.total_deductions}, ` +
          `carga fiscal=${s.total_tax_burden}, líquido=${s.total_net}`,
      )
      lines.push(
        `Taxas efetivas: IRS=${pct(s.effective_rate_irs)}, total=${pct(s.effective_rate_total)}`,
      )

      for (const p of s.persons) {
        const label = redactName(p.name, pii)
        lines.push(`\n${label}:`)
        lines.push(
          `  Bruto=${p.gross_income}, tributável=${p.taxable_income}, ` +
            `IRS pré-deduções=${p.irs_before_deductions}, deduções=${p.deductions_total}, ` +
            `IRS final=${p.irs_after_deductions}`,
        )

        const extras: string[] = []
        if (p.autonomous_tax) extras.push(`tributação autónoma=${p.autonomous_tax}`)
        if (p.solidarity_surcharge) extras.push(`sobretaxa solidariedade=${p.solidarity_surcharge}`)
        if (p.irs_jovem_exemption) extras.push(`isenção IRS Jovem=${p.irs_jovem_exemption}`)
        if (p.nhr_tax) extras.push(`imposto NHR=${p.nhr_tax}`)
        if (p.double_taxation_credit)
          extras.push(`crédito dupla tributação=${p.double_taxation_credit}`)
        if (p.minimo_existencia_applied) extras.push('mínimo existência=aplicado')
        if (extras.length > 0) lines.push(`  ${extras.join(', ')}`)

        lines.push(
          `  SS=${p.ss_total}, retenção=${p.withholding_total}, ` +
            `taxa IRS=${pct(p.effective_rate_irs)}, taxa total=${pct(p.effective_rate_total)}`,
        )
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

function buildOptimizationsSection(
  results: AnalysisResult[],
  recommendations?: ActionableReport[],
): string {
  const lines: string[] = []

  for (const r of results) {
    if (r.optimizations.length > 0) {
      lines.push(`### Otimizações proativas — ${r.year}`)
      for (const opt of r.optimizations) {
        lines.push(
          `- **${opt.title}**: ${opt.description} (poupança estimada: €${opt.estimated_savings})`,
        )
      }
      lines.push('')
    }
  }

  if (recommendations && recommendations.length > 0) {
    lines.push('### Recomendações acionáveis')
    for (const report of recommendations) {
      lines.push(`\n#### Ano ${report.year} — poupança total: €${report.total_savings}`)
      lines.push(`Regime atual: ${report.current_filing} → Ótimo: ${report.optimal_filing}`)

      for (const rec of report.recommendations) {
        lines.push(`\n**${rec.title}** [${rec.priority}] — €${rec.total_savings}`)
        lines.push(rec.summary)
        for (const step of rec.steps) {
          lines.push(`  ${step.order}. ${step.title}: ${step.description}`)
          if (step.portal_path) lines.push(`     URL: ${step.portal_path}`)
        }
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Root Prompt ──────────────────────────────────────────────

function buildRootPrompt(locale: Locale): string {
  const languageRule =
    locale === 'pt'
      ? `Responde SEMPRE em português europeu (pt-PT). Nunca uses português do Brasil (pt-BR) — usa "tu" em vez de "você", "telemóvel" em vez de "celular", "autocarro" em vez de "ônibus", etc.`
      : `Always respond in English. Use € formatting (e.g., €1,234.56) for monetary amounts.`

  return `You are a Portuguese tax advisor assistant for FiscalPT.
You help individual taxpayers understand their tax situation based on a deterministic analysis computed by a verified tax engine.

LANGUAGE:
${languageRule}

CRITICAL RULES:
- All numbers below were computed by a deterministic tax engine — they are mathematically verified, not AI-generated.
- Your role is to EXPLAIN and CONTEXTUALIZE these results. Nunca inventes números ou cálculos.
- Only discuss the user's specific tax data provided below. If the user asks about something not covered, say so clearly.
- Be practical and actionable. Use simple, clear language.
- Keep responses concise — 2-3 paragraphs max unless the user asks for detail.
- Use €X.XXX,XX formatting for amounts (Portuguese locale).
- Reference specific values from the analysis when explaining.
- Never provide legal advice — you provide tax information and explain calculations.
- When referring to household members, use the labels below (Contribuinte A, Contribuinte B, etc.) — never reveal real names or NIFs.`
}

// ─── Public API ───────────────────────────────────────────────

export interface ChatContextParams {
  results: AnalysisResult[]
  locale?: Locale
  recommendations?: ActionableReport[]
}

export function buildChatSystemPrompt(params: ChatContextParams): string {
  const { results, locale = 'pt', recommendations } = params
  const pii = buildPiiMap(results)

  const sections = [
    buildRootPrompt(locale),
    '\n---\n\n## 1. DADOS DO AGREGADO (inputs do utilizador)\n',
    buildInputsSection(results, pii),
    '---\n\n## 2. RESULTADOS DA ANÁLISE\n',
    buildResultsSection(results, pii),
    '---\n\n## 3. RECOMENDAÇÕES E OTIMIZAÇÕES\n',
    buildOptimizationsSection(results, recommendations),
  ]

  return sections.join('\n')
}
