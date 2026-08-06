"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, ChevronRight, X } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import type { AppNotification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useExternalServiceOrders } from "@/lib/external-service-orders"

const openedAlertsPrefix = "k-tour-id:opened-alerts:v1:"

export default function AlertsPage() {
  const router = useRouter()
  const { notifications, dismissNotification, markAllRead, orders, session, hydrated } = useApp()
  const { t, lang } = useLang()
  const ko = lang === "ko"
  const [tab, setTab] = useState<"all" | "unread">("all")
  const [openedIds, setOpenedIds] = useState<number[]>([])
  const did = session.identity?.did ?? "guest"
  const externalOrders = useExternalServiceOrders(did)

  useEffect(() => {
    if (hydrated && !session.onboarded) router.replace("/onboarding")
  }, [hydrated, router, session.onboarded])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${openedAlertsPrefix}${did}`) ?? "[]")
      setOpenedIds(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [])
    } catch {
      setOpenedIds([])
    }
  }, [did])

  if (!hydrated || !session.onboarded) return null

  const isRead = (notification: AppNotification) => notification.read || openedIds.includes(notification.id)
  const list = tab === "unread" ? notifications.filter((n) => !isRead(n)) : notifications

  const markRead = (id: number) => {
    setOpenedIds((current) => {
      if (current.includes(id)) return current
      const next = [id, ...current].slice(0, 100)
      try {
        localStorage.setItem(`${openedAlertsPrefix}${did}`, JSON.stringify(next))
      } catch {
        /* The visual read state still updates for this session. */
      }
      return next
    })
  }

  const markEveryAlertRead = () => {
    const ids = notifications.map((notification) => notification.id)
    setOpenedIds(ids)
    try {
      localStorage.setItem(`${openedAlertsPrefix}${did}`, JSON.stringify(ids))
    } catch {
      /* The shared app state remains the source of truth. */
    }
    markAllRead()
  }

  return (
    <PhoneFrame>
      <PageHeader
        title={t("alerts.title")}
        right={
          <button
            type="button"
            onClick={markEveryAlertRead}
            aria-label={ko ? "모두 읽음" : "Mark all read"}
            className="pressable grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Check className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-5 pt-1">
        <div className="mb-4 flex gap-5 border-b border-border">
          {(["all", "unread"] as const).map((tb) => {
            const active = tab === tb
            return (
              <button
                key={tb}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(tb)}
                className={cn(
                  "relative -mb-px min-h-11 pb-2 text-[14px] font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                {t(`alerts.${tb}`)}
                {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          {list.length > 0 ? (
            list.map((n) => {
              const read = isRead(n)
              const destination = notificationDestination(n, orders, externalOrders)
              return (
              <article
                key={n.id}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl p-3.5 ring-1",
                  read ? "bg-card ring-border" : "bg-primary/[0.04] ring-primary/20",
                )}
              >
                <span
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-foreground/75"
                  style={{ backgroundColor: n.iconBg }}
                >
                  <AppIcon name={n.icon as IconKey} className="h-[18px] w-[18px]" />
                </span>
                <Link
                  href={destination}
                  onClick={() => markRead(n.id)}
                  className="pressable min-w-0 flex-1 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-snug text-foreground">{notificationCopy(n, ko).title}</p>
                    {!read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{notificationCopy(n, ko).message}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{notificationCopy(n, ko).time}</p>
                  <span className="mt-2 inline-flex min-h-8 items-center gap-1 text-[12px] font-bold text-primary">
                    {notificationAction(n, ko)}<ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => dismissNotification(n.id)}
                  aria-label={ko ? "알림 삭제" : "Dismiss notification"}
                  className="pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </article>
            )})
          ) : (
            <p className="py-16 text-center text-[13px] text-muted-foreground">{t("alerts.empty")}</p>
          )}
        </div>
      </div>
    </PhoneFrame>
  )
}

function notificationCopy(notification: AppNotification, ko: boolean) {
  const defaults: Record<number, { ko: [string, string, string]; en: [string, string, string] }> = {
    1: { ko: ["결제 완료", "올리브영에서 ₩135,727을 결제했어요", "2시간 전"], en: ["Payment complete", "You paid ₩135,727 at Olive Young", "2 hours ago"] },
    2: { ko: ["여행 혜택", "남은 여행 잔액을 재방문 바우처로 전환할 수 있어요", "4시간 전"], en: ["Travel benefit", "You can turn remaining travel balance into a return-trip voucher", "4 hours ago"] },
    3: { ko: ["K-Tour ID 확인", "K-Tour ID 상태를 확인했어요", "어제"], en: ["K-Tour ID checked", "Your K-Tour ID is ready to use", "Yesterday"] },
    4: { ko: ["바우처 추가", "₩10,000 웰컴 쿠폰이 ID·지갑에 추가됐어요", "2일 전"], en: ["Voucher added", "A ₩10,000 welcome coupon was added to ID · Wallet", "2 days ago"] },
    5: { ko: ["K-Tour ID 업데이트", "여행 기간과 결제 한도가 업데이트됐어요", "3일 전"], en: ["K-Tour ID updated", "Your trip window and payment limit were refreshed", "3 days ago"] },
  }
  const preset = defaults[notification.id]
  if (preset) {
    const [title, message, time] = preset[ko ? "ko" : "en"]
    return { title, message, time }
  }
  if (!ko) return { ...notification, time: relativeTime(notification.time, false) }
  const amounts = notification.message.match(/₩[\d,]+/g) ?? []
  if (notification.title.endsWith(" paid")) return { title: "혜택 결제 완료", message: amounts.length >= 2 ? `혜택 ${amounts[0]} 적용 · ${amounts[1]} 결제` : "혜택을 적용해 결제했어요", time: "방금" }
  if (notification.title.includes("Order refund complete")) return { title: "주문 환불 완료", message: amounts.length >= 2 ? `${amounts[0]} 환불 · 혜택 ${amounts[1]} 복구` : "결제 금액과 이용 전 혜택이 복구됐어요", time: "방금" }
  if (notification.title.includes("Order confirmed")) return { title: "주문 완료", message: amounts[0] ? `${amounts[0]} 결제 · 주문이 확정됐어요` : "주문이 확정됐어요", time: "방금" }
  if (notification.title.includes("Order refunded")) return { title: "주문 환불 완료", message: amounts.length >= 3 ? `총 ${amounts[0]} 복구 · 여행 잔액 ${amounts[1]} · 바우처 ${amounts[2]}` : amounts[0] ? `${amounts[0]}이 여행 잔액으로 돌아왔어요${notification.message.includes("benefit restored") ? " · 이용 전 혜택 복구" : ""}` : "환불 처리가 완료됐어요", time: "방금" }
  if (notification.title.includes("Payment complete")) return { title: "결제 완료", message: amounts[0] ? `${amounts[0]} 결제가 완료됐어요` : "결제가 완료됐어요", time: "방금" }
  if (notification.title.includes("Travel balance topped up")) return { title: "여행 잔액 충전 완료", message: amounts[0] ? `${amounts[0]}이 여행 잔액에 추가됐어요` : "여행 잔액이 충전됐어요", time: "방금" }
  if (notification.title.includes("Voucher returned")) return { title: "바우처 전환 취소", message: amounts[0] ? `${amounts[0]}이 여행 잔액으로 돌아왔어요` : "금액이 여행 잔액으로 돌아왔어요", time: "방금" }
  if (notification.title.includes("Return-trip voucher")) return { title: "재방문 바우처 준비 완료", message: amounts[0] ? `${amounts[0]} 바우처가 ID·지갑에 추가됐어요` : "ID·지갑에서 확인할 수 있어요", time: "방금" }
  return { ...notification, time: relativeTime(notification.time, true) }
}

function relativeTime(value: string, ko: boolean) {
  if (value === "Just now") return ko ? "방금" : "Just now"
  const hours = value.match(/^(\d+) hours? ago$/)
  if (hours) return ko ? `${hours[1]}시간 전` : value
  if (value === "1 day ago") return ko ? "어제" : "Yesterday"
  const days = value.match(/^(\d+) days? ago$/)
  if (days) return ko ? `${days[1]}일 전` : value
  return value
}

type CommerceAlertOrder = {
  id: string
  titleEn: string
  status: string
}

type ExternalAlertOrder = {
  id: string
  titleEn: string
  status: string
}

function notificationDestination(
  notification: AppNotification,
  orders: CommerceAlertOrder[],
  externalOrders: ExternalAlertOrder[],
) {
  const copy = `${notification.title} ${notification.message}`.toLowerCase()
  if (copy.includes("k-tour id") || notification.type === "security") return "/pass"
  if (copy.includes("refund") || copy.includes("returned")) {
    const external = externalOrders.find((order) => order.status.includes("refund") || copy.includes(order.titleEn.toLowerCase()))
    if (external) return `/services/orders/${external.id}`
    const commerce = orders.find((order) => order.status === "refunded" || copy.includes(order.titleEn.toLowerCase()))
    return commerce ? `/orders/${commerce.id}` : "/wallet"
  }
  if (copy.includes("order confirmed")) {
    const commerce = orders.find((order) => copy.includes(order.titleEn.toLowerCase())) ?? orders[0]
    return commerce ? `/orders/${commerce.id}` : "/wallet"
  }
  if (copy.includes("voucher") || notification.type === "promotion") return "/wallet"
  return "/wallet"
}

function notificationAction(notification: AppNotification, ko: boolean) {
  const copy = `${notification.title} ${notification.message}`.toLowerCase()
  if (copy.includes("k-tour id") || notification.type === "security") return ko ? "ID 상태 보기" : "View ID status"
  if (copy.includes("refund") || copy.includes("returned")) return ko ? "환불 내역 보기" : "View refund"
  if (copy.includes("order")) return ko ? "주문 보기" : "View order"
  if (copy.includes("voucher") || notification.type === "promotion") return ko ? "ID·지갑에서 보기" : "View in ID · Wallet"
  return ko ? "결제 내역 보기" : "View payment"
}
