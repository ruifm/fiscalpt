import { FileCode, FileText, Shield, type LucideIcon } from 'lucide-react'
import type { DocumentType, LiquidacaoParsed, ComprovativoParsed } from '@/lib/tax/pdf-extractor'
import type { ParsedXmlResult } from '@/lib/tax/xml-parser'
import type { Household, ValidationIssue } from '@/lib/tax/types'

// ─── Component Props ────────────────────────────────────────

export interface DocumentUploadProps {
  onExtracted: (
    households: Household[],
    issues: ValidationIssue[],
    liquidacao?: LiquidacaoParsed,
  ) => void
}

// ─── Internal Types ─────────────────────────────────────────

export interface FileMeta {
  docTypeLabel: string
  nif?: string
  year?: number
  taxaEfetiva?: number
  nifConjuge?: string
}

export interface UploadedFile {
  file: File
  type: DocumentType
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
  meta?: FileMeta
  parsedXml?: ParsedXmlResult
  parsedComprovativo?: ComprovativoParsed
  parsedLiquidacao?: LiquidacaoParsed
}

export interface SectionFiles {
  declaration: UploadedFile[]
  liquidacao: UploadedFile[]
  previousYears: UploadedFile[]
}

export type Section = keyof SectionFiles

// ─── Constants ──────────────────────────────────────────────

export const MAX_FILE_SIZE_MB = 20
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const MAX_FILES: Record<Section, number> = {
  declaration: 2,
  liquidacao: 2,
  previousYears: 0, // dynamic — overridden by maxPreviousYearsFiles()
}

export const YEAR_COLORS: Record<number, string> = {
  2021: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  2022: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  2023: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  2024: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  2025: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

export const NIF_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
] as const

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  xml_modelo3: 'upload.docTypes.xml',
  pdf_comprovativo: 'upload.docTypes.comprovativo',
  pdf_liquidacao: 'upload.docTypes.liquidacao',
  unknown: 'upload.docTypes.unknown',
}

export const DOC_TYPE_STYLES: Record<
  DocumentType,
  { icon: LucideIcon; iconClass: string; badgeClass: string }
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

export const DEDUCTION_CATEGORY_LABELS: Record<string, string> = {
  general: 'upload.deductionCategories.general',
  health: 'upload.deductionCategories.health',
  education: 'upload.deductionCategories.education',
  housing: 'upload.deductionCategories.housing',
  care_home: 'upload.deductionCategories.careHome',
  fatura: 'upload.deductionCategories.invoiceRequirement',
  trabalho_domestico: 'upload.deductionCategories.domesticWork',
}

export const SLOT_ROLE_LABELS: Record<string, { label: string; badge: string }> = {
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

export const DOC_TYPE_ORDER: Record<DocumentType, number> = {
  xml_modelo3: 0,
  pdf_comprovativo: 1,
  pdf_liquidacao: 2,
  unknown: 3,
}
