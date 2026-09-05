import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useI18n, type Locale } from "@/lib/i18n"
import { useEffect, useState } from "react"

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

export const TEMPLATE_META: Record<string, { name: string; desc: string; icon: string }> = {
  free: {
    name: '自由笔记',
    desc: '不提供固定结构，从空白开始自由编写 Markdown 笔记',
    icon: 'FileText',
  },
  cornell: {
    name: '康奈尔笔记法',
    desc: '主栏 + 线索栏 + 总结栏的三段式布局，适合课堂笔记与读书摘录',
    icon: 'LayoutGrid',
  },
  meeting_5w2h: {
    name: '5W2H分析法',
    desc: 'Why原因、What内容、Who人员、When时间、Where地点、How方法、How much成本',
    icon: 'ClipboardList',
  },
  six_hats: {
    name: '六顶思考帽',
    desc: '平行思维法：白红黑黄绿蓝六色分区，避免无序争论，提升决策质量',
    icon: 'HardHat',
  },
  eisenhower_matrix: {
    name: '时间管理四象限',
    desc: '艾森豪威尔矩阵：重要/紧急 × 紧急/不紧急四分区，优先排序，高效掌控时间',
    icon: 'Grid2X2',
  },
  monthly_plan: {
    name: '月计划',
    desc: '月度目标分解、关键里程碑、重点任务排布，月度复盘模板',
    icon: 'CalendarDays',
  },
  weekly_plan: {
    name: '周计划',
    desc: '本周核心目标、每日安排、重要会议与任务清单',
    icon: 'Calendar',
  },
  daily_plan: {
    name: '日计划',
    desc: '今日待办、时间块安排、重要事项优先排序，高效度过每一天',
    icon: 'CalendarClock',
  },
  woop: {
    name: 'WOOP 思维模型',
    desc: 'Wish愿望、Outcome结果、Obstacle障碍、Plan计划四步法，让愿望落地执行',
    icon: 'Sparkles',
  },
  ride: {
    name: 'RIDE 说服力模型',
    desc: 'Risk风险、Interest利益、Difference差异、Effect影响，构建有说服力的论证框架',
    icon: 'MessageSquare',
  },
  prep_method: {
    name: 'PREP 法则',
    desc: 'Point观点、Reason理由、Example案例、Point重申，结构化表达与演讲模板',
    icon: 'ListOrdered',
  },
  four_d_work: {
    name: '4D 工作法',
    desc: 'Do立刻做、Delay计划做、Delegate委托做、Delete删除做，任务优先级管理',
    icon: 'ListTodo',
  },
  empathy_map: {
    name: '同理心地图',
    desc: '用户所思/所感/所说/所做/所见/所闻，深度理解用户需求与体验',
    icon: 'HeartHandshake',
  },
  smart_goal: {
    name: 'SMART 目标制定',
    desc: 'Specific具体、Measurable可衡量、Achievable可实现、Relevant相关、Timebound有时限',
    icon: 'Target',
  },
  grai: {
    name: 'GRAI 复盘模型',
    desc: 'Goal目标回顾、Result结果评估、Analysis原因分析、Insight规律洞察，系统化复盘',
    icon: 'RotateCcw',
  },
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
