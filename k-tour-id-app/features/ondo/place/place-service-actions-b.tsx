"use client"

import { CalendarClock, ChevronRight, WalletCards } from "lucide-react"
import { resolveCommercePlaceB } from "../commerce-b/place-service-registry-b"
import { capturePlaceServiceMapReturnB } from "../map/place-service-map-return-b"
import { requestReservationSampleB } from "../reservation-b/reservation-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useReviewSampleSession } from "../shared/ui/use-qa-controls"
import styles from "./place-service-actions-b.module.css"

const COPY = {
  ko: { offer: "혜택 확인", benefit: "최대", discount: "할인", reserve: "예약하기", reserveHint: "날짜와 인원 선택" },
  en: { offer: "See your benefit", benefit: "Up to", discount: "off", reserve: "Book a table", reserveHint: "Choose a day and party size" },
  ja: { offer: "特典を見る", benefit: "最大", discount: "割引", reserve: "席を予約", reserveHint: "日付と人数を選択" },
} as const

/** Capabilities are an explicit walkthrough registry, never inferred from a
 * guide entry or directory record. Production hides these sample actions. */
export function PlaceServiceActionsB({ placeId, locale, onOffer, offerTestId }: {
  placeId: string
  locale: "en" | "ko" | "ja"
  onOffer?: () => void
  offerTestId?: string
}) {
  const { actions } = useOndoB()
  const sampleMode = useReviewSampleSession()
  const place = resolveCommercePlaceB(placeId)
  if (!sampleMode || !place || (!place.commerce && !place.reservation)) return null
  const copy = COPY[locale]
  return <section className={styles.actions} data-testid="place-service-actions" data-service-place-id={place.id} data-place-return-section="offer" data-capability-mode="sample">
    {place.commerce ? <button type="button" className={styles.primary} data-testid={offerTestId ?? "place-offer-open"} data-place-service="offer" data-offer-id={place.commerce.offerId} onClick={() => {
      capturePlaceServiceMapReturnB(place.id)
      if (onOffer) onOffer()
      else actions.openMealBenefitFromPlace(place.id)
    }}>
      <WalletCards size={20} aria-hidden="true" /><span><strong>{copy.offer}</strong><small>{copy.benefit} ₩{place.commerce.benefitKrw.toLocaleString("en-US")} {copy.discount}</small></span><ChevronRight size={18} aria-hidden="true" />
    </button> : null}
    {place.reservation ? <button type="button" className={styles.secondary} data-testid="place-reservation-open" data-place-service="reservation" onClick={() => {
      capturePlaceServiceMapReturnB(place.id)
      requestReservationSampleB({ venueId: place.id })
    }}>
      <CalendarClock size={20} aria-hidden="true" /><span><strong>{copy.reserve}</strong><small>{copy.reserveHint}</small></span><ChevronRight size={18} aria-hidden="true" />
    </button> : null}
  </section>
}
