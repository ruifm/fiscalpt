'use client'

import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/lib/i18n'
import { DOC_TYPE_STYLES, DOC_TYPE_ORDER, YEAR_COLORS, type UploadedFile } from './types'

export function SectionFileList({
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
          {uf.status === 'done' && uf.warning && !uf.error && (
            <p className="mt-1 pl-6 text-xs text-amber-600 dark:text-amber-400">ℹ {uf.warning}</p>
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

/**
 * Previous years file list grouped by year (descending).
 * Within each year: declarations first, then liquidações.
 */
export function GroupedSectionFileList({
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
