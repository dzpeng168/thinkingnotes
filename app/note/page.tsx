"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/ui/tag-badge"
import { TemplateRenderer } from "@/components/templates/template-renderer"
import { SimpleMarkdownEditor } from "@/components/editor/simple-markdown-editor"
import { noteApi, tagApi, categoryApi } from "@/lib/api"
import { formatDate, cn, useTemplateMeta } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { useIsMobile } from "@/lib/use-mobile"
import type { Note, Tag as TagModel, TemplateType } from "@/lib/types"
import { useHotkey } from "@/components/hotkeys-context"
import { SettingsDialog } from "@/components/settings-dialog"
import { Spinner, LoadingScreen, TopProgressBar } from "@/components/ui/loading"
import {
  ArrowLeft, Save, Check, Edit3, PencilLine, Plus, Trash2,
  LayoutGrid, ClipboardList, Tag, BookOpen, CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
  Download, FileText, Printer, MoreVertical, Tags,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

const TEMPLATE_ICONS: Record<string, any> = {
  free: FileText, cornell: LayoutGrid, meeting_5w2h: ClipboardList,
  monthly_plan: CalendarDays, weekly_plan: Calendar, daily_plan: CalendarClock,
  woop: Sparkles, ride: MessageSquare, prep_method: ListOrdered,
  four_d_work: ListTodo, empathy_map: HeartHandshake, smart_goal: Target, grai: RotateCcw,
}

function NoteEditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, locale } = useT()
  const isMobile = useIsMobile()
  const noteId = searchParams.get("id") || ""
  // 从"新建笔记"落地时（edit=1）直接进入编辑模式
  const startInEditor = !isMobile && searchParams.get("edit") === "1"

  const [note, setNote] = useState<Note | null>(null)
  const [noteTags, setNoteTags] = useState<TagModel[]>([])
  const [allTags, setAllTags] = useState<TagModel[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState<"pdf" | "md" | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tagDialog, setTagDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // 移动端：顶栏「更多」菜单（简化编辑模式下收纳次要操作）
  const [mobileMenu, setMobileMenu] = useState(false)
  const saveTimer = useRef<any>(null)
  const loaded = useRef(false)
  const contentRef = useRef("")
  const titleRef = useRef("")
  const noteRef = useRef<Note | null>(null)

  useEffect(() => { noteRef.current = note }, [note])

  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { titleRef.current = title }, [title])

  useEffect(() => {
    if (!noteId) {
      router.replace("/")
      return
    }
    ;(async () => {
      try {
        const [n, allT, cats] = await Promise.all([noteApi.get(noteId), tagApi.list(), categoryApi.list()])
        setNote(n)
        setTitle(n.title)
        setContent(n.content)
        setAllTags(allT)
        setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })))
        const list = await noteApi.list()
        const item = list.find(x => x.id === n.id)
        if (item) setNoteTags(item.tags)
        loaded.current = true
      } catch (e) {
        console.error(e)
        alert(t("note.loadFailed") + (e as any))
        router.replace("/")
      }
    })()
  }, [noteId, router, t])

  // 离开页面时补一次保存：防抖窗口（600ms）内的改动在移动端"直接返回列表"时很容易丢
  useEffect(() => {
    return () => {
      const n = noteRef.current
      if (!n || !loaded.current) return
      clearTimeout(saveTimer.current)
      const patch: { title?: string; content?: string } = {}
      if (titleRef.current !== n.title) patch.title = titleRef.current
      if (contentRef.current !== n.content) patch.content = contentRef.current
      if (Object.keys(patch).length > 0) void noteApi.update(n.id, patch)
    }
  }, [])

  const triggerSave = (patch: { title?: string; content?: string }) => {
    if (!loaded.current || !note) return
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        const updated = await noteApi.update(note.id, patch)
        setNote(updated)
        setSaved(true)
      } catch (e) {
        console.error("save failed", e)
      } finally {
        setSaving(false)
      }
    }, 600)
  }

  const onTitleChange = (v: string) => {
    setTitle(v)
    triggerSave({ title: v })
  }

  const onContentChange = (v: string) => {
    setContent(v)
    triggerSave({ content: v })
  }

  const forceSave = useCallback(async () => {
    if (!loaded.current || !note) return
    clearTimeout(saveTimer.current)
    setSaving(true)
    try {
      const patch: { title?: string; content?: string } = {}
      if (titleRef.current !== note.title) patch.title = titleRef.current
      if (contentRef.current !== note.content) patch.content = contentRef.current
      if (Object.keys(patch).length === 0) {
        setSaving(false)
        setSaved(true)
        return
      }
      const updated = await noteApi.update(note.id, patch)
      setNote(updated)
      setSaved(true)
    } catch (e) {
      console.error("force save failed", e)
    } finally {
      setSaving(false)
    }
  }, [note])

  const toggleEditorMode = useCallback(() => {
    const ev = new CustomEvent("thinknote:editor-toggle-mode")
    window.dispatchEvent(ev)
  }, [])

  const editorSearch = useCallback(() => {
    const ev = new CustomEvent("thinknote:editor-search")
    window.dispatchEvent(ev)
  }, [])

  const openSettingsHere = useCallback(() => {
    setShowSettings(true)
  }, [])

  useHotkey("app.save", forceSave)
  useHotkey("editor.toggle-mode", toggleEditorMode)
  useHotkey("editor.search", editorSearch)
  useHotkey("app.open-settings", openSettingsHere)

  useEffect(() => {
    const h1 = () => setDeleteDialog(true)
    const h2 = () => setTagDialog(true)
    const h3 = () => setEditingTitle(true)
    window.addEventListener("thinknote:editor-delete", h1)
    window.addEventListener("thinknote:editor-tags", h2)
    window.addEventListener("thinknote:editor-title", h3)
    return () => {
      window.removeEventListener("thinknote:editor-delete", h1)
      window.removeEventListener("thinknote:editor-tags", h2)
      window.removeEventListener("thinknote:editor-title", h3)
    }
  }, [])

  const refreshTags = async () => {
    const allT = await tagApi.list()
    setAllTags(allT)
    const list = await noteApi.list()
    const item = list.find(x => x.id === noteId)
    if (item) setNoteTags(item.tags)
  }

  const toggleTag = async (tagId: string, on: boolean) => {
    if (!note) return
    if (on) await tagApi.addToNote(note.id, tagId)
    else await tagApi.removeFromNote(note.id, tagId)
    await refreshTags()
  }

  const createTag = async (name: string) => {
    try { await tagApi.create(name, "#e67e48"); await refreshTags() } catch {}
  }

  const doDelete = async () => {
    if (!note) return
    await noteApi.delete(note.id)
    router.push("/")
  }

  // 清理文件名中的非法字符
  const sanitizeFilename = (name: string) =>
    name.replace(/[\\/:*?"<>|\r\n\t]/g, "_").replace(/\s+/g, " ").trim() || t("note.untitledNote")

  // 导出 Markdown：前端 Blob 下载（替代桌面版写本地文件）
  const exportMarkdown = async () => {
    if (!note) return
    try {
      const blob = new Blob([contentRef.current], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = sanitizeFilename(titleRef.current) + ".md"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert(t("note.exportMarkdownSuccess"))
    } catch (e) {
      console.error(e)
      alert(t("note.exportMarkdownFailed") + (e as Error).message)
    }
  }

  // 导出 PDF：html2canvas 截取完整内容 → jsPDF 生成单页自定义尺寸 PDF → 浏览器下载
  const exportPDF = async () => {
    if (!note) return
    setExporting("pdf")
    try {
      // 动态 import（减少首屏打包体积）
      const { default: html2canvas } = await import("html2canvas")
      const { default: jsPDF } = await import("jspdf")

      // 定位编辑器 DOM（ProseMirror 内容区）
      const editorEl = document.querySelector<HTMLElement>(".thinkingnotes-milkdown")
      if (!editorEl) { alert(t("note.editorNotReady")); return }

      // —— 1. 截取完整内容 ——
      // A4 宽度 210mm ≈ 794px @ 96dpi
      const A4_FULL_PX = 794
      const MARGIN_MM = 12
      const DPI = 96
      const MM_PER_PX = 25.4 / DPI
      const SCALE = 2 // 高清截图

      // 临时克隆 DOM 到 body，脱离 overflow 容器，确保 html2canvas 能拿到完整高度
      const clone = editorEl.cloneNode(true) as HTMLElement
      // 克隆后的子元素也要去掉 max-width 限制，让它展开
      clone.style.position = "absolute"
      clone.style.left = "-9999px"
      clone.style.top = "0"
      clone.style.width = `${A4_FULL_PX}px`
      clone.style.height = "auto"
      clone.style.minHeight = "auto"
      clone.style.maxHeight = "none"
      clone.style.overflow = "visible"
      clone.style.background = "#ffffff"
      clone.style.padding = "16px 20px"
      // 展开所有 overflow 子容器
      clone.querySelectorAll<HTMLElement>("*").forEach(el => {
        const st = getComputedStyle(el)
        if (st.overflow === "auto" || st.overflow === "scroll" || st.maxHeight !== "none") {
          el.style.overflow = "visible"
          el.style.maxHeight = "none"
          el.style.height = "auto"
        }
      })
      document.body.appendChild(clone)

      const canvas = await html2canvas(clone, {
        width: A4_FULL_PX,
        windowWidth: A4_FULL_PX,
        scale: SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      })

      document.body.removeChild(clone)

      // —— 2. 计算 PDF 自定义一页尺寸（绝对没空白页）——
      const contentHeightMM = (canvas.height / SCALE) * MM_PER_PX
      const pageHeightMM = Math.max(contentHeightMM + MARGIN_MM * 2, 50)
      const contentWidthMM = 210 - MARGIN_MM * 2 // 186mm

      // —— 3. 生成 PDF ——
      const pdf = new jsPDF({
        unit: "mm",
        format: [210, pageHeightMM],
        compress: true,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.92)
      const imgHeightMM = (contentWidthMM / canvas.width) * canvas.height
      pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, contentWidthMM, imgHeightMM)

      // —— 4. 浏览器直接下载 ——
      const defaultName = sanitizeFilename(titleRef.current) + ".pdf"
      pdf.save(defaultName)
      alert(t("note.exportPDFSuccess"))
    } catch (e) {
      console.error(e)
      alert(t("note.exportPDFFailed") + (e as Error).message)
    } finally {
      setExporting(null)
    }
  }

  // Hooks 必须在任何 early return 之前调用（保证顺序一致）
  const meta = useTemplateMeta(note?.template_type || "")
  const Icon = TEMPLATE_ICONS[note?.template_type || ""] || LayoutGrid
  const ttype = (note?.template_type || "cornell") as TemplateType

  if (!note) {
    return <LoadingScreen text={t("common.loading")} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-100/40">
      {exporting && <TopProgressBar />}
      <header className="bg-warm-50 border-b border-warm-200 sticky top-0 z-30 backdrop-blur-sm">
        <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-warm-700">
              <ArrowLeft className="w-4 h-4" /> {t("note.backHome")}
            </Button>
          </Link>

          <div className="h-6 w-px bg-warm-200 hidden sm:block" />

          <div className={`flex-1 min-w-[120px] max-w-2xl ${isMobile ? "min-w-0" : "min-w-[240px]"}`}>
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false) }}
                autoFocus
                className={`h-10 font-bold bg-warm-100 border-warm-300 ${isMobile ? "text-lg" : "text-xl"}`}
              />
            ) : (
              <div
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 group cursor-text px-2 py-1 rounded-lg hover:bg-warm-100"
              >
                <h1 className={`font-bold text-warm-900 truncate ${isMobile ? "text-lg" : "text-xl"}`}>
                  {title || <span className="text-warm-400 italic">{t("note.clickToInputTitle")}</span>}
                </h1>
                <Edit3 className={`w-4 h-4 text-warm-400 ${isMobile ? "" : "opacity-0 group-hover:opacity-100"}`} />
              </div>
            )}
          </div>

          {/* 移动端：保存状态 + 更多菜单（导出/标签/删除收纳其中，桌面端在右侧横排） */}
          {isMobile && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "px-2 h-8 rounded-lg flex items-center text-xs font-medium",
                  saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-warm-100 text-warm-700 border border-warm-300"
                )}
              >
                {saving ? <Spinner size="sm" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </div>
              <button
                type="button"
                aria-label={t("common.more")}
                onClick={() => setMobileMenu(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-warm-600 hover:bg-warm-100 active:bg-warm-200 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          )}

          {!isMobile && (
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="ghost" size="sm" className="text-warm-700 hover:text-warm-900 hover:bg-warm-100" onClick={exportMarkdown} disabled={exporting !== null}>
              <FileText className="w-4 h-4" /> {t("note.exportMarkdown")}
            </Button>
            <Button variant="ghost" size="sm" className="text-warm-700 hover:text-warm-900 hover:bg-warm-100" onClick={exportPDF} disabled={exporting !== null}>
              {exporting === "pdf" ? <Spinner size="sm" /> : <Printer className="w-4 h-4" />}
              {exporting === "pdf" ? t("common.loading") : t("note.exportPDF")}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="w-4 h-4" /> {t("common.delete")}
            </Button>
            <div
              className={cn(
                "px-3 h-9 rounded-lg flex items-center gap-2 text-xs font-medium",
                saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-warm-100 text-warm-700 border border-warm-300"
              )}
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  {t("note.saving")}
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" /> {t("note.autoSaved")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {t("note.pendingSave")}
                </>
              )}
            </div>
          </div>
          )}
        </div>
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
          {/* 笔记分类 chip */}
          {note.category_id && (() => {
            const cat = categories.find((c: any) => c.id === note.category_id)
            return cat ? (
              <TagBadge color="#3b82f6" className="gap-1">
                <BookOpen className="w-3 h-3" />
                {cat.name}
              </TagBadge>
            ) : null
          })()}

          {/* 模板 chip */}
          <TagBadge color="#8b5cf6" className="gap-1">
            <Icon className="w-3 h-3" />
            {meta.name}
          </TagBadge>

          {/* 标签 chips — 移动端只读时不可关闭 */}
          {noteTags.map(t => (
            <TagBadge
              key={t.id}
              color={t.color}
              closable={!isMobile}
              onClose={!isMobile ? () => toggleTag(t.id, false) : undefined}
            >{t.name}</TagBadge>
          ))}

          {/* 管理标签入口 — 移动端隐藏 */}
          {!isMobile && (
          <button
            onClick={() => setTagDialog(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-warm-300 px-2.5 py-0.5 text-xs text-warm-500 hover:border-warm-400 hover:text-warm-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t("note.createLabel")}
          </button>
          )}

          {/* 右侧时间信息 — 移动端简化 */}
          <div className={`${isMobile ? "" : "ml-auto"} text-xs text-warm-500 flex items-center gap-3 flex-wrap`}>
            <span>{t("note.createdAt")}{formatDate(note.created_at, locale)}</span>
            <span className="hidden sm:inline">{t("note.updatedAtLabel")}{formatDate(note.updated_at, locale)}</span>
            {!isMobile && meta.desc && <span className="hidden md:inline text-warm-600">💡 {meta.desc}</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 p-2 sm:p-5 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl bg-warm-50 border border-warm-200 shadow-warm p-2 sm:p-5 overflow-hidden flex flex-col">
          {/* 打印时显示的标题 */}
          <div className="print-only">{title}</div>
          {isMobile ? (
            /* 移动端：简化编辑模式（原生 textarea 直写 Markdown + 预览切换）
               桌面端的 Milkdown 富文本在手机上选区/输入法体验差，这里刻意降级 */
            <SimpleMarkdownEditor
              value={content}
              onChange={onContentChange}
              initialMode={startInEditor ? "edit" : "preview"}
            />
          ) : (
            <TemplateRenderer
              template={ttype}
              value={content}
              onChange={onContentChange}
              noteId={noteId}
              initialMode={startInEditor ? "editor" : undefined}
            />
          )}
        </div>
      </main>

      {/* 移动端「更多」菜单：导出 / 标签 / 删除 */}
      <Dialog open={mobileMenu} onOpenChange={setMobileMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.more")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <button
              onClick={() => { setMobileMenu(false); exportMarkdown() }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-warm-800 hover:bg-warm-100 transition-colors"
            >
              <FileText className="w-4 h-4 text-warm-500" /> {t("note.exportMarkdown")}
            </button>
            <button
              onClick={() => { setMobileMenu(false); setTagDialog(true) }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-warm-800 hover:bg-warm-100 transition-colors"
            >
              <Tags className="w-4 h-4 text-warm-500" /> {t("note.manageTags")}
            </button>
            <button
              onClick={() => { setMobileMenu(false); void forceSave() }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-warm-800 hover:bg-warm-100 transition-colors"
            >
              <Save className="w-4 h-4 text-warm-500" /> {t("common.save")}
            </button>
            <button
              onClick={() => { setMobileMenu(false); setDeleteDialog(true) }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> {t("common.delete")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialog} onOpenChange={setTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-warm-600" /> {t("note.manageTags")}
            </DialogTitle>
          </DialogHeader>
          <TagManagerContent
            noteTagIds={new Set(noteTags.map(t => t.id))}
            allTags={allTags}
            onToggle={toggleTag}
            onCreate={createTag}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("note.deleteTitle")}</DialogTitle>
            <p className="text-sm text-warm-600 mt-2">{t("note.deleteHint")}</p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={doDelete}><Trash2 className="w-4 h-4" /> {t("note.moveToTrash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
}

function TagManagerContent({
  noteTagIds, allTags, onToggle, onCreate,
}: {
  noteTagIds: Set<string>
  allTags: TagModel[]
  onToggle: (tagId: string, on: boolean) => void
  onCreate: (name: string) => void
}) {
  const { t } = useT()
  const [name, setName] = useState("")
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder={t("note.newTagPlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => { if (name.trim()) { onCreate(name.trim()); setName("") } }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="max-h-72 overflow-auto space-y-1 border border-warm-200 rounded-lg p-2 bg-warm-50">
        {allTags.map(tag => {
          const on = noteTagIds.has(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onToggle(tag.id, !on)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${on ? "bg-warm-500 text-white shadow-warm" : "bg-white hover:bg-warm-100 border border-warm-100"}`}
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: on ? "white" : tag.color }} />
                {tag.name}
              </span>
              {on ? <Check className="w-4 h-4" /> : <span className="text-xs text-warm-400">{t("common.clickToAdd")}</span>}
            </button>
          )
        })}
        {allTags.length === 0 && (
          <div className="text-xs text-warm-500 text-center py-8">{t("note.tagsEmptyHint")}</div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={() => {}}>{t("common.complete")}</Button>
      </DialogFooter>
    </div>
  )
}

export default function NoteEditPage() {
  const { t } = useT()
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-warm-50">{t("common.loading")}</div>}>
      <NoteEditContent />
    </Suspense>
  )
}
