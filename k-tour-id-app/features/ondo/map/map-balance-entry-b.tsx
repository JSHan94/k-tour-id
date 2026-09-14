"use client"

import { WalletCards } from "lucide-react"
import { stableCommerceBalanceB, stableCommerceHeldKrwB } from "../commerce-b/stable-commerce-model-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import styles from "./map-balance-entry-b.module.css"

/** One balance, shared with checkout. The map never maintains a second purse. */
export function MapBalanceEntryB({ onOpen }: { onOpen: () => void }) {
  const { state } = useOndoB()
  const availableKrw = Math.max(0, Math.round(stableCommerceBalanceB(state.commerceSession) * 1_000) - stableCommerceHeldKrwB(state.commerceSession))
  const amount = `₩${availableKrw.toLocaleString("en-US")}`
  const label = state.locale === "ko" ? `여행 잔액 ${amount}, 지갑 열기` : state.locale === "ja" ? `旅行残高 ${amount}、ウォレットを開く` : `Travel balance ${amount}, open wallet`
  return <button type="button" className={styles.entry} data-testid="map-wallet-balance" data-balance-krw={availableKrw} data-balance-source="shared-commerce-session" aria-label={label} onClick={onOpen}>
    <WalletCards size={16} aria-hidden="true" /><span>{amount}</span>
  </button>
}
