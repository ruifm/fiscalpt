'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useT } from '@/lib/i18n'

export function DropZone({
  onFiles,
  accept,
  disabled,
  multiple = false,
}: {
  onFiles: (files: FileList) => void
  accept: string
  disabled?: boolean
  multiple?: boolean
}) {
  const t = useT()
  const [dragActive, setDragActive] = useState(false)

  function openFilePicker() {
    if (disabled) return
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = accept
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) onFiles(target.files)
    }
    input.click()
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        if (!disabled) onFiles(e.dataTransfer.files)
      }}
      onClick={openFilePicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openFilePicker()
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t('upload.dropzone')}
      data-testid="upload-dropzone"
      className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-all ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : dragActive
            ? 'cursor-pointer border-primary bg-primary/5'
            : 'cursor-pointer border-border hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      <Upload
        className={`h-5 w-5 shrink-0 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">{t('upload.dropzone')}</span>
    </div>
  )
}
