"use client";

export type SupportTopic = "payment" | "refund" | "id" | "safety" | "other";

export interface SupportCase {
  id: string;
  topic: SupportTopic;
  message: string;
  orderId?: string;
  orderLabel?: string;
  createdAt: string;
  expectedReplyAt: string;
  status: "received";
}

const prefix = "k-tour-id:support-cases:v1:";

function storageKey(did: string) {
  return `${prefix}${did || "guest"}`;
}

export function readSupportCases(did: string): SupportCase[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(did)) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createSupportCase(
  did: string,
  input: Pick<SupportCase, "topic" | "message" | "orderId" | "orderLabel">,
): SupportCase | null {
  if (typeof window === "undefined") return null;
  const now = new Date();
  const slaHours = input.topic === "refund" ? 4 : input.topic === "safety" ? 1 : 2;
  const supportCase: SupportCase = {
    ...input,
    id: `KT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    createdAt: now.toISOString(),
    expectedReplyAt: new Date(now.getTime() + slaHours * 60 * 60 * 1_000).toISOString(),
    status: "received",
  };
  try {
    const next = [supportCase, ...readSupportCases(did)].slice(0, 12);
    localStorage.setItem(storageKey(did), JSON.stringify(next));
    return supportCase;
  } catch {
    return null;
  }
}
