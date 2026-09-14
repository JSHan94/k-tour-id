"use client"

import { useOndo } from "../shared/state/ondo-provider"
import { LabsEntryCore } from "./labs-entry"
import type { SheetPresencePhase } from "../shared/ui/use-sheet-presence"

export function LabsEntry({ presenceState = "open" }: { presenceState?: Exclude<SheetPresencePhase, "closed"> }) {
  const { state, actions } = useOndo()
  return (
    <LabsEntryCore
      locale={state.locale}
      originTab={state.tab}
      stamps={state.stamps}
      provider="legacy"
      sessionKey="ondo.labs.v2"
      presenceState={presenceState}
      onDismiss={() => {
        actions.setSurface({ kind: "map" })
        actions.setTab(state.tab)
      }}
    />
  )
}
