// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

import { DropZone } from '@/components/document-upload/drop-zone'

describe('DropZone', () => {
  const onFiles = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with dropzone label', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" />)
    expect(screen.getByText('upload.dropzone')).toBeDefined()
  })

  it('has button role and is focusable', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" />)
    const zone = screen.getByRole('button', { name: 'upload.dropzone' })
    expect(zone.getAttribute('tabindex')).toBe('0')
  })

  it('is not focusable when disabled', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" disabled />)
    const zone = screen.getByTestId('upload-dropzone')
    expect(zone.getAttribute('tabindex')).toBe('-1')
  })

  it('calls onFiles on drop', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" />)
    const zone = screen.getByTestId('upload-dropzone')

    const file = new File(['content'], 'test.xml', { type: 'text/xml' })
    const dataTransfer = { files: [file] as unknown as FileList }

    fireEvent.drop(zone, { dataTransfer })
    expect(onFiles).toHaveBeenCalledWith([file])
  })

  it('does not call onFiles on drop when disabled', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" disabled />)
    const zone = screen.getByTestId('upload-dropzone')

    const file = new File(['content'], 'test.xml', { type: 'text/xml' })
    fireEvent.drop(zone, { dataTransfer: { files: [file] as unknown as FileList } })
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('highlights on drag over', () => {
    render(<DropZone onFiles={onFiles} accept=".xml,.pdf" />)
    const zone = screen.getByTestId('upload-dropzone')

    fireEvent.dragOver(zone)
    expect(zone.className).toContain('border-primary')

    fireEvent.dragLeave(zone)
    expect(zone.className).not.toContain('border-primary bg-primary/5')
  })
})
