"use client"

import { Bookmark, ChevronRight, MapPin, Trash2 } from "lucide-react"
import { venueNamePresentation, venueDistrictLabel } from "@/lib/ondo/venues/display"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { openSavedBDiscoveryVenue } from "../map/b-discovery-history"
import { useOndoB } from "../shared/state/ondo-b-provider"
import styles from "../shared/ui/production-local.module.css"
import { PrivateNote } from "./private-note"

export function SavedEntryB() {
  const { state, actions } = useOndoB()
  const locale = state.locale
  const saved = state.savedVenueIds.flatMap((venueId) => {
    const venue = canonicalMapVenueById(venueId)
    return venue ? [venue] : []
  })

  function openVenue(venueId: string, cityId: "seoul" | "busan") {
    if (!openSavedBDiscoveryVenue(venueId, cityId)) return
    actions.setSurface({ kind: "map" })
    actions.setTab("ondo")
  }

  return (
    <div className={styles.screen} data-testid="ondo-b-saved-entry">
      <header className={styles.header}>
        <p>{locale === "ko" ? "내 기기" : "ON THIS DEVICE"}</p>
        <h1>{locale === "ko" ? "저장한 장소" : "Saved places"}</h1>
        <span>{locale === "ko" ? "공식 장소 기록을 모아 두고, 나만의 메모와 함께 다시 찾아보세요." : "Keep official place records close and return with your own private notes."}</span>
      </header>

      {saved.length === 0 ? (
        <section className={styles.empty} aria-label={locale === "ko" ? "저장한 장소 없음" : "No saved places"}>
          <Bookmark size={22} aria-hidden="true" />
          <h2>{locale === "ko" ? "아직 저장한 장소가 없어요" : "Nothing saved yet"}</h2>
          <p>{locale === "ko" ? "탐색에서 다시 보고 싶은 장소를 저장하면 여기에 나타나요." : "Save a place from Explore and it will appear here."}</p>
          <button type="button" onClick={() => { actions.setSurface({ kind: "map" }); actions.setTab("ondo") }}>{locale === "ko" ? "장소 탐색하기" : "Explore places"}</button>
        </section>
      ) : (
        <div className={styles.savedList} aria-label={locale === "ko" ? `저장한 장소 ${saved.length}곳` : `${saved.length} saved places`}>
          {saved.map((venue) => {
            const name = venueNamePresentation(venue.name.ko, locale)
            return (
              <article className={styles.savedCard} key={venue.id} data-testid={`saved-card-${venue.id}`}>
                <button className={styles.savedOpen} type="button" onClick={() => openVenue(venue.id, venue.cityId)} data-testid={`saved-venue-${venue.id}`}>
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    <strong>{name.officialName}</strong>
                    <small>{name.officialNameLabel}</small>
                    {locale === "en" ? <small><b>{name.transliteration}</b> · {name.transliterationLabel}</small> : null}
                    <small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)}</small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <PrivateNote venueId={venue.id} />
                <button className={styles.remove} type="button" onClick={() => actions.toggleSavedVenue(venue.id)}>
                  <Trash2 size={16} aria-hidden="true" />
                  {locale === "ko" ? "저장한 장소와 개인 메모 삭제" : "Remove saved place and private note"}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
