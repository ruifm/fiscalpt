import type { FileInfo, UploadValidationError } from '@/lib/tax/upload-validation'
import {
  validateDeclarationFiles,
  validateLiquidacaoFiles,
  validatePreviousYearsFiles,
} from '@/lib/tax/upload-validation'
import type { AssemblyFile } from '@/lib/tax/assemble-households'
import type { UploadedFile, Section, SectionFiles } from './types'

export function toFileInfo(uf: UploadedFile): FileInfo {
  return {
    name: uf.file.name,
    nif: uf.meta?.nif,
    year: uf.meta?.year,
    docType: uf.type,
    nifConjuge: uf.meta?.nifConjuge,
  }
}

export function toAssemblyFile(uf: UploadedFile): AssemblyFile {
  return {
    fileName: uf.file.name,
    status: uf.status,
    nif: uf.meta?.nif,
    year: uf.meta?.year,
    nifConjuge: uf.meta?.nifConjuge,
    parsedXml: uf.parsedXml,
    parsedComprovativo: uf.parsedComprovativo,
    parsedLiquidacao: uf.parsedLiquidacao,
  }
}

export function runSectionValidation(
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

export function formatYearRange(years: number[]): string {
  if (years.length === 0) return ''
  const sorted = [...years].sort((a, b) => a - b)
  return sorted.length === 1 ? `${sorted[0]}` : `${sorted[0]}–${sorted[sorted.length - 1]}`
}
