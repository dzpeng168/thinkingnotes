import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useI18n, type Locale } from "@/lib/i18n"
import { useEffect, useState } from "react"

// 模板元数据已拆到纯数据文件（Server Component 链路可安全导入），此处 re-export 保持既有 import 兼容
import { TEMPLATE_META } from "./template-meta"
export { TEMPLATE_META }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, locale?: Locale): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    if (locale === "en") {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, "0")
      const d = String(date.getDate()).padStart(2, "0")
      const hh = String(date.getHours()).padStart(2, "0")
      const mm = String(date.getMinutes()).padStart(2, "0")
      return `${y}-${m}-${d} ${hh}:${mm}`
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}`
  } catch {
    return dateStr
  }
}

/**
 * 根据当前 locale 取模板名/描述。模板原始名（中文原版）保留不翻译，
 * 通过 messages 中的 template.* 命名空间查找英文覆盖；找不到就回退到原版。
 */
export function useTemplateMeta(templateKey: string): { name: string; desc: string; icon: string } {
  const { locale, t } = useI18n()
  const base = TEMPLATE_META[templateKey] ?? { name: templateKey, desc: "", icon: "LayoutGrid" }
  if (locale === "zh") return base
  try {
    const msgKey = TEMPLATE_MESSAGE_KEYS[templateKey]
    if (!msgKey) return base
    const nameKey = `${msgKey}` as const
    const descKey = `${msgKey}Desc` as const
    // t() 返回 key 本身当缺失；与默认名不同才替换
    const n = t(nameKey as any)
    const d = t(descKey as any)
    return {
      name: n && n !== nameKey ? n : base.name,
      desc: d && d !== descKey ? d : base.desc,
      icon: base.icon,
    }
  } catch {
    return base
  }
}

// 模板 key 与 messages template 命名空间 key 的映射
const TEMPLATE_MESSAGE_KEYS: Record<string, string | undefined> = {
  free: "template.free",
  cornell: "template.cornell",
  meeting_5w2h: "template.meeting5w2h",
  six_hats: "template.sixHats",
  monthly_plan: "template.monthlyPlan",
  weekly_plan: "template.weeklyPlan",
  daily_plan: "template.dailyPlan",
  woop: "template.woop",
  ride: "template.ride",
  prep_method: "template.prepMethod",
  four_d_work: "template.fourDWork",
  empathy_map: "template.empathyMap",
  smart_goal: "template.smartGoal",
  grai: "template.grai",
  eisenhower_matrix: "template.eisenhowerMatrix",
  trust_equation: "template.trustEquation",
}

/**
 * 纯函数版 useTemplateMeta：可在 map 回调等非 hook 上下文中使用，
 * translate 传入 t()（调用方自行处理 any 断言）。
 */
export function resolveTemplateMeta(
  templateKey: string,
  locale: Locale,
  translate: (key: string) => string,
): { name: string; desc: string; icon: string } {
  const base = TEMPLATE_META[templateKey] ?? { name: templateKey, desc: "", icon: "LayoutGrid" }
  if (locale !== "en") return base
  const msgKey = TEMPLATE_MESSAGE_KEYS[templateKey]
  if (!msgKey) return base
  const n = translate(msgKey)
  const d = translate(`${msgKey}Desc`)
  return {
    name: n && n !== msgKey ? n : base.name,
    desc: d && d !== `${msgKey}Desc` ? d : base.desc,
    icon: base.icon,
  }
}

/** 仅读取当前 locale 的 hook（常用于传给 formatDate 等工具）。 */
export function useLocale(): Locale {
  const { locale } = useI18n()
  return locale
}

/** 返回当前 locale 的数字格式。 */
export function useNumberFormat(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const locale = useLocale()
  const [fmt, setFmt] = useState(() =>
    typeof Intl !== "undefined"
      ? new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", options)
      : ({ format: (n: number) => String(n) } as any),
  )
  useEffect(() => {
    if (typeof Intl === "undefined") return
    setFmt(new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", options))
  }, [locale, options])
  return fmt
}
