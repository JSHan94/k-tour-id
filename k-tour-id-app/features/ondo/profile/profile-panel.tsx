"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Edit3, Globe2, Lock, MapPin, RotateCcw, Save, UserRound } from "lucide-react"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./profile.module.css"

const COPY = {
  en: {
    title: "Public profile",
    private: "Private by default",
    partial: "Only selected fields are public",
    edit: "Edit public fields",
    account: "Create an account from a save or Table action before editing a public profile.",
    name: "Display name",
    from: "From",
    lives: "Lives in",
    languages: "Languages",
    self: "Self-declared",
    show: "Show publicly",
    save: "Save selected fields",
    cancel: "Cancel editing",
    failed: "Profile changes were not saved. Your previous public fields are unchanged.",
    retry: "Try save again",
    truth: "Person-check nationality is never copied here. Every public location or language is self-declared and separately consented.",
  },
  ko: {
    title: "공개 프로필",
    private: "기본은 비공개",
    partial: "선택한 필드만 공개 중",
    edit: "공개 필드 편집",
    account: "공개 프로필은 저장이나 Table 행동에서 계정을 만든 뒤 편집할 수 있어요.",
    name: "표시 이름",
    from: "출신",
    lives: "거주지",
    languages: "사용 언어",
    self: "본인 입력",
    show: "공개하기",
    save: "선택한 필드 저장",
    cancel: "편집 취소",
    failed: "프로필 변경을 저장하지 못했어요. 기존 공개값은 바뀌지 않았습니다.",
    retry: "저장 다시 시도",
    truth: "사람 확인의 국적은 여기로 복사하지 않습니다. 공개 위치와 언어는 각각 본인이 입력하고 동의한 값입니다.",
  },
} satisfies Record<Locale, Record<string, string>>

type Draft = {
  displayName: string
  from: string
  livesIn: string
  languages: string
  shareFrom: boolean
  shareLivesIn: boolean
  shareLanguages: boolean
}

export function ProfilePanel() {
  const { state, actions } = useOndo()
  const [editing, setEditing] = useState(false)
  const [failed, setFailed] = useState(false)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)
  const focusEditOnExitRef = useRef(false)
  const [draft, setDraft] = useState<Draft>({
    displayName: state.profile.displayName,
    from: state.profile.from ?? "",
    livesIn: state.profile.livesIn ?? "",
    languages: state.profile.languages.join(", "),
    shareFrom: state.profile.shareFrom,
    shareLivesIn: state.profile.shareLivesIn,
    shareLanguages: state.profile.shareLanguages,
  })
  const t = COPY[state.locale]

  useEffect(() => {
    if (!editing) setDraft({
      displayName: state.profile.displayName,
      from: state.profile.from ?? "",
      livesIn: state.profile.livesIn ?? "",
      languages: state.profile.languages.join(", "),
      shareFrom: state.profile.shareFrom,
      shareLivesIn: state.profile.shareLivesIn,
      shareLanguages: state.profile.shareLanguages,
    })
  }, [editing, state.profile])

  useEffect(() => {
    if (editing) window.requestAnimationFrame(() => nameInputRef.current?.focus())
    else if (focusEditOnExitRef.current) {
      focusEditOnExitRef.current = false
      window.requestAnimationFrame(() => editButtonRef.current?.focus())
    }
  }, [editing])

  useEffect(() => {
    if (failed) window.requestAnimationFrame(() => retryButtonRef.current?.focus())
  }, [failed])

  const save = () => {
    const shouldFail = new URLSearchParams(window.location.search).get("profile") === "failure" && !failed
    if (shouldFail) {
      setFailed(true)
      return
    }
    actions.updateProfile({
      displayName: draft.displayName.trim() || state.profile.displayName,
      from: draft.from.trim() || undefined,
      livesIn: draft.livesIn.trim() || undefined,
      languages: draft.languages.split(",").map((item) => item.trim()).filter(Boolean),
      shareFrom: draft.shareFrom,
      shareLivesIn: draft.shareLivesIn,
      shareLanguages: draft.shareLanguages,
    })
    focusEditOnExitRef.current = true
    setFailed(false)
    setEditing(false)
    actions.notify(state.locale === "ko" ? "선택한 공개 필드를 저장했어요." : "Selected public fields saved.")
  }

  const isPartial = state.profile.shareFrom || state.profile.shareLivesIn || state.profile.shareLanguages

  return (
    <section className={styles.panel} data-testid="ondo-profile-panel">
      <header>
        <div><h2>{t.title}</h2><p><Lock size={11} />{isPartial ? t.partial : t.private}</p></div>
        {state.account === "ACC-ACTIVE" && !editing ? <button ref={editButtonRef} type="button" onClick={() => setEditing(true)}><Edit3 size={15} />{t.edit}</button> : null}
      </header>

      {state.account !== "ACC-ACTIVE" ? (
        <div className={styles.locked}><UserRound size={20} /><p>{t.account}</p></div>
      ) : editing ? (
        <div className={styles.form}>
          <label><span>{t.name}</span><input ref={nameInputRef} value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} /></label>
          <Field label={t.from} icon={<Globe2 size={15} />} value={draft.from} share={draft.shareFrom} locale={state.locale} onValue={(from) => setDraft((current) => ({ ...current, from }))} onShare={(shareFrom) => setDraft((current) => ({ ...current, shareFrom }))} />
          <Field label={t.lives} icon={<MapPin size={15} />} value={draft.livesIn} share={draft.shareLivesIn} locale={state.locale} onValue={(livesIn) => setDraft((current) => ({ ...current, livesIn }))} onShare={(shareLivesIn) => setDraft((current) => ({ ...current, shareLivesIn }))} />
          <Field label={t.languages} icon={<Globe2 size={15} />} value={draft.languages} share={draft.shareLanguages} locale={state.locale} onValue={(languages) => setDraft((current) => ({ ...current, languages }))} onShare={(shareLanguages) => setDraft((current) => ({ ...current, shareLanguages }))} />
          {failed ? <div className={styles.error} role="alert">{t.failed}</div> : null}
          <button ref={retryButtonRef} type="button" className={styles.save} onClick={save}>{failed ? <RotateCcw size={16} /> : <Save size={16} />}{failed ? t.retry : t.save}</button>
          <button type="button" className={styles.cancel} onClick={() => { focusEditOnExitRef.current = true; setEditing(false); setFailed(false) }}>{t.cancel}</button>
        </div>
      ) : (
        <div className={styles.summary} role="status" aria-live="polite">
          <span>{state.profile.displayName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{state.profile.displayName}</strong><p>{[state.profile.shareFrom ? state.profile.from : null, state.profile.shareLivesIn ? state.profile.livesIn : null, ...(state.profile.shareLanguages ? state.profile.languages : [])].filter(Boolean).join(" · ") || t.private}</p></div>
        </div>
      )}
      <p className={styles.truth}>{t.truth}</p>
    </section>
  )
}

function Field({ label, icon, value, share, locale, onValue, onShare }: { label: string; icon: React.ReactNode; value: string; share: boolean; locale: Locale; onValue(value: string): void; onShare(value: boolean): void }) {
  return (
    <div className={styles.field}>
      <label><span>{icon}{label}<i>{locale === "ko" ? "본인 입력" : "Self-declared"}</i></span><input value={value} onChange={(event) => onValue(event.target.value)} /></label>
      <button type="button" aria-pressed={share} className={share ? styles.consentOn : styles.consent} onClick={() => onShare(!share)}><span>{share ? <Check size={12} /> : null}</span>{locale === "ko" ? "공개하기" : "Show publicly"}</button>
    </div>
  )
}
