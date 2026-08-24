"use client"

import { MapEntryB } from "../map/map-entry-b"
import { PulseTablesEntryB } from "../connect/tables-entry-b"
import { TravelerIdEntryB } from "../identity-b/traveler-id-entry-b"
import { LocalSignalLayerB } from "../local-signal-b/local-signal-layer-b"
import { SavedEntryB } from "../my/saved-entry-b"
import { OfficialDirectoryOnboardingLayer } from "../onboarding/official-directory-onboarding"
import { CanonicalPlaceMount } from "../place/canonical-place-mount"
import { SettingsEntryB } from "../settings/settings-entry-b"
import { OndoAppB } from "./ondo-app-b"

export function OndoProductB() {
  return (
    <OndoAppB slots={{
      explore: <MapEntryB />,
      saved: <SavedEntryB />,
      tables: <PulseTablesEntryB />,
      travelerId: <TravelerIdEntryB />,
      settings: <SettingsEntryB />,
      overlays: <><CanonicalPlaceMount /><LocalSignalLayerB /><OfficialDirectoryOnboardingLayer /></>,
    }} />
  )
}
