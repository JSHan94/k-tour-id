"use client"

import { Bookmark, CalendarDays, ChevronRight, History, MapPin, MessageSquareText, ReceiptText, Trash2 } from "lucide-react"
import { venueNamePresentation, venueDistrictLabel } from "@/lib/ondo/venues/display"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { openSavedBDiscoveryVenue } from "../map/b-discovery-history"
import { useOndoB } from "../shared/state/ondo-b-provider"
import styles from "../shared/ui/production-local.module.css"
import { MY_KOREA_TABLE_CATALOG } from "./my-korea-model"
import { PrivateNote } from "./private-note"
import { STABLE_B_RECEIPT_ID, STABLE_B_REFUND_RECEIPT_ID } from "../commerce-b/stable-commerce-model-b"

const ONDO_OPEN_TABLE_EVENT = "ondo:b:open-table"

const COPY = {
  en: {
    eyebrow: "ON THIS DEVICE",
    title: "My Korea",
    boundary: "Saved places, recent views, joined Tables, and Local Signals stay in this browser. They are not reservations or synced activity.",
    savedTitle: "Saved places",
    savedBody: "Official place records you chose to keep, with optional private notes.",
    savedEmpty: "Nothing saved yet",
    savedEmptyBody: "Save a place from Explore and it will appear here.",
    explore: "Explore places",
    remove: "Remove saved place and private note",
    recentTitle: "Recently viewed official places",
    recentBody: "Only places you explicitly opened on this device appear here.",
    recentEmpty: "No recently viewed places",
    recentEmptyBody: "Opening an official place from Explore starts this list.",
    viewed: "Viewed on this device",
    plannedTitle: "Planned meals",
    plannedBody: "A Table appears here only after you confirm its local join. No booking is created.",
    plannedEmpty: "No planned meals",
    plannedEmptyBody: "Confirm a local Table join to keep its reference here.",
    localPreview: "Saved on this device · no reservation",
    openTables: "Open Tables",
    contributionsTitle: "Local Signal history",
    contributionsBody: "Successful Local Signals you explicitly post appear here.",
    contributionsEmpty: "No Local Signals yet",
    contributionsEmptyBody: "This stays empty until you explicitly add a Local Signal on this device.",
    contributed: "Local Signal added on this device",
    recentSaveFailed: "The place opened, but this device could not update Recently viewed.",
    receiptsTitle: "Wallet activity",
    receiptsBody: "Payments and refunds completed on this device.",
    paid: "Paid",
    refunded: "Refunded",
    originalPayment: "Original payment",
    refundReference: "Refund reference",
    openWallet: "Open wallet",
  },
  ko: {
    eyebrow: "이 기기",
    title: "내 한국",
    boundary: "저장한 장소, 최근 조회, 참여한 테이블과 로컬 시그널은 이 브라우저에만 남습니다. 예약이나 동기화된 활동 기록이 아닙니다.",
    savedTitle: "저장한 장소",
    savedBody: "직접 저장한 공식 장소 기록과 선택 사항인 개인 메모입니다.",
    savedEmpty: "아직 저장한 장소가 없어요",
    savedEmptyBody: "탐색에서 다시 보고 싶은 장소를 저장하면 여기에 나타나요.",
    explore: "장소 탐색하기",
    remove: "저장한 장소와 개인 메모 삭제",
    recentTitle: "최근 본 공식 장소",
    recentBody: "이 기기에서 직접 연 장소만 여기에 나타납니다.",
    recentEmpty: "최근 본 장소가 없어요",
    recentEmptyBody: "탐색에서 공식 장소를 열면 이 목록이 시작됩니다.",
    viewed: "이 기기에서 조회함",
    plannedTitle: "식사 계획",
    plannedBody: "로컬 참여를 최종 확인한 테이블만 나타납니다. 예약은 생성되지 않습니다.",
    plannedEmpty: "식사 계획이 없어요",
    plannedEmptyBody: "로컬 테이블 참여를 확인하면 참조가 여기에 남습니다.",
    localPreview: "이 기기에 저장됨 · 예약 아님",
    openTables: "테이블 열기",
    contributionsTitle: "로컬 시그널 기록",
    contributionsBody: "직접 게시에 성공한 로컬 시그널이 여기에 나타납니다.",
    contributionsEmpty: "아직 로컬 시그널이 없어요",
    contributionsEmptyBody: "이 기기에서 로컬 시그널을 직접 남기기 전까지 비어 있습니다.",
    contributed: "이 기기에서 남긴 로컬 시그널",
    recentSaveFailed: "장소는 열었지만 이 기기의 최근 본 목록에는 저장하지 못했어요.",
    receiptsTitle: "지갑 활동",
    receiptsBody: "이 기기에서 완료한 결제와 환불입니다.",
    paid: "결제",
    refunded: "환불됨",
    originalPayment: "원 결제",
    refundReference: "환불 참조",
    openWallet: "지갑 열기",
  },
} as const

export function SavedEntryB() {
  const { state, actions } = useOndoB()
  const locale = state.locale
  const copy = COPY[locale]
  const saved = state.savedVenueIds.flatMap((venueId) => {
    const venue = canonicalMapVenueById(venueId)
    return venue ? [venue] : []
  })
  const recent = state.recentVenueIds.flatMap((venueId) => {
    const venue = canonicalMapVenueById(venueId)
    return venue ? [venue] : []
  })
  const planned = state.plannedTableRefs.flatMap((reference) => {
    const table = MY_KOREA_TABLE_CATALOG[reference.tableId]
    const venue = canonicalMapVenueById(reference.venueId)
    return table && venue ? [{ reference, table, venue }] : []
  })
  const contributions = state.localSignalPostedVenueIds.flatMap((venueId) => {
    const venue = canonicalMapVenueById(venueId)
    return venue ? [venue] : []
  })
  const receiptVenue = state.commerceReceiptVenueId ? canonicalMapVenueById(state.commerceReceiptVenueId) : undefined

  function openVenue(venueId: string, cityId: "seoul" | "busan") {
    if (!openSavedBDiscoveryVenue(venueId, cityId)) return
    if (!actions.recordRecentVenue(venueId)) actions.notify(copy.recentSaveFailed)
    actions.setSurface({ kind: "map" })
    actions.setTab("ondo")
  }

  function openPlannedTable(tableId: string, venueId: string) {
    window.__ONDO_B_TABLE_INTENT__ = { tableId, venueId, mode: "view" }
    actions.setTab("tables")
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(ONDO_OPEN_TABLE_EVENT, {
      detail: { tableId, venueId, mode: "view" },
    })), 0)
  }

  return (
    <div className={styles.screen} data-testid="ondo-b-my-korea-entry">
      <header className={styles.header}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.boundary}</span>
      </header>

      <div className={styles.activitySections}>
        <section className={styles.activitySection} data-testid="ondo-b-saved-entry" aria-labelledby="my-korea-saved-heading">
          <div className={styles.activityHeading}><Bookmark size={19} aria-hidden="true" /><span><h2 id="my-korea-saved-heading">{copy.savedTitle}</h2><p>{copy.savedBody}</p></span></div>
          {saved.length === 0 ? (
            <div className={styles.compactEmpty} aria-label={locale === "ko" ? "저장한 장소 없음" : "No saved places"}>
              <h3>{copy.savedEmpty}</h3>
              <p>{copy.savedEmptyBody}</p>
              <button type="button" onClick={() => { actions.setSurface({ kind: "map" }); actions.setTab("ondo") }}>{copy.explore}</button>
            </div>
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
                      {copy.remove}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className={styles.activitySection} data-testid="my-korea-recent" aria-labelledby="my-korea-recent-heading">
          <div className={styles.activityHeading}><History size={19} aria-hidden="true" /><span><h2 id="my-korea-recent-heading">{copy.recentTitle}</h2><p>{copy.recentBody}</p></span></div>
          {recent.length === 0 ? <ActivityEmpty testId="my-korea-recent-empty" title={copy.recentEmpty} body={copy.recentEmptyBody} /> : (
            <div className={styles.referenceList}>
              {recent.map((venue) => {
                const name = venueNamePresentation(venue.name.ko, locale)
                return <button key={venue.id} type="button" className={styles.referenceCard} data-testid={`recent-venue-${venue.id}`} onClick={() => openVenue(venue.id, venue.cityId)}><MapPin size={18} aria-hidden="true" /><span><strong>{name.officialName}</strong><small>{venueDistrictLabel(venue.cityId, venue.districtId, locale)} · {copy.viewed}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              })}
            </div>
          )}
        </section>

        <section className={styles.activitySection} data-testid="my-korea-planned" aria-labelledby="my-korea-planned-heading">
          <div className={styles.activityHeading}><CalendarDays size={19} aria-hidden="true" /><span><h2 id="my-korea-planned-heading">{copy.plannedTitle}</h2><p>{copy.plannedBody}</p></span></div>
          {planned.length === 0 ? <ActivityEmpty testId="my-korea-planned-empty" title={copy.plannedEmpty} body={copy.plannedEmptyBody} /> : (
            <div className={styles.referenceList}>
              {planned.map(({ reference, table, venue }) => <article key={reference.tableId} className={styles.planReference} data-testid={`planned-table-${reference.tableId}`}><span className={styles.localBadge}>{copy.localPreview}</span><h3>{table.title[locale]}</h3><p>{table.schedule[locale]} · {venueNamePresentation(venue.name.ko, locale).officialName}</p><button type="button" onClick={() => openPlannedTable(reference.tableId, reference.venueId)}>{copy.openTables}<ChevronRight size={16} aria-hidden="true" /></button></article>)}
            </div>
          )}
        </section>

        {state.commerceSession.status === "paid" || state.commerceSession.status === "refunded" ? (
          <section className={styles.activitySection} data-testid="my-korea-receipts" aria-labelledby="my-korea-receipts-heading">
            <div className={styles.activityHeading}><ReceiptText size={19} aria-hidden="true" /><span><h2 id="my-korea-receipts-heading">{copy.receiptsTitle}</h2><p>{copy.receiptsBody}</p></span></div>
            <div className={styles.referenceList}>
              <article className={styles.planReference}>
                <span className={styles.localBadge}>{state.commerceSession.status === "refunded" ? `${copy.refunded} ${state.commerceSession.chargedDebit} OOKRW Test` : `${copy.paid} ${state.commerceSession.chargedDebit} OOKRW Test`}</span>
                <h3>{receiptVenue ? venueNamePresentation(receiptVenue.name.ko, locale).officialName : copy.receiptsTitle}</h3>
                <p>{state.commerceSession.status === "refunded" ? `${copy.originalPayment}: ${STABLE_B_RECEIPT_ID}` : STABLE_B_RECEIPT_ID}</p>
                {state.commerceSession.status === "refunded" ? <p>{copy.refundReference}: {STABLE_B_REFUND_RECEIPT_ID}</p> : null}
                <button type="button" onClick={() => actions.setTab("id")}>{copy.openWallet}<ChevronRight size={16} aria-hidden="true" /></button>
              </article>
            </div>
          </section>
        ) : null}

        <section className={styles.activitySection} data-testid="my-korea-contributions" aria-labelledby="my-korea-contributions-heading">
          <div className={styles.activityHeading}><MessageSquareText size={19} aria-hidden="true" /><span><h2 id="my-korea-contributions-heading">{copy.contributionsTitle}</h2><p>{copy.contributionsBody}</p></span></div>
          {contributions.length === 0 ? <ActivityEmpty testId="my-korea-contributions-empty" title={copy.contributionsEmpty} body={copy.contributionsEmptyBody} /> : (
            <div className={styles.referenceList}>
              {contributions.map((venue) => {
                const name = venueNamePresentation(venue.name.ko, locale)
                return <button key={venue.id} type="button" className={styles.referenceCard} data-testid={`contribution-venue-${venue.id}`} onClick={() => openVenue(venue.id, venue.cityId)}><MessageSquareText size={18} aria-hidden="true" /><span><strong>{name.officialName}</strong><small>{copy.contributed}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ActivityEmpty({ testId, title, body }: { testId: string; title: string; body: string }) {
  return <div className={styles.compactEmpty} data-testid={testId}><h3>{title}</h3><p>{body}</p></div>
}
