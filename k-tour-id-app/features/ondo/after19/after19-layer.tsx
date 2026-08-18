"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Clock3, Moon, ShieldCheck, Sunrise, X } from "lucide-react"
import { canAutoEnterAfter19 } from "../contracts/after19"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./after19.module.css"

const COPY = {
  en: {
    on: "After 19 is on",
    autoReason: "Your current 19+ check, Korea time after 19:00, and auto-open setting all matched.",
    manualReason: "You opened this layer with a current 19+ check.",
    off: "Return to the main map",
    sessionOff: "After 19 will not reopen automatically in this session.",
    expired: "Your 19+ check expired, so the main map is shown.",
    nonAlcohol: "Late-night restaurants and cafés remain available on the main map.",
    chipOn: "After 19 on",
    chipOff: "After 19",
    gateTitle: "Confirm 19+ to view After 19.",
    gateBody: "The route checks only the required eligibility without displaying your full date of birth.",
    gatePrimary: "Confirm 19+",
    gateSecondary: "Stay on the main map",
    simulation: "19+ check simulation",
    autoSetting: "Open automatically when eligible",
    close: "Close",
    reset: "Allow automatic opening again",
  },
  ko: {
    on: "After 19가 켜졌어요",
    autoReason: "현재 19+ 확인, 한국 시간 19:00 이후, 자동 열기 설정이 모두 맞았어요.",
    manualReason: "현재 유효한 19+ 확인으로 이 레이어를 직접 열었어요.",
    off: "기본 지도로 돌아가기",
    sessionOff: "이 세션에서는 자동으로 다시 열지 않아요.",
    expired: "19+ 확인이 만료되어 기본 지도로 돌아왔어요.",
    nonAlcohol: "일반 심야 식당과 카페는 기본 지도에서도 볼 수 있어요.",
    chipOn: "After 19 켜짐",
    chipOff: "After 19",
    gateTitle: "After 19를 보려면 19+ 확인이 필요해요.",
    gateBody: "생년월일 전체를 공개하지 않고 필요한 자격만 확인하는 경로를 사용합니다.",
    gatePrimary: "19+ 확인하기",
    gateSecondary: "기본 지도에 머물기",
    simulation: "19+ 확인 시뮬레이션",
    autoSetting: "조건이 맞으면 자동으로 열기",
    close: "닫기",
    reset: "자동 열기 다시 허용",
  },
} satisfies Record<Locale, Record<string, string>>

export function After19Layer({ now }: { now?: Date } = {}) {
  const { state, actions } = useOndo()
  const [clock, setClock] = useState(() => now ?? new Date())
  const [showGate, setShowGate] = useState(false)
  const [showSessionNotice, setShowSessionNotice] = useState(false)
  const promptedToken = useRef<string | null>(null)
  const autoOpened = useRef(false)
  const t = COPY[state.locale]

  useEffect(() => {
    if (now) {
      setClock(now)
      return
    }
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [now])

  const autoEligible = useMemo(() => canAutoEnterAfter19({
    ageStatus: state.age,
    ageExpiresAt: state.ageExpiresAt,
    koreanLocalTime: clock.toISOString(),
    autoNight: state.autoNight,
    mode: state.after19,
  }), [clock, state.after19, state.age, state.ageExpiresAt, state.autoNight])

  useEffect(() => {
    if (!state.hydrated || state.after19 !== "A19-OFF" || !autoEligible) return
    const token = `${state.ageExpiresAt}-${clock.toISOString().slice(0, 13)}`
    if (promptedToken.current === token) return
    promptedToken.current = token
    autoOpened.current = true
    actions.setAfter19("A19-PROMPT")
  }, [actions, autoEligible, clock, state.after19, state.ageExpiresAt, state.hydrated])

  useEffect(() => {
    if (state.after19 !== "A19-PROMPT") return
    const timer = window.setTimeout(() => actions.setAfter19("A19-ON"), 180)
    return () => window.clearTimeout(timer)
  }, [actions, state.after19])

  useEffect(() => {
    if (state.after19 !== "A19-ON") return
    const proofExpired = state.ageExpiresAt == null || new Date(state.ageExpiresAt).getTime() <= clock.getTime()
    if (state.age !== "AGE-VERIFIED" || proofExpired || (autoOpened.current && !autoEligible)) {
      actions.setAfter19("A19-OFF")
      if (state.age !== "AGE-VERIFIED" || proofExpired) actions.notify(t.expired)
    }
  }, [actions, autoEligible, clock, state.after19, state.age, state.ageExpiresAt, t.expired])

  if (!state.hydrated) return null

  const manualOpen = () => {
    if (state.age === "AGE-VERIFIED" && state.ageExpiresAt && new Date(state.ageExpiresAt).getTime() > clock.getTime()) {
      autoOpened.current = false
      actions.setAfter19("A19-ON")
      return
    }
    setShowGate(true)
  }
  const beginAgeGate = () => {
    setShowGate(false)
    actions.beginAction({ cta: "OPEN_AFTER19", gates: ["age"] })
  }
  const turnOff = () => {
    actions.setAfter19("A19-MANUAL-OFF")
    setShowSessionNotice(true)
  }

  if (state.tab !== "ondo" && !state.gate) return null

  return (
    <div className={styles.root} data-testid="ondo-after19-layer" aria-live="polite">
      <button type="button" className={state.after19 === "A19-ON" ? styles.chipOn : styles.chip} onClick={state.after19 === "A19-ON" ? turnOff : manualOpen}>
        {state.after19 === "A19-ON" ? <Sunrise size={16} /> : <Moon size={16} />}{state.after19 === "A19-ON" ? t.chipOn : t.chipOff}
      </button>

      {state.after19 === "A19-ON" ? (
        <section className={styles.banner} data-testid="after19-auto-banner">
          <span><Moon size={19} /></span>
          <div><strong>{t.on}</strong><p>{autoOpened.current ? t.autoReason : t.manualReason}</p><small>{t.nonAlcohol}</small></div>
          <button type="button" onClick={turnOff}>{t.off}</button>
        </section>
      ) : null}

      {showSessionNotice ? (
        <div className={styles.sessionNotice} role="status"><span>{t.sessionOff}</span><button type="button" className={styles.reset} onClick={() => { actions.setAfter19("A19-OFF"); setShowSessionNotice(false); promptedToken.current = null }}>{t.reset}</button><button type="button" onClick={() => setShowSessionNotice(false)} aria-label={t.close}><X size={15} /></button></div>
      ) : null}

      {showGate ? (
        <div className={styles.gateLayer}>
          <button type="button" className={styles.backdrop} onClick={() => setShowGate(false)} aria-label={t.close} />
          <section className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="after19-title">
            <span className={styles.moon}><Moon size={28} /></span>
            <p className={styles.truth}><ShieldCheck size={13} />{t.simulation}</p>
            <h2 id="after19-title">{t.gateTitle}</h2>
            <p>{t.gateBody}</p>
            <div className={styles.fact}><Clock3 size={17} /><span>{state.locale === "ko" ? "한국 시간 19:00 이후 자동 전환은 19+ 확인과 자동 열기 설정이 모두 필요합니다." : "Automatic switching after 19:00 Korea time also requires a current 19+ check and auto-open setting."}</span></div>
            <button type="button" className={styles.primary} onClick={beginAgeGate}>{t.gatePrimary}</button>
            <button type="button" className={styles.secondary} onClick={() => setShowGate(false)}>{t.gateSecondary}</button>
          </section>
        </div>
      ) : null}

      <label className={styles.autoSetting}>
        <input type="checkbox" checked={state.autoNight} onChange={(event) => {
          actions.setAutoNight(event.target.checked)
          if (!event.target.checked && state.after19 === "A19-ON") actions.setAfter19("A19-OFF")
        }} />
        <span aria-hidden="true"><i /></span>{t.autoSetting}
      </label>
    </div>
  )
}
