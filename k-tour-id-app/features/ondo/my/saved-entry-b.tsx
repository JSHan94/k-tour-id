"use client"

import { Bookmark, CalendarDays, ChevronRight, FlaskConical, History, MapPin, MessageSquareText, ReceiptText, Trash2 } from "lucide-react"
import { venueNamePresentation, venueDistrictLabel } from "@/lib/ondo/venues/display"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { openBDiscoveryEditorialDetail, openSavedBDiscoveryEditorialPlace, openSavedBDiscoveryVenue } from "../map/b-discovery-history"
import { editorialPlaceById, type EditorialPlaceB } from "../pulse-b/japan-first-pulse-model-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import styles from "../shared/ui/production-local.module.css"
import { MY_KOREA_TABLE_CATALOG } from "./my-korea-model"
import { KoreaMemoryMapB } from "./korea-memory-map-b"
import { PrivateNote } from "./private-note"
import { STABLE_B_RECEIPT_ID, STABLE_B_REFUND_RECEIPT_ID } from "../commerce-b/stable-commerce-model-b"

const ONDO_OPEN_TABLE_EVENT = "ondo:b:open-table"

const COPY = {
  en: {
    eyebrow: "ON THIS DEVICE",
    title: "My Korea",
    boundary: "Saved places, recent views, joined Tables, and Local Signals stay in this browser. They are not reservations or synced activity.",
    savedTitle: "Saved places",
    savedBody: "Food places and travel ideas you chose to keep.",
    savedEmpty: "Nothing saved yet",
    savedEmptyBody: "Save a place from Explore and it will appear here.",
    explore: "Explore places",
    remove: "Remove saved place and private note",
    removeEditorial: "Remove saved travel place",
    editorialBoundary: "Travel story",
    recentTitle: "Recently viewed places",
    recentBody: "Food places and travel stories stay easy to tell apart here.",
    recentEmpty: "No recently viewed places",
    recentEmptyBody: "Open a food place from Explore to start this list.",
    viewed: "Viewed on this device",
    plannedTitle: "Planned meals",
    plannedBody: "A Table appears here only after you confirm its local join. No booking is created.",
    plannedEmpty: "No planned meals",
    plannedEmptyBody: "Confirm a local Table join to keep its reference here.",
    localPreview: "Saved on this device · no reservation",
    openTables: "Open Table",
    contributionsTitle: "Local Signal history",
    contributionsBody: "Successful Local Signals you explicitly post appear here.",
    contributionsEmpty: "No Local Signals yet",
    contributionsEmptyBody: "This stays empty until you explicitly add a Local Signal on this device.",
    contributed: "Local Signal added on this device",
    recentSaveFailed: "The place opened, but this device could not update Recently viewed.",
    receiptsTitle: "Wallet activity",
    receiptsBody: "Payment and refund records saved on this device. No money moved.",
    paid: "Payment saved",
    refunded: "Payment undone",
    originalPayment: "Original payment",
    refundReference: "Refund reference",
    openWallet: "Open wallet",
    openReceiptPlace: "Open exact place",
    labsBody: "Optional wallet and bridge tools",
    openLabs: "Open Labs",
  },
  ko: {
    eyebrow: "이 기기",
    title: "내 한국",
    boundary: "저장한 장소, 최근 조회, 참여한 테이블과 로컬 시그널은 이 브라우저에만 남습니다. 예약이나 동기화된 활동 기록이 아닙니다.",
    savedTitle: "저장한 장소",
    savedBody: "직접 저장한 음식 장소와 여행 아이디어입니다.",
    savedEmpty: "아직 저장한 장소가 없어요",
    savedEmptyBody: "탐색에서 다시 보고 싶은 장소를 저장하면 여기에 나타나요.",
    explore: "장소 탐색하기",
    remove: "저장한 장소와 개인 메모 삭제",
    removeEditorial: "저장한 여행 장소 삭제",
    editorialBoundary: "여행 이야기",
    recentTitle: "최근 본 장소",
    recentBody: "음식 장소와 여행 이야기를 쉽게 구분해 보여줍니다.",
    recentEmpty: "최근 본 장소가 없어요",
    recentEmptyBody: "탐색에서 음식 장소를 열면 이 목록이 시작됩니다.",
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
    receiptsBody: "이 기기에 저장한 결제·환불 기록입니다. 돈은 이동하지 않았습니다.",
    paid: "결제 저장",
    refunded: "결제 되돌림",
    originalPayment: "원 결제",
    refundReference: "환불 참조",
    openWallet: "지갑 열기",
    openReceiptPlace: "이 장소 열기",
    labsBody: "선택형 지갑·체인 연결 도구",
    openLabs: "Labs 열기",
  },
  ja: {
    eyebrow: "この端末",
    title: "マイ韓国",
    boundary: "保存した場所、最近見た場所、参加したテーブル、ローカルシグナルはこのブラウザにのみ保存されます。予約や同期されたアクティビティではありません。",
    savedTitle: "保存した場所",
    savedBody: "保存した食の場所と旅のアイデアです。",
    savedEmpty: "まだ保存した場所はありません",
    savedEmptyBody: "「探す」で気になる場所を保存すると、ここに表示されます。",
    explore: "場所を探す",
    remove: "保存した場所とプライベートメモを削除",
    removeEditorial: "保存した旅スポットを削除",
    editorialBoundary: "旅ストーリー",
    recentTitle: "最近見た場所",
    recentBody: "食の場所と旅ストーリーを見分けやすく表示します。",
    recentEmpty: "最近見た場所はありません",
    recentEmptyBody: "「探す」で食の場所を開くと、ここに追加されます。",
    viewed: "この端末で閲覧",
    plannedTitle: "食事の予定",
    plannedBody: "ローカル参加を確定したテーブルだけが表示されます。予約は作成されません。",
    plannedEmpty: "食事の予定はありません",
    plannedEmptyBody: "ローカルテーブルへの参加を確定すると、ここに記録が残ります。",
    localPreview: "この端末に保存 · 予約ではありません",
    openTables: "テーブルを開く",
    contributionsTitle: "ローカルシグナル履歴",
    contributionsBody: "自分で投稿し、完了したローカルシグナルが表示されます。",
    contributionsEmpty: "ローカルシグナルはまだありません",
    contributionsEmptyBody: "この端末でローカルシグナルを投稿するまで、ここは空のままです。",
    contributed: "この端末で追加したローカルシグナル",
    recentSaveFailed: "場所は開きましたが、この端末の「最近見た場所」を更新できませんでした。",
    receiptsTitle: "ウォレット履歴",
    receiptsBody: "この端末に保存した支払い・返金の記録です。実際のお金は動いていません。",
    paid: "支払いを保存",
    refunded: "支払いを取り消し",
    originalPayment: "元の支払い",
    refundReference: "返金参照",
    openWallet: "ウォレットを開く",
    openReceiptPlace: "このお店を開く",
    labsBody: "任意のウォレット・ブリッジ機能",
    openLabs: "Labsを開く",
  },
} as const

const SAVED_EMPTY_LABEL: Record<OndoBLocale, string> = {
  en: "No saved places",
  ko: "저장한 장소 없음",
  ja: "保存した場所なし",
}

const EMPTY_INSPIRATION = {
  en: { alt: "A fictional traveler looking across a coastal landscape", caption: "Travel inspiration · fictional editorial scene" },
  ko: { alt: "해안 풍경을 바라보는 가상의 여행자", caption: "여행 영감 · 가상의 에디토리얼 이미지" },
  ja: { alt: "海辺の景色を眺める架空の旅行者", caption: "旅のインスピレーション · 架空の編集イメージ" },
} satisfies Record<OndoBLocale, { alt: string; caption: string }>

const JA_TABLE_COPY: Record<keyof typeof MY_KOREA_TABLE_CATALOG, { title: string; schedule: string }> = {
  "table-seoul-night-bites": {
    title: "夜食を囲む、ひとつのテーブル",
    schedule: "9月18日（金）· 20:30 KST",
  },
}

function savedListLabel(locale: OndoBLocale, count: number) {
  if (locale === "ko") return `저장한 장소 ${count}곳`
  if (locale === "ja") return `保存した場所 ${count}件`
  return `${count} saved places`
}

function personalVenueName(name: string, locale: OndoBLocale) {
  return venueNamePresentation(name, locale)
}

function personalDistrictLabel(cityId: "seoul" | "busan", districtId: string, locale: OndoBLocale) {
  return venueDistrictLabel(cityId, districtId, locale)
}

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
  const savedEditorial = state.savedEditorialPlaceIds.flatMap((placeId) => {
    const place = editorialPlaceById(placeId)
    return place ? [place] : []
  })
  const recentEditorial = state.recentEditorialPlaceIds.flatMap((placeId) => {
    const place = editorialPlaceById(placeId)
    return place ? [place] : []
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
  const mappedOfficialVenues = [
    ...saved,
    ...recent,
    ...planned.map(({ venue }) => venue),
    ...contributions,
    ...(receiptVenue && (state.commerceSession.status === "paid" || state.commerceSession.status === "refunded") ? [receiptVenue] : []),
  ]
  const memoryCityCounts = {
    seoul: new Set(mappedOfficialVenues.filter((venue) => venue.cityId === "seoul").map((venue) => venue.id)).size,
    busan: new Set(mappedOfficialVenues.filter((venue) => venue.cityId === "busan").map((venue) => venue.id)).size,
    jeju: new Set([...savedEditorial, ...recentEditorial].map((place) => place.id)).size,
  } as const
  const isEmptyJourney = saved.length === 0
    && savedEditorial.length === 0
    && recent.length === 0
    && recentEditorial.length === 0
    && planned.length === 0
    && contributions.length === 0
    && state.commerceSession.status !== "paid"
    && state.commerceSession.status !== "refunded"

  function openVenue(venueId: string, cityId: "seoul" | "busan") {
    if (!openSavedBDiscoveryVenue(venueId, cityId)) return
    if (!actions.recordRecentVenue(venueId)) actions.notify(copy.recentSaveFailed)
    actions.setSurface({ kind: "map" })
    actions.setTab("ondo")
  }

  function openEditorialPlace(editorialPlaceId: EditorialPlaceB["id"]) {
    if (!openSavedBDiscoveryEditorialPlace(editorialPlaceId)) return
    if (!openBDiscoveryEditorialDetail(editorialPlaceId)) return
    if (!actions.recordRecentEditorialPlace(editorialPlaceId)) actions.notify(copy.recentSaveFailed)
    actions.setSurface({ kind: "editorial_place", editorialPlaceId })
    actions.setTab("ondo")
  }

  function openPlannedTable(tableId: string, venueId: string) {
    window.__ONDO_B_TABLE_INTENT__ = { tableId, venueId, mode: "view" }
    actions.setTab("tables")
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(ONDO_OPEN_TABLE_EVENT, {
      detail: { tableId, venueId, mode: "view" },
    })), 0)
  }

  function openExplore() {
    actions.setSurface({ kind: "map" })
    actions.setTab("ondo")
    window.requestAnimationFrame(() => document.getElementById("ondo-active-panel")?.focus())
  }

  const plannedSection = (
    <section key="planned" className={styles.activitySection} data-testid="my-korea-planned" aria-labelledby="my-korea-planned-heading">
      <div className={styles.activityHeading}><CalendarDays size={19} aria-hidden="true" /><span><h2 id="my-korea-planned-heading">{copy.plannedTitle}</h2><p>{copy.plannedBody}</p></span></div>
      {planned.length === 0 ? <ActivityEmpty testId="my-korea-planned-empty" title={copy.plannedEmpty} body={copy.plannedEmptyBody} /> : (
        <div className={styles.referenceList}>
          {planned.map(({ reference, table, venue }) => {
            const localizedTable = locale === "ja" ? JA_TABLE_COPY[reference.tableId] : { title: table.title[locale], schedule: table.schedule[locale] }
            return <article key={reference.tableId} className={styles.planReference} data-testid={`planned-table-${reference.tableId}`}><span className={styles.localBadge}>{copy.localPreview}</span><h3>{localizedTable.title}</h3><p>{localizedTable.schedule} · {personalVenueName(venue.name.ko, locale).officialName}</p><button type="button" onClick={() => openPlannedTable(reference.tableId, reference.venueId)}>{copy.openTables}<ChevronRight size={16} aria-hidden="true" /></button></article>
          })}
        </div>
      )}
    </section>
  )

  const savedSection = (
    <section key="saved" className={styles.activitySection} data-testid="ondo-b-saved-entry" aria-labelledby="my-korea-saved-heading">
      <div className={styles.activityHeading}><Bookmark size={19} aria-hidden="true" /><span><h2 id="my-korea-saved-heading">{copy.savedTitle}</h2><p>{copy.savedBody}</p></span></div>
      {saved.length === 0 && savedEditorial.length === 0 ? (
        <div className={styles.compactEmpty} aria-label={SAVED_EMPTY_LABEL[locale]}>
          <h3>{copy.savedEmpty}</h3>
          <p>{copy.savedEmptyBody}</p>
          <button type="button" onClick={openExplore}>{copy.explore}</button>
        </div>
      ) : (
        <div className={styles.savedList} aria-label={savedListLabel(locale, saved.length + savedEditorial.length)}>
          {saved.map((venue) => {
            const name = personalVenueName(venue.name.ko, locale)
            return (
              <article className={styles.savedCard} key={venue.id} data-testid={`saved-card-${venue.id}`}>
                <button
                  className={styles.savedOpen}
                  type="button"
                  onClick={() => openVenue(venue.id, venue.cityId)}
                  data-testid={`saved-venue-${venue.id}`}
                  aria-label={`${name.officialNameLabel}: ${name.officialName}. ${name.transliterationLabel}: ${name.transliteration}. ${personalDistrictLabel(venue.cityId, venue.districtId, locale)}`}
                >
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    <strong>{name.officialName}</strong>
                    <small className={styles.srOnly}>{name.officialNameLabel}</small>
                    {locale !== "ko" ? <small><b>{name.transliteration}</b><span className={styles.srOnly}> · {name.transliterationLabel}</span></small> : null}
                    <small>{personalDistrictLabel(venue.cityId, venue.districtId, locale)}</small>
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
          {savedEditorial.map((place) => (
            <article className={styles.savedCard} key={place.id} data-testid={`saved-editorial-card-${place.id}`} data-truth-kind="editorial-place">
              <button className={styles.savedOpen} type="button" onClick={() => openEditorialPlace(place.id)} data-testid={`saved-editorial-${place.id}`}>
                <MapPin size={18} aria-hidden="true" />
                <span>
                  <strong>{place.name[locale]}</strong>
                  <small>{copy.editorialBoundary}</small>
                  <small>{locale === "en" ? place.address.en : place.address.ko}</small>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button className={styles.remove} type="button" onClick={() => actions.toggleSavedEditorialPlace(place.id)}>
                <Trash2 size={16} aria-hidden="true" />
                {copy.removeEditorial}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className={styles.screen} data-testid="ondo-b-my-korea-entry" data-visual-direction="warm-living-atlas">
      <header className={styles.header}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.boundary}</span>
      </header>

      {!isEmptyJourney ? <KoreaMemoryMapB locale={locale} cityCounts={memoryCityCounts} /> : null}

      {isEmptyJourney ? (
        <figure className={styles.journeyInspiration} data-testid="my-korea-empty-inspiration">
          <img src="/editorial/people/ondo-my-korea-inspiration-v2-landscape.jpg" alt={EMPTY_INSPIRATION[locale].alt} />
          <figcaption>{EMPTY_INSPIRATION[locale].caption}</figcaption>
        </figure>
      ) : null}

      <div className={styles.activitySections}>
        {saved.length === 0 ? savedSection : plannedSection}
        {saved.length === 0 ? plannedSection : savedSection}

        <section className={styles.activitySection} data-testid="my-korea-recent" aria-labelledby="my-korea-recent-heading">
          <div className={styles.activityHeading}><History size={19} aria-hidden="true" /><span><h2 id="my-korea-recent-heading">{copy.recentTitle}</h2><p>{copy.recentBody}</p></span></div>
          {recent.length === 0 && recentEditorial.length === 0 ? <ActivityEmpty testId="my-korea-recent-empty" title={copy.recentEmpty} body={copy.recentEmptyBody} /> : (
            <div className={styles.referenceList}>
              {recent.map((venue) => {
                const name = personalVenueName(venue.name.ko, locale)
                return <button key={venue.id} type="button" className={styles.referenceCard} data-testid={`recent-venue-${venue.id}`} onClick={() => openVenue(venue.id, venue.cityId)}><MapPin size={18} aria-hidden="true" /><span><strong>{name.officialName}</strong><small>{personalDistrictLabel(venue.cityId, venue.districtId, locale)} · {copy.viewed}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              })}
              {recentEditorial.map((place) => (
                <button key={place.id} type="button" className={styles.referenceCard} data-testid={`recent-editorial-${place.id}`} data-truth-kind="editorial-place" onClick={() => openEditorialPlace(place.id)}>
                  <MapPin size={18} aria-hidden="true" />
                  <span><strong>{place.name[locale]}</strong><small>{copy.editorialBoundary} · {copy.viewed}</small></span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>

        {state.commerceSession.status === "paid" || state.commerceSession.status === "refunded" ? (
          <section className={styles.activitySection} data-testid="my-korea-receipts" aria-labelledby="my-korea-receipts-heading">
            <div className={styles.activityHeading}><ReceiptText size={19} aria-hidden="true" /><span><h2 id="my-korea-receipts-heading">{copy.receiptsTitle}</h2><p>{copy.receiptsBody}</p></span></div>
            <div className={styles.referenceList}>
              <article className={styles.planReference}>
                <span className={styles.localBadge}>{state.commerceSession.status === "refunded" ? `${copy.refunded} ${state.commerceSession.chargedDebit} OOKRW` : `${copy.paid} ${state.commerceSession.chargedDebit} OOKRW`}</span>
                <h3>{receiptVenue ? personalVenueName(receiptVenue.name.ko, locale).officialName : copy.receiptsTitle}</h3>
                <p>{state.commerceSession.status === "refunded" ? `${copy.originalPayment}: ${STABLE_B_RECEIPT_ID}` : STABLE_B_RECEIPT_ID}</p>
                {state.commerceSession.status === "refunded" ? <p>{copy.refundReference}: {STABLE_B_REFUND_RECEIPT_ID}</p> : null}
                {receiptVenue ? <button type="button" data-testid="my-korea-receipt-place" onClick={() => openVenue(receiptVenue.id, receiptVenue.cityId)}>{copy.openReceiptPlace}<ChevronRight size={16} aria-hidden="true" /></button> : null}
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
                const name = personalVenueName(venue.name.ko, locale)
                return <button key={venue.id} type="button" className={styles.referenceCard} data-testid={`contribution-venue-${venue.id}`} onClick={() => openVenue(venue.id, venue.cityId)}><MessageSquareText size={18} aria-hidden="true" /><span><strong>{name.officialName}</strong><small>{copy.contributed}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              })}
            </div>
          )}
        </section>
      </div>

      <button className={styles.labsEntry} type="button" data-testid="open-labs" onClick={() => actions.setSurface({ kind: "labs" })}>
        <FlaskConical size={18} aria-hidden="true" />
        <span><strong>Labs</strong><small>{copy.labsBody}</small></span>
        <ChevronRight size={17} aria-hidden="true" />
        <span className={styles.srOnly}>{copy.openLabs}</span>
      </button>
    </div>
  )
}

function ActivityEmpty({ testId, title, body }: { testId: string; title: string; body: string }) {
  return <div className={styles.compactEmpty} data-testid={testId}><h3>{title}</h3><p>{body}</p></div>
}
