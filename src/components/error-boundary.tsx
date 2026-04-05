'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n'
import { captureError } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error?: Error
}

function ErrorFallback({
  error,
  fallbackMessage,
  onReset,
}: {
  error?: Error
  fallbackMessage?: string
  onReset: () => void
}) {
  const t = useT()
  return (
    <Card className="mx-auto max-w-lg mt-12" role="alert">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('error.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {fallbackMessage ?? t('error.defaultMessage')}
          </p>
          {error && <p className="text-xs text-muted-foreground font-mono mt-2">{error.message}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onReset} className="gap-1.5">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('error.retry')}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('error.reload')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
    captureError(error, { componentStack: info.componentStack ?? undefined })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          fallbackMessage={this.props.fallbackMessage}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}
