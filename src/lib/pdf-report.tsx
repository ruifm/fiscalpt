import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { AnalysisResult, PersonTaxDetail, ScenarioResult } from './tax/types'
import type { ActionableReport, ActionableRecommendation } from './tax/actionable-recommendations'
import { deriveResultsView } from './tax/results-view'
import { personTotalIrs, scenarioRefund } from './tax/historical-comparison'
import { dictionaries } from '@/dictionaries'
import type { Dictionary, Locale } from '@/lib/i18n'

// ─── Style constants ──────────────────────────────────────────

const BLUE = '#2563eb'
const DARK = '#1f2937'
const GRAY = '#6b7280'
const LIGHT_GRAY = '#f3f4f6'
const BORDER = '#e5e7eb'
const GREEN = '#059669'
const RED = '#dc2626'
const AMBER = '#d97706'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
    paddingBottom: 10,
  },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: BLUE },
  logoSub: { fontSize: 8, color: GRAY, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK },
  headerDate: { fontSize: 8, color: GRAY, marginTop: 2 },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 6,
    marginTop: 10,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 10,
  },
  summaryLabel: { fontSize: 7, color: GRAY, marginBottom: 2, textTransform: 'uppercase' as const },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  summaryValueGreen: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GREEN },
  summaryValueRed: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: RED },
  summaryValueAmber: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: AMBER },

  // Table
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, marginBottom: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'right',
  },
  tableHeaderCellFirst: {
    flex: 1.5,
    padding: 6,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'left',
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: LIGHT_GRAY,
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
  },
  tableCell: { flex: 1, padding: 6, fontSize: 8, textAlign: 'right' },
  tableCellFirst: { flex: 1.5, padding: 6, fontSize: 8, textAlign: 'left' },
  tableCellBold: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  tableCellBoldFirst: {
    flex: 1.5,
    padding: 6,
    fontSize: 8,
    textAlign: 'left',
    fontFamily: 'Helvetica-Bold',
  },

  // Optimizations
  optimizationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  optimizationTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', flex: 1 },
  optimizationDesc: { fontSize: 8, color: GRAY, marginTop: 2 },
  optimizationSavings: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    minWidth: 70,
    textAlign: 'right',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: GRAY },
  footerPage: { fontSize: 7, color: GRAY },

  // Savings badge
  savingsBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  savingsBadgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: GREEN },

  noOptimizations: { fontSize: 9, color: GRAY, fontStyle: 'italic', marginTop: 4 },

  // Unlocked recommendations
  recCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recIndex: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recIndexText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLUE },
  recTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', flex: 1 },
  recSavings: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREEN },
  recSummary: { fontSize: 8, color: GRAY, marginBottom: 6 },
  recStep: { flexDirection: 'row', gap: 4, marginBottom: 4, paddingLeft: 24 },
  recStepNumber: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLUE, width: 12 },
  recStepTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  recStepDesc: { fontSize: 7, color: GRAY, marginTop: 1 },
  recStepLink: { fontSize: 7, color: BLUE, marginTop: 1 },
})

// ─── i18n helper (no React context — plain dictionary lookup) ─

type DictValue = string | { [key: string]: DictValue }

function resolvePath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.')
  let current: DictValue = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, DictValue>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  )
}

function makeT(locale: Locale): (key: string, params?: Record<string, string | number>) => string {
  const dict = dictionaries[locale]
  return (key, params) => {
    const value = resolvePath(dict, key) ?? resolvePath(dictionaries.pt, key) ?? key
    return params ? interpolate(value, params) : value
  }
}

// ─── Formatting (locale-independent, same as app) ─────────────

function fmtEuro(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtPercent(value: number): string {
  return `${(value * 100).toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// ─── Helpers ──────────────────────────────────────────────────

function personRefund(p: PersonTaxDetail): number {
  return p.withholding_total - personTotalIrs(p)
}

function filingLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'married_joint':
      return t('review.filing.joint')
    case 'married_separate':
      return t('review.filing.separate')
    default:
      return t('review.filing.single')
  }
}

// ─── PDF Document Component ──────────────────────────────────

export interface PdfReportProps {
  results: AnalysisResult[]
  locale: Locale
  unlockedReports?: ActionableReport[]
}

export function PdfReport({ results, locale, unlockedReports }: PdfReportProps) {
  const t = makeT(locale)
  const now = new Date()
  const dateStr = now.toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document
      title={`FiscalPT — ${t('pdf.reportTitle')}`}
      author="FiscalPT"
      creator="FiscalPT"
      language={locale}
    >
      {results.map((result) => {
        const yearReport = unlockedReports?.find((r) => r.year === result.year)
        return (
          <YearPage
            key={result.year}
            result={result}
            t={t}
            dateStr={dateStr}
            unlockedReport={yearReport}
          />
        )
      })}
    </Document>
  )
}

// ─── Per-year page ───────────────────────────────────────────

function YearPage({
  result,
  t,
  dateStr,
  unlockedReport,
}: {
  result: AnalysisResult
  t: ReturnType<typeof makeT>
  dateStr: string
  unlockedReport?: ActionableReport
}) {
  const view = deriveResultsView(result)
  const { currentScenario, optimalScenario, isAlreadyOptimal, savings } = view
  const isMulti = currentScenario.persons.length > 1
  const refund = scenarioRefund(currentScenario)
  const isRefund = refund >= 0

  return (
    <Page size="A4" style={s.page} wrap>
      {/* Header */}
      <View style={s.header} fixed>
        <View>
          <Text style={s.logo}>FiscalPT</Text>
          <Text style={s.logoSub}>{t('pdf.tagline')}</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.headerTitle}>{t('pdf.reportTitle')}</Text>
          <Text style={s.headerDate}>{dateStr}</Text>
        </View>
      </View>

      {/* Year & filing */}
      <Text style={s.sectionTitle}>
        {t('results.fiscalYear', { year: result.year })} —{' '}
        {filingLabel(result.household.filing_status, t)}
      </Text>

      {/* Summary cards */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>{t('results.income')}</Text>
          <Text style={s.summaryValue}>{fmtEuro(currentScenario.total_gross)}</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>{t('results.irs')}</Text>
          <Text style={s.summaryValueRed}>{fmtEuro(currentScenario.total_irs)}</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>{t('results.effectiveRate')}</Text>
          <Text style={s.summaryValue}>{fmtPercent(currentScenario.effective_rate_irs)}</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>{isRefund ? t('results.refund') : t('results.toPay')}</Text>
          <Text style={isRefund ? s.summaryValueGreen : s.summaryValueAmber}>
            {fmtEuro(Math.abs(refund))}
          </Text>
        </View>
      </View>

      {/* Current scenario table */}
      <Text style={s.sectionSubtitle}>{t('results.currentSituation')}</Text>
      <ScenarioTable scenario={currentScenario} isMulti={isMulti} t={t} />

      {/* Optimized scenario */}
      {!isAlreadyOptimal && savings > 0 && (
        <>
          <View style={s.savingsBadge}>
            <Text style={s.savingsBadgeText}>
              ★ {t('results.optimizedScenario')} —{' '}
              {t('results.saves', { amount: fmtEuro(savings) })}
            </Text>
          </View>
          <ScenarioTable scenario={optimalScenario} isMulti={isMulti} t={t} />
        </>
      )}

      {/* Recommendations / Optimizations */}
      {unlockedReport && unlockedReport.recommendations.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>{t('pdf.recommendations')}</Text>
          {unlockedReport.recommendations.map((rec, idx) => (
            <RecommendationSection key={rec.id} recommendation={rec} index={idx} t={t} />
          ))}
        </>
      ) : result.optimizations.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>{t('pdf.optimizations')}</Text>
          <View style={s.optimizationItem}>
            <Text style={s.optimizationDesc}>
              {t('pdf.optimizationsTeaser', {
                count: result.optimizations.length,
                amount: fmtEuro(
                  result.optimizations.reduce((sum, o) => sum + o.estimated_savings, 0),
                ),
              })}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={s.sectionTitle}>{t('pdf.optimizations')}</Text>
          <Text style={s.noOptimizations}>{t('pdf.noOptimizations')}</Text>
        </>
      )}

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{t('pdf.disclaimer')}</Text>
        <Text
          style={s.footerPage}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </Page>
  )
}

// ─── Scenario table ──────────────────────────────────────────

function ScenarioTable({
  scenario,
  isMulti,
  t,
}: {
  scenario: ScenarioResult
  isMulti: boolean
  t: ReturnType<typeof makeT>
}) {
  return (
    <View style={s.table}>
      {/* Header row */}
      <View style={s.tableHeader}>
        <Text style={s.tableHeaderCellFirst}>{isMulti ? t('pdf.member') : ''}</Text>
        <Text style={s.tableHeaderCell}>{t('pdf.grossIncome')}</Text>
        <Text style={s.tableHeaderCell}>{t('pdf.taxableIncome')}</Text>
        <Text style={s.tableHeaderCell}>{t('results.irs')}</Text>
        <Text style={s.tableHeaderCell}>{t('pdf.withholding')}</Text>
        <Text style={s.tableHeaderCell}>{t('pdf.socialSecurity')}</Text>
        <Text style={s.tableHeaderCell}>{t('pdf.refundResult')}</Text>
      </View>

      {/* Person rows */}
      {scenario.persons.map((person, i) => {
        const ref = personRefund(person)
        return (
          <View key={person.name} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={s.tableCellFirst}>{person.name}</Text>
            <Text style={s.tableCell}>{fmtEuro(person.gross_income)}</Text>
            <Text style={s.tableCell}>{fmtEuro(person.taxable_income)}</Text>
            <Text style={s.tableCell}>{fmtEuro(personTotalIrs(person))}</Text>
            <Text style={s.tableCell}>{fmtEuro(person.withholding_total)}</Text>
            <Text style={s.tableCell}>{fmtEuro(person.ss_total)}</Text>
            <Text style={{ ...s.tableCell, color: ref >= 0 ? GREEN : AMBER }}>
              {ref >= 0 ? '+' : ''}
              {fmtEuro(ref)}
            </Text>
          </View>
        )
      })}

      {/* Total row (only for multi-person) */}
      {isMulti && (
        <View style={s.tableRowTotal}>
          <Text style={s.tableCellBoldFirst}>{t('pdf.total')}</Text>
          <Text style={s.tableCellBold}>{fmtEuro(scenario.total_gross)}</Text>
          <Text style={s.tableCellBold}>{fmtEuro(scenario.total_taxable)}</Text>
          <Text style={s.tableCellBold}>{fmtEuro(scenario.total_irs)}</Text>
          <Text style={s.tableCellBold}>
            {fmtEuro(scenario.persons.reduce((sum, p) => sum + p.withholding_total, 0))}
          </Text>
          <Text style={s.tableCellBold}>{fmtEuro(scenario.total_ss)}</Text>
          {(() => {
            const totalRef = scenarioRefund(scenario)
            return (
              <Text style={{ ...s.tableCellBold, color: totalRef >= 0 ? GREEN : AMBER }}>
                {totalRef >= 0 ? '+' : ''}
                {fmtEuro(totalRef)}
              </Text>
            )
          })()}
        </View>
      )}
    </View>
  )
}

// ─── Unlocked recommendation section ─────────────────────────

const PRIORITY_COLORS = { high: GREEN, medium: AMBER, low: GRAY } as const

function RecommendationSection({
  recommendation,
  index,
  t,
}: {
  recommendation: ActionableRecommendation
  index: number
  t: ReturnType<typeof makeT>
}) {
  const priorityLabel = t(`pdf.priority_${recommendation.priority}`)

  return (
    <View style={s.recCard} wrap={false}>
      <View style={s.recHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <View style={s.recIndex}>
            <Text style={s.recIndexText}>{index + 1}</Text>
          </View>
          <Text style={s.recTitle}>{recommendation.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 7, color: PRIORITY_COLORS[recommendation.priority] }}>
            {priorityLabel}
          </Text>
          {recommendation.total_savings > 0 && (
            <Text style={s.recSavings}>{fmtEuro(recommendation.total_savings)}</Text>
          )}
        </View>
      </View>
      <Text style={s.recSummary}>{recommendation.summary}</Text>
      {recommendation.steps.map((step) => (
        <View key={step.order} style={s.recStep}>
          <Text style={s.recStepNumber}>{step.order}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.recStepTitle}>{step.title}</Text>
            <Text style={s.recStepDesc}>{step.description}</Text>
            {step.portal_path && <Text style={s.recStepLink}>Portal: {step.portal_path}</Text>}
          </View>
        </View>
      ))}
    </View>
  )
}
