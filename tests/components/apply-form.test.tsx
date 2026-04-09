// @vitest-environment jsdom
import { createContext, useContext } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const DialogCtx = createContext<{ open: boolean; onOpenChange: (v: boolean) => void }>({
  open: false,
  onOpenChange: () => {},
})

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open: boolean
    onOpenChange?: (v: boolean) => void
  }) => (
    <DialogCtx.Provider value={{ open, onOpenChange: onOpenChange ?? (() => {}) }}>
      <div data-testid="dialog">{children}</div>
    </DialogCtx.Provider>
  ),
  DialogTrigger: ({ children, ...props }: { children: React.ReactNode; className?: string }) => {
    const { onOpenChange } = useContext(DialogCtx)
    return (
      <button data-testid="dialog-trigger" onClick={() => onOpenChange(true)} {...props}>
        {children}
      </button>
    )
  },
  DialogContent: ({ children }: { children: React.ReactNode }) => {
    const { open } = useContext(DialogCtx)
    return open ? <div data-testid="dialog-content">{children}</div> : null
  },
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogClose: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    className?: string
    disabled?: boolean
  }) => {
    const { onOpenChange } = useContext(DialogCtx)
    return (
      <button data-testid="dialog-close" onClick={() => onOpenChange(false)} {...props}>
        {children}
      </button>
    )
  },
}))

import { ApplyForm } from '@/components/apply-form'

describe('ApplyForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders trigger button with Candidatar-me', () => {
    render(<ApplyForm roleTitle="Engenheiro Frontend" />)
    expect(screen.getByText('Candidatar-me')).toBeDefined()
  })

  it('shows role title in dialog', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Tax Advisor" />)
    await user.click(screen.getByText('Candidatar-me'))
    expect(screen.getByText(/Tax Advisor/)).toBeDefined()
  })

  it('renders required form fields', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Developer" />)
    await user.click(screen.getByText('Candidatar-me'))
    expect(screen.getByLabelText('Nome *')).toBeDefined()
    expect(screen.getByLabelText('Email *')).toBeDefined()
    expect(screen.getByLabelText('Carta de motivação *')).toBeDefined()
  })

  it('renders file upload button for CV', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Developer" />)
    await user.click(screen.getByText('Candidatar-me'))
    expect(screen.getByText('Escolher ficheiro')).toBeDefined()
  })

  it('shows submit button', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Developer" />)
    await user.click(screen.getByText('Candidatar-me'))
    expect(screen.getByText('Enviar candidatura')).toBeDefined()
  })

  it('shows file size error for oversized files', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Developer" />)
    await user.click(screen.getByText('Candidatar-me'))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

    await user.upload(fileInput, largeFile)
    expect(screen.getByText('Ficheiro demasiado grande (máximo 5 MB)')).toBeDefined()
  })
})
