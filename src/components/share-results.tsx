'use client'

import { useState, useCallback } from 'react'
import { Share2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { formatEuro } from '@/lib/utils'

interface ShareResultsProps {
  savings: number
  optimizationCount: number
  years: number[]
}

export function ShareResults({ savings, optimizationCount, years }: ShareResultsProps) {
  const t = useT()
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const yearText = years.length === 1 ? `${years[0]}` : `${years[0]}–${years[years.length - 1]}`

  const shareText =
    savings > 0
      ? t('share.textWithSavings', {
          amount: formatEuro(savings),
          years: yearText,
          count: String(optimizationCount),
        })
      : t('share.textNoSavings', { years: yearText })

  const shareUrl = 'https://fiscalpt.com'

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: do nothing
    }
  }, [shareText])

  const handleShare = useCallback(
    (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
      const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`)
      const urls = {
        twitter: `https://x.com/intent/tweet?text=${encoded}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
        whatsapp: `https://wa.me/?text=${encoded}`,
      }
      window.open(urls[platform], '_blank', 'noopener,noreferrer')
      setShowMenu(false)
    },
    [shareText],
  )

  // Try native share API first (mobile)
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FiscalPT', text: shareText, url: shareUrl })
        return
      } catch {
        // User cancelled or not supported — fall through to menu
      }
    }
    setShowMenu((v) => !v)
  }, [shareText])

  return (
    <div className="relative print:hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={handleNativeShare}
        aria-label={t('share.button')}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} aria-hidden />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border bg-background shadow-lg p-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('share.title')}</span>
              <button
                onClick={() => setShowMenu(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{shareText}</p>

            <button
              onClick={() => handleShare('twitter')}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              𝕏 Twitter / X
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              in LinkedIn
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  {t('share.copied')}
                </>
              ) : (
                <>📋 {t('share.copyLink')}</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
