import { describe, it, expect } from 'vitest'
import { formatYearRange } from '@/components/document-upload/file-processing'

describe('formatYearRange', () => {
  it('returns empty string for empty array', () => {
    expect(formatYearRange([])).toBe('')
  })

  it('returns single year as string', () => {
    expect(formatYearRange([2024])).toBe('2024')
  })

  it('returns range for multiple years', () => {
    expect(formatYearRange([2024, 2023])).toBe('2023–2024')
  })

  it('returns range for three years', () => {
    expect(formatYearRange([2025, 2023, 2024])).toBe('2023–2025')
  })

  it('does not mutate the input array', () => {
    const input = [2025, 2023]
    formatYearRange(input)
    expect(input).toEqual([2025, 2023])
  })
})
