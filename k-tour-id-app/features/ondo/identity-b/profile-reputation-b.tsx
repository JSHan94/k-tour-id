"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Footprints,
  Globe2,
  HandHeart,
  LockKeyhole,
  MapPin,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
  Stamp,
  UsersRound,
} from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { readQaRuntime } from "../shared/ui/use-qa-controls"
import { useBActivityProfile, type BActivityProfile, type BProfileField, type BReputation } from "./activity-profile-b-provider"
import styles from "./profile-reputation-b.module.css"

type Props = {
  locale: OndoBLocale
  accountActive: boolean
  personVerified: boolean
}

const COPY = {
  en: {
    profileTitle: "Travel profile",
    private: "Private by default",
    partial: "Selected details only",
    edit: "Edit",
    locked: "Create an account only when a save, Table or payment needs it. Then you can choose what appears here.",
    name: "Display name",
    from: "From",
    lives: "Lives in",
    languages: "Languages",
    include: "Show",
    exclude: "Hide",
    save: "Save profile",
    retry: "Try saving again",
    cancel: "Cancel",
    failed: "Couldn’t save. Your previous profile is unchanged.",
    boundary: "Self-declared · this tab only · never copied from an identity check",
    activityTitle: "Travel history",
    activityNote: "Four separate signals — never one score",
    identity: "Person",
    visit: "Visits",
    contribution: "Tips",
    meetup: "Tables",
    noHistory: "Not yet",
    ready: "Ready",
    one: "One",
    several: "Several",
    historyBoundary: "On-device activity only. It does not rate character, safety or expertise.",
    stampTitle: "Journey stamps",
    stampBody: "A visit record — not payment — adds one stamp.",
    milestone: "10th place reached",
    milestoneBody: "Your optional souvenir is ready in Labs.",
    openMilestone: "View souvenir",
    progress: (stamps: number) => `${stamps} of 10 visit stamps`,
  },
  ko: {
    profileTitle: "여행 프로필",
    private: "기본 비공개",
    partial: "선택한 정보만 표시",
    edit: "편집",
    locked: "저장·Table·결제에 필요할 때만 계정을 준비하세요. 그다음 여기에 보일 정보를 직접 고를 수 있어요.",
    name: "표시 이름",
    from: "출신",
    lives: "거주지",
    languages: "사용 언어",
    include: "표시",
    exclude: "숨김",
    save: "프로필 저장",
    retry: "다시 저장",
    cancel: "취소",
    failed: "저장하지 못했어요. 이전 프로필은 그대로입니다.",
    boundary: "본인 입력 · 이 탭에만 저장 · 본인 확인 정보에서 복사하지 않음",
    activityTitle: "여행 이력",
    activityNote: "하나의 점수가 아닌 네 개의 독립 신호",
    identity: "본인",
    visit: "방문",
    contribution: "팁",
    meetup: "Table",
    noHistory: "아직 없음",
    ready: "준비됨",
    one: "1회",
    several: "여러 번",
    historyBoundary: "이 기기의 활동만 표시하며 성품·안전·전문성을 평가하지 않습니다.",
    stampTitle: "여행 스탬프",
    stampBody: "결제가 아닌 방문 기록이 스탬프 하나를 더합니다.",
    milestone: "열 번째 장소 도착",
    milestoneBody: "선택형 기념품이 Labs에 준비됐어요.",
    openMilestone: "기념품 보기",
    progress: (stamps: number) => `방문 스탬프 10개 중 ${stamps}개`,
  },
  ja: {
    profileTitle: "旅行プロフィール",
    private: "初期設定は非公開",
    partial: "選んだ情報だけを表示",
    edit: "編集",
    locked: "保存・Table・支払いで必要になったときだけアカウントを準備し、表示する情報を自分で選べます。",
    name: "表示名",
    from: "出身",
    lives: "居住地",
    languages: "使用言語",
    include: "表示",
    exclude: "非表示",
    save: "プロフィールを保存",
    retry: "もう一度保存",
    cancel: "キャンセル",
    failed: "保存できませんでした。以前のプロフィールは変更されていません。",
    boundary: "自己申告 · このタブだけ · 本人確認の情報はコピーしません",
    activityTitle: "旅の履歴",
    activityNote: "ひとつの点数にせず、4つのシグナルを分離",
    identity: "本人",
    visit: "訪問",
    contribution: "旅のヒント",
    meetup: "Table",
    noHistory: "まだなし",
    ready: "準備済み",
    one: "1件",
    several: "複数",
    historyBoundary: "この端末の活動だけを表示し、人柄、安全性、専門性を評価しません。",
    stampTitle: "旅のスタンプ",
    stampBody: "支払いではなく、訪問記録によってスタンプが1つ増えます。",
    milestone: "10か所目に到達",
    milestoneBody: "任意の記念アイテムをLabsで確認できます。",
    openMilestone: "記念アイテムを見る",
    progress: (stamps: number) => `訪問スタンプ10個中${stamps}個`,
  },
} as const

type Draft = {
  displayName: string
  from: string
  livesIn: string
  languages: string
  shareFrom: boolean
  shareLivesIn: boolean
  shareLanguages: boolean
}

function draftFrom(profile: BActivityProfile): Draft {
  return {
    displayName: profile.displayName,
    from: profile.from.value,
    livesIn: profile.livesIn.value,
    languages: profile.languages.value.join(", "),
    shareFrom: profile.from.consent,
    shareLivesIn: profile.livesIn.consent,
    shareLanguages: profile.languages.consent,
  }
}

function profileFrom(draft: Draft): BActivityProfile {
  return {
    displayName: draft.displayName,
    from: { value: draft.from, consent: draft.shareFrom },
    livesIn: { value: draft.livesIn, consent: draft.shareLivesIn },
    languages: { value: draft.languages.split(",").map((item) => item.trim()).filter(Boolean), consent: draft.shareLanguages },
  }
}

function axisLevel(axis: "identity" | keyof BReputation, value: string) {
  if (axis === "identity") return value === "verified" ? 3 : 0
  if (value === "new") return 0
  if (value === "recent" || value === "helpful" || value === "reliable") return 2
  return 3
}

export function ProfileReputationB({ locale, accountActive, personVerified }: Props) {
  const { state, actions } = useBActivityProfile()
  const { actions: ondoActions } = useOndoB()
  const copy = COPY[locale]
  const [editing, setEditing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [draft, setDraft] = useState(() => draftFrom(state.profile))
  const editRef = useRef<HTMLButtonElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const retryRef = useRef<HTMLButtonElement>(null)
  const failConsumedRef = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(draftFrom(state.profile))
  }, [editing, state.profile])

  useEffect(() => {
    if (editing) window.requestAnimationFrame(() => nameRef.current?.focus({ preventScroll: true }))
  }, [editing])

  const visibleDetails = useMemo(() => [
    state.profile.from.consent && state.profile.from.value ? state.profile.from.value : null,
    state.profile.livesIn.consent && state.profile.livesIn.value ? state.profile.livesIn.value : null,
    ...(state.profile.languages.consent ? state.profile.languages.value : []),
  ].filter(Boolean) as string[], [state.profile])
  const partial = visibleDetails.length > 0

  function closeEditor() {
    setEditing(false)
    setFailed(false)
    setDraft(draftFrom(state.profile))
    window.requestAnimationFrame(() => editRef.current?.focus({ preventScroll: true }))
  }

  function saveProfile() {
    const qa = readQaRuntime<{ profile?: "failure" }>()
    const injectedFailure = qa?.profile === "failure" && !failConsumedRef.current
    if (injectedFailure) {
      failConsumedRef.current = true
      if (qa) delete qa.profile
      setFailed(true)
      window.requestAnimationFrame(() => retryRef.current?.focus({ preventScroll: true }))
      return
    }
    if (!actions.updateProfile(profileFrom(draft))) {
      setFailed(true)
      window.requestAnimationFrame(() => retryRef.current?.focus({ preventScroll: true }))
      return
    }
    setFailed(false)
    setEditing(false)
    window.requestAnimationFrame(() => editRef.current?.focus({ preventScroll: true }))
  }

  const axes = [
    { id: "identity" as const, label: copy.identity, value: personVerified ? "verified" : "new", icon: BadgeCheck, text: personVerified ? copy.ready : copy.noHistory },
    { id: "visit" as const, label: copy.visit, value: state.reputation.visit, icon: Footprints, text: state.reputation.visit === "new" ? copy.noHistory : state.reputation.visit === "recent" ? copy.one : copy.several },
    { id: "contribution" as const, label: copy.contribution, value: state.reputation.contribution, icon: HandHeart, text: state.reputation.contribution === "new" ? copy.noHistory : state.reputation.contribution === "helpful" ? copy.one : copy.several },
    { id: "meetup" as const, label: copy.meetup, value: state.reputation.meetup, icon: UsersRound, text: state.reputation.meetup === "new" ? copy.noHistory : state.reputation.meetup === "reliable" ? copy.one : copy.several },
  ]

  return (
    <section className={styles.root} data-testid="ondo-b-profile-activity">
      <article className={styles.profileCard} data-testid="ondo-profile-panel" data-state={partial ? "partial" : "private"}>
        <header className={styles.cardHeader}>
          <div className={styles.headingIcon}><LockKeyhole size={18} aria-hidden="true" /></div>
          <div><h2>{copy.profileTitle}</h2><p>{partial ? copy.partial : copy.private}</p></div>
          {accountActive && !editing ? <button ref={editRef} type="button" className={styles.editButton} onClick={() => setEditing(true)}><Pencil size={15} aria-hidden="true" />{copy.edit}</button> : null}
        </header>

        {!accountActive ? (
          <div className={styles.locked}><LockKeyhole size={20} aria-hidden="true" /><p>{copy.locked}</p></div>
        ) : editing ? (
          <div className={styles.form}>
            <label className={styles.nameField}><span>{copy.name}</span><input ref={nameRef} value={draft.displayName} maxLength={40} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} /></label>
            <ConsentField locale={locale} label={copy.from} icon={<Globe2 size={16} aria-hidden="true" />} value={draft.from} consent={draft.shareFrom} onValue={(from) => setDraft((current) => ({ ...current, from }))} onConsent={(shareFrom) => setDraft((current) => ({ ...current, shareFrom }))} />
            <ConsentField locale={locale} label={copy.lives} icon={<MapPin size={16} aria-hidden="true" />} value={draft.livesIn} consent={draft.shareLivesIn} onValue={(livesIn) => setDraft((current) => ({ ...current, livesIn }))} onConsent={(shareLivesIn) => setDraft((current) => ({ ...current, shareLivesIn }))} />
            <ConsentField locale={locale} label={copy.languages} icon={<Globe2 size={16} aria-hidden="true" />} value={draft.languages} consent={draft.shareLanguages} onValue={(languages) => setDraft((current) => ({ ...current, languages }))} onConsent={(shareLanguages) => setDraft((current) => ({ ...current, shareLanguages }))} />
            {failed ? <p className={styles.error} role="alert">{copy.failed}</p> : null}
            <div className={styles.formActions}>
              <button ref={retryRef} type="button" className={styles.saveButton} onClick={saveProfile}>{failed ? <RotateCcw size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{failed ? copy.retry : copy.save}</button>
              <button type="button" className={styles.cancelButton} onClick={closeEditor}>{copy.cancel}</button>
            </div>
          </div>
        ) : (
          <div className={styles.profileSummary} role="status" aria-live="polite">
            <span className={styles.avatar} aria-hidden="true">{state.profile.displayName.slice(0, 1).toUpperCase()}</span>
            <div><strong>{state.profile.displayName}</strong><p>{visibleDetails.join(" · ") || copy.private}</p></div>
          </div>
        )}
        <p className={styles.boundary}>{copy.boundary}</p>
      </article>

      <article className={styles.historyCard} data-testid="ondo-trust-panel">
        <header className={styles.cardHeader}>
          <div className={styles.headingIcon}><Sparkles size={18} aria-hidden="true" /></div>
          <div><h2>{copy.activityTitle}</h2><p>{copy.activityNote}</p></div>
        </header>
        <div className={styles.axes}>
          {axes.map((axis) => {
            const Icon = axis.icon
            const level = axisLevel(axis.id, axis.value)
            return (
              <div key={axis.id} className={styles.axis} data-axis={axis.id}>
                <Icon size={18} aria-hidden="true" />
                <div><span><strong>{axis.label}</strong><small>{axis.text}</small></span><div className={styles.axisBars} role="img" aria-label={`${axis.label}: ${axis.text}`}>{[1, 2, 3].map((unit) => <i key={unit} data-filled={unit <= level} />)}</div></div>
              </div>
            )
          })}
        </div>
        <p className={styles.boundary}>{copy.historyBoundary}</p>
      </article>

      <article className={styles.stampCard} data-testid="ondo-b-stamp-milestone" data-stamps={state.stamps}>
        <div className={styles.stampLead}>
          <div className={styles.stampIcon}><Stamp size={21} aria-hidden="true" /></div>
          <div><h2>{state.stamps === 10 ? copy.milestone : copy.stampTitle}</h2><p>{state.stamps === 10 ? copy.milestoneBody : copy.stampBody}</p></div>
        </div>
        <div className={styles.stampProgress} role="img" aria-label={copy.progress(state.stamps)}>
          {Array.from({ length: 10 }, (_, index) => <i key={index} data-filled={index < state.stamps}>{index < state.stamps ? <Check size={11} aria-hidden="true" /> : null}</i>)}
        </div>
        <strong className={styles.stampCount}>{state.stamps}<span>/10</span></strong>
        {state.stamps === 10 ? <button type="button" data-testid="open-labs-milestone" onClick={() => ondoActions.setSurface({ kind: "labs" })}>{copy.openMilestone}<ChevronRight size={17} aria-hidden="true" /></button> : null}
      </article>
    </section>
  )
}

function ConsentField({ locale, label, icon, value, consent, onValue, onConsent }: {
  locale: OndoBLocale
  label: string
  icon: React.ReactNode
  value: string
  consent: boolean
  onValue(value: string): void
  onConsent(value: boolean): void
}) {
  const copy = COPY[locale]
  const toggleLabel = locale === "ko"
    ? `${label}: ${consent ? "표시 중. 숨기기" : "숨김. 표시하기"}`
    : locale === "ja"
      ? `${label}: ${consent ? "表示中。非表示にする" : "非表示。表示する"}`
      : `${label}: ${consent ? "shown. Hide" : "hidden. Show"}`
  return (
    <label className={styles.consentField}>
      <span className={styles.fieldLabel}>{icon}{label}</span>
      <input value={value} maxLength={80} onChange={(event) => onValue(event.target.value)} />
      <button type="button" role="switch" aria-checked={consent} aria-label={toggleLabel} onClick={() => onConsent(!consent)}><i aria-hidden="true"><Check size={10} /></i><span>{consent ? copy.include : copy.exclude}</span></button>
    </label>
  )
}
