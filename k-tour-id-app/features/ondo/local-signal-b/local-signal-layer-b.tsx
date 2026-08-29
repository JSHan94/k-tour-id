"use client"

import type { ChangeEvent, KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { BadgeCheck, ChevronLeft, CircleAlert, ImagePlus, NotebookPen, RotateCcw, Send, ShieldCheck, Trash2, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueNamePresentation } from "@/lib/ondo/venues/display"
import {
  abandonPendingBAction,
  B_ACTION_GATE_CANCEL_EVENT,
  B_ACTION_GATE_COMPLETE_EVENT,
  B_ACTION_GATE_READY_EVENT,
  consumePendingBActionAtMutation,
  createBLocalSignalActionReturn,
  finalizeConsumedBAction,
  requestBActionGate,
  restoreBActionGateSession,
  restoreConsumedBActionAfterMutationFailure,
  type BLocalSignalActionReturn,
} from "../identity-b/action-gate-contract-b"
import { useBActivityProfile } from "../identity-b/activity-profile-b-provider"
import { B_DISCOVERY_TRAVERSAL_EVENT } from "../map/b-discovery-history"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import type { OndoBLocalSignalTag } from "../shared/state/ondo-b-provider"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import { readQaRuntime } from "../shared/ui/use-qa-controls"
import styles from "./local-signal-layer-b.module.css"

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex='-1'])"
export const MAX_LOCAL_SIGNAL_PHOTO_BYTES = 10 * 1024 * 1024
const LOCAL_SIGNAL_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
type PhotoError = "photoTypeError" | "photoSizeError" | "photoPrepareError"
type SocialLocale = OndoBLocale
type LocalSignalGateSession = {
  origin: "local_signal"
  venueId: string
  draftNonce: string
  issuedAt: number
  expiresAt: number
  outcome: "success" | "cancel" | "failure" | "unavailable" | "expired"
}

async function decodeLocalSignalPhoto(url: string) {
  const candidateImage = new Image()
  candidateImage.src = url
  await candidateImage.decode()
  if (candidateImage.naturalWidth < 1 || candidateImage.naturalHeight < 1) throw new Error("Photo has no decodable pixels")
}

const TAGS: ReadonlyArray<{ id: OndoBLocalSignalTag } & Record<SocialLocale, string>> = [
  { id: "calm_now", en: "Calm right now", ko: "지금은 여유로워요", ja: "今は落ち着いています" },
  { id: "lively_now", en: "Lively right now", ko: "지금은 활기차요", ja: "今はにぎやかです" },
  { id: "quick_stop", en: "Good for a quick stop", ko: "빠르게 들르기 좋아요", ja: "短時間で立ち寄りやすい" },
  { id: "welcoming", en: "Welcoming service", ko: "친절하게 맞아줘요", ja: "親しみやすい接客" },
]

const COPY = {
  en: {
    close: "Close Local Signal",
    dismiss: "Dismiss Local Signal",
    eyebrow: "AT THIS PLACE",
    title: "Add a Local Signal",
    body: "Capture what this place feels like right now as a private, on-device observation.",
    choose: "What did you notice?",
    chooseHelp: "Choose one or more. This is your observation, not the place source information.",
    note: "Optional local note",
    notePlaceholder: "A short detail for this local observation",
    noteHelp: "The note stays in this draft only and is discarded after posting or closing.",
    boundary: "Privacy & availability",
    boundaryBody: "Tags and post time stay on this device. Your note and photo are discarded when this screen closes; nothing is uploaded.",
    personBoundary: "A session-only confirmation unlocks saving. No account, ID, or credential is created.",
    person: "Confirm for this action",
    retry: "Try confirmation again",
    post: "Save Local Signal on this device",
    update: "Update Local Signal on this device",
    posted: "Local Signal saved on this device. Your selections and time stay in Local Signal history; the public ONDO temperature score, count, level, and ranking do not change.",
    updated: "Local Signal updated on this device. Your selections and time were replaced; the public ONDO temperature score, count, level, and ranking do not change.",
    postError: "Could not save this Local Signal on this device. Your exact draft and place remain open.",
    success: "Confirmation complete. Your Local Signal is ready to save on this device.",
    cancel: "You declined. Your exact draft and place are unchanged.",
    failure: "Confirmation did not complete. Your draft and place are unchanged.",
    unavailable: "Confirmation is unavailable. Your draft and place are unchanged.",
    expired: "Confirmation expired. Your draft and place are unchanged.",
    alreadyPosted: "A Local Signal for this place is already saved on this device. Saving again replaces its selections and time; the public ONDO temperature stays unchanged.",
    photo: "Add a photo",
    photoHelp: "JPEG, PNG, or WebP · up to 10 MB",
    replacePhoto: "Replace photo",
    removePhoto: "Remove photo",
    photoTypeError: "Choose a JPEG, PNG, or WebP photo.",
    photoSizeError: "Choose a photo that is 10 MB or smaller.",
    photoPrepareError: "The photo could not be prepared.",
    photoRetry: "Retry photo",
    photoChooseAnother: "Choose another photo",
    photoAlt: "Local photo preview — kept in this open draft only",
  },
  ko: {
    close: "로컬 시그널 닫기",
    dismiss: "로컬 시그널 화면 닫기",
    eyebrow: "이 장소에서",
    title: "로컬 시그널 남기기",
    body: "지금 이 장소의 분위기를 이 기기에만 남는 관찰로 기록하세요.",
    choose: "무엇을 발견했나요?",
    chooseHelp: "하나 이상 골라주세요. 장소 출처 정보가 아닌 나의 관찰입니다.",
    note: "선택적 로컬 메모",
    notePlaceholder: "이 로컬 관찰을 위한 짧은 메모",
    noteHelp: "메모는 작성 중에만 남고 게시하거나 닫으면 폐기됩니다.",
    boundary: "개인정보와 이용 범위",
    boundaryBody: "태그와 게시 시각만 기기에 남아요. 메모와 사진은 화면을 닫으면 폐기되며 업로드하지 않습니다.",
    personBoundary: "이 화면에서만 유지되는 확인 결과로 저장을 진행합니다. 계정·ID·자격증명을 만들지 않습니다.",
    person: "이 작업 확인",
    retry: "다시 확인",
    post: "이 기기에 로컬 시그널 저장",
    update: "이 기기의 로컬 시그널 업데이트",
    posted: "이 기기에 로컬 시그널을 저장했어요. 선택한 관찰과 시각은 로컬 시그널 기록에만 남고 공개 온도 점수·신호 수·단계·순위는 바뀌지 않습니다.",
    updated: "이 기기의 로컬 시그널을 업데이트했어요. 선택한 관찰과 시각만 교체되며 공개 온도 점수·신호 수·단계·순위는 바뀌지 않습니다.",
    postError: "이 기기에 이 로컬 시그널을 저장하지 못했어요. 정확한 작성 내용과 장소는 그대로 열려 있습니다.",
    success: "확인을 마쳤어요. 이 기기에 로컬 시그널을 저장할 수 있어요.",
    cancel: "거절했어요. 정확한 작성 내용과 장소는 그대로입니다.",
    failure: "확인을 완료하지 못했어요. 작성 내용과 장소는 그대로입니다.",
    unavailable: "확인을 이용할 수 없어요. 작성 내용과 장소는 그대로입니다.",
    expired: "확인이 만료됐어요. 작성 내용과 장소는 그대로입니다.",
    alreadyPosted: "이 장소의 로컬 시그널이 이미 기기에 저장되어 있어요. 다시 저장하면 선택한 관찰과 시각만 교체되며 공개 온도는 바뀌지 않습니다.",
    photo: "사진 추가",
    photoHelp: "JPEG, PNG, WebP · 최대 10MB",
    replacePhoto: "사진 교체",
    removePhoto: "사진 삭제",
    photoTypeError: "JPEG, PNG 또는 WebP 사진을 선택해 주세요.",
    photoSizeError: "10 MB 이하의 사진을 선택해 주세요.",
    photoPrepareError: "사진을 준비하지 못했어요.",
    photoRetry: "사진 다시 시도",
    photoChooseAnother: "다른 사진 선택",
    photoAlt: "로컬 사진 미리보기 — 열린 작성 화면에서만 유지",
  },
  ja: {
    close: "Local Signalを閉じる",
    dismiss: "Local Signal画面を閉じる",
    eyebrow: "この場所で",
    title: "Local Signalを追加",
    body: "今この場所がどんな雰囲気か、この端末だけの観察として記録します。",
    choose: "何に気づきましたか？",
    chooseHelp: "1つ以上選んでください。場所の出典情報ではなく、あなた自身の観察です。",
    note: "任意のローカルメモ",
    notePlaceholder: "このローカル観察のための短いメモ",
    noteHelp: "メモは下書き中だけ保持され、投稿または画面を閉じると破棄されます。",
    boundary: "プライバシーと利用範囲",
    boundaryBody: "タグと投稿時刻だけがこの端末に残ります。メモと写真は画面を閉じると破棄され、アップロードされません。",
    personBoundary: "この画面だけで有効な確認結果で保存を続けます。アカウント、ID、資格情報は作成されません。",
    person: "この操作を確認",
    retry: "もう一度確認",
    post: "この端末にLocal Signalを保存",
    update: "この端末のLocal Signalを更新",
    posted: "この端末にLocal Signalを保存しました。選んだ内容と時刻はLocal Signal履歴だけに残り、公開ONDO温度のスコア・件数・レベル・順位は変わりません。",
    updated: "この端末のLocal Signalを更新しました。選んだ内容と時刻だけが置き換わり、公開ONDO温度のスコア・件数・レベル・順位は変わりません。",
    postError: "この端末にこのLocal Signalを保存できませんでした。下書きと場所はそのまま開いています。",
    success: "確認が完了しました。この端末にLocal Signalを保存できます。",
    cancel: "確認を見送りました。下書きと場所はそのままです。",
    failure: "確認を完了できませんでした。下書きと場所はそのままです。",
    unavailable: "確認を利用できません。下書きと場所はそのままです。",
    expired: "確認の有効期限が切れました。下書きと場所はそのままです。",
    alreadyPosted: "この場所のLocal Signalはすでにこの端末に保存されています。もう一度保存すると選んだ内容と時刻だけが置き換わり、公開ONDO温度は変わりません。",
    photo: "写真を追加",
    photoHelp: "JPEG、PNG、WebP・最大10 MB",
    replacePhoto: "写真を変更",
    removePhoto: "写真を削除",
    photoTypeError: "JPEG、PNG、WebPの写真を選んでください。",
    photoSizeError: "10 MB以下の写真を選んでください。",
    photoPrepareError: "写真を準備できませんでした。",
    photoRetry: "写真をもう一度処理",
    photoChooseAnother: "別の写真を選ぶ",
    photoAlt: "ローカル写真のプレビュー — 開いている下書きにのみ保持",
  },
} as const satisfies Record<SocialLocale, Record<string, string>>

export function LocalSignalLayerB() {
  const { state, actions } = useOndoB()
  const { actions: activityActions } = useBActivityProfile()
  const [draftNonce, setDraftNonce] = useState("")
  const [gateSession, setGateSession] = useState<LocalSignalGateSession | null>(null)
  const [postFailed, setPostFailed] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<PhotoError | null>(null)
  const [photoCanRetry, setPhotoCanRetry] = useState(false)
  const [photoFailedOnce, setPhotoFailedOnce] = useState(false)
  const layerRef = useRef<HTMLElement>(null)
  const checkRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoUrlRef = useRef<string | null>(null)
  const photoPreparationRef = useRef(0)
  const photoSectionRef = useRef<HTMLElement>(null)
  const photoErrorRef = useRef<HTMLParagraphElement>(null)
  const postErrorRef = useRef<HTMLParagraphElement>(null)
  const draft = state.localSignalDraft
  const venue = draft ? canonicalMapVenueById(draft.venueId) : undefined
  const locale = state.locale
  const socialLocale: SocialLocale = locale
  const copy = COPY[socialLocale]
  const open = state.tab === "ondo" && Boolean(draft && venue && state.surface.kind === "venue" && state.surface.venueId === draft.venueId)
  const activeVenueId = open && draft && venue ? venue.id : null
  useModalIsolation(open, layerRef)

  useEffect(() => {
    photoPreparationRef.current += 1
    setGateSession(null)
    setPostFailed(false)
    setPhotoFile(null)
    setPhotoError(null)
    setPhotoCanRetry(false)
    setPhotoFailedOnce(false)
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = null
    setPhotoUrl(null)
    setDraftNonce(activeVenueId ? `${activeVenueId}:${Date.now()}:${Math.random().toString(36).slice(2)}` : "")
  }, [activeVenueId])

  useEffect(() => {
    function returnFromGate(event: Event, outcome: LocalSignalGateSession["outcome"]) {
      const detail = event instanceof CustomEvent ? event.detail as BLocalSignalActionReturn & { gateOutcome?: Exclude<LocalSignalGateSession["outcome"], "success"> } : null
      if (!detail || detail.cta !== "SUBMIT_LOCAL_SIGNAL" || detail.venueId !== activeVenueId) return
      setDraftNonce(detail.draftNonce)
      const restored = restoreBActionGateSession(window.sessionStorage)
      const expiresAt = restored.person.expiresAt ? Date.parse(restored.person.expiresAt) : Date.now()
      setGateSession({ origin: "local_signal", venueId: detail.venueId, draftNonce: detail.draftNonce, issuedAt: Date.now(), expiresAt, outcome: detail.gateOutcome ?? outcome })
      window.requestAnimationFrame(() => checkRef.current?.focus({ preventScroll: true }))
    }
    const complete = (event: Event) => returnFromGate(event, "success")
    const cancel = (event: Event) => returnFromGate(event, "cancel")
    window.addEventListener(B_ACTION_GATE_READY_EVENT, complete)
    window.addEventListener(B_ACTION_GATE_CANCEL_EVENT, cancel)
    return () => {
      window.removeEventListener(B_ACTION_GATE_READY_EVENT, complete)
      window.removeEventListener(B_ACTION_GATE_CANCEL_EVENT, cancel)
    }
  }, [activeVenueId])

  useEffect(() => {
    if (!open) return
    const discardOnTraversal = () => {
      discardPendingSignalAction()
      actions.closeLocalSignal()
    }
    window.addEventListener(B_DISCOVERY_TRAVERSAL_EVENT, discardOnTraversal)
    return () => window.removeEventListener(B_DISCOVERY_TRAVERSAL_EVENT, discardOnTraversal)
  }, [actions, activeVenueId, draftNonce, open])

  useEffect(() => {
    if (!gateSession || gateSession.outcome !== "success") return
    const remaining = gateSession.expiresAt - Date.now()
    if (remaining <= 0) {
      setGateSession((current) => current ? { ...current, outcome: "expired" } : null)
      return
    }
    const timer = window.setTimeout(() => {
      setGateSession((current) => current?.outcome === "success" ? { ...current, outcome: "expired" } : current)
    }, remaining)
    return () => window.clearTimeout(timer)
  }, [gateSession])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => layerRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!postFailed) return
    const frame = window.requestAnimationFrame(() => postErrorRef.current?.scrollIntoView({ block: "nearest" }))
    return () => window.cancelAnimationFrame(frame)
  }, [postFailed])

  useEffect(() => () => {
    photoPreparationRef.current += 1
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = null
  }, [])

  if (!open || !draft || !venue) return null
  const activeDraft = draft
  const activeVenue = venue
  const name = venueNamePresentation(venue.name.ko, locale)
  const alreadyPosted = state.localSignalPostedVenueIds.includes(venue.id)
  const photoFailed = photoError !== null
  const exactGateSession = gateSession
    && gateSession.origin === "local_signal"
    && gateSession.venueId === activeVenue.id
    && gateSession.draftNonce === draftNonce
      ? gateSession
      : null
  const gateReturn = exactGateSession?.outcome ?? null
  const personReady = exactGateSession?.outcome === "success" && exactGateSession.expiresAt > Date.now()
  const signalStage = postFailed ? "post_failed" : personReady ? "ready" : alreadyPosted ? "posted" : gateReturn ?? "draft"
  const photoStage = photoError ?? (photoUrl ? "ready" : "empty")

  function discardPendingSignalAction() {
    const latest = restoreBActionGateSession(window.sessionStorage)
    const pending = latest.pending
    if (pending?.cta === "SUBMIT_LOCAL_SIGNAL"
      && pending.venueId === activeVenueId
      && pending.draftNonce === draftNonce) {
      abandonPendingBAction(window.sessionStorage, pending)
    }
  }

  function returnToPlace() {
    discardPendingSignalAction()
    removePhoto()
    setGateSession(null)
    actions.closeLocalSignal()
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-testid='canonical-local-signal-open']")?.focus({ preventScroll: true }))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      returnToPlace()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (document.activeElement === layerRef.current) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
      return
    }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  function toggleTag(tag: OndoBLocalSignalTag) {
    setPostFailed(false)
    actions.updateLocalSignalDraft({
      tags: activeDraft.tags.includes(tag) ? activeDraft.tags.filter((item) => item !== tag) : [...activeDraft.tags, tag],
      note: activeDraft.note,
    })
  }

  function revealPhotoState() {
    window.requestAnimationFrame(() => {
      if (window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches) {
        photoSectionRef.current?.scrollIntoView({ block: "start" })
      } else {
        photoSectionRef.current?.scrollIntoView({ block: "nearest" })
        photoErrorRef.current?.scrollIntoView({ block: "nearest" })
      }
    })
  }

  async function preparePhoto(file: File, allowQaFailure = true) {
    const preparation = ++photoPreparationRef.current
    if (!LOCAL_SIGNAL_PHOTO_TYPES.has(file.type)) {
      setPhotoFile(file)
      setPhotoCanRetry(false)
      setPhotoError("photoTypeError")
      revealPhotoState()
      return
    }
    if (file.size > MAX_LOCAL_SIGNAL_PHOTO_BYTES) {
      setPhotoFile(file)
      setPhotoCanRetry(false)
      setPhotoError("photoSizeError")
      revealPhotoState()
      return
    }
    if (allowQaFailure && readQaRuntime<{ localSignalPhoto?: "failure" }>()?.localSignalPhoto === "failure" && !photoFailedOnce) {
      setPhotoFile(file)
      setPhotoFailedOnce(true)
      setPhotoCanRetry(true)
      setPhotoError("photoPrepareError")
      revealPhotoState()
      return
    }
    const previousUrl = photoUrlRef.current
    let candidateUrl: string
    try {
      candidateUrl = URL.createObjectURL(file)
    } catch {
      setPhotoFile(file)
      setPhotoCanRetry(false)
      setPhotoError("photoPrepareError")
      revealPhotoState()
      return
    }
    try {
      await decodeLocalSignalPhoto(candidateUrl)
    } catch {
      URL.revokeObjectURL(candidateUrl)
      if (preparation !== photoPreparationRef.current) return
      setPhotoFile(file)
      setPhotoCanRetry(false)
      setPhotoError("photoPrepareError")
      revealPhotoState()
      return
    }
    if (preparation !== photoPreparationRef.current) {
      URL.revokeObjectURL(candidateUrl)
      return
    }
    setPhotoFile(file)
    setPhotoCanRetry(false)
    setPhotoError(null)
    photoUrlRef.current = candidateUrl
    setPhotoUrl(candidateUrl)
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    revealPhotoState()
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void preparePhoto(file)
    event.target.value = ""
  }

  function removePhoto() {
    photoPreparationRef.current += 1
    setPhotoFile(null)
    releasePhotoUrl()
    setPhotoCanRetry(false)
    setPhotoError(null)
    revealPhotoState()
  }

  function releasePhotoUrl() {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = null
    setPhotoUrl(null)
  }

  function beginGate() {
    setPostFailed(false)
    const envelope = createBLocalSignalActionReturn({ venueId: activeVenue.id, draftNonce, tags: activeDraft.tags, note: activeDraft.note })
    if (!requestBActionGate(envelope)) {
      const issuedAt = Date.now()
      setGateSession({ origin: "local_signal", venueId: activeVenue.id, draftNonce, issuedAt, expiresAt: issuedAt, outcome: "failure" })
    }
  }

  function post() {
    if (!exactGateSession || exactGateSession.expiresAt <= Date.now()) {
      setGateSession((current) => current ? { ...current, outcome: "expired" } : null)
      return
    }
    if (exactGateSession.outcome !== "success" || activeDraft.tags.length === 0) return
    const actionSession = restoreBActionGateSession(window.sessionStorage)
    const pending = actionSession.pending
    if (!pending || pending.cta !== "SUBMIT_LOCAL_SIGNAL" || pending.venueId !== activeVenue.id || pending.draftNonce !== draftNonce) {
      setPostFailed(true)
      return
    }
    const satisfied = new Set<"account" | "person">()
    if (state.account === "ACC-ACTIVE") satisfied.add("account")
    if (actionSession.person.status === "eligible" && actionSession.person.expiresAt && Date.parse(actionSession.person.expiresAt) > Date.now()) satisfied.add("person")
    const consumed = consumePendingBActionAtMutation(window.sessionStorage, pending, satisfied)
    if (!consumed) {
      setPostFailed(true)
      return
    }
    if (!actions.markLocalSignalPosted(activeVenue.id)) {
      restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed)
      setPostFailed(true)
      return
    }
    setPostFailed(false)
    activityActions.recordContribution(`contribution:${activeVenue.id}:${draftNonce}`)
    finalizeConsumedBAction(window.sessionStorage, consumed)
    window.dispatchEvent(new CustomEvent(B_ACTION_GATE_COMPLETE_EVENT, { detail: consumed }))
    removePhoto()
    actions.closeLocalSignal()
    actions.notify(alreadyPosted ? copy.updated : copy.posted)
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-testid='canonical-local-signal-open']")?.focus({ preventScroll: true }))
  }

  return (
    <>
      <div className={styles.backdrop}>
        <section
          ref={layerRef}
          className={styles.layer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-signal-title"
          tabIndex={-1}
          data-testid="ondo-b-local-signal"
          data-modal-layer-priority="50"
          data-venue-id={venue.id}
          data-visual-direction="apple-contribution-strava"
          data-signal-stage={signalStage}
          data-photo-stage={photoStage}
          onKeyDown={handleKeyDown}
        >
          <header>
            <button ref={closeRef} type="button" onClick={returnToPlace} aria-label={copy.close}><ChevronLeft size={20} aria-hidden="true" /></button>
            <strong>Local Signal</strong>
            <button type="button" onClick={returnToPlace} aria-label={copy.dismiss}><X size={20} aria-hidden="true" /></button>
          </header>
          <div className={styles.body}>
            <div className={styles.intro}>
              <div className={styles.mark}><NotebookPen size={24} aria-hidden="true" /></div>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h2 id="local-signal-title">{copy.title}</h2>
              <p className={styles.place}>{name.officialName}<span>{name.transliteration}</span></p>
              <p className={styles.lead}>{copy.body}</p>
            </div>

            <div className={styles.draft} data-testid="local-signal-draft" data-gate-return={gateReturn ?? "none"}>
              <div className={styles.observation}>
                <fieldset>
                  <legend>{copy.choose}</legend>
                  <p>{copy.chooseHelp}</p>
                  <div className={styles.tags}>
                    {TAGS.map((tag) => (
                      <button key={tag.id} type="button" aria-pressed={draft.tags.includes(tag.id)} onClick={() => toggleTag(tag.id)}>{tag[socialLocale]}</button>
                    ))}
                  </div>
                </fieldset>

                <label className={styles.note}>
                  <span>{copy.note}</span>
                  <textarea
                    maxLength={240}
                    value={draft.note}
                    aria-label={copy.note}
                    placeholder={copy.notePlaceholder}
                    onChange={(event) => actions.updateLocalSignalDraft({ tags: draft.tags, note: event.target.value })}
                  />
                  <small>{copy.noteHelp} · {draft.note.length}/240</small>
                </label>
              </div>

              <div className={styles.completion}>
                <section ref={photoSectionRef} className={styles.photo} data-photo-stage={photoStage}>
                <div><strong>{copy.photo}</strong><small>{copy.photoHelp}</small></div>
                <input ref={photoInputRef} className={styles.photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={copy.photo} data-testid="local-signal-photo-input" tabIndex={-1} onChange={selectPhoto} />
                {photoUrl ? <figure role="status"><img src={photoUrl} alt={copy.photoAlt} /><figcaption><button type="button" data-testid="local-signal-photo-replace" onClick={() => photoInputRef.current?.click()}><ImagePlus size={16} aria-hidden="true" />{copy.replacePhoto}</button><button type="button" data-testid="local-signal-photo-remove" onClick={removePhoto}><Trash2 size={16} aria-hidden="true" />{copy.removePhoto}</button></figcaption></figure> : null}
                    {photoError ? <p ref={photoErrorRef} role="alert" data-testid="local-signal-photo-error" data-error={photoError}>{copy[photoError]}{photoError === "photoPrepareError" && photoCanRetry ? <button type="button" data-testid="local-signal-photo-retry" onClick={() => { if (photoFile) void preparePhoto(photoFile, false) }}><RotateCcw size={16} aria-hidden="true" />{copy.photoRetry}</button> : <button type="button" data-testid="local-signal-photo-choose-another" onClick={() => photoInputRef.current?.click()}><ImagePlus size={16} aria-hidden="true" />{copy.photoChooseAnother}</button>}</p> : null}
                {!photoUrl && !photoFailed ? <button type="button" className={styles.photoAdd} onClick={() => photoInputRef.current?.click()}><ImagePlus size={17} aria-hidden="true" />{copy.photo}</button> : null}
                </section>

                <section className={styles.truth}>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span><strong>{copy.boundary}</strong><small>{copy.boundaryBody}</small></span>
                </section>

                <p className={styles.personBoundary}>{copy.personBoundary}</p>

                {alreadyPosted ? <p className={styles.already}>{copy.alreadyPosted}</p> : null}
                {gateReturn ? <p className={personReady ? styles.gateSuccess : styles.gateNotice} role="status"><CircleAlert size={16} aria-hidden="true" />{copy[gateReturn]}</p> : null}
                {postFailed ? <p ref={postErrorRef} className={styles.error} role="alert" data-testid="local-signal-post-error">{copy.postError}</p> : null}

                <div className={styles.actions}>
                  {personReady ? (
                    <button ref={checkRef} type="button" className={styles.primary} data-testid="local-signal-post" disabled={draft.tags.length === 0} onClick={post}><Send size={18} aria-hidden="true" />{alreadyPosted ? copy.update : copy.post}</button>
                  ) : (
                    <button ref={checkRef} type="button" className={styles.primary} data-testid="local-signal-person-check" disabled={draft.tags.length === 0} onClick={beginGate}>
                      {gateReturn ? <RotateCcw size={17} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
                      {gateReturn ? copy.retry : copy.person}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

    </>
  )
}
