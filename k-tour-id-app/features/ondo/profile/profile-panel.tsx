"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Edit3, Globe2, Lock, MapPin, RotateCcw, Save, UserRound } from "lucide-react"
import type { Locale } from "../contracts/domain"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./profile.module.css"

const COPY = {
  en: {
    title: "Browser-local profile preview",
    private: "Private in this browser session by default",
    partial: "Selected fields included in this browser preview",
    edit: "Edit profile preview",
    account: "Create a local account preview from a save or Table action before editing this browser-local profile preview.",
    name: "Display name",
    from: "From",
    lives: "Lives in",
    languages: "Languages",
    self: "Self-declared",
    save: "Save profile preview",
    cancel: "Cancel preview editing",
    failed: "Profile preview changes were not saved. Your previous browser-local preview is unchanged and nothing was published.",
    retry: "Try saving preview again",
    truth: "Identity-check nationality is never copied here. Every previewed location and language is self-declared and stays in this browser session. Nothing is published or sent.",
  },
  ko: {
    title: "브라우저 로컬 프로필 미리보기",
    private: "이 브라우저 세션에서는 기본 비공개",
    partial: "선택한 필드가 이 브라우저 미리보기에 포함됨",
    edit: "프로필 미리보기 편집",
    account: "저장이나 Table 행동에서 로컬 계정 미리보기를 만든 뒤 이 브라우저 로컬 프로필 미리보기를 편집할 수 있어요.",
    name: "표시 이름",
    from: "출신",
    lives: "거주지",
    languages: "사용 언어",
    self: "본인 입력",
    save: "프로필 미리보기 저장",
    cancel: "미리보기 편집 취소",
    failed: "프로필 미리보기 변경을 저장하지 못했어요. 기존 브라우저 로컬 미리보기는 바뀌지 않았고 아무것도 공개되지 않았습니다.",
    retry: "미리보기 저장 다시 시도",
    truth: "본인 확인에 사용한 국적은 여기로 복사하지 않습니다. 미리보기에 포함한 위치와 언어는 각각 본인이 입력한 값이며 이 브라우저 세션에만 남습니다. 아무것도 공개하거나 전송하지 않습니다.",
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
    actions.notify(state.locale === "ko" ? "이 브라우저에 저장했어요. 이 세션에만 남고 공개되지 않아요." : "Saved in this browser. It stays in this session and is not published.")
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
          <Field id="profile-from" label={t.from} description={t.self} icon={<Globe2 size={15} />} value={draft.from} share={draft.shareFrom} locale={state.locale} onValue={(from) => setDraft((current) => ({ ...current, from }))} onShare={(shareFrom) => setDraft((current) => ({ ...current, shareFrom }))} />
          <Field id="profile-lives-in" label={t.lives} description={t.self} icon={<MapPin size={15} />} value={draft.livesIn} share={draft.shareLivesIn} locale={state.locale} onValue={(livesIn) => setDraft((current) => ({ ...current, livesIn }))} onShare={(shareLivesIn) => setDraft((current) => ({ ...current, shareLivesIn }))} />
          <Field id="profile-languages" label={t.languages} description={t.self} icon={<Globe2 size={15} />} value={draft.languages} share={draft.shareLanguages} locale={state.locale} onValue={(languages) => setDraft((current) => ({ ...current, languages }))} onShare={(shareLanguages) => setDraft((current) => ({ ...current, shareLanguages }))} />
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

function Field({ id, label, description, icon, value, share, locale, onValue, onShare }: { id: string; label: string; description: string; icon: React.ReactNode; value: string; share: boolean; locale: Locale; onValue(value: string): void; onShare(value: boolean): void }) {
  const toggleLabel = locale === "ko"
    ? share ? `${label}: 브라우저 미리보기에 포함됨. ${label} 제외하기` : `${label}: 브라우저 미리보기에서 제외됨. ${label} 포함하기`
    : share ? `${label}: included in browser preview. Remove ${label} from preview` : `${label}: excluded from browser preview. Include ${label} in preview`
  const toggleText = locale === "ko"
    ? share ? "미리보기에 포함 · 제외하기" : "미리보기에서 제외 · 포함하기"
    : share ? "Included in preview · Remove" : "Excluded from preview · Include"

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>{icon}<span>{label}</span></label>
      <p id={`${id}-description`} className={styles.selfDeclared}>{description}</p>
      <input id={id} aria-describedby={`${id}-description`} value={value} onChange={(event) => onValue(event.target.value)} />
      <button type="button" aria-label={toggleLabel} aria-pressed={share} className={share ? styles.consentOn : styles.consent} onClick={() => onShare(!share)}><span aria-hidden="true">{share ? <Check size={12} /> : null}</span><span>{toggleText}</span></button>
    </div>
  )
}
