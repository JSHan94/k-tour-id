"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { dict, type Lang } from "./dict"

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)
const STORAGE_KEY = "k-tour-id-lang"

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Default to Korean — the judging panel is Korean. Tourists toggle to EN.
  const [lang, setLangState] = useState<Lang>("ko")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "ko" || saved === "en") setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => setLang(lang === "ko" ? "en" : "ko"), [lang, setLang])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = dict[lang][key] ?? dict.en[key] ?? key
      if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]))
      return s
    },
    [lang],
  )

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used within <LangProvider>")
  return ctx
}
