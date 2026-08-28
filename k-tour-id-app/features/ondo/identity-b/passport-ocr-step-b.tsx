"use client"

import type { ChangeEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Check, FileImage, RefreshCw, ShieldCheck, Trash2, Upload } from "lucide-react"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import styles from "./passport-ocr-step-b.module.css"

const MAX_PASSPORT_IMAGE_BYTES = 12 * 1024 * 1024
const PASSPORT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

type PassportOcrStage = "select" | "decoding" | "preview" | "processing" | "review"
type PassportOcrError = "type" | "size" | "decode" | null

const COPY = {
  en: {
    eyebrow: "SIMULATED OCR · LOCAL PREVIEW",
    title: "Choose one passport image",
    lead: "Use a JPEG, PNG or WebP image up to 12 MB. It is decoded only in this tab and is never uploaded.",
    inputLabel: "Passport image file",
    choose: "Choose image",
    required: "One image is required before simulated OCR can start.",
    checking: "Checking the image locally",
    previewTitle: "Image ready for local preview",
    previewAlt: "Selected passport page preview",
    replace: "Replace image",
    remove: "Remove image",
    start: "Start simulated OCR",
    privacy: "The preview stays in memory only until you replace, remove, continue or close. No filename, image or metadata is saved or sent.",
    typeError: "Choose a JPEG, PNG or WebP image.",
    sizeError: "This image is larger than 12 MB. Choose a smaller image.",
    decodeError: "This image could not be decoded. Remove it and choose another JPEG, PNG or WebP image.",
    retry: "Choose another image",
    processingTitle: "Preparing a minimum local review",
    processingLead: "This walkthrough models OCR locally. It does not contact a passport, identity or OpenDID provider.",
    processingSteps: ["Read the image locally", "Mask sensitive fields", "Prepare the minimum review"],
    pending: "Waiting",
    current: "In progress",
    complete: "Complete",
    reviewEyebrow: "SIMULATED OCR · MASKED RESULT",
    reviewTitle: "Review the minimum result",
    reviewLead: "This is a demonstration result, not a passport authenticity or identity decision.",
    routeLabel: "Selected route",
    routeValue: "Passport eKYC",
    imageLabel: "Image",
    imageValue: "Decoded locally · released before this review",
    identifierLabel: "Document identifier",
    identifierValue: "•••••••• · demo mask only",
    personalLabel: "Personal fields",
    personalValue: "Not extracted or retained",
    resultLabel: "OCR result",
    resultValue: "SIMULATED · no provider decision",
    reviewTruth: "No name, passport number, MRZ, birth date, image or metadata continues to the next step.",
    continue: "Continue to face + liveness",
    removed: "Image removed. Choose another image to continue.",
  },
  ko: {
    eyebrow: "SIMULATED OCR · LOCAL PREVIEW",
    title: "여권 이미지 한 장 선택",
    lead: "12MB 이하 JPEG, PNG 또는 WebP 이미지를 사용하세요. 이 탭에서만 해석하며 업로드하지 않습니다.",
    inputLabel: "여권 이미지 파일",
    choose: "이미지 선택",
    required: "시뮬레이션 OCR을 시작하려면 이미지 한 장이 필요합니다.",
    checking: "기기에서 이미지 확인 중",
    previewTitle: "로컬 미리보기 준비 완료",
    previewAlt: "선택한 여권 면 미리보기",
    replace: "이미지 교체",
    remove: "이미지 삭제",
    start: "시뮬레이션 OCR 시작",
    privacy: "미리보기는 교체·삭제·계속·닫기 전까지만 메모리에 있습니다. 파일명·이미지·메타데이터를 저장하거나 전송하지 않습니다.",
    typeError: "JPEG, PNG 또는 WebP 이미지를 선택하세요.",
    sizeError: "이미지가 12MB를 초과합니다. 더 작은 이미지를 선택하세요.",
    decodeError: "이미지를 해석할 수 없습니다. 삭제한 뒤 다른 JPEG, PNG 또는 WebP 이미지를 선택하세요.",
    retry: "다른 이미지 선택",
    processingTitle: "최소 로컬 검토 준비",
    processingLead: "이 화면은 기기에서 OCR 흐름을 재현할 뿐 여권·신원확인·OpenDID 제공자에 연결하지 않습니다.",
    processingSteps: ["기기에서 이미지 읽기", "민감 필드 마스킹", "최소 검토 결과 준비"],
    pending: "대기",
    current: "진행 중",
    complete: "완료",
    reviewEyebrow: "시뮬레이션 OCR · 마스킹 결과",
    reviewTitle: "최소 결과 확인",
    reviewLead: "여권 진위 또는 본인확인 판정이 아닌 데모 결과입니다.",
    routeLabel: "선택 경로",
    routeValue: "여권 eKYC",
    imageLabel: "이미지",
    imageValue: "기기에서 해석 · 검토 전 폐기됨",
    identifierLabel: "문서 식별자",
    identifierValue: "•••••••• · 데모 마스크",
    personalLabel: "개인 필드",
    personalValue: "추출하거나 보관하지 않음",
    resultLabel: "OCR 결과",
    resultValue: "시뮬레이션 · 제공자 판정 없음",
    reviewTruth: "이름·여권번호·MRZ·생년월일·이미지·메타데이터는 다음 단계로 넘어가지 않습니다.",
    continue: "얼굴·라이브니스로 계속",
    removed: "이미지를 삭제했습니다. 계속하려면 다른 이미지를 선택하세요.",
  },
  ja: {
    eyebrow: "SIMULATED OCR · LOCAL PREVIEW",
    title: "パスポート画像を1枚選択",
    lead: "12MB以下のJPEG、PNG、WebP画像を使います。このタブ内だけで読み取り、アップロードしません。",
    inputLabel: "パスポート画像ファイル",
    choose: "画像を選択",
    required: "シミュレーションOCRを始めるには画像が1枚必要です。",
    checking: "端末内で画像を確認中",
    previewTitle: "ローカルプレビューの準備完了",
    previewAlt: "選択したパスポート面のプレビュー",
    replace: "画像を差し替える",
    remove: "画像を削除",
    start: "シミュレーションOCRを開始",
    privacy: "プレビューは差し替え、削除、続行、終了までメモリ内だけにあります。ファイル名、画像、メタデータは保存・送信しません。",
    typeError: "JPEG、PNG、WebP画像を選択してください。",
    sizeError: "画像が12MBを超えています。より小さい画像を選択してください。",
    decodeError: "画像を読み取れませんでした。削除して別のJPEG、PNG、WebP画像を選択してください。",
    retry: "別の画像を選択",
    processingTitle: "最小限のローカル確認を準備",
    processingLead: "端末内でOCRの流れを再現するだけで、パスポート、本人確認、OpenDID事業者には接続しません。",
    processingSteps: ["端末内で画像を読む", "機微な項目をマスク", "最小限の確認結果を準備"],
    pending: "待機",
    current: "処理中",
    complete: "完了",
    reviewEyebrow: "シミュレーションOCR · マスク済み結果",
    reviewTitle: "最小限の結果を確認",
    reviewLead: "パスポートの真正性や本人確認を判定するものではないデモ結果です。",
    routeLabel: "選択ルート",
    routeValue: "パスポートeKYC",
    imageLabel: "画像",
    imageValue: "端末内で読み取り · 確認前に解放済み",
    identifierLabel: "文書識別子",
    identifierValue: "•••••••• · デモ用マスク",
    personalLabel: "個人項目",
    personalValue: "抽出・保持しない",
    resultLabel: "OCR結果",
    resultValue: "シミュレーション · 事業者の判定なし",
    reviewTruth: "氏名、パスポート番号、MRZ、生年月日、画像、メタデータは次の段階へ渡しません。",
    continue: "顔・ライブネスへ進む",
    removed: "画像を削除しました。続けるには別の画像を選択してください。",
  },
} as const satisfies Record<OndoBLocale, Record<string, string | readonly string[]>>

export function PassportOcrStepB({ locale, onComplete }: { locale: OndoBLocale; onComplete: () => void }) {
  const copy = COPY[locale]
  const [stage, setStage] = useState<PassportOcrStage>("select")
  const [error, setError] = useState<PassportOcrError>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState(0)
  const [announcement, setAnnouncement] = useState<string>(copy.required as string)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialActionRef = useRef<HTMLButtonElement>(null)
  const previewActionRef = useRef<HTMLButtonElement>(null)
  const replaceActionRef = useRef<HTMLButtonElement>(null)
  const reviewActionRef = useRef<HTMLButtonElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const selectionRef = useRef(0)

  const revokeObjectUrl = useCallback(() => {
    if (!previewUrlRef.current) return
    URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
  }, [])

  const clearPreview = useCallback(() => {
    revokeObjectUrl()
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [revokeObjectUrl])

  useEffect(() => () => {
    selectionRef.current += 1
    revokeObjectUrl()
  }, [revokeObjectUrl])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (error) (stage === "preview" ? replaceActionRef.current : initialActionRef.current)?.focus({ preventScroll: true })
      else if (stage === "preview") {
        previewActionRef.current?.focus()
        previewActionRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
      }
      else if (stage === "review") reviewActionRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [error, stage])

  useEffect(() => {
    if (stage !== "processing") return
    setProcessingStep(0)
    const steps = copy.processingSteps as readonly string[]
    const second = window.setTimeout(() => {
      setProcessingStep(1)
      setAnnouncement(steps[1])
    }, 320)
    const third = window.setTimeout(() => {
      setProcessingStep(2)
      setAnnouncement(steps[2])
    }, 640)
    const review = window.setTimeout(() => {
      setStage("review")
      setAnnouncement(copy.reviewTitle as string)
    }, 960)
    return () => {
      window.clearTimeout(second)
      window.clearTimeout(third)
      window.clearTimeout(review)
    }
  }, [copy.reviewTitle, stage])

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return

    const selection = selectionRef.current + 1
    selectionRef.current = selection
    const hadPreview = previewUrlRef.current != null
    setError(null)

    if (!PASSPORT_IMAGE_TYPES.has(file.type)) {
      setError("type")
      setStage(hadPreview ? "preview" : "select")
      setAnnouncement(copy.typeError as string)
      return
    }
    if (file.size > MAX_PASSPORT_IMAGE_BYTES) {
      setError("size")
      setStage(hadPreview ? "preview" : "select")
      setAnnouncement(copy.sizeError as string)
      return
    }

    setStage("decoding")
    setAnnouncement(copy.checking as string)
    let objectUrl: string
    try {
      objectUrl = URL.createObjectURL(file)
    } catch {
      setError("decode")
      setStage(hadPreview ? "preview" : "select")
      setAnnouncement(copy.decodeError as string)
      return
    }

    const decoded = await new Promise<boolean>((resolve) => {
      const image = new window.Image()
      image.onload = () => resolve(true)
      image.onerror = () => resolve(false)
      image.src = objectUrl
    })
    if (selectionRef.current !== selection) {
      URL.revokeObjectURL(objectUrl)
      return
    }
    if (!decoded) {
      URL.revokeObjectURL(objectUrl)
      setError("decode")
      setStage(hadPreview ? "preview" : "select")
      setAnnouncement(copy.decodeError as string)
      return
    }

    revokeObjectUrl()
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setStage("preview")
    setAnnouncement(copy.previewTitle as string)
  }

  function openPicker() {
    if (!inputRef.current) return
    inputRef.current.value = ""
    inputRef.current.click()
  }

  function removeImage() {
    selectionRef.current += 1
    clearPreview()
    setError(null)
    setStage("select")
    setAnnouncement(copy.removed as string)
  }

  function beginProcessing() {
    clearPreview()
    setError(null)
    setStage("processing")
    setAnnouncement((copy.processingSteps as readonly string[])[0])
  }

  const errorMessage = error === "type"
    ? copy.typeError
    : error === "size"
      ? copy.sizeError
      : error === "decode"
        ? copy.decodeError
        : null

  return <div className={styles.root} data-testid="k-tour-id-passport-document" data-ocr-stage={stage} data-ocr-error={error ?? undefined}
    aria-busy={stage === "decoding" || stage === "processing"}>
    <span data-testid="ktour-id-passport-document" className={styles.heroIcon}><FileImage aria-hidden="true" /></span>
    <p className={styles.eyebrow}>{stage === "review" ? copy.reviewEyebrow : copy.eyebrow}</p>
    <input ref={inputRef} className={styles.fileInput} data-testid="passport-ocr-input" type="file"
      accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={copy.inputLabel as string}
      tabIndex={-1} onChange={handleSelection} />

    {stage === "select" || stage === "decoding" ? <>
      <h1>{copy.title}</h1>
      <p className={styles.lead}>{copy.lead}</p>
      {errorMessage ? <p className={styles.error} data-testid="passport-ocr-error" role="alert">{errorMessage}</p> : null}
      <div className={styles.actions}>
        <button ref={initialActionRef} type="button" data-identity-initial-focus data-testid={error ? "passport-ocr-retry" : "passport-ocr-choose"}
          className={styles.primary} onClick={openPicker} disabled={stage === "decoding"}>
          {stage === "decoding" ? <RefreshCw className={styles.spin} aria-hidden="true" /> : <Upload aria-hidden="true" />}
          {stage === "decoding" ? copy.checking : error ? copy.retry : copy.choose}
        </button>
        <button type="button" data-testid="passport-ocr-start" className={styles.secondary} disabled aria-describedby="passport-ocr-required">{copy.start}</button>
      </div>
      <p id="passport-ocr-required" className={styles.truth}><ShieldCheck aria-hidden="true" />{copy.required}</p>
    </> : null}

    {stage === "preview" && previewUrl ? <>
      <h1>{copy.previewTitle}</h1>
      <div className={styles.preview} data-testid="passport-ocr-preview"><img src={previewUrl} alt={copy.previewAlt as string} /></div>
      {errorMessage ? <p className={styles.error} data-testid="passport-ocr-error" role="alert">{errorMessage}</p> : null}
      <div className={styles.actions}>
        <button ref={previewActionRef} type="button" data-identity-initial-focus data-testid="passport-ocr-start" className={styles.primary} onClick={beginProcessing}>{copy.start}<ArrowRight aria-hidden="true" /></button>
        <button ref={replaceActionRef} type="button" data-testid="passport-ocr-replace" className={styles.secondary} onClick={openPicker}><RefreshCw aria-hidden="true" />{copy.replace}</button>
        <button type="button" data-testid="passport-ocr-remove" className={styles.danger} onClick={removeImage}><Trash2 aria-hidden="true" />{copy.remove}</button>
      </div>
      <p className={styles.truth}><ShieldCheck aria-hidden="true" />{copy.privacy}</p>
    </> : null}

    {stage === "processing" ? <>
      <h1>{copy.processingTitle}</h1>
      <p className={styles.lead}>{copy.processingLead}</p>
      <ol className={styles.processing} data-testid="passport-ocr-processing">
        {(copy.processingSteps as readonly string[]).map((label, index) => {
          const status = index < processingStep ? copy.complete : index === processingStep ? copy.current : copy.pending
          return <li key={label} data-status={index < processingStep ? "complete" : index === processingStep ? "current" : "pending"}>
            <span aria-hidden="true">{index < processingStep ? <Check /> : index + 1}</span><strong>{label}</strong><small>{status}</small>
          </li>
        })}
      </ol>
    </> : null}

    {stage === "review" ? <>
      <h1>{copy.reviewTitle}</h1>
      <p className={styles.lead}>{copy.reviewLead}</p>
      <dl className={styles.review} data-testid="passport-ocr-review">
        {[
          [copy.routeLabel, copy.routeValue],
          [copy.imageLabel, copy.imageValue],
          [copy.identifierLabel, copy.identifierValue],
          [copy.personalLabel, copy.personalValue],
          [copy.resultLabel, copy.resultValue],
        ].map(([term, value]) => <div key={term as string}><dt>{term}</dt><dd>{value}</dd></div>)}
      </dl>
      <p className={styles.truth}><ShieldCheck aria-hidden="true" />{copy.reviewTruth}</p>
      <div className={styles.actions}>
        <button ref={reviewActionRef} type="button" data-identity-initial-focus data-testid="k-tour-id-continue" className={styles.primary} onClick={onComplete}>{copy.continue}<ArrowRight aria-hidden="true" /></button>
      </div>
    </> : null}

    <p className={styles.live} data-testid="passport-ocr-status" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </div>
}
