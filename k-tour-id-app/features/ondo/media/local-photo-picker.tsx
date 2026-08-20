"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react"
import type { Locale, UploadStatus } from "../contracts/domain"
import { validateImageMeta, type LocalPhoto, type UploadPurpose } from "./media-model"
import styles from "./media.module.css"

export function LocalPhotoPicker({
  locale,
  purpose,
  value,
  onChange,
  disabled = false,
}: {
  locale: Locale
  purpose: UploadPurpose
  value: LocalPhoto | null
  onChange(photo: LocalPhoto | null): void
  disabled?: boolean
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<"type" | "size" | null>(null)

  useEffect(() => () => {
    if (value?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl)
  }, [value?.previewUrl])

  function choose(file?: File) {
    if (!file) return
    const validation = validateImageMeta(file)
    if (!validation.ok) {
      setError(validation.reason)
      return
    }
    setError(null)
    if (value?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl)
    onChange({
      id: `${purpose}-${file.name}-${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
      purpose,
      state: "UPL-PREVIEW",
    })
  }

  function remove() {
    if (value?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl)
    if (inputRef.current) inputRef.current.value = ""
    onChange(null)
    setError(null)
  }

  const labels = locale === "ko"
    ? {
        choose: value ? "다른 사진 선택" : purpose === "chat_image" ? "사진 추가" : "사진 선택",
        remove: "사진 삭제",
        preview: purpose === "local_signal" ? "현장 사진 · 로컬 미리보기" : "대화 사진 · 전송 전 미리보기",
        truth: "사진은 이 화면에서만 보이며 서버에 업로드되거나 저장되지 않습니다.",
        type: "JPG, PNG, WebP 파일을 선택해 주세요.",
        size: "10MB 이하 사진을 선택해 주세요.",
      }
    : {
        choose: value ? "Choose another photo" : purpose === "chat_image" ? "Add a photo" : "Choose photo",
        remove: "Remove photo",
        preview: purpose === "local_signal" ? "On-site photo · Local preview" : "Chat photo · Preview before sending",
        truth: "The photo is visible only on this screen and is not uploaded to or stored on a server.",
        type: "Choose a JPG, PNG, or WebP file.",
        size: "Choose a photo under 10MB.",
      }

  return (
    <div className={styles.picker} data-upload-purpose={purpose} data-upload-state={value?.state ?? "UPL-IDLE"}>
      {value ? (
        <figure className={styles.preview}>
          {/* Browser-local object URLs intentionally use a plain img element. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.previewUrl} alt={labels.preview} />
          <figcaption><Camera size={14} /> {labels.preview}</figcaption>
        </figure>
      ) : null}
      <div className={styles.actions}>
        <label className={styles.photoButton} htmlFor={inputId} aria-disabled={disabled}>
          {value ? <RefreshCw size={17} /> : <ImagePlus size={17} />}
          {labels.choose}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => choose(event.target.files?.[0])}
        />
        {value ? <button type="button" className={styles.removeButton} onClick={remove} disabled={disabled}><Trash2 size={17} /> {labels.remove}</button> : null}
      </div>
      <p className={styles.truth}>{labels.truth}</p>
      {error ? <p className={styles.error} role="alert">{labels[error]}</p> : null}
    </div>
  )
}

export function withUploadState(photo: LocalPhoto, state: UploadStatus): LocalPhoto {
  return { ...photo, state }
}
