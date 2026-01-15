import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

import { initSentry } from './lib/sentry'
import { validateEnv } from './lib/validate-env'
import * as Sentry from "@sentry/react"
import { ErrorFallback } from "./components/ErrorBoundary"

// Validate environment variables before rendering
validateEnv()
initSentry()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
)
