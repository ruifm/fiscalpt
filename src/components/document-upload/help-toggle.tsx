'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n'

export function HelpToggle({ children }: { children: React.ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        {t('upload.howToGet')}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-4 text-xs text-muted-foreground">{children}</div>
      )}
    </div>
  )
}
