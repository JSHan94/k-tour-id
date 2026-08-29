export {}

declare global {
  interface Window {
    /** Test-only fixture. Runtime access is disabled unless the QA build flag is compiled in. */
    __ONDO_B_QA__?: {
      account?: "failure"
      actionGate?: Record<string, "failure" | "unavailable" | "expired">
      after19?: "failure" | "unavailable" | "expired"
      after19Global?: "failure" | "unavailable"
      benefit?: "ineligible" | "below_minimum" | "expired"
      credentialStatus?: string
      eligibility?: "success" | "cancel" | "failure" | "unavailable" | "expired"
      holdProcessing?: boolean
      identity?: Record<string, unknown>
      identitySetupOutcome?: string
      localSignalPhoto?: "failure"
      payment?: "failure" | "insufficient"
      paymentKyc?: "failure" | "unavailable" | "expired"
      profile?: "failure"
      tableMessage?: "failure"
      wallet?: "failure"
    }
  }
}
