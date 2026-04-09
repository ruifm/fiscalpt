// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

import { SectionFileList } from '@/components/document-upload/section-file-list'
import type { UploadedFile } from '@/components/document-upload/types'

function makeFile(
  name: string,
  overrides: Partial<UploadedFile> = {},
): UploadedFile {
  return {
    file: new File(['x'], name, { type: 'text/xml' }),
    type: 'xml_modelo3',
    status: 'done',
    ...overrides,
  }
}

describe('SectionFileList', () => {
  const onRemove = vi.fn()
  const nifColorMap = new Map<string, string>()

  beforeEach(() => vi.clearAllMocks())

  it('returns null when files is empty', () => {
    const { container } = render(
      <SectionFileList files={[]} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders file name and size', () => {
    const files = [makeFile('decl.xml')]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(screen.getByText('decl.xml')).toBeDefined()
    // Size in KB
    expect(screen.getByText('0 KB')).toBeDefined()
  })

  it('shows remove button when not processing', () => {
    const files = [makeFile('test.xml')]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(screen.getByRole('button', { name: /upload\.remove/ })).toBeDefined()
  })

  it('hides remove button when processing', () => {
    const files = [makeFile('test.xml')]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={true} nifColorMap={nifColorMap} />,
    )
    expect(screen.queryByRole('button', { name: /upload\.remove/ })).toBeNull()
  })

  it('calls onRemove with correct index', async () => {
    const user = userEvent.setup()
    const files = [makeFile('a.xml'), makeFile('b.xml')]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )

    const slots = screen.getAllByTestId('upload-slot')
    const secondSlot = slots[1]
    const removeBtn = within(secondSlot).getByRole('button', { name: /upload\.remove/ })
    await user.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('shows error message for error status', () => {
    const files = [makeFile('bad.xml', { status: 'error', error: 'Parse failed' })]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(screen.getByText('⚠ Parse failed')).toBeDefined()
  })

  it('shows processing indicator', () => {
    const files = [makeFile('loading.xml', { status: 'processing' })]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(screen.getByText('upload.processing')).toBeDefined()
  })

  it('shows meta badges when status is done', () => {
    const files = [
      makeFile('meta.xml', {
        status: 'done',
        meta: { docTypeLabel: 'upload.docTypes.xml', nif: '123456789', year: 2024 },
      }),
    ]
    render(
      <SectionFileList files={files} onRemove={onRemove} processing={false} nifColorMap={nifColorMap} />,
    )
    expect(screen.getByText('upload.docTypes.xml')).toBeDefined()
    expect(screen.getByText('NIF 123456789')).toBeDefined()
    expect(screen.getByText('2024')).toBeDefined()
  })
})
