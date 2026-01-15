import * as Sentry from "@sentry/react"
import { getAuth } from "firebase/auth"

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Tracing
      tracesSampleRate: 1.0, // Capture 100% of the transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,

      beforeSend(event) {
        if (!import.meta.env.PROD) return null
        return event
      },
    })

    // Add user context if logged in
    const auth = getAuth()
    auth.onAuthStateChanged((user) => {
        if (user) {
            Sentry.setUser({
                id: user.uid,
                email: user.email || undefined,
            })
        } else {
            Sentry.setUser(null)
        }
    })
  }
}

export function setSentrySession(sessionId: string) {
    if (import.meta.env.PROD) {
        Sentry.setTag("session_id", sessionId)
    }
}
