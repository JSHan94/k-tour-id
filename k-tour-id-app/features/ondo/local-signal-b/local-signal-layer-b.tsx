"use client"

import type { ChangeEvent, KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { BadgeCheck, ChevronLeft, CircleAlert, ImagePlus, NotebookPen, RotateCcw, Send, ShieldCheck, Trash2, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueNamePresentation } from "@/lib/ondo/venues/display"
import { LocalCheckWalkthroughB, type LocalCheckOutcome } from "../identity-b/local-check-walkthrough-b"
import type { OndoBLocalSignalTag } from "../shared/state/ondo-b-provider"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./local-signal-layer-b.module.css"

const FOCUSABLE = "button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex='-1'])"

const TAGS: ReadonlyArray<{ id: OndoBLocalSignalTag; en: string; ko: string }> = [
  { id: "calm_now", en: "Calm right now", ko: "지금은 여유로워요" },
  { id: "lively_now", en: "Lively right now", ko: "지금은 활기차요" },
  { id: "quick_stop", en: "Good for a quick stop", ko: "빠르게 들르기 좋아요" },
  { id: "welcoming", en: "Welcoming service", ko: "친절하게 맞아줘요" },
]

const COPY = {
  en: {
    close: "Close Local Signal",
    dismiss: "Dismiss Local Signal",
    eyebrow: "FROM THIS OFFICIAL PLACE",
    title: "Add a Local Signal",
    body: "Share what the place feels like right now. A photo can help another traveler recognize the moment.",
    choose: "What did you notice?",
    chooseHelp: "Choose one or more. This is your observation, not an official LOCALDATA fact.",
    note: "Optional local note",
    notePlaceholder: "A short detail that may help another visitor",
    noteHelp: "The note stays in this draft only and is discarded after posting or closing.",
    boundary: "Privacy & availability",
    boundaryBody: "Tags and post time stay on this device. Your note and photo are discarded when this screen closes; nothing is uploaded.",
    person: "Continue to identity check",
    retry: "Retry identity check",
    post: "Post on this device",
    posted: "Local Signal added to this device’s Pulse evidence. Shared Pulse scores and counts do not change.",
    postError: "This device could not save the posted marker. Your exact draft and place remain open.",
    success: "Identity check complete. Your Local Signal is ready to post on this device.",
    cancel: "You declined. Your exact draft and place are unchanged.",
    failure: "The identity check did not complete. Your draft and place are unchanged.",
    unavailable: "Identity check is unavailable. Your draft and place are unchanged.",
    expired: "The identity check expired. Your draft and place are unchanged.",
    alreadyPosted: "Local Pulse evidence for this place already exists on this device. Posting again replaces its tag IDs and post time; it does not change shared counts.",
    photo: "Add a photo",
    photoHelp: "JPEG, PNG, or WebP · up to 8 MB",
    replacePhoto: "Replace photo",
    removePhoto: "Remove photo",
    photoFailed: "The photo could not be prepared.",
    photoRetry: "Retry photo",
  },
  ko: {
    close: "로컬 시그널 닫기",
    dismiss: "로컬 시그널 화면 닫기",
    eyebrow: "이 공식 장소에서",
    title: "로컬 시그널 남기기",
    body: "지금 이 장소의 분위기를 나눠보세요. 사진은 다른 여행자가 순간을 알아보는 데 도움이 돼요.",
    choose: "무엇을 발견했나요?",
    chooseHelp: "하나 이상 골라주세요. 공식 LOCALDATA 사실이 아닌 나의 관찰입니다.",
    note: "선택적 로컬 메모",
    notePlaceholder: "다른 방문자에게 도움이 될 짧은 정보",
    noteHelp: "메모는 작성 중에만 남고 게시하거나 닫으면 폐기됩니다.",
    boundary: "개인정보와 이용 범위",
    boundaryBody: "태그와 게시 시각만 기기에 남아요. 메모와 사진은 화면을 닫으면 폐기되며 업로드하지 않습니다.",
    person: "본인 확인 계속",
    retry: "본인 확인 다시 시도",
    post: "이 기기에 게시",
    posted: "이 기기의 Pulse 근거에 로컬 시그널을 추가했어요. 공유 Pulse 점수와 신호 수는 바뀌지 않습니다.",
    postError: "이 기기에 게시 표시를 저장하지 못했어요. 정확한 작성 내용과 장소는 그대로 열려 있습니다.",
    success: "본인 확인을 마쳤어요. 이 기기에 로컬 시그널을 게시할 수 있어요.",
    cancel: "거절했어요. 정확한 작성 내용과 장소는 그대로입니다.",
    failure: "본인 확인을 완료하지 못했어요. 작성 내용과 장소는 그대로입니다.",
    unavailable: "본인 확인을 이용할 수 없어요. 작성 내용과 장소는 그대로입니다.",
    expired: "본인 확인이 만료됐어요. 작성 내용과 장소는 그대로입니다.",
    alreadyPosted: "이 장소의 로컬 Pulse 근거가 이미 기기에 있습니다. 다시 게시하면 태그 ID와 시각을 교체하며 공유 신호 수는 바뀌지 않아요.",
    photo: "사진 추가",
    photoHelp: "JPEG, PNG, WebP · 최대 8MB",
    replacePhoto: "사진 교체",
    removePhoto: "사진 삭제",
    photoFailed: "사진을 준비하지 못했어요.",
    photoRetry: "사진 다시 시도",
  },
} as const

export function LocalSignalLayerB() {
  const { state, actions } = useOndoB()
  const [walkthroughOpen, setWalkthroughOpen] = useState(false)
  const [personReady, setPersonReady] = useState(false)
  const [gateReturn, setGateReturn] = useState<LocalCheckOutcome | null>(null)
  const [postFailed, setPostFailed] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [photoFailedOnce, setPhotoFailedOnce] = useState(false)
  const layerRef = useRef<HTMLElement>(null)
  const checkRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoUrlRef = useRef<string | null>(null)
  const draft = state.localSignalDraft
  const venue = draft ? canonicalMapVenueById(draft.venueId) : undefined
  const locale = state.locale
  const copy = COPY[locale]
  const open = state.tab === "ondo" && Boolean(draft && venue && state.surface.kind === "venue" && state.surface.venueId === draft.venueId)
  useModalIsolation(open, layerRef)

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => layerRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => () => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = null
  }, [])

  if (!open || !draft || !venue) return null
  const activeDraft = draft
  const activeVenue = venue
  const name = venueNamePresentation(venue.name.ko, locale)
  const alreadyPosted = state.localSignalPostedVenueIds.includes(venue.id)

  function returnToPlace() {
    removePhoto()
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
    actions.updateLocalSignalDraft({
      tags: activeDraft.tags.includes(tag) ? activeDraft.tags.filter((item) => item !== tag) : [...activeDraft.tags, tag],
      note: activeDraft.note,
    })
  }

  function preparePhoto(file: File, allowQaFailure = true) {
    setPhotoFile(file)
    releasePhotoUrl()
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 8 * 1024 * 1024) {
      setPhotoFailed(true)
      setPhotoUrl(null)
      return
    }
    if (allowQaFailure && window.__ONDO_B_QA__?.localSignalPhoto === "failure" && !photoFailedOnce) {
      setPhotoFailedOnce(true)
      setPhotoFailed(true)
      setPhotoUrl(null)
      return
    }
    setPhotoFailed(false)
    const url = URL.createObjectURL(file)
    photoUrlRef.current = url
    setPhotoUrl(url)
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) preparePhoto(file)
    event.target.value = ""
  }

  function removePhoto() {
    setPhotoFile(null)
    releasePhotoUrl()
    setPhotoFailed(false)
  }

  function releasePhotoUrl() {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = null
    setPhotoUrl(null)
  }

  function handleGateReturn(outcome: LocalCheckOutcome) {
    setWalkthroughOpen(false)
    setGateReturn(outcome)
    setPersonReady(outcome === "success")
    window.requestAnimationFrame(() => checkRef.current?.focus({ preventScroll: true }))
  }

  function post() {
    if (!personReady || activeDraft.tags.length === 0) return
    if (!actions.markLocalSignalPosted(activeVenue.id)) {
      setPostFailed(true)
      return
    }
    setPostFailed(false)
    removePhoto()
    actions.closeLocalSignal()
    actions.notify(copy.posted)
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
          data-venue-id={venue.id}
          onKeyDown={handleKeyDown}
        >
          <header>
            <button ref={closeRef} type="button" onClick={returnToPlace} aria-label={copy.close}><ChevronLeft size={20} aria-hidden="true" /></button>
            <strong>Local Signal</strong>
            <button type="button" onClick={returnToPlace} aria-label={copy.dismiss}><X size={20} aria-hidden="true" /></button>
          </header>
          <div className={styles.body}>
            <div className={styles.mark}><NotebookPen size={24} aria-hidden="true" /></div>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h2 id="local-signal-title">{copy.title}</h2>
            <p className={styles.place}>{name.officialName}<span>{name.transliteration}</span></p>
            <p className={styles.lead}>{copy.body}</p>

            <div className={styles.draft} data-testid="local-signal-draft" data-gate-return={gateReturn ?? "none"}>
              <fieldset>
                <legend>{copy.choose}</legend>
                <p>{copy.chooseHelp}</p>
                <div className={styles.tags}>
                  {TAGS.map((tag) => (
                    <button key={tag.id} type="button" aria-pressed={draft.tags.includes(tag.id)} onClick={() => toggleTag(tag.id)}>{tag[locale]}</button>
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

              <section className={styles.photo}>
                <div><strong>{copy.photo}</strong><small>{copy.photoHelp}</small></div>
                <input ref={photoInputRef} className={styles.photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={copy.photo} data-testid="local-signal-photo-input" onChange={selectPhoto} />
                {photoUrl ? <figure><img src={photoUrl} alt="" /><figcaption><button type="button" data-testid="local-signal-photo-replace" onClick={() => photoInputRef.current?.click()}><ImagePlus size={16} aria-hidden="true" />{copy.replacePhoto}</button><button type="button" data-testid="local-signal-photo-remove" onClick={removePhoto}><Trash2 size={16} aria-hidden="true" />{copy.removePhoto}</button></figcaption></figure> : null}
                {photoFailed ? <p role="alert">{copy.photoFailed}<button type="button" data-testid="local-signal-photo-retry" onClick={() => { if (photoFile) preparePhoto(photoFile, false) }}><RotateCcw size={16} aria-hidden="true" />{copy.photoRetry}</button></p> : null}
                {!photoUrl && !photoFailed ? <button type="button" className={styles.photoAdd} onClick={() => photoInputRef.current?.click()}><ImagePlus size={17} aria-hidden="true" />{copy.photo}</button> : null}
              </section>

              <section className={styles.truth}>
                <ShieldCheck size={18} aria-hidden="true" />
                <span><strong>{copy.boundary}</strong><small>{copy.boundaryBody}</small></span>
              </section>

              {alreadyPosted ? <p className={styles.already}>{copy.alreadyPosted}</p> : null}
              {gateReturn ? <p className={personReady ? styles.gateSuccess : styles.gateNotice} role="status"><CircleAlert size={16} aria-hidden="true" />{copy[gateReturn]}</p> : null}
              {postFailed ? <p className={styles.error} role="alert">{copy.postError}</p> : null}

              <div className={styles.actions}>
                {personReady ? (
                  <button ref={checkRef} type="button" className={styles.primary} disabled={draft.tags.length === 0} onClick={post}><Send size={18} aria-hidden="true" />{copy.post}</button>
                ) : (
                  <button ref={checkRef} type="button" className={styles.primary} data-testid="local-signal-person-check" onClick={() => setWalkthroughOpen(true)}>
                    {gateReturn ? <RotateCcw size={17} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
                    {gateReturn ? copy.retry : copy.person}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {walkthroughOpen ? (
        <LocalCheckWalkthroughB
          locale={locale}
          check="person"
          origin="local_signal"
          boundarySeen={state.localInteractionBoundarySeen}
          onAcknowledgeBoundary={actions.acknowledgeLocalInteractionBoundary}
          onReturn={handleGateReturn}
        />
      ) : null}
    </>
  )
}
