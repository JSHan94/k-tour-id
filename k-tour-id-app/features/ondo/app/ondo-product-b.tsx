"use client"

import { After19Layer } from "../after19/after19-layer"
import { After19VenueReturn } from "../after19/after19-venue-return"
import { ConnectOverlays } from "../connect/connect-overlays"
import { TablesEntry } from "../connect/tables-entry"
import { GateOverlay } from "../identity/gate-overlay"
import { IdentityEntry } from "../identity/identity-entry"
import { MapEntryB } from "../map/map-entry-b"
import { MyEntry } from "../my/my-entry"
import { OnboardingLayer } from "../onboarding/onboarding-layer"
import { PlaceOverlay } from "../place/place-overlay"
import { CanonicalPlaceMount } from "../place/canonical-place-mount"
import { OndoApp } from "./ondo-app"

export function OndoProductB() {
  return (
    <OndoApp variant="B" slots={{
      map: <MapEntryB />,
      my: <MyEntry />,
      tables: <TablesEntry />,
      id: <IdentityEntry />,
      overlays: <><After19VenueReturn /><CanonicalPlaceMount /><PlaceOverlay /><ConnectOverlays /><After19Layer variant="B" /><OnboardingLayer /><GateOverlay /></>,
    }} />
  )
}
