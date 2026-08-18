"use client"

import { CalendarClock, ChevronRight, Languages, MapPin, Users } from "lucide-react"
import { useOndo } from "../shared/state/ondo-provider"
import { TABLES, tableStatusCopy } from "./table-model"
import styles from "./connect.module.css"

const VENUE_NAMES: Record<string, { en: string; ko: string }> = {
  "seoul-seongsu-gukbap": { en: "Seongsu Dwaeji Gukbap", ko: "성수 돼지국밥" },
  "seoul-euljiro-nogari": { en: "Euljiro Nogari Alley", ko: "을지로 노가리 골목" },
  "seoul-mangwon-kalguksu": { en: "Mangwon Market Kalguksu", ko: "망원시장 칼국수" },
  "busan-jagalchi-grill": { en: "Jagalchi Charcoal Mackerel", ko: "자갈치 숯불 고등어" },
}

export function TablesEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const joined = TABLES.filter((table) => ["confirmed", "checked_in", "completed"].includes(state.tableMembershipById[table.id] ?? "none"))

  return (
    <div className={styles.screen} data-testid="tables-entry">
      <header className={styles.screenHeader}>
        <p>{locale === "ko" ? "같은 장소, 같은 시간" : "Same place, same time"}</p>
        <h1>Pulse Tables</h1>
        <span>{locale === "ko" ? "식사하고 싶은 사람들이 장소와 시간을 기준으로 만나는 자리예요." : "Meet people who want to eat at the same place and time."}</span>
      </header>

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
