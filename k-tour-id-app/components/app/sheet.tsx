"use client"

import type React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

/** Mobile bottom sheet (Radix Dialog, slides up from the bottom of the phone column). */
export const Sheet = DialogPrimitive.Root

export function SheetContent({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[420px] rounded-t-3xl bg-card px-5 pb-8 pt-3",
          "max-h-[calc(100dvh-3rem)] overflow-y-auto shadow-[0_-10px_44px_rgba(20,22,30,0.2)]",
          "duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className,
        )}
      >
        <div className="sheet-grabber mx-auto mb-4" />
        <DialogPrimitive.Title className={cn("mb-4 text-center text-[15px] font-bold text-foreground", !title && "sr-only")}>
          {title ?? "Sheet"}
        </DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
