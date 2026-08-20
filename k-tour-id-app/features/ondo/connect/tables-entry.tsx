"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeft, CalendarClock, ChevronRight, Languages, MapPin, ShieldCheck, Users } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import { TABLES, tableStatusCopy } from "./table-model"
import styles from "./connect.module.css"

const VENUE_NAMES: Record<string, { en: string; ko: string }> = {
  "seoul-seongsu-gukbap": { en: "Seongsu Dwaeji Gukbap", ko: "성수 돼지국밥" },
  "seoul-euljiro-nogari": { en: "Euljiro Nogari Alley", ko: "을지로 노가리 골목" },
  "seoul-mangwon-kalguksu": { en: "Mangwon Market Kalguksu", ko: "망원시장 칼국수" },
  "busan-jagalchi-grill": { en: "Jagalchi Charcoal Mackerel", ko: "자갈치 숯불 고등어" },
}

export function tableFixtureTruth(locale: Locale, venue?: string) {
  if (locale === "ko") return {
    title: "시뮬레이션 미리보기 · 2026년 8월 19일 오후 6시 KST 기준",
    body: venue
      ? `${venue}에는 실제 Table이 연결되어 있지 않습니다. 아래 일정·자리 상태는 현재 정보가 아닌 고정 예시입니다. 실제 호스트나 예약은 없습니다. 참여해도 이 기기의 로컬 미리보기만 바뀝니다.`
      : "일정과 자리 상태는 현재 정보가 아닌 고정 예시입니다. 실제 호스트나 예약은 없습니다. 참여해도 이 기기의 로컬 미리보기만 바뀝니다.",
  }
  return {
    title: "Simulated preview · Fixed at Aug 19, 2026, 6:00 PM KST",
    body: venue
      ? `${venue} has no live Table attached. Dates and seat status below are fixed examples, not current availability. There is no live host or reservation; joining changes only this local preview.`
      : "Dates and seat status are fixed examples, not current availability. No live host or reservation exists; joining changes only this local preview.",
  }
}

export function TablesEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const joined = TABLES.filter((table) => ["confirmed", "checked_in", "completed"].includes(state.tableMembershipById[table.id] ?? "none"))
  const selectedVenue = state.surface.kind === "venue" ? canonicalMapVenueById(state.surface.venueId) : undefined
  const selectedVenueName = selectedVenue ? venueDisplayName(selectedVenue.name.ko, locale) : undefined
  const venueTables = selectedVenue ? TABLES.filter((table) => table.venueId === selectedVenue.id) : []
  const [scope, setScope] = useState<"venue" | "global">(selectedVenue ? "venue" : "global")
  const globalHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusGlobalHeadingRef = useRef(false)
  const contextual = Boolean(selectedVenue && scope === "venue")
  const truth = tableFixtureTruth(locale, contextual ? selectedVenueName : undefined)

  useEffect(() => {
    setScope(selectedVenue ? "venue" : "global")
  }, [selectedVenue?.id])

  useLayoutEffect(() => {
    if (scope !== "global" || !focusGlobalHeadingRef.current) return
    focusGlobalHeadingRef.current = false
    const heading = globalHeadingRef.current
    if (!heading) return
    heading.focus({ preventScroll: true })
    heading.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [scope])

  function browseAllTables() {
    focusGlobalHeadingRef.current = true
    setScope("global")
  }

  function returnToVenue() {
    if (!selectedVenue) return
    actions.setTab("ondo")
    // This explicit surface restore also keeps the handoff safe before the shared
    // tab-preservation update lands in the integration branch.
    actions.setSurface({ kind: "venue", venueId: selectedVenue.id })
  }

  return (
    <div className={styles.screen} data-testid="tables-entry">
      <header className={styles.screenHeader}>
        <p>{contextual ? locale === "ko" ? "이 장소에서 함께 먹기" : "Eat together at this place" : locale === "ko" ? "같은 장소, 같은 시간" : "Same place, same time"}</p>
        <h1>{contextual ? selectedVenueName : "Pulse Tables"}</h1>
        <span>{contextual
          ? locale === "ko" ? "이 장소에 연결된 Table만 먼저 확인해요." : "Start with Tables attached to this exact place."
          : locale === "ko" ? "식사하고 싶은 사람들이 장소와 시간을 기준으로 만나는 자리예요." : "Meet people who want to eat at the same place and time."}</span>
      </header>

      <aside className={styles.contextNotice} data-testid="tables-truth-notice"><ShieldCheck size={17} /><div><strong>{truth.title}</strong><span data-testid={selectedVenue ? "tables-canonical-context" : undefined}>{truth.body}</span></div></aside>

      {contextual ? (
        <>
          <section className={styles.section} aria-labelledby="venue-tables-title" data-testid="venue-table-scope">
            <div className={styles.sectionTitle}><h2 id="venue-tables-title">{locale === "ko" ? "이 장소의 Table" : "Tables at this place"}</h2><span>{venueTables.length}</span></div>
            {venueTables.length ? (
              <div className={styles.tableList}>{venueTables.map((table) => <TableCard key={table.id} tableId={table.id} joined={joined.some((entry) => entry.id === table.id)} />)}</div>
            ) : (
              <div className={styles.emptyState} data-testid="venue-tables-empty">
                <Users size={22} />
                <strong>{locale === "ko" ? "아직 이 장소에 열린 Table이 없어요." : "No Tables are open at this place yet."}</strong>
                <span>{locale === "ko" ? "다른 장소의 로컬 미리보기 Table은 전체 목록에서 볼 수 있어요." : "You can still browse local-preview Tables at other places."}</span>
              </div>
            )}
          </section>
          <div className={styles.contextActions}>
            <button type="button" className={styles.primary} onClick={returnToVenue} data-testid="tables-back-to-venue"><ArrowLeft size={17} />{locale === "ko" ? "장소로 돌아가기" : `Back to ${selectedVenueName}`}</button>
            <button type="button" className={styles.secondary} onClick={browseAllTables} data-testid="tables-browse-all">{locale === "ko" ? "전체 Table 둘러보기" : "Browse all Tables"}</button>
          </div>
        </>
      ) : <>
      {selectedVenue ? <button type="button" className={styles.contextBack} onClick={() => setScope("venue")} data-testid="tables-back-to-place-scope"><ArrowLeft size={16} />{locale === "ko" ? `${selectedVenueName}의 Table` : `Tables at ${selectedVenueName}`}</button> : null}
      {joined.length ? (
        <section className={styles.section} aria-labelledby="joined-tables-title">
          <div className={styles.sectionTitle}><h2 id="joined-tables-title">{locale === "ko" ? "참여 중" : "Joined"}</h2><span>{joined.length}</span></div>
          {joined.map((table) => <TableCard key={table.id} tableId={table.id} joined />)}
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="nearby-tables-title">
        <div className={styles.sectionTitle}><h2 ref={globalHeadingRef} id="nearby-tables-title" tabIndex={-1} data-testid="tables-global-heading">{locale === "ko" ? "장소별 Table" : "Tables by place"}</h2><small>{locale === "ko" ? "국적·성별 매칭 없음" : "No nationality or gender matching"}</small></div>
        <div className={styles.tableList}>
          {TABLES.map((table) => <TableCard key={table.id} tableId={table.id} />)}
        </div>
      </section>
      </>}
    </div>
  )
}

function TableCard({ tableId, joined = false }: { tableId: string; joined?: boolean }) {
  const { state, actions } = useOndo()
  const table = TABLES.find((candidate) => candidate.id === tableId)!
  const locale = state.locale
  const venue = VENUE_NAMES[table.venueId]?.[locale] ?? table.venueId
  const date = `${new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(table.startsAt))} · KST`

  return (
    <button
      type="button"
      className={styles.tableCard}
      onClick={() => actions.setSurface({ kind: joined ? "chat" : "table", tableId: table.id })}
      data-table-id={table.id}
      data-availability={table.availability}
    >
      <div className={styles.tableCardTop}>
        <span className={`${styles.availability} ${table.availability !== "TAV-OPEN" ? styles.availabilityMuted : ""}`}>{tableStatusCopy(table, locale)}</span>
        {table.alcohol ? <span className={styles.ageBadge}>19+</span> : null}
      </div>
      <strong>{table.title[locale]}</strong>
      <span className={styles.venueName}><MapPin size={14} /> {venue}</span>
      <div className={styles.tableMeta}>
        <span><CalendarClock size={14} /> {date}</span>
        <span><Users size={14} /> {table.seatsTaken}/{table.seatsTotal}</span>
        <span><Languages size={14} /> {table.languages.join(" · ")}</span>
      </div>
      <ChevronRight className={styles.cardArrow} size={19} />
    </button>
  )
}

export { VENUE_NAMES }
