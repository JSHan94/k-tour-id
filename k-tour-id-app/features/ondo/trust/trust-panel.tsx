"use client"

import { BadgeCheck, Footprints, HandHeart, UsersRound } from "lucide-react"
import type { Locale, ReputationSnapshot } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./trust.module.css"

const COPY = {
  en: {
    title: "Activity history",
    note: "Separate signals, never one safety score",
    identity: "Identity check",
    visit: "Simulated visit records",
    contribution: "Local-preview contributions",
    meetup: "Local-preview Tables",
    unverified: "Not completed",
    verified: "Completed · Simulated",
    new: "No local activity",
    recent: "One local record",
    repeat: "Multiple local records",
    helpful: "One local entry",
    established: "Several local entries",
    reliable: "One local completion",
    boundary: "The four axes stay separate. Visit, contribution, and Table activity are browser-local previews—not proof of real-world activity or safety.",
  },
  ko: {
    title: "활동 이력",
    note: "하나의 안전 점수가 아닌 분리된 신호",
    identity: "본인 확인",
    visit: "시뮬레이션 방문 기록",
    contribution: "로컬 미리보기 기여",
    meetup: "로컬 미리보기 모임",
    unverified: "미완료",
    verified: "완료 · 시뮬레이션",
    new: "로컬 활동 없음",
    recent: "로컬 기록 1건",
    repeat: "로컬 기록 여러 건",
    helpful: "로컬 입력 1건",
    established: "로컬 입력 여러 건",
    reliable: "로컬 완료 1건",
    boundary: "네 축은 서로 분리됩니다. 방문·기여·모임 활동은 이 브라우저의 미리보기이며 실제 활동이나 안전을 입증하지 않습니다.",
  },
} satisfies Record<Locale, Record<string, string>>

type Axis = keyof ReputationSnapshot
const ICONS = { identity: BadgeCheck, visit: Footprints, contribution: HandHeart, meetup: UsersRound }

function level(axis: Axis, value: ReputationSnapshot[Axis]) {
  if (axis === "identity") return value === "verified" ? 3 : 0
  if (value === "new") return 0
  if (["recent", "helpful", "reliable"].includes(value)) return 2
  return 3
}

export function TrustPanel() {
  const { state } = useOndo()
  const t = COPY[state.locale]
  const identity = state.person === "PER-VERIFIED" ? "verified" : "unverified"
  const axes: Array<{ id: Axis; value: ReputationSnapshot[Axis] }> = [
    { id: "identity", value: identity },
    { id: "visit", value: state.reputation.visit },
    { id: "contribution", value: state.reputation.contribution },
    { id: "meetup", value: state.reputation.meetup },
  ]

  return (
    <section className={styles.panel} data-testid="ondo-trust-panel">
      <header><div><h2>{t.title}</h2><p>{t.note}</p></div><span>4 AXES</span></header>
      <div className={styles.axes}>
        {axes.map(({ id, value }) => {
          const Icon = ICONS[id]
          const currentLevel = level(id, value)
          return (
            <article key={id}>
              <span className={styles.icon}><Icon size={17} /></span>
              <div className={styles.axisBody}>
                <div><strong>{t[id]}</strong><small>{t[value]}</small></div>
                <div className={styles.bar} role="img" aria-label={`${t[id]}: ${t[value]}`}>
                  {[1, 2, 3].map((unit) => <i key={unit} className={unit <= currentLevel ? styles.fill : undefined} />)}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <p className={styles.boundary}>{t.boundary}</p>
    </section>
  )
}
