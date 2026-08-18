"use client"

import { After19Layer } from "../after19/after19-layer"
import { ConnectOverlays } from "../connect/connect-overlays"
import { TablesEntry } from "../connect/tables-entry"
import { GateOverlay } from "../identity/gate-overlay"
import { IdentityEntry } from "../identity/identity-entry"
import { MapEntry } from "../map/map-entry"
import { MyEntry } from "../my/my-entry"
import { OnboardingLayer } from "../onboarding/onboarding-layer"
import { PlaceOverlay } from "../place/place-overlay"
import { OndoApp } from "./ondo-app"

export function OndoProduct() {
  return (
    <OndoApp
      slots={{
        map: <MapEntry />,
        my: <MyEntry />,
        tables: <TablesEntry />,
        id: <IdentityEntry />,
        overlays: (
          <>
            <PlaceOverlay />
            <ConnectOverlays />
            <After19Layer />
            <OnboardingLayer />
            <GateOverlay />
          </>
        ),
      }}
    />
  )
}
