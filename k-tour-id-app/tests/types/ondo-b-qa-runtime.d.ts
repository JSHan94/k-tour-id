export {}

declare global {
  interface Window {
    /** Test-only fixture. Runtime access is disabled unless the QA build flag is compiled in. */
    __ONDO_B_QA__?: {
      account?: "failure"
      actionGate?: Record<string, "failure" | "unavailable" | "expired">
      after19?: "failure" | "unavailable" | "expired"
      after19Global?: "success" | "failure" | "unavailable" | "expired"
      benefit?: "ineligible" | "below_minimum" | "expired"
      credentialStatus?: string
      eligibility?: "success" | "cancel" | "failure" | "unavailable" | "expired"
      evidenceFacts?: Partial<Record<"hours" | "card" | "menu" | "language", {
        state?: "yes" | "no" | "conditional" | "unknown" | "loading" | "stale" | "error"
        sourceClass?: "official_directory" | "editorial" | "ondo" | "merchant" | "opendid" | "eas"
        value?: unknown
        observedAt?: string
        recoverable?: boolean
      }>>
      holdProcessing?: boolean
      identity?: Record<string, unknown>
      identitySetupOutcome?: string
      localSignalPhoto?: "failure"
      mapImportDelayMs?: number
      payment?: "failure" | "insufficient"
      paymentKyc?: "failure" | "unavailable" | "expired"
      profile?: "failure"
      profileActivityEvents?: Array<{
        evidenceId: string
        axes: Array<"visit" | "contribution" | "meetup">
        addVisitStamp: boolean
      }>
      residenceCard?: "supported" | "unsupported" | "outage"
      tableMessage?: "failure"
      tableJoin?: "network" | "policy" | "full" | "cancelled"
      tableAvailability?: "open" | "full" | "closed" | "cancelled"
      wallet?: "failure"
    }
  }
}
