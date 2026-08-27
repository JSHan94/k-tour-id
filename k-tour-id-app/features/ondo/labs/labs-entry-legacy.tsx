"use client"

import { useOndo } from "../shared/state/ondo-provider"
import { LabsEntryCore } from "./labs-entry"

export function LabsEntry() {
  const { state, actions } = useOndo()
  return (
    <LabsEntryCore
      locale={state.locale}
      originTab={state.tab}
      stamps={state.stamps}
      provider="legacy"
      sessionKey="ondo.labs.v2"
      onDismiss={() => {
        actions.setSurface({ kind: "map" })
        actions.setTab(state.tab)
      }}
    />
  )
}
