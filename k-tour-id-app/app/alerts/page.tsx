"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { PhoneFrame, PageHeader } from "@/components/app/shell"
import { useApp } from "@/lib/store/app-provider"
import { useLang } from "@/lib/i18n/lang-provider"
import { AppIcon, type IconKey } from "@/lib/icon-map"
import { cn } from "@/lib/utils"

export default function AlertsPage() {
  const { notifications, dismissNotification, markAllRead } = useApp()
  const { t } = useLang()
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
            aria-label="Mark all read"
            className="pressable text-muted-foreground hover:text-foreground"
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
                onClick={() => setTab(tb)}
                className={cn(
                  "relative -mb-px pb-2 text-[14px] font-semibold transition-colors",
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
                    <p className="truncate text-[13px] font-semibold text-foreground">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{n.time}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(n.id)}
                  aria-label="Dismiss"
                  className="pressable grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
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
