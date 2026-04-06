// ─── Shared Utility Functions ────────────────────────────────

/** Round to 2 decimal places (€ amounts). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Round to 4 decimal places (rates/percentages). */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

/** Sum the gross income for a filtered set of income categories. */
export function sumGross(
  incomes: { gross: number; category: string }[],
  categories?: string[],
): number {
  const filtered = categories ? incomes.filter((i) => categories.includes(i.category)) : incomes
  return filtered.reduce((sum, i) => sum + i.gross, 0)
}

/** Format a number as a euro amount (integer, no decimals). */
export function formatEuro(amount: number): string {
  return `€${amount.toFixed(0)}`
}
