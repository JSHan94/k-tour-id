"use client"

import { BadgeCheck, Footprints, HandHeart, UsersRound } from "lucide-react"
import type { Locale, ReputationSnapshot } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./trust.module.css"

const COPY = {
  en: {
    title: "Activity history",
    note: "Separate signals, never one safety score",
    identity: "Person check",
    visit: "Confirmed visits",
    contribution: "Helpful contributions",
    meetup: "Completed Tables",
    unverified: "Not completed",
    verified: "Completed · Simulated",
    new: "New",
    recent: "Recent",
    repeat: "Repeat",
    helpful: "Helpful",
    established: "Established",
    reliable: "Reliable",
    boundary: "Activity histories describe specific evidence. They do not predict whether a person or meeting is safe.",
  },
  ko: {
    title: "활동 이력",
    note: "하나의 안전 점수가 아닌 분리된 신호",
    identity: "사람 확인",
    visit: "확인된 방문",
    contribution: "도움이 된 정보",
    meetup: "완료한 Table",
    unverified: "확인 전",
    verified: "완료 · 시뮬레이션",
    new: "시작 전",
    recent: "최근 방문",
    repeat: "반복 방문",
    helpful: "도움이 됨",
    established: "꾸준함",
    reliable: "약속 이행",
    boundary: "활동 이력은 특정 증거만 설명하며, 사람이나 만남의 안전을 예측하지 않습니다.",
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
                <div className={styles.bar} aria-label={`${t[id]}: ${t[value]}`}>
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
