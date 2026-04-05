'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, X } from 'lucide-react'
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { useT } from '@/lib/i18n'

interface GuideStep {
  screenshot: string
  width: number
  height: number
  caption: string
}

function StepImage({ step, onClick }: { step: GuideStep; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-md border border-border/50 bg-muted/30 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <Image
        src={step.screenshot}
        alt={step.caption}
        width={step.width}
        height={step.height}
        className="w-full h-auto"
        quality={90}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5">
        <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          Ampliar
        </span>
      </div>
    </button>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
      {n}
    </div>
  )
}

export function ATGuide({
  url,
  urlLabel,
  steps,
}: {
  url: string
  urlLabel: string
  steps: GuideStep[]
}) {
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)

  const zoomedStep = zoomedIndex !== null ? steps[zoomedIndex] : null

  return (
    <div className="space-y-3">
      {/* Portal link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        {urlLabel}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.screenshot} className="space-y-1.5">
            <div className="flex items-start gap-2">
              <StepNumber n={i + 1} />
              <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">
                {step.caption}
              </p>
            </div>
            <div className="pl-7">
              <StepImage step={step} onClick={() => setZoomedIndex(i)} />
            </div>
          </li>
        ))}
      </ol>

      {/* Lightbox */}
      <Dialog open={zoomedIndex !== null} onOpenChange={(open) => !open && setZoomedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="sr-only">
            <DialogTitle>{zoomedStep?.caption ?? ''}</DialogTitle>
          </div>
          {zoomedStep && (
            <>
              <div className="relative bg-muted/50">
                <Image
                  src={zoomedStep.screenshot}
                  alt={zoomedStep.caption}
                  width={zoomedStep.width}
                  height={zoomedStep.height}
                  className="w-full h-auto"
                  quality={95}
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5">
                <p className="text-xs text-muted-foreground">{zoomedStep.caption}</p>
                <DialogClose className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Pre-defined guide configurations
const LOGIN_STEP = {
  screenshot: '/screenshots/at/01-login.png',
  width: 1800,
  height: 899,
}

const MULTI_AUTH_STEP = {
  screenshot: '/screenshots/at/03-multi-auth.png',
  width: 1640,
  height: 737,
}

export function XmlGuide() {
  const t = useT()
  return (
    <ATGuide
      url="https://irs.portaldasfinancas.gov.pt/entregaIRSForm.action"
      urlLabel={t('upload.openPortalFinancas')}
      steps={[
        { ...LOGIN_STEP, caption: t('upload.guideSteps.login') },
        { ...MULTI_AUTH_STEP, caption: t('upload.guideSteps.multiAuth') },
        {
          screenshot: '/screenshots/at/02-corrigir-declaracao.png',
          width: 1800,
          height: 860,
          caption: t('upload.guideSteps.xmlEntregarDeclaracao'),
        },
        {
          screenshot: '/screenshots/at/04-declaration-modal.png',
          width: 1800,
          height: 874,
          caption: t('upload.guideSteps.xmlGravar'),
        },
      ]}
    />
  )
}

export function PdfGuide() {
  const t = useT()
  return (
    <ATGuide
      url="https://irs.portaldasfinancas.gov.pt/comprovativo/obterComprovativoForm"
      urlLabel={t('upload.openPortalFinancas')}
      steps={[
        { ...LOGIN_STEP, caption: t('upload.guideSteps.login') },
        { ...MULTI_AUTH_STEP, caption: t('upload.guideSteps.multiAuth') },
        {
          screenshot: '/screenshots/at/05-obter-comprovativos.png',
          width: 888,
          height: 484,
          caption: t('upload.guideSteps.pdfComprovativo'),
        },
      ]}
    />
  )
}

export function LiquidacaoGuide() {
  const t = useT()
  return (
    <ATGuide
      url="https://irs.portaldasfinancas.gov.pt/app/consulta"
      urlLabel={t('upload.openPortalFinancas')}
      steps={[
        { ...LOGIN_STEP, caption: t('upload.guideSteps.login') },
        { ...MULTI_AUTH_STEP, caption: t('upload.guideSteps.multiAuth') },
        {
          screenshot: '/screenshots/at/06-consultar-resultados.png',
          width: 870,
          height: 574,
          caption: t('upload.guideSteps.liqConsultar'),
        },
        {
          screenshot: '/screenshots/at/07-detalhe-declaracao.png',
          width: 879,
          height: 570,
          caption: t('upload.guideSteps.liqDownload'),
        },
      ]}
    />
  )
}
