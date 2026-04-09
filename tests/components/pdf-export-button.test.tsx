// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnalysisResult } from '@/lib/tax/types'

vi.mock('@/lib/i18n', () => ({
  useLocale: () => ({ locale: 'pt' }),
  useT: () => (key: string) => key,
}))

const mockToBlob = vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
const mockPdf = vi.fn().mockReturnValue({ toBlob: mockToBlob })

vi.mock('@react-pdf/renderer', () => ({
  pdf: mockPdf,
}))

vi.mock('@/lib/pdf-report', () => ({
  PdfReport: () => null,
}))

import { PdfExportButton } from '@/components/pdf-export-button'

const fakeResult: AnalysisResult = {
  year: 2024,
  household: { year: 2024, filing_status: 'single', members: [], dependents: [] },
  scenarios: [],
  recommended_scenario: 'separate',
  optimizations: [],
}

describe('PdfExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders download button with aria-label', () => {
    render(<PdfExportButton results={[fakeResult]} />)
    expect(screen.getByRole('button', { name: 'common.downloadPdf' })).toBeDefined()
  })

  it('triggers PDF generation on click', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:url')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })

    const user = userEvent.setup()
    render(<PdfExportButton results={[fakeResult]} />)

    await user.click(screen.getByRole('button', { name: 'common.downloadPdf' }))

    await waitFor(() => {
      expect(mockPdf).toHaveBeenCalled()
      expect(createObjectURL).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalled()
    })
  })

  it('handles PDF generation failure gracefully', async () => {
    mockToBlob.mockRejectedValueOnce(new Error('render failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(<PdfExportButton results={[fakeResult]} />)
    await user.click(screen.getByRole('button', { name: 'common.downloadPdf' }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('PDF generation failed:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })
})
