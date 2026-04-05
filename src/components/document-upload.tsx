'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  FileCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Shield,
  ClipboardPaste,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { XmlGuide, PdfGuide, LiquidacaoGuide } from '@/components/at-guide'
import type { Household, ValidationIssue, DeductionCategory } from '@/lib/tax/types'
import { parseModelo3Xml, type ParsedXmlResult } from '@/lib/tax/xml-parser'
import {
  extractTextFromPdf,
  parseLiquidacaoText,
  parseComprovativoPdfText,
  comprativoParsedToHousehold,
  detectDocumentType,
  type DocumentType,
  type LiquidacaoParsed,
  type ComprovativoParsed,
} from '@/lib/tax/pdf-extractor'
import {
  validateDeclarationFiles,
  validateLiquidacaoFiles,
  validatePreviousYearsFiles,
  validateCrossSection,
  computeDeductionSlots,
  getMandatoryUnfilledSlots,
  mergeSpouseHouseholds,
  maxPreviousYearsFiles,
  getAmendableYears,
  getAllSupportedYears,
  type FileInfo,
  type UploadValidationError,
  type DeductionSlot,
} from '@/lib/tax/upload-validation'
import { parseDeductionsPageText, type DeductionsParseResult } from '@/lib/tax/deductions-parser'
import { useT } from '@/lib/i18n'

interface DocumentUploadProps {
  onExtracted: (
    households: Household[],
    issues: ValidationIssue[],
    liquidacao?: LiquidacaoParsed,
  ) => void
}

interface FileMeta {
  docTypeLabel: string
  nif?: string
  year?: number
  taxaEfetiva?: number
  nifConjuge?: string
}

interface UploadedFile {
  file: File
  type: DocumentType
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
  meta?: FileMeta
  parsedXml?: ParsedXmlResult
  parsedComprovativo?: ComprovativoParsed
  parsedLiquidacao?: LiquidacaoParsed
}

interface SectionFiles {
  declaration: UploadedFile[]
  liquidacao: UploadedFile[]
  previousYears: UploadedFile[]
}

type Section = keyof SectionFiles

// ─── Constants ──────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 20
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const MAX_FILES: Record<Section, number> = {
  declaration: 2,
  liquidacao: 2,
  previousYears: 0, // dynamic — overridden by maxPreviousYearsFiles()
}

const YEAR_COLORS: Record<number, string> = {
  2021: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  2022: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  2023: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  2024: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  2025: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

const NIF_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
] as const

function formatYearRange(years: number[]): string {
  if (years.length === 0) return ''
  const sorted = [...years].sort((a, b) => a - b)
  return sorted.length === 1 ? `${sorted[0]}` : `${sorted[0]}–${sorted[sorted.length - 1]}`
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  xml_modelo3: 'upload.docTypes.xml',
  pdf_comprovativo: 'upload.docTypes.comprovativo',
  pdf_liquidacao: 'upload.docTypes.liquidacao',
  unknown: 'upload.docTypes.unknown',
}

const DOC_TYPE_STYLES: Record<
  DocumentType,
  { icon: typeof FileCode; iconClass: string; badgeClass: string }
> = {
  xml_modelo3: {
    icon: FileCode,
    iconClass: 'text-blue-600 dark:text-blue-400',
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  },
  pdf_comprovativo: {
    icon: FileText,
    iconClass: 'text-amber-600 dark:text-amber-400',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  },
  pdf_liquidacao: {
    icon: Shield,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  unknown: {
    icon: FileText,
    iconClass: 'text-muted-foreground',
    badgeClass: '',
  },
}

const DEDUCTION_CATEGORY_LABELS: Record<string, string> = {
  general: 'upload.deductionCategories.general',
  health: 'upload.deductionCategories.health',
  education: 'upload.deductionCategories.education',
  housing: 'upload.deductionCategories.housing',
  care_home: 'upload.deductionCategories.careHome',
  fatura: 'upload.deductionCategories.invoiceRequirement',
  trabalho_domestico: 'upload.deductionCategories.domesticWork',
}

const SLOT_ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  taxpayer: {
    label: 'upload.memberRoles.taxpayer',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  dependent: {
    label: 'upload.memberRoles.dependent',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  },
  ascendant: {
    label: 'upload.memberRoles.ascendant',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  },
}

/**
 * Maps liquidação deduction fields → DeductionCategory + known rate.
 * Used to reverse-engineer expense amounts: expense = deduction / rate.
 * Since AT already applied per-person caps, even-splitting between members
 * reproduces the exact same totals when our engine recomputes.
 */
const LIQUIDACAO_DEDUCTION_MAP: {
  field: keyof LiquidacaoParsed
  category: DeductionCategory
  rate: number
}[] = [
  { field: 'deducoesGerais', category: 'general', rate: 0.35 },
  { field: 'deducoesSaude', category: 'health', rate: 0.15 },
  { field: 'deducoesEducacao', category: 'education', rate: 0.3 },
  { field: 'deducoesExigenciaFatura', category: 'fatura', rate: 0.15 },
]

// ─── Helper Components ──────────────────────────────────────

function DropZone({
  onFiles,
  accept,
  disabled,
  multiple = false,
}: {
  onFiles: (files: FileList) => void
  accept: string
  disabled?: boolean
  multiple?: boolean
}) {
  const t = useT()
  const [dragActive, setDragActive] = useState(false)

  function openFilePicker() {
    if (disabled) return
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = accept
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) onFiles(target.files)
    }
    input.click()
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        if (!disabled) onFiles(e.dataTransfer.files)
      }}
      onClick={openFilePicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openFilePicker()
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t('upload.dropzone')}
      data-testid="upload-dropzone"
      className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-all ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : dragActive
            ? 'cursor-pointer border-primary bg-primary/5'
            : 'cursor-pointer border-border hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      <Upload
        className={`h-5 w-5 shrink-0 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">{t('upload.dropzone')}</span>
    </div>
  )
}

function SectionFileList({
  files,
  onRemove,
  processing,
  nifColorMap,
}: {
  files: UploadedFile[]
  onRemove: (index: number) => void
  processing: boolean
  nifColorMap: Map<string, string>
}) {
  const t = useT()
  if (files.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {files.map((uf, i) => (
        <div
          key={`${uf.file.name}-${i}`}
          data-testid="upload-slot"
          className={`rounded-md border px-3 py-2 ${
            uf.status === 'error'
              ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
              : uf.status === 'processing'
                ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
                : 'border-border bg-muted/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {(() => {
              const style = DOC_TYPE_STYLES[uf.type] ?? DOC_TYPE_STYLES.unknown
              const Icon = style.icon
              return <Icon className={`h-4 w-4 shrink-0 ${style.iconClass}`} aria-hidden="true" />
            })()}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{uf.file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {(uf.file.size / 1024).toFixed(0)} KB
            </span>
            {uf.status === 'processing' && (
              <Loader2
                className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500"
                aria-hidden="true"
              />
            )}
            {uf.status === 'done' && (
              <CheckCircle
                className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500"
                aria-hidden="true"
              />
            )}
            {uf.status === 'error' && (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
            )}
            {!processing && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(i)
                }}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                aria-label={`${t('upload.remove')} ${uf.file.name}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {uf.status === 'processing' && (
            <p className="mt-1 pl-6 text-xs text-blue-600 dark:text-blue-400">
              {t('upload.processing')}
            </p>
          )}
          {uf.status === 'error' && uf.error && (
            <p className="mt-1 pl-6 text-xs text-red-600 dark:text-red-400">⚠ {uf.error}</p>
          )}
          {uf.status === 'done' && uf.error && (
            <p className="mt-1 pl-6 text-xs text-red-600 dark:text-red-400">⚠ {uf.error}</p>
          )}
          {uf.status === 'done' && uf.meta && (
            <div className="mt-1 space-y-0.5 pl-6">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className={`px-1.5 py-0 text-[10px] ${(DOC_TYPE_STYLES[uf.type] ?? DOC_TYPE_STYLES.unknown).badgeClass}`}
                >
                  {t(uf.meta.docTypeLabel)}
                </Badge>
                {uf.meta.nif && (
                  <Badge className={nifColorMap.get(uf.meta.nif) ?? ''}>NIF {uf.meta.nif}</Badge>
                )}
                {uf.meta.year != null && (
                  <Badge className={YEAR_COLORS[uf.meta.year] ?? ''}>{uf.meta.year}</Badge>
                )}
                {uf.meta.taxaEfetiva != null && (
                  <span className="text-muted-foreground">
                    {t('upload.effectiveRateLabel')}: {(uf.meta.taxaEfetiva * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/** Sort order: declarations (XML first, then PDF comprovativo) before liquidações */
const DOC_TYPE_ORDER: Record<DocumentType, number> = {
  xml_modelo3: 0,
  pdf_comprovativo: 1,
  pdf_liquidacao: 2,
  unknown: 3,
}

/**
 * Previous years file list grouped by year (descending).
 * Within each year: declarations first, then liquidações.
 */
function GroupedSectionFileList({
  files,
  onRemove,
  processing,
  nifColorMap,
}: {
  files: UploadedFile[]
  onRemove: (index: number) => void
  processing: boolean
  nifColorMap: Map<string, string>
}) {
  const t = useT()
  if (files.length === 0) return null

  // Build groups keyed by year, preserving original indices for onRemove
  const indexed = files.map((uf, i) => ({ uf, originalIndex: i }))

  const groups = new Map<number | 'unknown', { uf: UploadedFile; originalIndex: number }[]>()
  for (const entry of indexed) {
    const year = entry.uf.meta?.year ?? 'unknown'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(entry)
  }

  // Sort groups by year descending ('unknown' at the end)
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === 'unknown') return 1
    if (b === 'unknown') return -1
    return (b as number) - (a as number)
  })

  // Sort files within each group: declarations first, then liquidações
  for (const entries of groups.values()) {
    entries.sort((a, b) => {
      const oa = DOC_TYPE_ORDER[a.uf.type] ?? 3
      const ob = DOC_TYPE_ORDER[b.uf.type] ?? 3
      return oa - ob
    })
  }

  return (
    <div className="mt-3 space-y-3">
      {sortedKeys.map((yearKey) => {
        const entries = groups.get(yearKey)!
        const yearLabel = yearKey === 'unknown' ? t('upload.unknownYear') : String(yearKey)
        const yearColor = typeof yearKey === 'number' ? YEAR_COLORS[yearKey] : undefined

        return (
          <div key={yearLabel}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Badge className={yearColor ?? 'bg-muted text-muted-foreground'}>{yearLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                ({entries.length}{' '}
                {entries.length === 1 ? t('upload.documentSingular') : t('upload.documentPlural')})
              </span>
            </div>
            <div className="space-y-1.5 border-l-2 border-muted pl-2">
              <SectionFileList
                files={entries.map((e) => e.uf)}
                onRemove={(i) => onRemove(entries[i].originalIndex)}
                processing={processing}
                nifColorMap={nifColorMap}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HelpToggle({ children }: { children: React.ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        {t('upload.howToGet')}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-4 text-xs text-muted-foreground">{children}</div>
      )}
    </div>
  )
}

function DeductionSlotCard({
  slot,
  entry,
  nifColorMap,
  onPaste,
  onRemove,
  showNif = true,
  showLoginHint = true,
}: {
  slot: DeductionSlot
  entry?: { text: string; result: DeductionsParseResult }
  nifColorMap: Map<string, string>
  onPaste: (text: string) => void
  onRemove: () => void
  showNif?: boolean
  showLoginHint?: boolean
}) {
  const t = useT()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const parsed = entry?.result.ok ? entry.result.data : null
  const hasError = entry && !entry.result.ok
  const atUrl = `https://irs.portaldasfinancas.gov.pt/consultarDespesasDeducoes.action?ano=${slot.year}`
  const yearColor = YEAR_COLORS[slot.year]
  const nifColor = nifColorMap.get(slot.nif)

  return (
    <div
      className="space-y-2 rounded-lg border p-3"
      data-testid={`deduction-slot-${slot.nif}-${slot.year}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={yearColor ?? 'bg-muted text-muted-foreground'}>{slot.year}</Badge>
        {showNif && (
          <Badge className={nifColor ?? 'bg-muted text-muted-foreground'}>NIF {slot.nif}</Badge>
        )}
        {slot.hasLiquidacao && !parsed && (
          <Badge variant="outline" className="text-[10px]">
            {t('upload.liquidacaoAvailable')}
          </Badge>
        )}
        {parsed && (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
        )}
      </div>

      {!parsed && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <a
            href={atUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-base" aria-hidden="true">
              ①
            </span>
            {t('upload.openPortalStep')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <span className="hidden sm:flex items-center text-muted-foreground" aria-hidden="true">
            →
          </span>
          <span className="text-xs text-muted-foreground sm:flex-1">
            <span className="text-base mr-1" aria-hidden="true">
              ②
            </span>
            {t('upload.copyPasteStep')}
          </span>
        </div>
      )}

      {!parsed && !hasError && showLoginHint && slot.hasLiquidacao && (
        <p className="text-xs italic text-muted-foreground">{t('upload.loginHintLiqOptional')}</p>
      )}

      {!parsed && !hasError && !showLoginHint && slot.hasLiquidacao && (
        <p className="text-xs italic text-muted-foreground">
          {t('upload.loginHintLiqOptionalShort')}
        </p>
      )}

      {parsed ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              ✓ {parsed.name || t(SLOT_ROLE_LABELS[slot.role]?.label ?? 'upload.person')} —{' '}
              {t('upload.categoriesCount', { count: parsed.expenses.length })}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t('upload.removePastedData')}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {parsed.expenses
              .filter((e) => e.expenseAmount > 0)
              .map((e) => (
                <div key={e.category} className="flex justify-between">
                  <span>{t(DEDUCTION_CATEGORY_LABELS[e.category] ?? e.category)}</span>
                  <span className="font-mono tabular-nums">
                    {e.expenseAmount.toLocaleString('pt-PT', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
              ))}
            {parsed.expenses.every((e) => e.expenseAmount === 0) && (
              <span className="col-span-2 italic">{t('upload.noExpenses')}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            data-testid={`deduction-textarea-${slot.nif}-${slot.year}`}
            aria-label={t('upload.pasteDeductionsFor', { nif: slot.nif, year: slot.year })}
            className="min-h-[60px] max-h-[120px] w-full resize-y rounded-md border bg-background px-3 py-2 pr-20 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={t('upload.pasteHere')}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text/plain')
              if (text.trim()) {
                setPasteHint(false)
                onPaste(text)
              }
            }}
            onChange={(e) => {
              const text = e.target.value
              if (text.trim().length > 100) {
                setPasteHint(false)
                onPaste(text)
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 gap-1.5 text-xs"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText()
                if (text.trim()) {
                  setPasteHint(false)
                  onPaste(text)
                  return
                }
              } catch {
                // Clipboard API denied — show hint and focus textarea
              }
              setPasteHint(true)
              textareaRef.current?.focus()
            }}
          >
            <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
            {t('upload.paste')}
          </Button>
          {pasteHint && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('upload.clipboardBlocked')}{' '}
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                Ctrl+V
              </kbd>{' '}
              {t('upload.clipboardBlockedSuffix')}
            </p>
          )}
        </div>
      )}

      {hasError && !entry.result.ok && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{entry.result.error}</span>
        </div>
      )}
    </div>
  )
}

function NifGroup({
  group,
  gi,
  nifColor,
  roleInfo,
  defaultOpen,
  pastedDeductions,
  nifColorMap,
  onPaste,
  onRemove,
}: {
  group: { nif: string; slots: DeductionSlot[] }
  gi: number
  nifColor: string | undefined
  roleInfo: { label: string; badge: string } | undefined
  defaultOpen: boolean
  pastedDeductions: Map<string, { text: string; result: DeductionsParseResult }>
  nifColorMap: Map<string, string>
  onPaste: (slotKey: string, nif: string, year: number, text: string) => void
  onRemove: (slotKey: string) => void
}) {
  const t = useT()
  const [groupOpen, setGroupOpen] = useState(defaultOpen)
  const allLiq = group.slots.every((s) => s.hasLiquidacao)

  return (
    <div className="space-y-2">
      {/* NIF group header with login instructions */}
      <button
        type="button"
        onClick={() => setGroupOpen(!groupOpen)}
        aria-expanded={groupOpen}
        className="flex w-full items-start gap-1.5 rounded-md bg-muted/50 p-2 min-h-[44px] text-left"
      >
        {groupOpen ? (
          <ChevronDown
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <div className="flex-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1.5">
            {gi > 0 && <span className="font-medium">{t('upload.endSession')} </span>}
            <span>
              {gi > 0
                ? t('upload.startSession').charAt(0).toLowerCase() +
                  t('upload.startSession').slice(1)
                : t('upload.startSession').charAt(0).toUpperCase() +
                  t('upload.startSession').slice(1)}
            </span>
            <Badge className={`${nifColor ?? 'bg-muted text-muted-foreground'} text-[10px]`}>
              NIF {group.nif}
            </Badge>
            <Badge className={`${roleInfo?.badge ?? 'bg-muted text-muted-foreground'} text-[10px]`}>
              {roleInfo ? t(roleInfo.label) : ''}
            </Badge>
            {allLiq && (
              <Badge variant="outline" className="text-[10px]">
                {t('upload.optional')}
              </Badge>
            )}
            <span>
              —{' '}
              {group.slots.length === 1
                ? t('upload.oneYear')
                : t('upload.nYears', { n: group.slots.length })}
            </span>
          </div>
        </div>
      </button>
      {groupOpen &&
        group.slots.map((slot) => (
          <DeductionSlotCard
            key={slot.key}
            slot={slot}
            entry={pastedDeductions.get(slot.key)}
            nifColorMap={nifColorMap}
            onPaste={(text) => onPaste(slot.key, slot.nif, slot.year, text)}
            onRemove={() => onRemove(slot.key)}
            showNif={false}
            showLoginHint={false}
          />
        ))}
    </div>
  )
}

/** Groups deduction slots by NIF with login instructions per NIF group */
function DeductionSlotsSection({
  title,
  roleDescription,
  slots,
  pastedDeductions,
  nifColorMap,
  onPaste,
  onRemove,
  defaultOpen = true,
}: {
  title: string
  roleDescription: string | null
  slots: DeductionSlot[]
  pastedDeductions: Map<string, { text: string; result: DeductionsParseResult }>
  nifColorMap: Map<string, string>
  onPaste: (slotKey: string, nif: string, year: number, text: string) => void
  onRemove: (slotKey: string) => void
  defaultOpen?: boolean
}) {
  const t = useT()
  const allHaveLiquidacao = slots.length > 0 && slots.every((s) => s.hasLiquidacao)
  const effectiveDefaultOpen = allHaveLiquidacao ? false : defaultOpen
  const [open, setOpen] = useState(effectiveDefaultOpen)
  if (slots.length === 0) return null

  const hasMandatory = slots.some((s) => !s.hasLiquidacao && s.role === 'taxpayer')

  // Group by NIF (slots are already sorted by NIF, then year desc)
  const nifGroups: { nif: string; slots: DeductionSlot[] }[] = []
  for (const slot of slots) {
    const last = nifGroups[nifGroups.length - 1]
    if (last && last.nif === slot.nif) {
      last.slots.push(slot)
    } else {
      nifGroups.push({ nif: slot.nif, slots: [slot] })
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-left text-sm font-medium min-h-[44px]"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        )}
        {title}
        {hasMandatory ? (
          <Badge variant="destructive" className="text-[10px]">
            {t('upload.required')}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            {t('upload.optional')}
          </Badge>
        )}
      </button>
      {!open && roleDescription && (
        <p className="ml-5 text-xs text-muted-foreground">{roleDescription}</p>
      )}

      {open && (
        <div className="space-y-3">
          {roleDescription && <p className="text-xs text-muted-foreground">{roleDescription}</p>}

          {nifGroups.map((group, gi) => {
            const nifColor = nifColorMap.get(group.nif)
            const roleInfo = SLOT_ROLE_LABELS[group.slots[0].role]
            const groupAllLiq = group.slots.every((s) => s.hasLiquidacao)
            return (
              <NifGroup
                key={group.nif}
                group={group}
                gi={gi}
                nifColor={nifColor}
                roleInfo={roleInfo}
                defaultOpen={!groupAllLiq}
                pastedDeductions={pastedDeductions}
                nifColorMap={nifColorMap}
                onPaste={onPaste}
                onRemove={onRemove}
              />
            )
          })}

          {allHaveLiquidacao && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t('upload.allHaveLiquidacao')} <strong>{t('upload.housing')}</strong>,{' '}
                <strong>{t('upload.careHomes')}</strong> {t('upload.or')}{' '}
                <strong>{t('upload.domesticWork')}</strong>.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Validation Helpers ─────────────────────────────────────

function toFileInfo(uf: UploadedFile): FileInfo {
  return {
    name: uf.file.name,
    nif: uf.meta?.nif,
    year: uf.meta?.year,
    docType: uf.type,
    nifConjuge: uf.meta?.nifConjuge,
  }
}

function runSectionValidation(
  section: Section,
  files: UploadedFile[],
  all: SectionFiles,
): UploadValidationError[] {
  const infos = files.filter((f) => f.status === 'done').map(toFileInfo)
  switch (section) {
    case 'declaration':
      return validateDeclarationFiles(infos)
    case 'liquidacao':
      return validateLiquidacaoFiles(
        infos,
        all.declaration.filter((f) => f.status === 'done').map(toFileInfo),
      )
    case 'previousYears':
      return validatePreviousYearsFiles(infos)
    default:
      return []
  }
}

// ─── Main Component ─────────────────────────────────────────

export function DocumentUpload({ onExtracted }: DocumentUploadProps) {
  const t = useT()
  const [sectionFiles, setSectionFiles] = useState<SectionFiles>({
    declaration: [],
    liquidacao: [],
    previousYears: [],
  })
  const sectionFilesRef = useRef(sectionFiles)
  useEffect(() => {
    sectionFilesRef.current = sectionFiles
  }, [sectionFiles])
  const [processing, setProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const validationErrorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (validationError) {
      validationErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [validationError])
  const [liquidacaoOpen, setLiquidacaoOpen] = useState(false)
  const [previousYearsOpen, setPreviousYearsOpen] = useState(false)
  const [deductionsPasteOpen, setDeductionsPasteOpen] = useState(false)

  // Section refs for autoscroll
  const deductionsSectionRef = useRef<HTMLDivElement>(null)
  const advanceButtonRef = useRef<HTMLDivElement>(null)

  /** Map of "NIF-year" → { text, parseResult } for pasted deductions */
  const [pastedDeductions, setPastedDeductions] = useState<
    Map<string, { text: string; result: DeductionsParseResult }>
  >(new Map())

  const amendableYears = useMemo(() => getAmendableYears(), [])
  const allSupportedYears = useMemo(() => getAllSupportedYears(), [])

  const hasDeclaration = sectionFiles.declaration.length > 0
  const anyFileProcessing = (Object.values(sectionFiles) as UploadedFile[][]).some((files) =>
    files.some((f) => f.status === 'processing'),
  )

  // Primary declaration year — used to compute max previous-years files
  const primaryDeclYear = useMemo(() => {
    const years = sectionFiles.declaration
      .filter((f) => f.status === 'done' && f.meta?.year != null)
      .map((f) => f.meta!.year!)
    return years.length > 0 ? Math.max(...years) : undefined
  }, [sectionFiles.declaration])

  const maxPrevFiles = maxPreviousYearsFiles(primaryDeclYear)
  const prevFilesAtLimit = sectionFiles.previousYears.length >= maxPrevFiles
  const declAtLimit = sectionFiles.declaration.length >= MAX_FILES.declaration
  const liqAtLimit = sectionFiles.liquidacao.length >= MAX_FILES.liquidacao

  const nifColorMap = useMemo(() => {
    const map = new Map<string, string>()
    const allFiles = [
      ...sectionFiles.declaration,
      ...sectionFiles.liquidacao,
      ...sectionFiles.previousYears,
    ]
    for (const uf of allFiles) {
      if (uf.meta?.nif && !map.has(uf.meta.nif)) {
        map.set(uf.meta.nif, NIF_COLORS[map.size] ?? NIF_COLORS[NIF_COLORS.length - 1])
      }
    }
    return map
  }, [sectionFiles])

  /** Unique (NIF, year) slots derived from parsed declarations, including dependents/ascendants */
  const deductionSlots = useMemo((): DeductionSlot[] => {
    // Map UploadedFile[] to SlotFileInfo[] for the pure function
    function toSlotFiles(files: UploadedFile[]) {
      return files.map((uf) => ({
        status: uf.status,
        year: uf.meta?.year,
        nif: uf.meta?.nif,
        nifConjuge: uf.meta?.nifConjuge,
        dependentNifs: [
          ...((uf.parsedXml?.raw.dependents.map((d) => d.nif).filter(Boolean) as string[]) ?? []),
          ...((uf.parsedXml?.raw.godchildren.map((d) => d.nif).filter(Boolean) as string[]) ?? []),
          ...(uf.parsedComprovativo?.dependentNifs ?? []),
        ],
        ascendantNifs: [
          ...((uf.parsedXml?.raw.ascendants.map((a) => a.nif).filter(Boolean) as string[]) ?? []),
          ...(uf.parsedComprovativo?.ascendantNifs ?? []),
        ],
        liquidacaoYear: uf.parsedLiquidacao?.year,
      }))
    }

    const declarations = toSlotFiles([...sectionFiles.declaration, ...sectionFiles.previousYears])
    const liquidacaoFiles = toSlotFiles([...sectionFiles.liquidacao, ...sectionFiles.previousYears])

    return computeDeductionSlots(declarations, liquidacaoFiles)
  }, [sectionFiles])

  const deductionsMandatory =
    deductionSlots.length > 0 &&
    deductionSlots.some((s) => s.role === 'taxpayer' && !s.hasLiquidacao)

  // Autoscroll to next action after all files finish processing (only if no errors)
  const prevProcessing = useRef(false)
  const anyFileError = (Object.values(sectionFiles) as UploadedFile[][]).some((files) =>
    files.some((f) => f.status === 'error' || (f.status === 'done' && f.error)),
  )
  useEffect(() => {
    const wasProcessing = prevProcessing.current
    prevProcessing.current = anyFileProcessing
    if (wasProcessing && !anyFileProcessing && hasDeclaration && !anyFileError) {
      setTimeout(() => {
        if (deductionsSectionRef.current && deductionsMandatory) {
          deductionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (advanceButtonRef.current) {
          advanceButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    }
  }, [anyFileProcessing, hasDeclaration, deductionsMandatory, anyFileError])

  const handleDeductionPaste = useCallback(
    (slotKey: string, expectedNif: string, expectedYear: number, text: string) => {
      let result = parseDeductionsPageText(text)

      // NIF / year mismatch → treat as error
      if (result.ok) {
        if (result.data.nif !== expectedNif) {
          result = {
            ok: false,
            error: t('upload.nifMismatch', {
              pastedNif: result.data.nif,
              expectedNif,
            }),
          }
        } else if (result.data.year !== expectedYear) {
          result = {
            ok: false,
            error: t('upload.yearMismatchPaste', {
              pastedYear: result.data.year,
              expectedYear,
            }),
          }
        }
      }

      setPastedDeductions((prev) => {
        const next = new Map(prev)
        next.set(slotKey, { text, result })
        return next
      })
    },
    [t],
  )

  const removeDeductionPaste = useCallback((slotKey: string) => {
    setPastedDeductions((prev) => {
      const next = new Map(prev)
      next.delete(slotKey)
      return next
    })
  }, [])

  const parseFileAsync = useCallback(
    async (section: Section, file: File) => {
      const updateFile = (update: Partial<UploadedFile>) => {
        setSectionFiles((prev) => {
          const idx = prev[section].findIndex((f) => f.file.name === file.name)
          if (idx === -1) return prev
          return {
            ...prev,
            [section]: prev[section].map((f, i) => (i === idx ? { ...f, ...update } : f)),
          }
        })
      }

      try {
        const isXml = file.name.toLowerCase().endsWith('.xml')

        if (isXml) {
          const text = await file.text()
          const result = parseModelo3Xml(text)

          if (section === 'liquidacao') {
            updateFile({
              status: 'error',
              error: t('upload.xmlDetected'),
            })
            return
          }

          const year = result.household.year
          const validYears = section === 'previousYears' ? allSupportedYears : amendableYears
          if (!validYears.includes(year)) {
            const hint =
              section === 'previousYears'
                ? t('upload.yearHintPrevious', { range: formatYearRange(allSupportedYears) })
                : t('upload.yearHintAmendable', { range: formatYearRange(amendableYears) })
            updateFile({
              status: 'error',
              error: t('upload.yearNotAccepted', { year, hint }),
            })
            return
          }

          const meta: FileMeta = {
            docTypeLabel: DOC_TYPE_LABELS.xml_modelo3,
            nif: result.raw.subjectA_nif,
            year: result.raw.year,
            nifConjuge: result.raw.subjectB_nif,
          }

          updateFile({ status: 'done', type: 'xml_modelo3', meta, parsedXml: result })

          // Run cross-file validation after parse — clear stale errors and set new ones
          setSectionFiles((prev) => {
            const errs = runSectionValidation(section, prev[section], prev)
            const errByFile = new Map(errs.map((e) => [e.file, e.message]))
            return {
              ...prev,
              [section]: prev[section].map((f) => {
                if (f.status !== 'done') return f
                const msg = errByFile.get(f.file.name)
                // Set or clear the validation error
                if (msg && f.error !== msg) return { ...f, error: msg }
                if (!msg && f.error) return { ...f, error: undefined }
                return f
              }),
            }
          })
        } else {
          const pdfText = await extractTextFromPdf(file)
          const docType = detectDocumentType(file.name, pdfText)

          if (section === 'declaration' && docType === 'pdf_liquidacao') {
            updateFile({
              status: 'error',
              error: t('upload.wrongDocType'),
            })
            return
          }
          if (section === 'liquidacao' && docType !== 'pdf_liquidacao' && docType !== 'unknown') {
            updateFile({
              status: 'error',
              error: t('upload.notLiquidacao'),
            })
            return
          }

          if (docType === 'pdf_liquidacao') {
            const parsed = parseLiquidacaoText(pdfText)
            const meta: FileMeta = {
              docTypeLabel: DOC_TYPE_LABELS.pdf_liquidacao,
              nif: parsed.nif,
              year: parsed.year,
              taxaEfetiva: parsed.taxaEfetiva,
            }
            updateFile({ status: 'done', type: docType, meta, parsedLiquidacao: parsed })

            // Run cross-file validation after parse — clear stale errors and set new ones
            setSectionFiles((prev) => {
              const errs = runSectionValidation(section, prev[section], prev)
              const errByFile = new Map(errs.map((e) => [e.file, e.message]))
              return {
                ...prev,
                [section]: prev[section].map((f) => {
                  if (f.status !== 'done') return f
                  const msg = errByFile.get(f.file.name)
                  if (msg && f.error !== msg) return { ...f, error: msg }
                  if (!msg && f.error) return { ...f, error: undefined }
                  return f
                }),
              }
            })
          } else if (docType === 'pdf_comprovativo') {
            const parsed = parseComprovativoPdfText(pdfText)

            if (parsed.year) {
              const validYears = section === 'previousYears' ? allSupportedYears : amendableYears
              if (!validYears.includes(parsed.year)) {
                const hint =
                  section === 'previousYears'
                    ? t('upload.yearHintPrevious', { range: formatYearRange(allSupportedYears) })
                    : t('upload.yearHintAmendable', { range: formatYearRange(amendableYears) })
                updateFile({
                  status: 'error',
                  error: t('upload.yearNotAccepted', { year: parsed.year, hint }),
                })
                return
              }
            }

            const meta: FileMeta = {
              docTypeLabel: DOC_TYPE_LABELS.pdf_comprovativo,
              nif: parsed.nif,
              year: parsed.year,
              nifConjuge: parsed.nifConjuge,
            }

            updateFile({ status: 'done', type: docType, meta, parsedComprovativo: parsed })

            // Run cross-file validation after parse — clear stale errors and set new ones
            setSectionFiles((prev) => {
              const errs = runSectionValidation(section, prev[section], prev)
              const errByFile = new Map(errs.map((e) => [e.file, e.message]))
              return {
                ...prev,
                [section]: prev[section].map((f) => {
                  if (f.status !== 'done') return f
                  const msg = errByFile.get(f.file.name)
                  if (msg && f.error !== msg) return { ...f, error: msg }
                  if (!msg && f.error) return { ...f, error: undefined }
                  return f
                }),
              }
            })
          } else {
            updateFile({
              status: 'error',
              error: t('upload.unrecognizedDoc'),
            })
          }
        }
      } catch (err) {
        updateFile({
          status: 'error',
          error: err instanceof Error ? err.message : t('upload.errorProcessingFile'),
        })
      }
    },
    [amendableYears, allSupportedYears, t],
  )

  const addFiles = useCallback(
    (section: Section, fileList: FileList | File[]) => {
      const errors: string[] = []
      const newFiles: UploadedFile[] = []

      for (const f of Array.from(fileList)) {
        const lower = f.name.toLowerCase()
        const isXml = lower.endsWith('.xml')
        const isPdf = lower.endsWith('.pdf')

        if (!isXml && !isPdf) continue

        if (f.size > MAX_FILE_SIZE_BYTES) {
          errors.push(t('upload.fileTooLarge', { name: f.name, max: MAX_FILE_SIZE_MB }))
          continue
        }

        if (f.size === 0) {
          errors.push(t('upload.fileEmpty', { name: f.name }))
          continue
        }

        if (section === 'liquidacao' && isXml) {
          errors.push(t('upload.liquidacaoPdfOnly', { name: f.name }))
          continue
        }

        newFiles.push({
          file: f,
          type: detectDocumentType(f.name),
          status: 'processing' as const,
        })
      }

      if (newFiles.length === 0) {
        if (errors.length > 0) setValidationError(errors.join(' '))
        return
      }

      // Pre-check limits and duplicates against current state snapshot
      const currentFiles = sectionFilesRef.current[section]
      const merged = [...currentFiles, ...newFiles]
      const limit = section === 'previousYears' ? maxPrevFiles : MAX_FILES[section]

      if (merged.length > limit) {
        setValidationError(t('upload.maxFiles', { max: limit }))
        return
      }

      const names = merged.map((uf) => uf.file.name)
      const dupes = names.filter((n, i) => names.indexOf(n) !== i)
      if (dupes.length > 0) {
        setValidationError(t('upload.duplicateFile', { name: dupes[0] }))
        return
      }

      // Add files to state
      setSectionFiles((prev) => ({ ...prev, [section]: [...prev[section], ...newFiles] }))

      // Always parse — we already validated limits/dupes above
      for (const nf of newFiles) {
        parseFileAsync(section, nf.file)
      }

      if (errors.length > 0) setValidationError(errors.join(' '))
      else setValidationError(null)
    },
    [parseFileAsync, maxPrevFiles, t],
  )

  function removeFile(section: Section, index: number) {
    setSectionFiles((prev) => {
      const updated = prev[section].filter((_, i) => i !== index)
      // Re-run validation on remaining files to update/clear errors
      const next = { ...prev, [section]: updated }
      const errs = runSectionValidation(section, updated, next)
      const errByFile = new Map(errs.map((e) => [e.file, e.message]))
      return {
        ...next,
        [section]: updated.map((f) => {
          if (f.status !== 'done') return f
          const msg = errByFile.get(f.file.name)
          if (msg && f.error !== msg) return { ...f, error: msg }
          if (!msg && f.error) return { ...f, error: undefined }
          return f
        }),
      }
    })
  }

  function processFiles() {
    if (sectionFiles.declaration.length === 0) {
      setValidationError(t('upload.needDeclaration'))
      return
    }

    if (anyFileProcessing) {
      setValidationError(t('upload.waitProcessing'))
      return
    }

    setProcessing(true)
    setValidationError(null)

    // Final cross-file validation before assembly
    const declInfos = sectionFiles.declaration.filter((f) => f.status === 'done').map(toFileInfo)
    const liqInfos = sectionFiles.liquidacao.filter((f) => f.status === 'done').map(toFileInfo)
    const prevInfos = sectionFiles.previousYears.filter((f) => f.status === 'done').map(toFileInfo)

    const preErrors = [
      ...validateDeclarationFiles(declInfos),
      ...validateLiquidacaoFiles(liqInfos, declInfos),
      ...validatePreviousYearsFiles(prevInfos),
      ...validateCrossSection(declInfos, prevInfos),
    ].filter((e) => e.severity !== 'warning')

    if (preErrors.length > 0) {
      setProcessing(false)
      setValidationError(preErrors.map((e) => e.message).join(' '))
      return
    }

    // Check mandatory deduction slots (taxpayers WITHOUT liquidação must have pasted deductions)
    const pastedKeys = new Set(
      [...pastedDeductions.entries()].filter(([_, v]) => v.result.ok).map(([k]) => k),
    )
    const unfilledMandatory = getMandatoryUnfilledSlots(deductionSlots, pastedKeys)
    if (unfilledMandatory.length > 0) {
      setProcessing(false)
      setDeductionsPasteOpen(true)
      const nifs = unfilledMandatory.map((s) => `NIF ${s.nif} (${s.year})`).join(', ')
      setValidationError(t('upload.deductionExpensesRequired', { names: nifs }))
      return
    }

    let household: Household | null = null
    const allIssues: ValidationIssue[] = []
    let liquidacaoResult: LiquidacaoParsed | undefined
    let declarationYear: number | undefined

    // Assemble from declaration (XML priority, then PDF fallback)
    const parsedDeclarations: Array<{
      household: Household
      nif: string
      nifConjuge?: string
      issues: ValidationIssue[]
    }> = []

    for (const uf of sectionFiles.declaration) {
      if (uf.status !== 'done') continue

      if (uf.parsedXml) {
        parsedDeclarations.push({
          household: uf.parsedXml.household,
          nif: uf.meta?.nif ?? uf.parsedXml.raw.subjectA_nif,
          nifConjuge: uf.meta?.nifConjuge ?? uf.parsedXml.raw.subjectB_nif,
          issues: uf.parsedXml.issues,
        })
      } else if (uf.parsedComprovativo && parsedDeclarations.length === 0) {
        const converted = comprativoParsedToHousehold(uf.parsedComprovativo)
        if (converted.household.members && converted.household.members.length > 0) {
          parsedDeclarations.push({
            household: converted.household as Household,
            nif: uf.meta?.nif ?? '',
            nifConjuge: uf.meta?.nifConjuge,
            issues: [
              ...converted.issues,
              {
                severity: 'warning',
                code: 'PDF_FALLBACK',
                message: t('upload.pdfFallbackNote'),
              },
            ],
          })
        }
      }
    }

    // Try to merge spouse declarations; fall back to first
    const merged = mergeSpouseHouseholds(parsedDeclarations)
    if (merged) {
      household = merged.household
      declarationYear = merged.household.year
      allIssues.push(...merged.issues)
    } else if (parsedDeclarations.length > 0) {
      const first = parsedDeclarations[0]
      household = first.household
      declarationYear = first.household.year
      allIssues.push(...first.issues)
    }

    // Assemble liquidação
    for (const uf of sectionFiles.liquidacao) {
      if (uf.status !== 'done') continue

      if (uf.parsedLiquidacao) {
        liquidacaoResult = uf.parsedLiquidacao

        if (liquidacaoResult.year && declarationYear && liquidacaoResult.year !== declarationYear) {
          allIssues.push({
            severity: 'error',
            code: 'YEAR_MISMATCH',
            message: t('upload.liquidacaoYearMismatch', {
              liqYear: liquidacaoResult.year,
              declYear: declarationYear,
            }),
          })
        }

        if (liquidacaoResult.taxaEfetiva) {
          allIssues.push({
            severity: 'warning',
            code: 'LIQUIDACAO_INFO',
            message: t('upload.liquidacaoInfoMessage', {
              year: String(liquidacaoResult.year || ''),
              rate: (liquidacaoResult.taxaEfetiva * 100).toFixed(2),
            }),
          })
        }
      }
    }

    // Cross-file: previous years — build households per year
    const previousYearsParsed = new Map<
      number,
      Array<{
        household: Household
        nif: string
        nifConjuge?: string
        issues: ValidationIssue[]
      }>
    >()

    for (const uf of sectionFiles.previousYears) {
      if (uf.status !== 'done' || !uf.parsedXml) continue

      const year = uf.meta?.year ?? uf.parsedXml.household.year
      if (declarationYear && year === declarationYear) {
        allIssues.push({
          severity: 'warning',
          code: 'YEAR_OVERLAP',
          message: t('upload.duplicateYearWarning', { year }),
        })
        continue
      }

      if (!previousYearsParsed.has(year)) previousYearsParsed.set(year, [])
      previousYearsParsed.get(year)!.push({
        household: uf.parsedXml.household,
        nif: uf.meta?.nif ?? uf.parsedXml.raw.subjectA_nif,
        nifConjuge: uf.meta?.nifConjuge ?? uf.parsedXml.raw.subjectB_nif,
        issues: uf.parsedXml.issues,
      })
    }

    // Merge spouse pairs for each previous year
    const previousHouseholds: Household[] = []
    for (const [, yearDecls] of previousYearsParsed) {
      const merged = mergeSpouseHouseholds(yearDecls)
      if (merged) {
        previousHouseholds.push(merged.household)
        allIssues.push(...merged.issues)
      } else if (yearDecls.length > 0) {
        previousHouseholds.push(yearDecls[0].household)
        allIssues.push(...yearDecls[0].issues)
      }
    }

    // Merge pasted deductions into household members
    if (household) {
      // Track which members already received pasted deductions (by NIF)
      const pastedNifs = new Set<string>()

      for (const [slotKey, entry] of pastedDeductions) {
        if (!entry.result.ok) continue
        const parsed = entry.result.data

        // Only merge deductions matching the household year
        if (parsed.year !== household.year) continue

        // Find the slot to determine role
        const slot = deductionSlots.find((s) => s.key === slotKey)
        if (!slot) continue

        if (slot.role === 'taxpayer') {
          // Find the matching member by NIF
          const member =
            household.members.find((m) => m.incomes.length > 0 && m.name === parsed.name) ??
            household.members.find((_, i) => {
              const declFile = sectionFiles.declaration.find(
                (f) => f.status === 'done' && f.meta?.nif === parsed.nif,
              )
              if (!declFile) return false
              const isSubjectA = declFile.meta?.nif === parsed.nif && !declFile.meta?.nifConjuge
              const isSubjectB = declFile.meta?.nifConjuge === parsed.nif
              return (
                (i === 0 && isSubjectA) ||
                (i === 1 && isSubjectB) ||
                (i === 0 && !isSubjectA && !isSubjectB)
              )
            })

          if (member) {
            pastedNifs.add(slot.nif)
            const atCategories = new Set(parsed.expenses.map((e) => e.category))
            member.deductions = member.deductions.filter((d) => !atCategories.has(d.category))
            for (const exp of parsed.expenses) {
              if (exp.expenseAmount > 0) {
                member.deductions.push({ category: exp.category, amount: exp.expenseAmount })
              }
            }
          }
        } else {
          // Dependent/ascendant: add expenses to first member's deductions
          // (the engine handles the split based on filing status)
          const firstMember = household.members[0]
          if (firstMember) {
            for (const exp of parsed.expenses) {
              if (exp.expenseAmount > 0) {
                const existing = firstMember.deductions.find((d) => d.category === exp.category)
                if (existing) {
                  existing.amount += exp.expenseAmount
                } else {
                  firstMember.deductions.push({
                    category: exp.category,
                    amount: exp.expenseAmount,
                  })
                }
              }
            }
          }
        }
      }

      // Fallback: derive deductions from liquidação for members without pasted data
      if (liquidacaoResult && household.year === liquidacaoResult.year) {
        const memberCount = household.members.length
        household = {
          ...household,
          members: household.members.map((member, mi) => {
            // Find the NIF for this member index
            const declFile = sectionFiles.declaration.find(
              (f) => f.status === 'done' && f.meta?.nif,
            )
            const memberNif = mi === 0 ? declFile?.meta?.nif : declFile?.meta?.nifConjuge
            if (memberNif && pastedNifs.has(memberNif)) return member // already has AT paste data

            // Reverse-engineer expense amounts from liquidação deductions
            // Split evenly between members (AT already applied per-person caps,
            // so household_total / N ≤ per-person cap — exact reconstruction)
            const newDeductions = [...member.deductions]
            for (const mapping of LIQUIDACAO_DEDUCTION_MAP) {
              const deductionAmount = liquidacaoResult![mapping.field] as number | undefined
              if (!deductionAmount || deductionAmount <= 0) continue
              const perMemberDeduction = deductionAmount / memberCount
              const expenseAmount = perMemberDeduction / mapping.rate

              const existing = newDeductions.findIndex((d) => d.category === mapping.category)
              if (existing >= 0) {
                newDeductions[existing] = { ...newDeductions[existing], amount: expenseAmount }
              } else {
                newDeductions.push({ category: mapping.category, amount: expenseAmount })
              }
            }
            return { ...member, deductions: newDeductions }
          }),
        }
      }
    }

    setProcessing(false)

    if (household) {
      const allHouseholds = [household, ...previousHouseholds].sort((a, b) => b.year - a.year)
      onExtracted(allHouseholds, allIssues, liquidacaoResult)
    } else if (previousHouseholds.length > 0) {
      const allHouseholds = previousHouseholds.sort((a, b) => b.year - a.year)
      onExtracted(allHouseholds, allIssues, liquidacaoResult)
    } else {
      setValidationError(t('upload.extractionFailed'))
    }
  }

  // Auto-expand deductions section when mandatory
  useEffect(() => {
    if (deductionsMandatory && !deductionsPasteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state sync
      setDeductionsPasteOpen(true)
    }
  }, [deductionsMandatory]) // eslint-disable-line react-hooks/exhaustive-deps

  const deductionsSection = deductionSlots.length > 0 && (
    <div ref={deductionsSectionRef}>
      <Card>
        <button
          type="button"
          onClick={() => setDeductionsPasteOpen(!deductionsPasteOpen)}
          aria-expanded={deductionsPasteOpen}
          className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
        >
          {deductionsPasteOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-heading text-base font-medium">
            {t('upload.deductionExpenses')}
          </span>
          {deductionsMandatory ? (
            <Badge>{t('upload.required')}</Badge>
          ) : (
            <Badge variant="outline">{t('upload.optional')}</Badge>
          )}
          {[...pastedDeductions.values()].filter((v) => v.result.ok).length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {[...pastedDeductions.values()].filter((v) => v.result.ok).length}/
              {deductionSlots.length}
            </Badge>
          )}
        </button>
        {deductionsPasteOpen && (
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">{t('upload.portalInstructions')}</p>

            <DeductionSlotsSection
              title={t('upload.taxpayers')}
              roleDescription={null}
              slots={deductionSlots.filter((s) => s.role === 'taxpayer')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
            />

            <DeductionSlotsSection
              title={t('upload.dependents')}
              roleDescription={t('upload.dependentsHelp')}
              slots={deductionSlots.filter((s) => s.role === 'dependent')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
              defaultOpen={false}
            />

            <DeductionSlotsSection
              title={t('upload.ascendants')}
              roleDescription={t('upload.ascendantsHelp')}
              slots={deductionSlots.filter((s) => s.role === 'ascendant')}
              pastedDeductions={pastedDeductions}
              nifColorMap={nifColorMap}
              onPaste={handleDeductionPaste}
              onRemove={removeDeductionPaste}
              defaultOpen={false}
            />
          </CardContent>
        )}
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Section 1: Declaração de IRS (required) */}
      <Card className="ring-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{t('upload.declarationTitle')}</CardTitle>
            <Badge>{t('upload.required')}</Badge>
          </div>
          <CardDescription>
            {t('upload.declarationDesc')}
            {amendableYears.length > 0 && ` (${formatYearRange(amendableYears)})`}.{' '}
            {t('upload.declarationSpouseNote')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="xml">
            <TabsList className="w-full">
              <TabsTrigger value="xml" className="flex-1">
                <FileCode className="h-3.5 w-3.5" aria-hidden="true" />
                {t('upload.xmlFile')}
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {t('upload.recommended')}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t('upload.pdfFile')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="xml" className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{t('upload.xmlDesc')}</p>
              <HelpToggle>
                <XmlGuide />
              </HelpToggle>
              {!declAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('declaration', files)}
                  accept=".xml,.pdf"
                  disabled={processing}
                />
              )}
            </TabsContent>

            <TabsContent value="pdf" className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{t('upload.pdfDesc')}</p>
              <HelpToggle>
                <PdfGuide />
              </HelpToggle>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('upload.pdfAnnexNote')}</span>
              </div>
              {!declAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('declaration', files)}
                  accept=".xml,.pdf"
                  disabled={processing}
                />
              )}
            </TabsContent>
          </Tabs>

          <SectionFileList
            files={sectionFiles.declaration}
            onRemove={(i) => removeFile('declaration', i)}
            processing={processing}
            nifColorMap={nifColorMap}
          />
        </CardContent>
      </Card>

      {/* Mandatory deductions rendered before optional sections */}
      {deductionsMandatory && deductionsSection}

      {/* Demonstração de Liquidação (optional, collapsible) */}
      {hasDeclaration && (
        <Card>
          <button
            type="button"
            onClick={() => setLiquidacaoOpen(!liquidacaoOpen)}
            aria-expanded={liquidacaoOpen}
            className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
          >
            {liquidacaoOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <span className="font-heading text-base font-medium">
                {t('upload.liquidacaoTitle')}
              </span>
              <p className="text-xs text-muted-foreground">{t('upload.liquidacaoDesc')}</p>
            </div>
            <Badge variant="outline">{t('upload.optional')}</Badge>
            {sectionFiles.liquidacao.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sectionFiles.liquidacao.length}
              </Badge>
            )}
          </button>
          {liquidacaoOpen && (
            <CardContent className="space-y-3 pt-0">
              <HelpToggle>
                <LiquidacaoGuide />
              </HelpToggle>
              {!liqAtLimit && (
                <DropZone
                  onFiles={(files) => addFiles('liquidacao', files)}
                  accept=".pdf"
                  disabled={processing}
                />
              )}
              <SectionFileList
                files={sectionFiles.liquidacao}
                onRemove={(i) => removeFile('liquidacao', i)}
                processing={processing}
                nifColorMap={nifColorMap}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Section 3: Anos Anteriores (optional, collapsible) */}
      <Card>
        <button
          type="button"
          onClick={() => setPreviousYearsOpen(!previousYearsOpen)}
          aria-expanded={previousYearsOpen}
          className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px] text-left"
        >
          {previousYearsOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="font-heading text-base font-medium">{t('upload.previousYears')}</span>
          <Badge variant="outline">{t('upload.optional')}</Badge>
          {sectionFiles.previousYears.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sectionFiles.previousYears.length}
            </Badge>
          )}
        </button>
        {previousYearsOpen && (
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              {t('upload.previousYearsDesc', { years: formatYearRange(allSupportedYears) })}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{t('upload.previousYearsBenefit1')}</li>
              <li>{t('upload.previousYearsBenefit2')}</li>
              <li>{t('upload.previousYearsBenefit3')}</li>
            </ul>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t('upload.amendableNote', { years: formatYearRange(amendableYears) })}</span>
            </div>
            {prevFilesAtLimit ? (
              <p className="text-xs text-muted-foreground italic">
                {t('upload.limitReached', { max: maxPrevFiles })}
              </p>
            ) : (
              <DropZone
                onFiles={(files) => addFiles('previousYears', files)}
                accept=".xml,.pdf"
                disabled={processing}
                multiple
              />
            )}
            <GroupedSectionFileList
              files={sectionFiles.previousYears}
              onRemove={(i) => removeFile('previousYears', i)}
              processing={processing}
              nifColorMap={nifColorMap}
            />
          </CardContent>
        )}
      </Card>

      {/* Optional deductions rendered after optional sections */}
      {!deductionsMandatory && deductionsSection}

      {validationError && (
        <div
          ref={validationErrorRef}
          role="alert"
          aria-live="assertive"
          data-testid="upload-validation-error"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm text-red-800 dark:text-red-200">{validationError}</p>
        </div>
      )}

      {/* Process button — sticky at bottom */}
      <div ref={advanceButtonRef} className="sticky bottom-4 z-10 flex justify-center px-4 sm:px-0">
        <Button
          size="lg"
          onClick={processFiles}
          disabled={processing || anyFileProcessing}
          className="w-full sm:w-auto gap-2 px-8 shadow-lg"
          data-testid="advance-button"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('upload.processingDocs')}
            </>
          ) : (
            t('upload.advance')
          )}
        </Button>
      </div>
    </div>
  )
}
