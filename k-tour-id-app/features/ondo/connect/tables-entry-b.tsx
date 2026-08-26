"use client"

import type { ChangeEvent, KeyboardEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, CalendarClock, Camera, Check, ChevronRight, CircleDollarSign, Flag, ImagePlus, Languages, MapPin, MessageCircle, RotateCcw, Send, ShieldCheck, Star, UserRoundX, UsersRound, Utensils, X } from "lucide-react"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { venueDistrictLabel, venueNamePresentation } from "@/lib/ondo/venues/display"
import { After19JitB } from "../after19/after19-jit-b"
import type { BReturnToEnvelope } from "../contracts/return-to-b"
import { createBReturnTo } from "../contracts/return-to-b"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { focusFirstAvailableDestination } from "../shared/ui/focus-destination"
import { useModalIsolation } from "../shared/ui/use-modal-isolation"
import styles from "./pulse-table-b.module.css"

export const TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"
export const ACTIVE_TABLE_ID = "table-seoul-night-bites"
export const ONDO_OPEN_TABLE_EVENT = "ondo:b:open-table"
export const MAX_TABLE_CHAT_IMAGE_BYTES = 10 * 1024 * 1024
const TABLE_CHAT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

type JoinStage = "idle" | "confirm" | "joined" | "chat"
type MessageState = "ready" | "failed"
type ChatMessage = { id: number; text: string; imageUrl: string | null; state: MessageState }
type SocialLocale = OndoBLocale

const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"

const COPY = {
  en: {
    eyebrow: "Upcoming in Seoul",
    title: "Pulse Tables",
    intro: "Small plans anchored to a real place, with the details you need before choosing a seat.",
    truth: "Messages and photos stay in this tab. A confirmed plan is saved to My Korea on this device. Nothing is booked, sent to the venue, or charged.",
    official: "Place record",
    officialBoundary: "An official Korean restaurant licence record confirms the place. The host provides the gathering details.",
    timeLabel: "When",
    time: "Fri, Aug 28 · 20:30 KST",
    menuLabel: "Food plan",
    menu: "Share two savoury plates; order together",
    languageLabel: "Languages",
    language: "Korean + English",
    costLabel: "Expected share",
    cost: "About ₩18,000 each",
    participantsLabel: "Seats",
    participants: "3 joined · 1 left",
    meetingLabel: "Meet",
    meeting: "By the main entrance at 20:20",
    open: "View Table",
    close: "Close Table",
    ageNotice: "19+ Table · eligibility is checked only when you choose to join.",
    draftLabel: "Note for the host",
    draftHint: "Language, seating, or food preference (optional)",
    join: "Join this Table",
    confirmTitle: "Your seat is ready",
    returnTitle: "Your Table, place, and note are unchanged.",
    confirm: "Confirm my seat",
    joinedTitle: "You’re in",
    joinedBody: "The plan is now saved in My Korea on this device.",
    openChat: "Open Table chat",
    chatTitle: "Table chat",
    chatBoundary: "Use this space for the meetup. Messages and photos remain in this tab.",
    compose: "Message the Table",
    attach: "Add photo",
    replacePhoto: "Replace photo",
    removePhoto: "Remove attached photo",
    photoTypeError: "Choose a JPEG, PNG, or WebP photo.",
    photoSizeError: "Choose a photo that is 10 MB or smaller.",
    send: "Send",
    sendFailed: "Message could not be added.",
    retry: "Retry",
    checkIn: "Check in at the meetup",
    checkedIn: "Checked in · 20:20",
    feedbackTitle: "How was the Table?",
    helpful: "Helpful table",
    welcoming: "Welcoming host",
    feedback: "Save feedback",
    feedbackSaved: "Saved in this tab only. No public rating or reputation was created.",
    meetup: "Meetup",
    contribution: "Feedback",
    meetupValue: "Device mark only",
    contributionValue: "Selected here",
    report: "Report",
    reportTitle: "Report this message?",
    reportConfirm: "Record in this tab",
    reportDone: "Report recorded in this tab.",
    block: "Block",
    blocked: "Jae is hidden only in this tab.",
    leave: "Leave",
    leaveTitle: "Leave this Table?",
    leaveConfirm: "Leave Table",
    keep: "Keep my seat",
    cancelSafety: "Cancel",
    stay: "Stay in this Table",
    blockTitle: "Hide Jae in this tab?",
    blockConfirm: "Hide participant",
    blockTarget: "Jae · participant in this Table",
    reportTarget: "Jae’s latest message · Recorded in this tab only; nothing is sent to ONDO or the host.",
    leaveTarget: "Night bites, one shared table",
    undo: "Undo",
    checkInBoundary: "Marks this device only. It does not verify your location or attendance.",
    tableHeader: "Pulse Table",
    tableOpen: "1 seat left",
    tableTitle: "Night bites, one shared table",
    tableSubtitle: "A relaxed Friday meal in Gangnam",
    joinSaveFailed: "My Korea could not save the plan, so you have not joined. Try again.",
    leaveSaveFailed: "My Korea could not remove the plan, so you are still in this Table. Try again.",
    venueUnavailable: "Official venue record unavailable.",
    minMessage: "Let’s meet by the entrance at 20:20.",
    jaeMessage: "English or Korean both work for me.",
    you: "You",
  },
  ko: {
    eyebrow: "서울의 다음 모임",
    title: "펄스 테이블",
    intro: "실제 장소에 연결된 작은 약속을 보고, 참여에 필요한 정보를 한눈에 확인하세요.",
    truth: "메시지와 사진은 이 탭에만 남고, 확정한 계획만 이 기기의 My Korea에 저장돼요. 예약·장소 전송·결제는 일어나지 않습니다.",
    official: "장소 기록",
    officialBoundary: "한국의 공식 음식점 인허가 기록으로 장소를 확인하며, 모임 정보는 호스트가 제공합니다.",
    timeLabel: "시간",
    time: "8월 28일 금요일 · 20:30 KST",
    menuLabel: "음식 계획",
    menu: "짭짤한 요리 두 가지를 함께 주문해 나눠요",
    languageLabel: "언어",
    language: "한국어 + 영어",
    costLabel: "예상 분담",
    cost: "1인 약 18,000원",
    participantsLabel: "좌석",
    participants: "3명 참여 · 1자리 남음",
    meetingLabel: "만남",
    meeting: "20:20 정문 앞",
    open: "테이블 보기",
    close: "테이블 닫기",
    ageNotice: "19+ 테이블 · 참여할 때만 자격을 확인해요.",
    draftLabel: "호스트에게 남길 메모",
    draftHint: "언어·좌석·음식 선호 (선택)",
    join: "이 테이블 참여",
    confirmTitle: "좌석이 준비됐어요",
    returnTitle: "테이블·장소·메모가 그대로 유지됐어요.",
    confirm: "내 좌석 확정",
    joinedTitle: "참여했어요",
    joinedBody: "이 기기의 My Korea에 계획을 저장했어요.",
    openChat: "테이블 채팅 열기",
    chatTitle: "테이블 채팅",
    chatBoundary: "모임을 위해 이용하세요. 메시지와 사진은 이 탭에만 남아요.",
    compose: "테이블에 메시지",
    attach: "사진 추가",
    replacePhoto: "사진 교체",
    removePhoto: "첨부 사진 삭제",
    photoTypeError: "JPEG, PNG 또는 WebP 사진을 선택해 주세요.",
    photoSizeError: "10 MB 이하의 사진을 선택해 주세요.",
    send: "보내기",
    sendFailed: "메시지를 추가하지 못했어요.",
    retry: "다시 시도",
    checkIn: "모임 체크인",
    checkedIn: "체크인 · 20:20",
    feedbackTitle: "테이블은 어땠나요?",
    helpful: "도움이 된 테이블",
    welcoming: "친절한 호스트",
    feedback: "피드백 저장",
    feedbackSaved: "이 탭에만 저장했어요. 공개 평점이나 평판은 생성되지 않았습니다.",
    meetup: "만남",
    contribution: "피드백",
    meetupValue: "이 기기의 표시만",
    contributionValue: "여기에서 선택됨",
    report: "신고",
    reportTitle: "이 메시지를 신고할까요?",
    reportConfirm: "이 탭에 기록",
    reportDone: "이 탭에 신고를 기록했어요.",
    block: "차단",
    blocked: "이 탭에서만 Jae를 숨겼어요.",
    leave: "나가기",
    leaveTitle: "이 테이블에서 나갈까요?",
    leaveConfirm: "테이블 나가기",
    keep: "좌석 유지",
    cancelSafety: "취소",
    stay: "이 테이블에 머물기",
    blockTitle: "이 탭에서 Jae를 숨길까요?",
    blockConfirm: "참여자 숨기기",
    blockTarget: "Jae · 이 테이블 참여자",
    reportTarget: "Jae의 최근 메시지 · 이 탭에만 기록되며 ONDO나 호스트에게 전송되지 않아요.",
    leaveTarget: "야식 한 상, 함께 앉는 테이블",
    undo: "실행 취소",
    checkInBoundary: "이 기기에만 표시됩니다. 위치나 실제 참석을 확인하지 않습니다.",
    tableHeader: "펄스 테이블",
    tableOpen: "1자리 남음",
    tableTitle: "야식 한 상, 함께 앉는 테이블",
    tableSubtitle: "강남에서 가볍게 나누는 금요일 저녁",
    joinSaveFailed: "My Korea에 계획을 저장하지 못해 아직 참여하지 않았어요. 다시 시도해 주세요.",
    leaveSaveFailed: "My Korea에서 계획을 삭제하지 못해 아직 이 테이블에 참여 중이에요. 다시 시도해 주세요.",
    venueUnavailable: "공식 장소 기록을 불러올 수 없어요.",
    minMessage: "20:20에 입구 옆에서 만나요.",
    jaeMessage: "저는 영어와 한국어 모두 괜찮아요.",
    you: "나",
  },
  ja: {
    eyebrow: "ソウルで開催予定",
    title: "Pulse Tables",
    intro: "実在する場所を起点にした少人数の予定です。席を選ぶ前に必要な情報を確認できます。",
    truth: "メッセージと写真はこのタブだけに残り、確定した予定だけがこの端末のマイ韓国に保存されます。予約、店舗への送信、決済は行われません。",
    official: "場所の記録",
    officialBoundary: "韓国の公式飲食店営業許可記録で場所を確認しています。集まりの詳細はホストが提供します。",
    timeLabel: "日時",
    time: "8月28日（金）・20:30 KST",
    menuLabel: "食事プラン",
    menu: "料理を2品、一緒に注文してシェア",
    languageLabel: "使用言語",
    language: "韓国語＋英語",
    costLabel: "予想負担額",
    cost: "1人約₩18,000",
    participantsLabel: "席",
    participants: "3人参加・残り1席",
    meetingLabel: "集合",
    meeting: "20:20に正面入口前",
    open: "Tableを見る",
    close: "Tableを閉じる",
    ageNotice: "19+のTableです。参加を選んだときだけ年齢条件を確認します。",
    draftLabel: "ホストへのメモ",
    draftHint: "言語、席、食の希望（任意）",
    join: "このTableに参加",
    confirmTitle: "席を確保できます",
    returnTitle: "Table、場所、メモはそのままです。",
    confirm: "席を確定する",
    joinedTitle: "参加しました",
    joinedBody: "この端末のマイ韓国に予定を保存しました。",
    openChat: "Tableチャットを開く",
    chatTitle: "Tableチャット",
    chatBoundary: "集合の連絡に使ってください。メッセージと写真はこのタブにのみ残ります。",
    compose: "Tableにメッセージ",
    attach: "写真を追加",
    replacePhoto: "写真を変更",
    removePhoto: "添付写真を削除",
    photoTypeError: "JPEG、PNG、WebPの写真を選んでください。",
    photoSizeError: "10 MB以下の写真を選んでください。",
    send: "送信",
    sendFailed: "メッセージを追加できませんでした。",
    retry: "もう一度試す",
    checkIn: "集合場所でチェックイン",
    checkedIn: "チェックイン済み・20:20",
    feedbackTitle: "Tableはいかがでしたか？",
    helpful: "役に立つTable",
    welcoming: "親切なホスト",
    feedback: "フィードバックを保存",
    feedbackSaved: "このタブ内だけに保存しました。公開評価や評判は作成されていません。",
    meetup: "集合",
    contribution: "フィードバック",
    meetupValue: "この端末の印のみ",
    contributionValue: "ここで選択",
    report: "報告",
    reportTitle: "このメッセージを報告しますか？",
    reportConfirm: "このタブに記録",
    reportDone: "このタブに報告を記録しました。",
    block: "ブロック",
    blocked: "このタブでだけJaeを非表示にしました。",
    leave: "退出",
    leaveTitle: "このTableから退出しますか？",
    leaveConfirm: "Tableから退出",
    keep: "席を維持",
    cancelSafety: "キャンセル",
    stay: "このTableに残る",
    blockTitle: "このタブでJaeを非表示にしますか？",
    blockConfirm: "参加者を非表示",
    blockTarget: "Jae・このTableの参加者",
    reportTarget: "Jaeの最新メッセージ・このタブ内だけに記録され、ONDOやホストには送信されません。",
    leaveTarget: "夜のひと皿を囲むTable",
    undo: "元に戻す",
    checkInBoundary: "この端末にだけ記録します。位置や実際の参加を確認するものではありません。",
    tableHeader: "Pulse Table",
    tableOpen: "残り1席",
    tableTitle: "夜のひと皿を囲むTable",
    tableSubtitle: "江南で気軽に楽しむ金曜の夕食",
    joinSaveFailed: "マイ韓国に予定を保存できなかったため、まだ参加していません。もう一度お試しください。",
    leaveSaveFailed: "マイ韓国から予定を削除できなかったため、まだこのTableに参加中です。もう一度お試しください。",
    venueUnavailable: "公式の場所記録を利用できません。",
    minMessage: "20:20に入口の横で会いましょう。",
    jaeMessage: "英語でも韓国語でも大丈夫です。",
    you: "自分",
  },
} as const satisfies Record<SocialLocale, Record<string, string>>

type TableCopy = (typeof COPY)[SocialLocale]

export function PulseTablesEntryB() {
  const { state, actions } = useOndoB()
  const locale = state.locale
  const socialLocale: SocialLocale = locale
  const t = COPY[socialLocale]
  const venue = canonicalMapVenueById(TABLE_VENUE_ID)
  const [selected, setSelected] = useState(false)
  const [draft, setDraft] = useState("")
  const [returnTo, setReturnTo] = useState<BReturnToEnvelope | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [joinStage, setJoinStage] = useState<JoinStage>(() => state.plannedTableRefs.some(({ tableId, venueId }) => tableId === ACTIVE_TABLE_ID && venueId === TABLE_VENUE_ID) ? "joined" : "idle")
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [joinPersistError, setJoinPersistError] = useState(false)
  const [leavePersistError, setLeavePersistError] = useState(false)
  const [compose, setCompose] = useState("")
  const [chatImage, setChatImage] = useState<string | null>(null)
  const [chatImageError, setChatImageError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [failedOnce, setFailedOnce] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [feedback, setFeedback] = useState<"helpful" | "welcoming" | null>(null)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const safetyOpen = reportOpen || blockOpen || leaveOpen
  const layerRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const reportButtonRef = useRef<HTMLButtonElement | null>(null)
  const blockButtonRef = useRef<HTMLButtonElement | null>(null)
  const leaveButtonRef = useRef<HTMLButtonElement | null>(null)
  const blockUndoRef = useRef<HTMLButtonElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlsRef = useRef(new Set<string>())

  useModalIsolation(selected, layerRef)

  useEffect(() => {
    if (!safetyOpen) return
    function ownSafetyEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      if (reportOpen) {
        setReportOpen(false)
        window.requestAnimationFrame(() => reportButtonRef.current?.focus({ preventScroll: true }))
      } else if (blockOpen) {
        setBlockOpen(false)
        window.requestAnimationFrame(() => blockButtonRef.current?.focus({ preventScroll: true }))
      } else {
        setLeaveOpen(false)
        setLeavePersistError(false)
        window.requestAnimationFrame(() => leaveButtonRef.current?.focus({ preventScroll: true }))
      }
    }
    window.addEventListener("keydown", ownSafetyEscape, true)
    return () => window.removeEventListener("keydown", ownSafetyEscape, true)
  }, [blockOpen, leaveOpen, reportOpen, safetyOpen])

  const venuePresentation = useMemo(() => venue ? venueNamePresentation(venue.name.ko, locale) : null, [locale, venue])
  const district = venue ? venueDistrictLabel(venue.cityId, venue.districtId, locale) : ""

  useEffect(() => {
    function openFromPlace(event?: Event) {
      const detail = event instanceof CustomEvent ? event.detail as { tableId?: string; venueId?: string; mode?: string } : null
      const pending = window.__ONDO_B_TABLE_INTENT__
      if (detail && (detail.tableId !== ACTIVE_TABLE_ID || detail.venueId !== TABLE_VENUE_ID)) return
      if (!detail && !pending) return
      window.__ONDO_B_TABLE_INTENT__ = undefined
      setSelected(true)
    }
    openFromPlace()
    window.addEventListener(ONDO_OPEN_TABLE_EVENT, openFromPlace)
    return () => window.removeEventListener(ONDO_OPEN_TABLE_EVENT, openFromPlace)
  }, [])

  useEffect(() => () => {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    objectUrlsRef.current.clear()
  }, [])

  useEffect(() => {
    if (!selected) return
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [selected])

  if (!venue || !venuePresentation) return <section className={styles.entry} data-testid="tables-entry" role="alert">{t.venueUnavailable}</section>

  function openActiveTable() { setSelected(true) }

  function closeTable() {
    setGateOpen(false)
    setReturnTo(null)
    setSelected(false)
    window.requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }))
  }

  function beginJoin() {
    const envelope = createBReturnTo({ tableId: ACTIVE_TABLE_ID, venueId: TABLE_VENUE_ID, draft })
    setReturnTo(envelope)
    setGateOpen(true)
  }

  function cancelGate() { setGateOpen(false); setReturnTo(null) }

  function completeGate(consumed: BReturnToEnvelope) {
    setReturnTo(consumed)
    setGateOpen(false)
    setJoinStage("confirm")
  }

  function retryExpiredGate() {
    if (!returnTo) return
    setReturnTo(createBReturnTo({ tableId: returnTo.tableId, venueId: returnTo.venueId, draft: returnTo.draft }))
  }

  function confirmJoin() {
    const recorded = actions.recordPlannedTable(ACTIVE_TABLE_ID, TABLE_VENUE_ID)
    if (!recorded) {
      setJoinPersistError(true)
      return
    }
    setJoinPersistError(false)
    setJoinStage("joined")
    focusFirstAvailableDestination(["[data-testid='table-open-chat']"])
  }

  function openChat() {
    setJoinStage("chat")
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => detailRef.current?.querySelector<HTMLElement>("[data-testid='table-chat']")?.scrollIntoView({ block: "start" }))
    })
  }

  function confirmLeave() {
    const removed = actions.removePlannedTable(ACTIVE_TABLE_ID)
    if (!removed) {
      setLeavePersistError(true)
      return
    }
    setLeavePersistError(false)
    setJoinStage("idle"); setReturnTo(null); setReportOpen(false); setReported(false); setBlockOpen(false); setBlocked(false); setLeaveOpen(false)
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    objectUrlsRef.current.clear()
    setChatImage(null); setChatImageError(null); setMessages([]); setCheckedIn(false); setFeedback(null); setFeedbackSaved(false)
    focusFirstAvailableDestination(["[data-testid='table-detail'] [data-testid='table-join']"])
  }

  function restoreSafetyFocus(ref: typeof reportButtonRef) {
    window.requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }))
  }

  function cancelReport() { setReportOpen(false); restoreSafetyFocus(reportButtonRef) }
  function cancelBlock() { setBlockOpen(false); restoreSafetyFocus(blockButtonRef) }
  function cancelLeave() { setLeaveOpen(false); setLeavePersistError(false); restoreSafetyFocus(leaveButtonRef) }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!TABLE_CHAT_IMAGE_TYPES.has(file.type)) {
      setChatImageError(t.photoTypeError)
      event.target.value = ""
      return
    }
    if (file.size > MAX_TABLE_CHAT_IMAGE_BYTES) {
      setChatImageError(t.photoSizeError)
      event.target.value = ""
      return
    }
    if (chatImage) {
      URL.revokeObjectURL(chatImage)
      objectUrlsRef.current.delete(chatImage)
    }
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.add(url)
    setChatImage(url)
    setChatImageError(null)
    event.target.value = ""
  }

  function removeChatImage() {
    if (chatImage) {
      URL.revokeObjectURL(chatImage)
      objectUrlsRef.current.delete(chatImage)
    }
    setChatImage(null)
    setChatImageError(null)
  }

  function sendMessage() {
    if (!compose.trim() && !chatImage) return
    const shouldFail = window.__ONDO_B_QA__?.tableMessage === "failure" && !failedOnce
    setMessages((current) => [...current, { id: Date.now(), text: compose.trim(), imageUrl: chatImage, state: shouldFail ? "failed" : "ready" }])
    setCompose(""); setChatImage(null)
    if (shouldFail) setFailedOnce(true)
  }

  function retryMessage(id: number) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, state: "ready" } : message))
  }

  function handleDetailKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (gateOpen) return
    if (event.key === "Escape" && safetyOpen) {
      event.preventDefault()
      if (reportOpen) cancelReport()
      else if (blockOpen) cancelBlock()
      else cancelLeave()
      return
    }
    if (event.key === "Escape") { event.preventDefault(); closeTable(); return }
    if (event.key !== "Tab") return
    const focusable = Array.from(detailRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null && !element.closest("[inert],[aria-hidden='true']"))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <section className={styles.entry} data-testid="tables-entry" data-visual-direction="timeleft-warm-atlas">
      <header className={styles.entryHeader}>
        <p>{t.eyebrow}</p><h1>{t.title}</h1><span>{t.intro}</span>
        <small className={styles.prototypeTruth}>{t.truth}</small>
      </header>

      <div className={styles.cards}>
        <article className={styles.cardActive} data-testid={`table-card-${ACTIVE_TABLE_ID}`} data-table-state="TABLE-OPEN">
          <div className={styles.cardTop}><span>{t.tableOpen}</span><ShieldCheck size={18} aria-hidden="true" /></div>
          <h2>{t.tableTitle}</h2>
          <p>{t.tableSubtitle}</p>
          <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
          <PlanFields copy={t} />
          <button ref={openerRef} type="button" className={styles.openButton} data-testid={`table-open-${ACTIVE_TABLE_ID}`} onClick={openActiveTable}>{t.open}<ChevronRight size={17} aria-hidden="true" /></button>
        </article>
      </div>

      {selected ? (
        <div ref={layerRef} className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="table-b-title" data-testid="table-detail" data-table-id={ACTIVE_TABLE_ID} data-venue-id={TABLE_VENUE_ID} data-join-stage={joinStage}>
          <button type="button" className={styles.backdrop} tabIndex={-1} aria-label={t.close} disabled={safetyOpen} onClick={closeTable} />
          <article ref={detailRef} className={styles.detail} data-join-stage={joinStage} onKeyDown={handleDetailKeyDown}>
            <header className={styles.detailHeader} inert={safetyOpen} aria-hidden={safetyOpen || undefined}>
              <button ref={closeRef} type="button" onClick={closeTable} aria-label={t.close}><ArrowLeft size={18} aria-hidden="true" /></button>
              <span>{t.tableHeader}</span>
              <button type="button" onClick={closeTable} aria-label={t.close}><X size={18} aria-hidden="true" /></button>
            </header>
            <div className={styles.detailBody}>
              <p className={styles.detailEyebrow}>{district} · {t.tableOpen}</p>
              <h2 id="table-b-title">{t.tableTitle}</h2>
              <OfficialVenue venueName={venuePresentation.officialName} district={district} copy={t} />
              <PlanFields copy={t} />
              <aside className={styles.ageNotice}><ShieldCheck size={18} aria-hidden="true" /><span>{t.ageNotice}</span></aside>

              {joinStage === "idle" ? <section className={styles.joinPanel}>
                <label htmlFor="table-join-draft">{t.draftLabel}</label>
                <textarea id="table-join-draft" data-testid="table-join-draft" maxLength={280} value={draft} placeholder={t.draftHint} onChange={(event) => setDraft(event.target.value)} />
                <button type="button" className={styles.primary} data-testid="table-join" onClick={beginJoin}>{t.join}</button>
              </section> : null}

              {joinStage === "confirm" && returnTo ? <section className={styles.confirmation} data-testid="table-join-confirmation" data-return-table={returnTo.tableId} data-return-venue={returnTo.venueId}>
                <Check size={24} aria-hidden="true" /><h3>{t.confirmTitle}</h3><p>{t.returnTitle}</p>
                {returnTo.draft ? <blockquote data-testid="after19-return">{returnTo.draft}</blockquote> : null}
                {joinPersistError ? <p className={styles.persistError} data-testid="table-join-save-error" role="alert"><AlertTriangle size={16} aria-hidden="true" />{t.joinSaveFailed}</p> : null}
                <button type="button" className={styles.primary} data-testid="table-join-confirm" onClick={confirmJoin}>{t.confirm}</button>
              </section> : null}

              {joinStage === "joined" ? <section className={styles.joined}>
                <UsersRound size={25} aria-hidden="true" /><h3>{t.joinedTitle}</h3><p>{t.joinedBody}</p>
                <button type="button" className={styles.primary} data-testid="table-open-chat" onClick={openChat}><MessageCircle size={17} aria-hidden="true" />{t.openChat}</button>
              </section> : null}

              {joinStage === "chat" ? <section className={styles.chat} data-testid="table-chat">
                <header inert={safetyOpen} aria-hidden={safetyOpen || undefined}><span><UsersRound size={18} aria-hidden="true" />{t.chatTitle}</span><small>{blocked ? 3 : 4}</small></header>
                <p className={styles.chatBoundary} inert={safetyOpen} aria-hidden={safetyOpen || undefined}>{t.chatBoundary}</p>
                <div className={styles.messages} aria-live="polite" inert={safetyOpen} aria-hidden={safetyOpen || undefined}>
                  <p><strong>Min</strong><span>{t.minMessage}</span></p>
                  {!blocked ? <p><strong>Jae</strong><span>{t.jaeMessage}</span></p> : null}
                  {messages.map((message) => <article key={message.id} className={styles.myMessage} data-state={message.state}>
                    <strong>{t.you}</strong>
                    {message.imageUrl ? <img src={message.imageUrl} alt="" /> : null}
                    {message.text ? <span>{message.text}</span> : null}
                    {message.state === "failed" ? <span className={styles.messageError}>{t.sendFailed}<button type="button" data-testid="table-message-retry" onClick={() => retryMessage(message.id)}><RotateCcw size={14} aria-hidden="true" />{t.retry}</button></span> : null}
                  </article>)}
                </div>
                <div className={styles.composer} inert={safetyOpen} aria-hidden={safetyOpen || undefined}>
                  {chatImage ? <div className={styles.chatImage}><img src={chatImage} alt="" /><button type="button" onClick={removeChatImage} aria-label={t.removePhoto}><X size={15} aria-hidden="true" /></button></div> : null}
                  {chatImageError ? <p className={styles.messageError} data-testid="table-chat-image-error" role="alert">{chatImageError}</p> : null}
                  <label><span>{t.compose}</span><textarea data-testid="table-chat-compose" value={compose} onChange={(event) => setCompose(event.target.value)} /></label>
                  <input ref={imageInputRef} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t.attach} data-testid="table-chat-image" onChange={chooseImage} />
                  <div><button type="button" className={styles.attachButton} onClick={() => imageInputRef.current?.click()}><ImagePlus size={17} aria-hidden="true" />{chatImage ? t.replacePhoto : t.attach}</button><button type="button" className={styles.sendButton} data-testid="table-message-send" disabled={!compose.trim() && !chatImage} onClick={sendMessage}><Send size={17} aria-hidden="true" />{t.send}</button></div>
                </div>
                <div className={styles.checkInGroup} inert={safetyOpen} aria-hidden={safetyOpen || undefined}>
                  <button type="button" className={checkedIn ? styles.checkedIn : styles.checkIn} data-testid="table-check-in" onClick={() => setCheckedIn(true)}><MapPin size={17} aria-hidden="true" />{checkedIn ? t.checkedIn : t.checkIn}</button>
                  <p>{t.checkInBoundary}</p>
                </div>
                {checkedIn ? <section className={styles.feedback} inert={safetyOpen} aria-hidden={safetyOpen || undefined}>
                  <h3>{t.feedbackTitle}</h3><div><button type="button" aria-pressed={feedback === "helpful"} onClick={() => setFeedback("helpful")}><Star size={16} aria-hidden="true" />{t.helpful}</button><button type="button" aria-pressed={feedback === "welcoming"} onClick={() => setFeedback("welcoming")}><UsersRound size={16} aria-hidden="true" />{t.welcoming}</button></div>
                  <button type="button" className={styles.primary} data-testid="table-feedback-submit" disabled={!feedback} onClick={() => setFeedbackSaved(true)}>{t.feedback}</button>
                  {feedbackSaved ? <aside className={styles.reputationReceipt} data-testid="table-reputation-receipt"><strong>{t.feedbackSaved}</strong><dl><div><dt>{t.meetup}</dt><dd>{t.meetupValue}</dd></div><div><dt>{t.contribution}</dt><dd>{t.contributionValue}</dd></div></dl></aside> : null}
                </section> : null}
                {reported ? <p className={styles.status} role="status" inert={safetyOpen} aria-hidden={safetyOpen || undefined}>{t.reportDone}</p> : null}
                {blocked ? <p className={styles.status} role="status" inert={safetyOpen} aria-hidden={safetyOpen || undefined}>{t.blocked}<button ref={blockUndoRef} type="button" data-testid="table-block-undo" onClick={() => { setBlocked(false); restoreSafetyFocus(blockButtonRef) }}>{t.undo}</button></p> : null}
                <div className={styles.safetyActions} inert={safetyOpen} aria-hidden={safetyOpen || undefined}><button ref={reportButtonRef} type="button" data-testid="table-report" disabled={safetyOpen} onClick={() => setReportOpen(true)}><Flag size={16} aria-hidden="true" />{t.report}</button><button ref={blockButtonRef} type="button" data-testid="table-block" disabled={blocked || safetyOpen} onClick={() => setBlockOpen(true)}><UserRoundX size={16} aria-hidden="true" />{t.block}</button><button ref={leaveButtonRef} type="button" data-testid="table-leave" disabled={safetyOpen} onClick={() => setLeaveOpen(true)}><X size={16} aria-hidden="true" />{t.leave}</button></div>
                {reportOpen ? <ConfirmPanel title={t.reportTitle} target={t.reportTarget} confirm={t.reportConfirm} cancel={t.cancelSafety} confirmTestId="table-report-confirm" onConfirm={() => { setReported(true); setReportOpen(false); restoreSafetyFocus(reportButtonRef) }} onCancel={cancelReport} /> : null}
                {blockOpen ? <ConfirmPanel title={t.blockTitle} target={t.blockTarget} confirm={t.blockConfirm} cancel={t.cancelSafety} confirmTestId="table-block-confirm" onConfirm={() => { setBlocked(true); setBlockOpen(false); window.requestAnimationFrame(() => blockUndoRef.current?.focus({ preventScroll: true })) }} onCancel={cancelBlock} /> : null}
                {leaveOpen ? <ConfirmPanel title={t.leaveTitle} target={t.leaveTarget} confirm={t.leaveConfirm} cancel={t.stay} confirmTestId="table-leave-confirm" error={leavePersistError ? t.leaveSaveFailed : null} errorTestId="table-leave-save-error" onConfirm={confirmLeave} onCancel={cancelLeave} /> : null}
              </section> : null}
            </div>
          </article>
          <After19JitB open={gateOpen} locale={socialLocale} returnTo={returnTo} tableTitle={t.tableTitle} venueLabel={venuePresentation.officialName} onCancel={cancelGate} onEligible={completeGate} onExpiredRetry={retryExpiredGate} />
        </div>
      ) : null}
    </section>
  )
}

function OfficialVenue({ venueName, district, copy }: { venueName: string; district: string; copy: TableCopy }) {
  return <section className={styles.official}><strong>{copy.official}</strong><p>{venueName} · {district}</p><span>{copy.officialBoundary}</span></section>
}

function PlanFields({ copy }: { copy: TableCopy }) {
  const fields = [
    { id: "table-sample-time", icon: CalendarClock, label: copy.timeLabel, value: copy.time },
    { id: "table-sample-menu", icon: Utensils, label: copy.menuLabel, value: copy.menu },
    { id: "table-sample-language", icon: Languages, label: copy.languageLabel, value: copy.language },
    { id: "table-sample-cost", icon: CircleDollarSign, label: copy.costLabel, value: copy.cost },
    { id: "table-sample-participants", icon: UsersRound, label: copy.participantsLabel, value: copy.participants },
    { id: "table-meeting-point", icon: Camera, label: copy.meetingLabel, value: copy.meeting },
  ]
  return <section className={styles.plan}><dl>{fields.map(({ id, icon: Icon, label, value }) => <div key={id} data-testid={id}><dt><Icon size={15} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function ConfirmPanel({ title, target, confirm, cancel, confirmTestId, error = null, errorTestId, onConfirm, onCancel }: {
  title: string
  target: string
  confirm: string
  cancel: string
  confirmTestId: string
  error?: string | null
  errorTestId?: string
  onConfirm(): void
  onCancel(): void
}) {
  const panelRef = useRef<HTMLElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: "end" })
      cancelRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!error) return
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "end" }))
    return () => window.cancelAnimationFrame(frame)
  }, [error])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (event.key === "Escape") {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((element) => element.offsetParent !== null)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return <section ref={panelRef} className={styles.inlineConfirm} role="alertdialog" aria-label={title} onKeyDown={handleKeyDown}>
    <AlertTriangle size={18} aria-hidden="true" />
    <strong>{title}</strong>
    <p className={styles.confirmTarget}>{target}</p>
    {error ? <p className={styles.persistError} data-testid={errorTestId} role="alert"><AlertTriangle size={16} aria-hidden="true" />{error}</p> : null}
    <div><button type="button" data-testid={confirmTestId} onClick={onConfirm}>{confirm}</button><button ref={cancelRef} type="button" onClick={onCancel}>{cancel}</button></div>
  </section>
}
