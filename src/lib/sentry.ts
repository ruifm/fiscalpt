import * as Sentry from '@sentry/nextjs'

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context)
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

export function captureMessage(message: string, level?: Sentry.SeverityLevel): void {
  Sentry.captureMessage(message, level)
}

export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value)
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb)
}
