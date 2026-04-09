'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  ClipboardPaste,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/lib/i18n'
import type { DeductionSlot } from '@/lib/tax/upload-validation'
import type { DeductionsParseResult } from '@/lib/tax/deductions-parser'
import { YEAR_COLORS, DEDUCTION_CATEGORY_LABELS, SLOT_ROLE_LABELS } from './types'

export function DeductionSlotCard({
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
export function DeductionSlotsSection({
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
