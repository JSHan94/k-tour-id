"use client"

import { useEffect, useId, useState } from "react"
import { LockKeyhole } from "lucide-react"
import { CANONICAL_PRIVATE_NOTE_MAX_LENGTH } from "@/lib/ondo/venues/canonical-allowlist"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { useOndoB } from "../shared/state/ondo-b-provider"
import styles from "../shared/ui/production-local.module.css"

const COPY = {
  en: {
    title: "Private note",
    boundary: "This note stays only in this browser and is not sent anywhere.",
    placeholder: "Keep an ordering tip or a reason to return.",
    save: "Save private note",
    saved: "Saved on this device.",
    failed: "The note could not be saved. Check browser storage and try again.",
  },
  ko: {
    title: "나만의 메모",
    boundary: "이 메모는 이 브라우저에만 남으며 어디에도 전송되지 않아요.",
    placeholder: "주문 방법이나 다시 찾을 이유를 적어 두세요.",
    save: "개인 메모 저장",
    saved: "이 기기에 저장했어요.",
    failed: "메모를 이 기기에 저장하지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
  },
  ja: {
    title: "プライベートメモ",
    boundary: "このメモはこのブラウザにのみ保存され、外部には送信されません。",
    placeholder: "注文のコツや、また訪れたい理由をメモできます。",
    save: "プライベートメモを保存",
    saved: "この端末に保存しました。",
    failed: "メモをこの端末に保存できませんでした。ブラウザの保存容量を確認して、もう一度お試しください。",
  },
} as const

export function PrivateNote({ venueId }: { venueId: string }) {
  const { state, actions } = useOndoB()
  const stored = state.privateNotesByVenue[venueId] ?? ""
  const [draft, setDraft] = useState(stored)
  const [receipt, setReceipt] = useState<"idle" | "saved" | "failed">("idle")
  const noteId = useId()
  const locale = state.locale
  const copy = COPY[locale]

  useEffect(() => {
    setDraft(stored)
  }, [stored])

  function save() {
    setReceipt(actions.setPrivateNote(venueId, draft) ? "saved" : "failed")
  }

  return (
    <section className={styles.note} data-testid={`private-note-${venueId}`} aria-labelledby={noteId}>
      <div className={styles.noteHeading}>
        <LockKeyhole size={16} aria-hidden="true" />
        <label id={noteId} htmlFor={`${noteId}-field`}>{copy.title}</label>
      </div>
      <p>{copy.boundary}</p>
      <textarea
        id={`${noteId}-field`}
        value={draft}
        maxLength={CANONICAL_PRIVATE_NOTE_MAX_LENGTH}
        rows={3}
        onChange={(event) => { setDraft(event.target.value); setReceipt("idle") }}
        placeholder={copy.placeholder}
      />
      <div className={styles.noteActions}>
        <small>{draft.length}/{CANONICAL_PRIVATE_NOTE_MAX_LENGTH}</small>
        <button type="button" onClick={save}>{copy.save}</button>
      </div>
      {receipt === "saved" ? <span className={styles.noteReceipt} role="status">{copy.saved}</span> : null}
      {receipt === "failed" ? <span className={styles.noteError} role="alert">{copy.failed}</span> : null}
    </section>
  )
}
