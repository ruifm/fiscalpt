'use client'

import { useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnalysisResult } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'
import { useLocale, useT } from '@/lib/i18n'

interface PdfExportButtonProps {
  results: AnalysisResult[]
  unlockedReports?: ActionableReport[] | null
}

export function PdfExportButton({ results, unlockedReports }: PdfExportButtonProps) {
  const { locale } = useLocale()
  const t = useT()
  const [loading, setLoading] = useState(false)

  const primaryYear = results.length > 0 ? results[0].year : new Date().getFullYear()

  const handleExport = useCallback(async () => {
    setLoading(true)
    try {
      const [{ pdf }, { PdfReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf-report'),
      ])

      const blob = await pdf(
        <PdfReport
          results={results}
          locale={locale}
          unlockedReports={unlockedReports ?? undefined}
        />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fiscalpt-analise-${primaryYear}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }, [results, locale, primaryYear, unlockedReports])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleExport}
      disabled={loading}
      className="print:hidden"
      aria-label={t('common.downloadPdf')}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  )
}
