'use client'

import { useState, useRef } from 'react'
import { Send, Upload, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ApplyFormProps {
  roleTitle: string
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function ApplyForm({ roleTitle }: ApplyFormProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [cvName, setCvName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setCvName(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ficheiro demasiado grande (máximo 5 MB)')
      e.target.value = ''
      setCvName(null)
      return
    }
    setErrorMsg('')
    setCvName(file.name)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('role', roleTitle)

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Erro ao enviar candidatura')
      }
      setState('success')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar candidatura')
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      // Reset form state when closing
      setTimeout(() => {
        setState('idle')
        setErrorMsg('')
        setCvName(null)
        formRef.current?.reset()
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
        <Send className="h-4 w-4" aria-hidden="true" />
        Candidatar-me
      </DialogTrigger>

      <DialogContent>
        {state === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle>Candidatura enviada</DialogTitle>
            <DialogDescription>
              Obrigado pelo interesse! Receberás uma resposta em breve no email indicado.
            </DialogDescription>
            <DialogClose className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              Fechar
            </DialogClose>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <DialogTitle>Candidatura — {roleTitle}</DialogTitle>
              <DialogDescription className="mt-1.5">
                Preenche o formulário abaixo. O CV é opcional mas recomendado.
              </DialogDescription>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="apply-name">Nome *</Label>
                <Input
                  id="apply-name"
                  name="name"
                  required
                  placeholder="O teu nome completo"
                  disabled={state === 'submitting'}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apply-email">Email *</Label>
                <Input
                  id="apply-email"
                  name="email"
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  disabled={state === 'submitting'}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apply-cover-letter">Carta de motivação *</Label>
                <textarea
                  id="apply-cover-letter"
                  name="coverLetter"
                  required
                  rows={5}
                  placeholder="Conta-nos porque queres contribuir para o FiscalPT, a tua experiência relevante, e o que te motiva..."
                  disabled={state === 'submitting'}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apply-cv">CV (PDF ou DOCX, máx. 5 MB)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={state === 'submitting'}
                    className="gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    {cvName ? 'Alterar ficheiro' : 'Escolher ficheiro'}
                  </Button>
                  {cvName && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {cvName}
                    </span>
                  )}
                  <input
                    ref={fileRef}
                    id="apply-cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  disabled={state === 'submitting'}
                >
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={state === 'submitting'} className="gap-1.5">
                  {state === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />A enviar...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Enviar candidatura
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
