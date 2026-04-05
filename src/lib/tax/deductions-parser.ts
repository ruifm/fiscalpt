/**
 * Parser for AT portal "Consultar Despesas p/ Deduções à Coleta" page text.
 *
 * Users Ctrl+A → Ctrl+C the page and paste the text into our app.
 * This module extracts NIF, year, name, and per-category expense/deduction amounts.
 */
import type { DeductionCategory } from './types'

// ── Types ──────────────────────────────────────────────────────────────

export interface ParsedExpense {
  category: DeductionCategory
  /** Total expense amount reported to AT (e.g. 38775.95) */
  expenseAmount: number
  /** Deduction amount computed by AT (informational, for display) */
  deductionAmount: number
}

export interface ParsedDeductionsPage {
  nif: string
  name: string
  year: number
  expenses: ParsedExpense[]
}

export type DeductionsParseResult =
  | { ok: true; data: ParsedDeductionsPage }
  | { ok: false; error: string }

// ── Constants ──────────────────────────────────────────────────────────

/** Maps AT portal category labels (lowercase) to our DeductionCategory */
const AT_CATEGORY_MAP: readonly [string, DeductionCategory][] = [
  ['despesas gerais familiares', 'general'],
  ['saúde e seguros de saúde', 'health'],
  ['educação e formação', 'education'],
  ['encargos com imóveis', 'housing'],
  ['encargos com lares', 'care_home'],
  ['exigência de fatura', 'fatura'],
  ['encargos com a prestação de trabalho doméstico', 'trabalho_domestico'],
]

// ── Helpers ────────────────────────────────────────────────────────────

/** Parse Portuguese currency: "38.775,95 €" → 38775.95, "0,00 €" → 0 */
export function parsePortugueseAmount(text: string): number | null {
  const match = text.match(/([\d.]+,\d{2})\s*€/)
  if (!match) return null
  return parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
}

// ── Parser ─────────────────────────────────────────────────────────────

/**
 * Parse the full-page text obtained by Ctrl+A → Ctrl+C on the AT portal
 * "Consultar Despesas p/ Deduções à Coleta" page.
 *
 * Extracts NIF, name, year, and expense/deduction amounts per category.
 * Gracefully handles noise (menus, footers, privacy notices).
 */
export function parseDeductionsPageText(text: string): DeductionsParseResult {
  if (!text?.trim()) {
    return { ok: false, error: 'Texto vazio' }
  }

  // ── NIF ──
  const nifMatch = text.match(/NIF:\s*(\d{9})/)
  if (!nifMatch) {
    return { ok: false, error: 'NIF não encontrado no texto colado' }
  }
  const nif = nifMatch[1]

  // ── Year (from "Ano YYYY" dropdown value) ──
  const yearMatch = text.match(/Ano\s+(\d{4})/)
  if (!yearMatch) {
    return { ok: false, error: 'Ano não encontrado no texto colado' }
  }
  const year = parseInt(yearMatch[1], 10)

  // ── Name (from greeting: "Boa noite, NOME") ──
  const nameMatch = text.match(/Boa\s+(?:noite|tarde|dia|manhã),\s+(.+)/i)
  const name = nameMatch ? nameMatch[1].trim() : ''

  // ── Expenses ──
  const lines = text.split('\n').map((l) => l.trim())
  const expenses: ParsedExpense[] = []

  for (const [label, category] of AT_CATEGORY_MAP) {
    const idx = lines.findIndex((l) => l.toLowerCase() === label)
    if (idx === -1) continue

    let expenseAmount = 0
    let deductionAmount = 0

    // Scan the next few lines for the expense amount and deduction amount
    for (let i = idx + 1; i < lines.length && i <= idx + 5; i++) {
      const line = lines[i]
      if (!line) continue

      if (line.includes('€') && !line.toLowerCase().startsWith('dedução')) {
        expenseAmount = parsePortugueseAmount(line) ?? 0
      }
      if (line.toLowerCase().startsWith('dedução correspondente')) {
        deductionAmount = parsePortugueseAmount(line) ?? 0
        break
      }
    }

    expenses.push({ category, expenseAmount, deductionAmount })
  }

  if (expenses.length === 0) {
    return { ok: false, error: 'Nenhuma categoria de despesa encontrada no texto colado' }
  }

  return { ok: true, data: { nif, name, year, expenses } }
}
