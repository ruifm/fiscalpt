'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = useT()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>{t('legal.backToHome')}</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-4 py-12 pb-24">{children}</main>
    </div>
  )
}
