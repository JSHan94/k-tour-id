"use client"

import { MapEntryB } from "../map/map-entry-b"
import { PulseTablesEntryB } from "../connect/tables-entry-b"
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
      settings: <SettingsEntryB />,
      overlays: <><CanonicalPlaceMount /><OfficialDirectoryOnboardingLayer /></>,
    }} />
  )
}
