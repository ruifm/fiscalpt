export type AnalyticsEventName =
  | 'page_view'
  | 'upload_start'
  | 'upload_complete'
  | 'questionnaire_start'
  | 'questionnaire_complete'
  | 'questionnaire_skip'
  | 'results_viewed'
  | 'pdf_exported'
  | 'locale_changed'
  | 'theme_changed'

export function trackEvent(_name: AnalyticsEventName, _properties?: Record<string, unknown>): void {
  // No-op — custom analytics removed. Will be replaced with a proper
  // analytics provider (Vercel Analytics, PostHog, etc.) in production.
}
