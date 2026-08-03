"use client"

import { useEffect, useState } from "react"
import type { CommercialCategory } from "@/lib/commercial-services"

export type ExternalOrderStatus = "pending" | "confirmed" | "cancelled" | "failed"

export interface ExternalServiceOrder {
  id: string
  serviceId: string
  provider: string
  title: string
  titleEn: string
  optionLabel: string
  optionLabelEn: string
  category: CommercialCategory
  status: ExternalOrderStatus
  integrationMode: "simulated"
  benefitId: string
  benefitFunding: "provider" | "tourism-campaign"
  grossKRW: number
  benefitAppliedKRW: number
  paidKRW: number
  platformFeeKRW: number
  providerReceivableKRW: number
  settlementStatus: "pending"
  createdAt: string
}

const prefix = "k-tour-id:external-orders:v1:"
const eventName = "k-tour-id:external-orders-updated"

function storageKey(did: string) { return `${prefix}${did || "guest"}` }

export function readExternalOrders(did: string): ExternalServiceOrder[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(did)) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveExternalOrder(did: string, order: ExternalServiceOrder): boolean {
  if (typeof window === "undefined") return false
  try {
    const previous = readExternalOrders(did)
    const next = [order, ...previous.filter((candidate) => candidate.id !== order.id)].slice(0, 20)
    localStorage.setItem(storageKey(did), JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(eventName))
    return true
  } catch { return false }
}

export function reserveExternalOrder(did: string, order: ExternalServiceOrder): boolean {
  if (order.benefitAppliedKRW > 0) {
    const alreadyReserved = readExternalOrders(did).some((candidate) => candidate.benefitId === order.benefitId && (candidate.status === "pending" || candidate.status === "confirmed") && candidate.benefitAppliedKRW > 0)
    if (alreadyReserved) return false
  }
  return saveExternalOrder(did, order)
}

export function useExternalServiceOrders(did: string) {
  const [orders, setOrders] = useState<ExternalServiceOrder[]>([])
  useEffect(() => {
    const sync = () => setOrders(readExternalOrders(did))
    sync()
    window.addEventListener(eventName, sync)
    window.addEventListener("storage", sync)
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener("storage", sync) }
  }, [did])
  return orders
}
