"use client";

import { useEffect, useState } from "react";
import type { CommercialCategory } from "@/lib/commercial-services";
import type { ServiceConfiguration } from "@/lib/service-flow";

export type ExternalOrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "failed"
  | "refund-pending"
  | "partially-refunded"
  | "refunded";

export interface ExternalServiceOrder {
  id: string;
  serviceId: string;
  provider: string;
  title: string;
  titleEn: string;
  optionLabel: string;
  optionLabelEn: string;
  category: CommercialCategory;
  status: ExternalOrderStatus;
  integrationMode: "simulated";
  paymentStatus?: "not-started" | "captured" | "refunded";
  providerStatus?: "not-requested" | "pending" | "accepted" | "rejected" | "unknown";
  benefitId: string;
  benefitFunding: "provider" | "tourism-campaign";
  grossKRW: number;
  benefitAppliedKRW: number;
  paidKRW: number;
  platformFeeKRW: number;
  providerReceivableKRW: number;
  settlementStatus: "pending" | "ready" | "settled";
  entryContext?: {
    contextId: string;
    contextLabel?: string;
    region?: string;
    branch?: "mobility" | "food";
    returnTo: string;
  };
  createdAt: string;
  statusUpdatedAt: string;
  providerReference: string;
  quoteId: string;
  quoteExpiresAt: string;
  fulfilmentStep: number;
  operationId: string;
  executionState:
    | "user-returned"
    | "provider-confirmed"
    | "status-unknown"
    | "reference-simulated";
  configuration: ServiceConfiguration | null;
  refundedKRW?: number;
  refundedAt?: string;
  refundReference?: string;
  refundRequestedKRW?: number;
  refundReason?: "cancel" | "missing-item" | "service-issue";
  refundQuoteId?: string;
  refundQuoteExpiresAt?: string;
  refundProviderStatus?: "pending" | "approved" | "rejected";
  refundReturnStatus?: "confirmed" | "completed";
}

const prefix = "k-tour-id:external-orders:v1:";
const eventName = "k-tour-id:external-orders-updated";

function storageKey(did: string) {
  return `${prefix}${did || "guest"}`;
}

export function readExternalOrders(did: string): ExternalServiceOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(did)) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExternalOrder(
  did: string,
  order: ExternalServiceOrder,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const previous = readExternalOrders(did);
    const next = [
      order,
      ...previous.filter((candidate) => candidate.id !== order.id),
    ].slice(0, 20);
    localStorage.setItem(storageKey(did), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(eventName));
    return true;
  } catch {
    return false;
  }
}

export function reserveExternalOrder(
  did: string,
  order: ExternalServiceOrder,
): boolean {
  if (order.benefitAppliedKRW > 0) {
    const alreadyReserved = readExternalOrders(did).some(
      (candidate) =>
        candidate.benefitId === order.benefitId &&
        ["pending", "confirmed", "completed", "refund-pending"].includes(
          candidate.status,
        ) &&
        candidate.benefitAppliedKRW > 0,
    );
    if (alreadyReserved) return false;
  }
  return saveExternalOrder(did, order);
}

export function useExternalServiceOrders(did: string) {
  const [orders, setOrders] = useState<ExternalServiceOrder[]>([]);
  useEffect(() => {
    const sync = () => setOrders(readExternalOrders(did));
    sync();
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, [did]);
  return orders;
}

export function externalPassPhase(
  order: ExternalServiceOrder,
  now = Date.now(),
): "scheduled" | "active" | "expired" | null {
  if (order.configuration?.kind !== "transit-pass") return null;
  const activationAt = new Date(order.configuration.activationAt).getTime();
  const expiresAt = new Date(order.configuration.expiresAt).getTime();
  if (now < activationAt) return "scheduled";
  if (now >= expiresAt) return "expired";
  return "active";
}

export function effectiveFulfilmentStep(
  order: ExternalServiceOrder,
  stepCount: number,
  now = Date.now(),
) {
  const lastStep = Math.max(0, stepCount - 1);
  const passPhase = externalPassPhase(order, now);
  if (passPhase)
    return passPhase === "scheduled" ? 1 : passPhase === "active" ? 2 : lastStep;
  if (order.integrationMode === "simulated" && order.status === "confirmed") {
    const startedAt = new Date(order.statusUpdatedAt || order.createdAt).getTime();
    const elapsedSteps = Number.isFinite(startedAt)
      ? Math.floor(Math.max(0, now - startedAt) / 4_800)
      : 0;
    return Math.min(lastStep, Math.max(order.fulfilmentStep ?? 0, elapsedSteps));
  }
  return Math.min(lastStep, order.fulfilmentStep ?? 0);
}

export function effectiveExternalOrderStatus(
  order: ExternalServiceOrder,
  stepCount: number,
  now = Date.now(),
): ExternalOrderStatus {
  if (order.status !== "confirmed") return order.status;
  const passPhase = externalPassPhase(order, now);
  if (passPhase === "expired") return "completed";
  if (!passPhase && effectiveFulfilmentStep(order, stepCount, now) >= stepCount - 1)
    return "completed";
  return order.status;
}
