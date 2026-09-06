"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LayoutGrid, ClipboardList, HardHat, Grid2X2, CalendarDays, Calendar, CalendarClock, Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw, FileText, Eye } from "lucide-react"
import { ExamplePreviewDialog, hasExample } from "@/components/example-preview-dialog"
import { Spinner, TopProgressBar } from "@/components/ui/loading"
import { noteApi, categoryApi } from "@/lib/api"
import { useTemplateMeta } from "@/lib/utils"
import type { Category, TemplateType } from "@/lib/types"
import { useT } from "@/lib/i18n"

const ICONS: Record<string, any> = {
  LayoutGrid, ClipboardList, HardHat, Grid2X2,
  CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
  FileText,
}

// 模板图标底色轮换（柔和色调，对齐登录页模板矩阵）
const ICON_STYLES = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-teal-100 text-teal-600",
]

const TEMPLATE_KEYS: TemplateType[] = [
  "free",
  "cornell",
  "meeting_5w2h",
  "six_hats",
  "eisenhower_matrix",
  "monthly_plan",
  "weekly_plan",
  "daily_plan",
  "woop",
  "ride",
  "prep_method",
  "four_d_work",
  "empathy_map",
  "smart_goal",
  "grai",
]

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

function TemplateCard({
  ttype, selected, onSelect, onPreview, index,
}: { ttype: TemplateType; selected: boolean; onSelect: () => void; onPreview: () => void; index: number }) {
  const { t } = useT()
  const meta = useTemplateMeta(ttype)
  const Icon = ICONS[meta.icon]
  const previewable = hasExample(ttype)
  const iconCls = selected
    ? "bg-warm-600 text-white"
    : ICON_STYLES[index % ICON_STYLES.length]
  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${selected
        ? "border-warm-600 bg-warm-100 shadow-warm-lg"
        : "border-warm-200 bg-white hover:border-warm-400 hover:shadow-warm"
      }`}
    >
      <button
        onClick={onSelect}
        className="w-full h-full p-3.5 text-left min-h-[108px]"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${iconCls}`}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <div className="font-semibold text-sm text-warm-800">{meta.name}</div>
        </div>
        <div className="text-xs text-warm-600 leading-snug">{meta.desc}</div>
      </button>
      {previewable && (
        <span
          role="button"
          tabIndex={0}
          title={t("template.previewExample")}
          aria-label={t("template.previewExample")}
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              onPreview()
            }
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-warm-500 hover:text-warm-800 hover:bg-warm-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}

export function NewNoteDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [title, setTitle] = useState("")
  const [selected, setSelected] = useState<TemplateType | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<TemplateType | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      loadCategories()
      setErrMsg(null)
    }
  }, [open])

  const loadCategories = async () => {
    try {
      const cs = await categoryApi.list()
      setCategories(cs)
    } catch (e) {
      console.error(e)
    }
  }

  const create = async () => {
    if (!selected) {
      setErrMsg(t("template.chooseTemplate"))
      return
    }
    setLoading(true)
    setErrMsg(null)
    try {
      // 后端按模板类型生成默认 markdown 文件并返回 Note；空标题默认回退"未命名"
      const note = await noteApi.create(title.trim() || t("common.untitled"), selected, categoryId)
      onOpenChange(false)
      setTitle("")
      setSelected(null)
      setCategoryId(null)
      router.push(`/note?id=${note.id}&edit=1`)
    } catch (e) {
      console.error("create note failed", e)
      setErrMsg(String(e))
      // 出错提示在滚动区顶部：滚回顶部确保可见
      scrollRef.current?.scrollTo({ top: 0 })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setTitle("")
    setSelected(null)
    setCategoryId(null)
    setErrMsg(null)
  }

  // 按 parent_id 构造缩进名（父类 / 子类）
  const namePath = (id: string): string => {
    const map = new Map(categories.map((c) => [c.id, c]))
    const path: string[] = []
    let cur: Category | undefined = map.get(id)
    while (cur) {
      path.unshift(cur.name)
      cur = cur.parent_id ? map.get(cur.parent_id) : undefined
    }
    return path.join(" / ")
  }

  return (
    <Dialog
      open={open}
      className="max-w-4xl"
      onOpenChange={(o) => {
        onOpenChange(o)
        if (o) loadCategories()
        if (!o) reset()
      }}
    >
      {loading && <TopProgressBar />}
      <DialogContent className="max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{t("template.dialogTitle")}</DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="space-y-5 flex-1 overflow-y-auto pr-1">
          {errMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{errMsg}</div>
          )}

          {/* 标题 + 分类：同一行 */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-warm-800 mb-2">{t("template.noteTitleLabel")}</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("template.noteTitlePlaceholder")}
                className="h-11 text-base bg-warm-50"
                autoFocus
              />
            </div>
            <div className="w-56 shrink-0">
              <div className="text-sm font-medium text-warm-800 mb-2">{t("template.categoryLabel")}</div>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="h-11 w-full rounded-md border border-warm-200 bg-warm-50 px-3 text-base text-warm-900 focus:outline-none focus:ring-2 focus:ring-warm-400"
              >
                <option value="">{t("template.categoryUncategorized")}</option>
                {categories
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {namePath(c.id)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-warm-800 mb-3">{t("template.chooseTemplateLabel")}</div>
            <div className="relative rounded-2xl border border-warm-200/70 bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-sky-50/70 p-3 overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-rose-200/40 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-sky-200/40 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-24 rounded-full bg-amber-200/30 blur-3xl" />
              <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEMPLATE_KEYS.map((key, i) => (
                  <TemplateCard
                    key={key}
                    index={i}
                    ttype={key}
                    selected={selected === key}
                    onSelect={() => { setSelected(key); setErrMsg(null) }}
                    onPreview={() => setPreviewType(key)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>{t("common.cancel")}</Button>
          <Button onClick={create} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="border-white border-t-transparent" />
                {t("common.loading")}
              </>
            ) : (
              t("template.createNote")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ExamplePreviewDialog
        ttype={previewType}
        onOpenChange={(o) => { if (!o) setPreviewType(null) }}
      />
    </Dialog>
  )
}
