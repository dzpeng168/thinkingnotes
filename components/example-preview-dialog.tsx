"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/loading"
import { useT } from "@/lib/i18n"
import { useLocale, useTemplateMeta } from "@/lib/utils"
import type { TemplateType } from "@/lib/types"
import { X } from "lucide-react"

// Milkdown 依赖浏览器环境，必须 ssr:false
const MarkdownView = dynamic(
  () => import("@/components/editor/markdown-view").then((m) => m.MarkdownView),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-16">
      <Spinner />
    </div>
  ) },
)

/** 模板 → 示例笔记文件名（public/templates/example[/en] 下，free 无示例） */
const EXAMPLE_FILES: Partial<Record<TemplateType, string>> = {
  cornell: "cornell-notes-example.md",
  meeting_5w2h: "5w2h-example.md",
  six_hats: "six-thinking-hats-example.md",
  eisenhower_matrix: "eisenhower-matrix-example.md",
  monthly_plan: "monthly-plan-example.md",
  weekly_plan: "weekly-plan-example.md",
  daily_plan: "daily-plan-example.md",
  woop: "woop-thinking-example.md",
  ride: "ride-persuasion-example.md",
  prep_method: "prep-method-example.md",
  four_d_work: "4d-work-example.md",
  empathy_map: "empathy-map-example.md",
  smart_goal: "smart-goal-example.md",
  grai: "grai-retrospective-example.md",
}

export function hasExample(ttype: TemplateType): boolean {
  return Boolean(EXAMPLE_FILES[ttype])
}

interface Props {
  ttype: TemplateType | null
  onOpenChange: (o: boolean) => void
}

/** 模板示例笔记预览弹窗：展示该模板的示例 markdown（只读渲染） */
export function ExamplePreviewDialog({ ttype, onOpenChange }: Props) {
  const { t } = useT()
  const locale = useLocale()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const meta = useTemplateMeta(ttype ?? "free")

  useEffect(() => {
    if (!ttype) return
    const file = EXAMPLE_FILES[ttype]
    if (!file) return
    setContent(null)
    setError(null)
    // 中文示例在 example/ 根目录，英文在 example/en/
    const url = locale === "en"
      ? `/templates/example/en/${file}`
      : `/templates/example/${file}`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setContent)
      .catch((e: Error) => setError(e.message ?? String(e)))
  }, [ttype, locale])

  return (
    <Dialog open={!!ttype} onOpenChange={onOpenChange} className="max-w-6xl">
      <DialogContent className="max-w-6xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 relative pr-10">
          <DialogTitle>{meta.name} · {t("template.previewExample")}</DialogTitle>
          <DialogDescription>{t("template.exampleDesc")}</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-0 right-0 w-8 h-8 rounded-md text-warm-500 hover:text-warm-900 hover:bg-warm-200 flex items-center justify-center transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-warm-200 bg-white p-6">
          {error ? (
            <div className="text-sm text-red-600">{t("template.exampleLoadFailed")}{error}</div>
          ) : content === null ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner />
              <span className="text-sm text-warm-400">{t("common.loading")}</span>
            </div>
          ) : (
            <MarkdownView value={content} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
