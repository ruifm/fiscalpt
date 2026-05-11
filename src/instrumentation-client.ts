// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// The DSN is hardcoded because Turbopack doesn't reliably inline
// process.env.NEXT_PUBLIC_* in instrumentation-client.ts (see commits
// 010a208, eb77d58). Sentry DSNs are public values (they identify the
// project, not authenticate). We disable in development so local dev
// and repo clones don't send events to our Sentry project.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://d957ed1f15982c8e0be5622a301d02d1@o4511167573458944.ingest.de.sentry.io/4511167603998800',
  enabled: process.env.NODE_ENV === 'production',
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  environment: process.env.NODE_ENV,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
