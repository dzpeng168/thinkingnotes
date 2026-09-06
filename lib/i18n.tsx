"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import zhMessages from "@/messages/zh.json"
import enMessages from "@/messages/en.json"

export type Locale = "zh" | "en"
export const LOCALES: Locale[] = ["zh", "en"]
// Web 版默认语言为 English（agent.md §7.6）：localStorage 偏好 > 浏览器语言 > 默认英文
export const DEFAULT_LOCALE: Locale = "en"
const LOCALE_STORAGE_KEY = "thinkingnotes:locale"

// 类型化 messages（从中文 JSON 推导）
export type Messages = typeof zhMessages
const MESSAGES: Record<Locale, Messages> = {
  zh: zhMessages as Messages,
  en: enMessages as Messages,
}

export const LANG_ATTR: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
}

type Dict = Record<string, any>
function getByPath(obj: Dict, path: string): any {
  const parts = path.split(".")
  let cur: any = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

function format(tpl: string, args: Record<string, string | number> | undefined): string {
  if (!args) return tpl
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(args, k) ? String((args as any)[k]) : `{${k}}`,
  )
}

function translate(messages: Messages, key: string, args?: Record<string, string | number>): string {
  const value = getByPath(messages as Dict, key)
  if (typeof value === "string") return format(value, args)
  if (value == null) {
    if (typeof window !== "undefined") {
      // 仅开发期提醒，避免线上刷 warning
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing translation key: ${key}`)
    }
    return key
  }
  return String(value)
}

type TranslateFn = <K extends Paths<Messages>>(
  key: K,
  args?: PathArgs<Messages, K>,
) => string

// ====== 嵌套 key 的类型推导（支持点路径 + args 参数对象类型） ======
type Paths<O, Prefix extends string = ""> = O extends object
  ? {
      [K in keyof O]-?: K extends string
        ? O[K] extends object
          ?
              | (Prefix extends "" ? `${K}` : `${Prefix}.${K}`)
              | Paths<O[K], Prefix extends "" ? K : `${Prefix}.${K}`>
          : Prefix extends ""
          ? K
          : `${Prefix}.${K}`
        : never
    }[keyof O]
  : never

type PathValue<O, P extends string> = P extends `${infer H}.${infer T}`
  ? H extends keyof O
    ? PathValue<O[H], T>
    : never
  : P extends keyof O
  ? O[P]
  : never

type ExtractArgs<T> = T extends string
  ? {
      [K in ExtractPlaceholders<T>]?: string | number
    }
  : never

type ExtractPlaceholders<S extends string> =
  S extends `${string}{${infer Name}}${infer Rest}`
    ? Name | ExtractPlaceholders<Rest>
    : never

type PathArgs<O, P extends string> = ExtractArgs<PathValue<O, P>>

// ====== Context ======
interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: TranslateFn
  setLocale: (loc: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    if (saved === "zh" || saved === "en") return saved
  } catch {}
  try {
    const nav = (navigator.language || "").toLowerCase()
    if (nav.startsWith("zh")) return "zh"
    if (nav.startsWith("en")) return "en"
  } catch {}
  return DEFAULT_LOCALE
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  // 初始状态优先使用服务端从 cookie 读取的 locale，保证 SSR 与客户端水合一致（无闪烁）。
  // 服务端未传则回退 DEFAULT_LOCALE（首访用户无 cookie 时）。
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  useEffect(() => {
    const detected = detectInitialLocale()
    if (detected !== locale) setLocaleState(detected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const messages = MESSAGES[locale]

  // 同步 html lang + cookie（以便 SSR 层后续读取，预留）
  useEffect(() => {
    try {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("lang", LANG_ATTR[locale])
      }
    } catch {}
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`
    } catch {}
  }, [locale])

  const setLocale = useCallback((loc: Locale) => {
    if (loc !== locale) setLocaleState(loc)
  }, [locale])

  const t: TranslateFn = useCallback(
    (key: any, args?: any) => translate(messages, key as string, args),
    [messages],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, messages, t, setLocale }),
    [locale, messages, t, setLocale],
  )

  return React.createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider>. Did you wrap the root layout?")
  }
  return ctx
}

/** 常用快捷 hook：`const { t } = useT(); t("note.new")` */
export function useT() {
  const { t, locale, setLocale, messages } = useI18n()
  return { t, locale, setLocale, messages }
}

/** 单独取 locale 的快捷 hook，方便 formatDate 等使用 */
export function useLocale(): Locale {
  const { locale } = useI18n()
  return locale
}
