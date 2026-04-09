// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : <div>{children}</div>,
  DialogTrigger: ({ children, ...props }: { children: React.ReactNode; className?: string }) => (
    <button data-testid="dialog-trigger" {...props}>
      {children}
    </button>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogClose: ({ children, ...props }: { children: React.ReactNode; className?: string; disabled?: boolean }) => (
    <button data-testid="dialog-close" {...props}>
      {children}
    </button>
  ),
}))

import { ApplyForm } from '@/components/apply-form'

describe('ApplyForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders trigger button with Candidatar-me', () => {
    render(<ApplyForm roleTitle="Engenheiro Frontend" />)
    expect(screen.getByText('Candidatar-me')).toBeDefined()
  })

  it('shows role title in dialog', () => {
    render(<ApplyForm roleTitle="Tax Advisor" />)
    expect(screen.getByText(/Tax Advisor/)).toBeDefined()
  })

  it('renders required form fields', () => {
    render(<ApplyForm roleTitle="Developer" />)
    expect(screen.getByLabelText('Nome *')).toBeDefined()
    expect(screen.getByLabelText('Email *')).toBeDefined()
    expect(screen.getByLabelText('Carta de motivação *')).toBeDefined()
  })

  it('renders file upload button for CV', () => {
    render(<ApplyForm roleTitle="Developer" />)
    expect(screen.getByText('Escolher ficheiro')).toBeDefined()
  })

  it('shows submit button', () => {
    render(<ApplyForm roleTitle="Developer" />)
    expect(screen.getByText('Enviar candidatura')).toBeDefined()
  })

  it('shows file size error for oversized files', async () => {
    const user = userEvent.setup()
    render(<ApplyForm roleTitle="Developer" />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

    await user.upload(fileInput, largeFile)
    expect(screen.getByText('Ficheiro demasiado grande (máximo 5 MB)')).toBeDefined()
  })
})
