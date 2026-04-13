export type AnalyticsEventName =
  | 'page_view'
  | 'upload_start'
  | 'upload_complete'
  | 'questionnaire_start'
  | 'questionnaire_complete'
  | 'questionnaire_skip'
  | 'results_viewed'
  | 'pdf_exported'
  | 'payment_start'
  | 'payment_success'
  | 'locale_changed'
  | 'theme_changed'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: AnalyticsEventName, properties?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties)
  }
}

/** Fire a Google Ads conversion event. Requires a conversion label from the Dashboard. */
export function trackConversion(conversionLabel: string, value?: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionLabel,
      ...(value != null && { value, currency: 'EUR' }),
    })
  }
}
