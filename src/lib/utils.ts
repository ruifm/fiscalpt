import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Number Formatting ──────────────────────────────────────

const euroFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Format a number as euros: €1.234,56 */
export function formatEuro(value: number): string {
  return euroFormatter.format(value)
}

/** Format a decimal as percentage: 0.235 → "23,5%" */
export function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** Format a plain number with pt-PT locale: 1234.56 → "1.234,56" */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
