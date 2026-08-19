"use client"

import { CalendarClock, ChevronRight, Languages, MapPin, ShieldCheck, Users } from "lucide-react"
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
    title: "시뮬레이션 미리보기",
    body: venue
      ? `${venue}에는 실제 Table이 연결되어 있지 않습니다. 아래 항목에도 실제 호스트나 예약은 없으며, 참여해도 이 기기의 로컬 미리보기만 바뀝니다.`
      : "실제 호스트나 예약은 없습니다. 참여해도 이 기기의 로컬 미리보기만 바뀝니다.",
  }
  return {
    title: "Simulated fixture",
    body: venue
      ? `${venue} has no live Table attached. The entries below have no live host or reservation; joining changes only this local preview.`
      : "No live host or reservation. Joining changes only this local preview.",
  }
}

export function TablesEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const joined = TABLES.filter((table) => ["confirmed", "checked_in", "completed"].includes(state.tableMembershipById[table.id] ?? "none"))
  const selectedVenue = state.surface.kind === "venue" ? canonicalMapVenueById(state.surface.venueId) : undefined
  const truth = tableFixtureTruth(locale, selectedVenue ? venueDisplayName(selectedVenue.name.ko, locale) : undefined)

  return (
    <div className={styles.screen} data-testid="tables-entry">
      <header className={styles.screenHeader}>
        <p>{locale === "ko" ? "같은 장소, 같은 시간" : "Same place, same time"}</p>
        <h1>Pulse Tables</h1>
        <span>{locale === "ko" ? "식사하고 싶은 사람들이 장소와 시간을 기준으로 만나는 자리예요." : "Meet people who want to eat at the same place and time."}</span>
      </header>

      <aside className={styles.contextNotice} data-testid="tables-truth-notice"><ShieldCheck size={17} /><div><strong>{truth.title}</strong><span data-testid={selectedVenue ? "tables-canonical-context" : undefined}>{truth.body}</span></div></aside>

      {joined.length ? (
        <section className={styles.section} aria-labelledby="joined-tables-title">
          <div className={styles.sectionTitle}><h2 id="joined-tables-title">{locale === "ko" ? "참여 중" : "Joined"}</h2><span>{joined.length}</span></div>
          {joined.map((table) => <TableCard key={table.id} tableId={table.id} joined />)}
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="nearby-tables-title">
        <div className={styles.sectionTitle}><h2 id="nearby-tables-title">{locale === "ko" ? "장소별 Table" : "Tables by place"}</h2><small>{locale === "ko" ? "국적·성별 매칭 없음" : "No nationality or gender matching"}</small></div>
        <div className={styles.tableList}>
          {TABLES.map((table) => <TableCard key={table.id} tableId={table.id} />)}
        </div>
      </section>
    </div>
  )
}

function TableCard({ tableId, joined = false }: { tableId: string; joined?: boolean }) {
  const { state, actions } = useOndo()
  const table = TABLES.find((candidate) => candidate.id === tableId)!
  const locale = state.locale
  const venue = VENUE_NAMES[table.venueId]?.[locale] ?? table.venueId
  const date = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(table.startsAt))

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
