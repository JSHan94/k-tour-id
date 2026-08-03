"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import type { AppNotification } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function AlertsPage() {
  const { notifications, dismissNotification, markAllRead } = useApp()
  const { t, lang } = useLang()
  const ko = lang === "ko"
  const [tab, setTab] = useState<"all" | "unread">("all")

  const list = tab === "unread" ? notifications.filter((n) => !n.read) : notifications

  return (
    <PhoneFrame>
      <PageHeader
        title={t("alerts.title")}
        right={
          <button
            type="button"
            onClick={markAllRead}
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
            list.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl p-3.5 ring-1",
                  n.read ? "bg-card ring-border" : "bg-primary/[0.04] ring-primary/20",
                )}
              >
                <span
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-foreground/75"
                  style={{ backgroundColor: n.iconBg }}
                >
                  <AppIcon name={n.icon as IconKey} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-snug text-foreground">{notificationCopy(n, ko).title}</p>
                    {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{notificationCopy(n, ko).message}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{notificationCopy(n, ko).time}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(n.id)}
                  aria-label={ko ? "알림 삭제" : "Dismiss notification"}
                  className="pressable grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
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
    2: { ko: ["여행 혜택", "남은 여행 잔액을 귀국·재방문 바우처로 전환할 수 있어요", "4시간 전"], en: ["Travel benefit", "You can turn remaining travel balance into a return-trip voucher", "4 hours ago"] },
    3: { ko: ["K-Tour ID 확인", "K-Tour ID 상태를 확인했어요", "1일 전"], en: ["K-Tour ID checked", "Your K-Tour ID is ready to use", "1 day ago"] },
    4: { ko: ["바우처 추가", "₩10,000 웰컴 쿠폰이 혜택 지갑에 추가됐어요", "2일 전"], en: ["Voucher added", "A ₩10,000 welcome coupon was added to your benefit wallet", "2 days ago"] },
    5: { ko: ["K-Tour ID 업데이트", "여행 기간과 결제 한도가 업데이트됐어요", "3일 전"], en: ["K-Tour ID updated", "Your trip window and payment limit were refreshed", "3 days ago"] },
  }
  const preset = defaults[notification.id]
  if (preset) {
    const [title, message, time] = preset[ko ? "ko" : "en"]
    return { title, message, time }
  }
  if (!ko) return notification
  if (notification.title.includes("Bukchon workshop paid")) return { title: "북촌 공예 체험 결제 완료", message: "여행자 할인이 적용됐어요", time: "방금" }
  if (notification.title.includes("Workshop refund complete")) return { title: "북촌 공예 체험 환불 완료", message: "결제 금액과 여행자 혜택이 복구됐어요", time: "방금" }
  if (notification.title.includes("Payment complete")) return { title: "결제 완료", message: "결제가 완료됐어요", time: "방금" }
  if (notification.title.includes("Travel balance topped up")) return { title: "여행 잔액 충전 완료", message: "여행 잔액이 충전됐어요", time: "방금" }
  if (notification.title.includes("Voucher returned")) return { title: "바우처 전환 취소", message: "금액이 여행 잔액으로 돌아왔어요", time: "방금" }
  if (notification.title.includes("Return-trip voucher")) return { title: "귀국·재방문 바우처 준비 완료", message: "바우처 지갑에서 확인할 수 있어요", time: "방금" }
  return { ...notification, time: notification.time === "Just now" ? "방금" : notification.time }
}
