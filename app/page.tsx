"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/ui/tag-badge"
import { NoteCardSkeleton, TopProgressBar, Spinner } from "@/components/ui/loading"
import { ThemeToggle } from "@/components/theme-toggle"
import { NewNoteDialog } from "@/components/new-note-dialog"
import { CategoryTree } from "@/components/category-tree"
import { CalendarView } from "@/components/calendar-view"
import { AppRail } from "@/components/app-rail"
import { SettingsDialog } from "@/components/settings-dialog"
import { TagFilterDialog } from "@/components/tag-filter-dialog"
import { HotkeysDialog } from "@/components/hotkeys-dialog"
import { ExamplePreviewDialog } from "@/components/example-preview-dialog"
import { SiteFooter } from "@/components/site-footer"
import { useHotkey } from "@/components/hotkeys-context"
import {
  Search, Plus, Trash2, Edit3, PencilLine, LayoutGrid, ClipboardList, HardHat,
  BookOpen, Check, Tag as TagIcon, FolderInput, Calendar, CalendarDays, CalendarClock,
  ChevronLeft, ChevronRight, RotateCcw, Trash, FileText, Eye, LogIn, AlertCircle,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target,
} from "lucide-react"
import { noteApi, tagApi, categoryApi, trashApi, bootstrap, ApiError } from "@/lib/api"
import { formatDate, resolveTemplateMeta, useTemplateMeta } from "@/lib/utils"
import { collectDescendantIds } from "@/lib/category"
import { getGuestData } from "@/lib/guest-data"
import { useT } from "@/lib/i18n"
import { useIsMobile } from "@/lib/use-mobile"
import type { NoteListItem, Tag as TagModel, Category, TemplateType } from "@/lib/types"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

const TEMPLATE_ICONS: Record<string, any> = {
  free: FileText, cornell: LayoutGrid, meeting_5w2h: ClipboardList, six_hats: HardHat,
  monthly_plan: CalendarDays, weekly_plan: Calendar, daily_plan: CalendarClock,
  woop: Sparkles, ride: MessageSquare, prep_method: ListOrdered,
  four_d_work: ListTodo, empathy_map: HeartHandshake, smart_goal: Target, grai: RotateCcw,
}

// 模板徽章配色：每个模板固定一种柔和色调（与登录页风格一致，避免单调）
const TEMPLATE_BADGE_STYLES: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  cornell: "bg-rose-100 text-rose-700",
  meeting_5w2h: "bg-amber-100 text-amber-700",
  six_hats: "bg-violet-100 text-violet-700",
  eisenhower_matrix: "bg-emerald-100 text-emerald-700",
  monthly_plan: "bg-sky-100 text-sky-700",
  weekly_plan: "bg-teal-100 text-teal-700",
  daily_plan: "bg-cyan-100 text-cyan-700",
  woop: "bg-fuchsia-100 text-fuchsia-700",
  ride: "bg-orange-100 text-orange-700",
  prep_method: "bg-lime-100 text-lime-700",
  four_d_work: "bg-indigo-100 text-indigo-700",
  empathy_map: "bg-pink-100 text-pink-700",
  smart_goal: "bg-blue-100 text-blue-700",
  grai: "bg-stone-200 text-stone-700",
}

type Selection = string | "all" | "uncategorized" | null

function NoteCard({
  note,
  categories,
  onMove,
  onTags,
  onRename,
  onDelete,
  onClick,
}: {
  note: NoteListItem
  categories: Category[]
  onMove: (id: string) => void
  onTags: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
}) {
  const { t, locale } = useT()
  const meta = useTemplateMeta(note.template_type)
  const Icon = TEMPLATE_ICONS[note.template_type] || LayoutGrid
  const _ = categories
  void _
  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-warm-200 bg-white p-6 transition-all hover:border-warm-400 hover:shadow-md cursor-pointer"
      onClick={() => onClick(note.id)}
    >
      {/* hover 操作按钮 - 绝对定位右上 */}
      <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
          title={t("note.tooltipMoveCategory")}
          onClick={(e) => { e.stopPropagation(); onMove(note.id) }}
        >
          <FolderInput className="w-3.5 h-3.5" />
        </button>
        <button
          className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
          title={t("note.tooltipTags")}
          onClick={(e) => { e.stopPropagation(); onTags(note.id) }}
        >
          <TagIcon className="w-3.5 h-3.5" />
        </button>
        <button
          className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
          title={t("note.tooltipRename")}
          onClick={(e) => { e.stopPropagation(); onRename(note.id, note.title) }}
        >
          <PencilLine className="w-3.5 h-3.5" />
        </button>
        <button
          className="w-7 h-7 rounded-md hover:bg-red-50 text-red-500 flex items-center justify-center"
          title={t("note.tooltipDelete")}
          onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 顶部：模板名（圆角标签） */}
      <div className="flex items-center justify-between mb-4 pr-20">
        <span className="flex-1 text-left">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-warm-600 whitespace-nowrap">
            {meta.name}
          </span>
        </span>
      </div>

      {/* 标题：固定 2 行高度 */}
      <h3 className="text-base font-semibold text-warm-900 leading-relaxed line-clamp-2 min-h-[3em] mb-4">
        {note.title || <span className="text-warm-400 italic font-normal">{t("note.untitledNote")}</span>}
      </h3>

      {/* 标签：固定高度占位，无标签时显示占位文字 */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[22px]">
        {note.tags.length > 0 ? (
          note.tags.slice(0, 3).map((t) => (
            <TagBadge key={t.id} color={t.color}>{t.name}</TagBadge>
          ))
        ) : (
          <span className="text-xs text-warm-300">{t("note.noTags")}</span>
        )}
        {note.tags.length > 3 && (
          <span className="text-xs text-warm-400 self-center">+{note.tags.length - 3}</span>
        )}
      </div>

      {/* 底部 meta - mt-auto 推到底部 */}
      <div className="mt-auto pt-4 border-t border-warm-100 flex items-center justify-between text-xs text-warm-400">
        <span>{formatDate(note.updated_at, locale)}</span>
        <span className="flex items-center gap-1 text-warm-500">
          <Edit3 className="w-3 h-3" /> {t("note.updatedAt")}
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useT()
  const isMobile = useIsMobile()
  // 移动端也视为只读：隐藏所有创建/编辑/删除入口
  const mobileReadOnly = isMobile
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [tags, setTags] = useState<TagModel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [keyword, setKeyword] = useState("")
  const [selection, setSelection] = useState<Selection>("all")
  const [showNew, setShowNew] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [trashedNotes, setTrashedNotes] = useState<NoteListItem[]>([])
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null)
  const [tagDialog, setTagDialog] = useState<string | null>(null)
  const [moveDialog, setMoveDialog] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [showSettings, setShowSettings] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  // 列表加载状态：true 时渲染骨架屏而非空状态，用动画替代闪烁
  const [loading, setLoading] = useState(true)
  // 列表数据最后一次就绪的时间戳，用于触发卡片动画重新播放
  const [listLoadedAt, setListLoadedAt] = useState<number>(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 游客模式：null = 尚未检测（挂载后读取 cookie）；true = 只读浏览示例数据
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [previewTtype, setPreviewTtype] = useState<TemplateType | null>(null)
  useEffect(() => {
    try {
      setIsGuest(document.cookie.split("; ").includes("tn_guest=1"))
    } catch {
      setIsGuest(false)
    }
  }, [])

  // 游客退出：清 cookie 回登录页
  const exitGuest = () => {
    document.cookie = "tn_guest=; path=/; max-age=0"
    window.location.href = "/login"
  }

  // 左侧目录宽度（可拖拽调整 + localStorage 持久化）
  const DEFAULT_SIDEBAR_W = 256
  const MIN_SIDEBAR_W = 200
  const MAX_SIDEBAR_W = 520
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_W)
  // 挂载后再读取持久化宽度，避免首帧与 SSR 输出不一致导致 hydration 错误
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("thinkingnotes:sidebar-width")
      const n = saved ? Number(saved) : NaN
      if (Number.isFinite(n)) {
        setSidebarWidth(Math.min(Math.max(n, MIN_SIDEBAR_W), MAX_SIDEBAR_W))
      }
    } catch {}
  }, [])
  const draggingRef = useRef<{ startX: number; startW: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = { startX: e.clientX, startW: sidebarWidth }
    setIsResizing(true)
  }
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current
      if (!d) return
      const w = Math.min(Math.max(d.startW + (e.clientX - d.startX), MIN_SIDEBAR_W), MAX_SIDEBAR_W)
      setSidebarWidth(w)
    }
    const onUp = () => {
      draggingRef.current = null
      setIsResizing(false)
      setSidebarWidth((w) => {
        try { window.localStorage.setItem("thinkingnotes:sidebar-width", String(w)) } catch {}
        return w
      })
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [isResizing])

  // 每页展示 4 列 × 2 行 = 8 条
  const PAGE_SIZE = 8

  // 并发保护：只应用最后一次请求的结果，避免慢请求覆盖新请求造成列表闪空
  const refreshSeqRef = useRef(0)
  // 列表加载失败信息（仅当确实没有数据时才展示错误态，而不是装作"没有笔记"）
  const [loadError, setLoadError] = useState<string | null>(null)
  // 避免在切换语言时重建 refresh 导致额外刷新
  const localeRef = useRef(locale)
  useEffect(() => { localeRef.current = locale }, [locale])

  const refresh = useCallback(async (silent = false) => {
    const seq = ++refreshSeqRef.current
    // 非静默刷新（例如首次加载、从详情页返回、切换 tab）时展示骨架屏
    if (!silent) setLoading(true)
    try {
      // 游客模式：使用本地示例数据，不请求后端
      if (isGuest) {
        const gd = getGuestData(localeRef.current)
        if (seq !== refreshSeqRef.current) return
        setNotes(gd.notes); setTags(gd.tags); setCategories(gd.categories)
        setLoadError(null)
        return
      }
      // 合并为单次 bootstrap 请求：1 次 HTTP + 1 次 requireUser RPC，替代原先的 3 次
      // 请求层已对 401 做"续期后重放"，这里再补最多 2 次退避重试，抵御偶发网络抖动
      let data: Awaited<ReturnType<typeof bootstrap>> | null = null
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          data = await bootstrap()
          lastErr = null
          break
        } catch (e) {
          lastErr = e
          if (e instanceof ApiError && e.status === 401) break // 会话确实失效，别再重试
          if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
        }
      }
      if (seq !== refreshSeqRef.current) return
      if (!data) {
        if (lastErr instanceof ApiError && lastErr.status === 401) {
          // 会话真的没了：回登录页，而不是让用户对着空列表发呆
          window.location.href = "/login"
          return
        }
        setLoadError(lastErr instanceof Error ? lastErr.message : String(lastErr))
        return
      }
      setNotes(data.notes); setTags(data.tags); setCategories(data.categories)
      setLoadError(null)
    } catch (e) { console.error(e) }
    finally {
      if (seq === refreshSeqRef.current) {
        setLoading(false)
        // 记录数据就绪的时间戳 → 触发卡片入场动画重新播放
        setListLoadedAt(Date.now())
      }
    }
  }, [isGuest])

  // 1. 挂载且游客检测完成后加载列表
  // 2. pathname 变化：当从详情页 router.push("/") 返回本页时，pathname 从 /note 变回 /，触发刷新
  // 3. 页面从后台切回前台（tab 切换回来）时刷新，保证数据最新
  useEffect(() => {
    if (isGuest === null) return
    if (pathname !== "/") return
    void refresh()
  }, [isGuest, pathname, refresh])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isGuest !== null && pathname === "/") {
        void refresh(true)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [isGuest, pathname, refresh])

  const openNew = useCallback(() => {
    // 游客模式 / 移动端：只读，提示登录或回桌面端创建
    if (isGuest) {
      alert(t("guest.previewOnly"))
      return
    }
    if (mobileReadOnly) {
      alert(t("mobile.readOnlyHint"))
      return
    }
    setShowNew(true)
  }, [isGuest, mobileReadOnly, t])
  const openSettings = useCallback(() => setShowSettings(true), [])
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [])
  const openTagFilter = useCallback(() => setShowTagFilter(true), [])
  const openGraphView = useCallback(() => {
    alert(t("app.graphViewComingSoon"))
  }, [t])

  useHotkey("app.new-note", openNew)
  useHotkey("app.open-settings", openSettings)
  useHotkey("app.global-search", focusSearch)
  useHotkey("app.graph-view", openGraphView)

  useEffect(() => {
    const h1 = () => openNew()
    const h2 = () => setShowSettings(true)
    const h3 = () => setShowTagFilter(true)
    const h4 = () => {
      setTimeout(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }, 60)
    }
    const h5 = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.view) setViewMode(detail.view as "list" | "calendar")
    }
    const h6 = (e: Event) => {
      const id = (e as CustomEvent).detail?.id
      if (id) setSelection(id)
      else setSelection("all")
    }
    window.addEventListener("thinknote:new-note", h1)
    window.addEventListener("thinknote:open-settings", h2)
    window.addEventListener("thinknote:open-tag-filter", h3)
    window.addEventListener("thinknote:focus-search", h4)
    window.addEventListener("thinknote:set-view", h5)
    window.addEventListener("thinknote:select-category", h6)
    return () => {
      window.removeEventListener("thinknote:new-note", h1)
      window.removeEventListener("thinknote:open-settings", h2)
      window.removeEventListener("thinknote:open-tag-filter", h3)
      window.removeEventListener("thinknote:focus-search", h4)
      window.removeEventListener("thinknote:set-view", h5)
      window.removeEventListener("thinknote:select-category", h6)
    }
  }, [openNew])

  // 计算每个分类的笔记数（仅直接归属，不累计子分类，累计由 buildCategoryTree 完成）
  const noteCounts: Record<string, number> = {}
  let uncategorizedCount = 0
  for (const n of notes) {
    if (n.category_id) {
      noteCounts[n.category_id] = (noteCounts[n.category_id] ?? 0) + 1
    } else {
      uncategorizedCount += 1
    }
  }

  // 当前选中分类对应的笔记列表
  const visibleNotes: NoteListItem[] = (() => {
    if (selection === "all") return notes
    if (selection === "uncategorized") return notes.filter((n) => !n.category_id)
    if (selection === null) return notes
    // 选中具体分类：先用全量 notes 做前端过滤作为兜底（catNotes 拉取完成前不会显示错误的全量）
    const ids = new Set(collectDescendantIds(categories, selection))
    return notes.filter((n) => n.category_id && ids.has(n.category_id))
  })()

  // 选中分类时拉取（含子分类）；游客模式用本地示例数据过滤
  const [catNotes, setCatNotes] = useState<NoteListItem[] | null>(null)
  const catLoadingRef = useRef(false)
  useEffect(() => {
    if (selection === "all" || selection === "uncategorized" || selection === null) {
      setCatNotes(null)
      return
    }
    if (isGuest === null) return
    if (pathname !== "/") return
    if (isGuest) {
      const gd = getGuestData(locale)
      const ids = new Set(collectDescendantIds(gd.categories, selection))
      setCatNotes(gd.notes.filter((n) => n.category_id && ids.has(n.category_id)))
      return
    }
    // 切到具体分类时短暂显示骨架，给 API 拉取留出过渡窗口，避免闪烁
    if (!catLoadingRef.current) {
      catLoadingRef.current = true
      setLoading(true)
    }
    let cancelled = false
    noteApi.byCategory(selection, true).then((ns) => {
      if (!cancelled) {
        setCatNotes(ns)
        setLoading(false)
        setListLoadedAt(Date.now())
        catLoadingRef.current = false
      }
    }).catch((e) => {
      console.error(e)
      if (!cancelled) { setLoading(false); catLoadingRef.current = false }
    })
    return () => { cancelled = true }
  }, [selection, isGuest, pathname, categories])

  // 筛选条件变化时回到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [keyword, selection, filterTagIds])

  // 最终展示的笔记列表（再叠加关键词 + 标签过滤）
  const baseNotes = catNotes ?? visibleNotes
  const filteredNotes = (() => {
    const kw = keyword.trim().toLowerCase()
    const tagSet = new Set(filterTagIds)
    return baseNotes.filter((n) => {
      // 标签筛选：必须包含选中标签中的任意一个（OR）
      if (tagSet.size > 0) {
        const hit = n.tags.some((t) => tagSet.has(t.id))
        if (!hit) return false
      }
      // 关键词筛选：标题或标签名
      if (!kw) return true
      return (
        n.title.toLowerCase().includes(kw) ||
        n.tags.some((t) => t.name.toLowerCase().includes(kw))
      )
    })
  })()

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedNotes = filteredNotes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // 状态标题
  const currentCategoryName = (() => {
    if (selection === "all") return t("note.allNotes")
    if (selection === "uncategorized") return t("note.uncategorized")
    return categories.find((c) => c.id === selection)?.name ?? t("note.fallbackLabel")
  })()

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await noteApi.delete(deleteId)
      await refresh()
      await refreshTrash()
    } finally { setDeleteId(null) }
  }

  const refreshTrash = async () => {
    // 游客模式无回收站数据（只读示例）
    if (isGuest) return
    try {
      const list = await trashApi.list()
      setTrashedNotes(list)
    } catch (e) { console.error(e) }
  }

  const openTrash = async () => {
    await refreshTrash()
    setShowTrash(true)
  }

  const handleRestore = async (id: string) => {
    try {
      await trashApi.restore(id)
      await refresh()
      await refreshTrash()
    } catch (e) { console.error(e) }
  }

  const handlePermanentDelete = async (id: string) => {
    try {
      await trashApi.permanentDelete(id)
      await refreshTrash()
    } catch (e) { console.error(e) }
    setPermanentDeleteId(null)
  }

  const confirmRename = async () => {
    if (!renameId || !renameVal.trim()) return
    try { await noteApi.rename(renameId, renameVal.trim()); await refresh() } finally { setRenameId(null) }
  }

  const addNoteTag = async (noteId: string, tagId: string) => {
    await tagApi.addToNote(noteId, tagId); await refresh()
  }
  const removeNoteTag = async (noteId: string, tagId: string) => {
    await tagApi.removeFromNote(noteId, tagId); await refresh()
  }
  const createTag = async () => {
    if (!newTag.trim()) return
    try { await tagApi.create(newTag.trim()); setNewTag(""); await refresh() } catch {}
  }

  const moveNote = async (noteId: string, targetCategoryId: string | null) => {
    try {
      await noteApi.moveToCategory(noteId, targetCategoryId)
      setMoveDialog(null)
      await refresh()
    } catch (e) {
      console.error(e)
      alert(t("note.moveCategoryFailed") + (e as any))
    }
  }

  // 分类下拉路径
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
    <div className={`min-h-screen bg-gradient-to-b from-warm-100/70 via-warm-50 to-warm-50 flex ${isResizing ? "select-none" : ""}`} style={isResizing ? { cursor: "col-resize" } : undefined}>
      {/* 最左侧竖条 Rail — 移动端隐藏 */}
      {!isMobile && (
      <AppRail
        onTagsClick={() => setShowTagFilter(true)}
        onSettingsClick={() => setShowSettings(true)}
        onTrashClick={openTrash}
        onHotkeysClick={() => setShowHotkeys(true)}
        trashCount={trashedNotes.length}
      />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className={`relative overflow-hidden bg-gradient-to-r from-warm-100 via-warm-50 to-warm-100 border-b border-warm-200 ${isMobile ? "" : ""}`}>
          {/* 顶栏柔和光斑 — 移动端隐藏 */}
          {!isMobile && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-[8%] w-72 h-48 rounded-full bg-rose-200/30 blur-3xl" />
            <div className="absolute -top-24 right-[8%] w-72 h-48 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[560px] h-32 rounded-full bg-sky-100/40 blur-3xl" />
          </div>
          )}
          <div className={`relative ${isMobile ? "" : "max-w-7xl mx-auto"} px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3 sm:gap-4`}>
            <div>
              <h1 className={`font-bold text-warm-900 tracking-tight ${isMobile ? "text-lg" : "text-2xl"}`}>{t("app.name")}</h1>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-end gap-2 sm:gap-3 flex-wrap min-w-0">
              <div className={`relative min-w-0 ${isMobile ? "w-full sm:w-80" : "w-80"}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <Input
                  ref={searchInputRef}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t("note.searchPlaceholder")}
                  className="pl-9 h-10 bg-warm-50 w-full"
                />
              </div>
              <ThemeToggle />
              {isGuest ? (
                /* 徽章 + 登录按钮成组，避免小屏换行后被拆到两行造成错位 */
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                    <Eye className="w-3.5 h-3.5" /> {t("guest.badge")}
                  </span>
                  <Button variant="outline" size="lg" onClick={exitGuest} className="shrink-0">
                    <LogIn className="w-4 h-4" /> {t("guest.signIn")}
                  </Button>
                </div>
              ) : (
                <>
                  {/* 移动端隐藏"新建笔记"按钮（改为只读浏览） */}
                  {!mobileReadOnly && (
                  <Button onClick={() => setShowNew(true)} size="lg" className={isMobile ? "hidden" : ""}>
                    <Plus className="w-5 h-5" /> {t("note.new")}
                  </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* 游客模式提示条 */}
        {isGuest && (
          <div className="border-b border-amber-200 bg-amber-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 text-xs text-amber-700 flex items-center justify-center gap-1.5 text-center">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              {t("guest.hint")}
            </div>
          </div>
        )}

        <main className="flex-1 w-full py-6 flex">
        {/* 左侧目录树（可拖拽调整宽度）— 移动端隐藏 */}
        {!isMobile && (
        <aside
          className="shrink-0 relative ml-5"
          style={{ width: `${sidebarWidth}px` }}
        >
          <CategoryTree
            categories={categories}
            noteCounts={noteCounts}
            totalCount={notes.length}
            uncategorizedCount={uncategorizedCount}
            selectedId={selection}
            onSelect={setSelection}
            onChanged={refresh}
            readOnly={!!isGuest || mobileReadOnly}
          />
          {/* 拖拽分隔条 — 移动端隐藏 */}
          {!isMobile && (
          <div
            onMouseDown={onResizeStart}
            onDoubleClick={() => {
              setSidebarWidth(DEFAULT_SIDEBAR_W)
              try { window.localStorage.setItem("thinkingnotes:sidebar-width", String(DEFAULT_SIDEBAR_W)) } catch {}
            }}
            title={t("sidebar.resizerTip")}
            className={`absolute top-0 right-[-3px] h-full w-[6px] cursor-col-resize z-10 group transition-colors ${
              isResizing ? "bg-warm-400/60" : "hover:bg-warm-400/40"
            }`}
          >
            <span
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full transition-colors ${
                isResizing ? "bg-warm-600" : "bg-warm-300 group-hover:bg-warm-500"
              }`}
            />
          </div>
          )}
        </aside>
        )}

        {/* 右侧笔记列表 */}
        <section className={`flex-1 min-w-0 ${isMobile ? "px-3" : "px-6 ml-2"}`}>
          <div className={`${isMobile ? "" : "max-w-7xl mx-auto"} w-full`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-warm-800 ${isMobile ? "text-base" : "text-lg"}`}>
              {currentCategoryName}
              <span className="ml-2 text-sm text-warm-500">{t("note.countText", { count: filteredNotes.length })}</span>
            </h2>
            {/* 视图切换 — 移动端隐藏（默认列表） */}
            {!isMobile && (
            <div className="flex items-center rounded-md border border-warm-200 p-0.5 bg-white">
              <button
                onClick={() => setViewMode("list")}
                className={`h-7 px-2.5 rounded flex items-center gap-1.5 text-xs transition-colors ${
                  viewMode === "list"
                    ? "bg-warm-100 text-warm-800 font-medium"
                    : "text-warm-500 hover:text-warm-700"
                }`}
                title={t("note.viewListTitle")}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> {t("note.viewList")}
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`h-7 px-2.5 rounded flex items-center gap-1.5 text-xs transition-colors ${
                  viewMode === "calendar"
                    ? "bg-warm-100 text-warm-800 font-medium"
                    : "text-warm-500 hover:text-warm-700"
                }`}
                title={t("note.viewCalendarTitle")}
              >
                <Calendar className="w-3.5 h-3.5" /> {t("note.viewCalendar")}
              </button>
            </div>
            )}
          </div>

          {loading ? (
            // 加载中：顶部进度条 + 骨架卡片（错峰淡入） + 底部 spinner + 提示文字
            <>
              <TopProgressBar />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 auto-rows-fr">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`skeleton-${listLoadedAt}-${i}`}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <NoteCardSkeleton />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-warm-500 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
                <Spinner size="sm" />
                <span>{t("note.loadingHint")}</span>
              </div>
            </>
          ) : loadError && notes.length === 0 ? (
            // 加载失败：明确告诉用户出错并可重试，而不是显示"还没有笔记"
            <div
              className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6 shadow-warm">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-warm-800 mb-2">
                {t("note.loadFailed")}
              </h2>
              <p className="text-warm-500 max-w-md mb-6 leading-relaxed break-all">
                {t("note.loadFailedHint")}
                <span className="block text-xs text-warm-400 mt-1">{loadError}</span>
              </p>
              <Button size="lg" onClick={() => void refresh()}>
                <RotateCcw className="w-5 h-5" /> {t("note.retry")}
              </Button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-warm-200 to-warm-300 flex items-center justify-center mb-6 shadow-warm">
                <BookOpen className="w-12 h-12 text-warm-600" />
              </div>
              <h2 className="text-xl font-semibold text-warm-800 mb-2">
                {keyword || selection !== "all" ? t("note.noNotesHere") : t("note.noNotesYet")}
              </h2>
              <p className="text-warm-500 max-w-md mb-6 leading-relaxed">
                {keyword || selection !== "all"
                  ? t("note.noNotesHintFiltered")
                  : t("note.noNotesHintEmpty")}
              </p>
              {!isGuest && !mobileReadOnly && (
                <Button size="lg" onClick={() => setShowNew(true)}>
                  <Plus className="w-5 h-5" /> {t("note.createFirst")}
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 auto-rows-fr">
                {paginatedNotes.map((note, idx) => {
                const meta = resolveTemplateMeta(note.template_type, locale, (k) => t(k as any))
                const Icon = TEMPLATE_ICONS[note.template_type] || LayoutGrid
                const noteCategory = note.category_id
                  ? categories.find((c) => c.id === note.category_id)
                  : null
                const delay = Math.min(idx, 16) * 60
                // 移动端/只读模式下：点击卡片时游客仍预览，其他用户也进入详情（详情页移动端只读）
                return (
                  <div
                    key={`${note.id}-${listLoadedAt}`}
                    className="group relative flex flex-col rounded-2xl border border-warm-200 bg-white p-6 transition-all hover:border-warm-400 hover:shadow-warm-lg cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${delay}ms` }}
                    onClick={() =>
                      isGuest
                        ? setPreviewTtype(note.template_type as TemplateType)
                        : router.push(`/note?id=${note.id}`)
                    }
                  >
                    {/* hover 操作按钮 — 游客/只读模式/移动端均隐藏 */}
                    {!isGuest && !mobileReadOnly && (
                    <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
                        title={t("note.tooltipMoveCategory")}
                        onClick={(e) => { e.stopPropagation(); setMoveDialog(note.id) }}
                      >
                        <FolderInput className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
                        title={t("note.tooltipTags")}
                        onClick={(e) => { e.stopPropagation(); setTagDialog(note.id) }}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-md hover:bg-warm-100 text-warm-500 flex items-center justify-center"
                        title={t("note.tooltipRename")}
                        onClick={(e) => { e.stopPropagation(); setRenameId(note.id); setRenameVal(note.title) }}
                      >
                        <PencilLine className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-md hover:bg-red-50 text-red-500 flex items-center justify-center"
                        title={t("note.tooltipDelete")}
                        onClick={(e) => { e.stopPropagation(); setDeleteId(note.id) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    )}

                    {/* 顶部：模板名（圆角标签）左 + 分类名 右，各占 50% */}
                    <div className="flex items-center justify-between mb-4 pr-20">
                      <span className="flex-1 text-left">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TEMPLATE_BADGE_STYLES[note.template_type] ?? "bg-warm-100 text-warm-600"}`}>
                          {meta.name}
                        </span>
                      </span>
                      {/* <span className="flex-1 text-right text-xs text-warm-500  whitespace-nowrap">
                        {noteCategory?.name ?? ""}
                      </span> */}
                    </div>

                    {/* 标题：固定 2 行高度 */}
                    <h3 className="text-base font-semibold text-warm-900 leading-relaxed line-clamp-2 min-h-[3em] mb-4">
                      {note.title || <span className="text-warm-400 italic font-normal">{t("note.untitledNote")}</span>}
                    </h3>

                    {/* 标签：固定高度占位，无标签时显示占位文字 */}
                    <div className="flex flex-wrap gap-1.5 mb-4 min-h-[22px]">
                      {note.tags.length > 0 ? (
                        note.tags.slice(0, 3).map((t) => (
                          <TagBadge key={t.id} color={t.color}>{t.name}</TagBadge>
                        ))
                      ) : (
                        <span className="text-xs text-warm-300">{t("note.noTags")}</span>
                      )}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-warm-400 self-center">+{note.tags.length - 3}</span>
                      )}
                    </div>

                    {/* 底部 meta - mt-auto 推到底部，所有卡片底边对齐 */}
                    <div className="mt-auto pt-4 border-t border-warm-100 flex items-center justify-between text-xs text-warm-400">
                      <span>{formatDate(note.updated_at)}</span>
                      <span className="flex items-center gap-1 text-warm-500">
                        <Edit3 className="w-3 h-3" /> {t("note.updatedAt")}
                      </span>
                    </div>
                  </div>
                )
              })}
              </div>

              {/* 分页控件（仅列表视图且有数据时显示） */}
              {filteredNotes.length > 0 && (
                <div
                  className="flex items-center justify-between mt-6 pt-4 border-t border-warm-100 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(paginatedNotes.length, 8) * 60 + 60}ms` }}
                >
                  <div className="text-xs text-warm-500">
                    {t("note.pageInfo", { total: filteredNotes.length, current: safePage, totalPages })}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 rounded-md border border-warm-200 bg-white text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      title={t("note.prevPage")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // 显示当前页附近的页码，省略远端页
                        if (totalPages <= 7) return true
                        if (p === 1 || p === totalPages) return true
                        return Math.abs(p - safePage) <= 1
                      })
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (arr[arr.length - 1] as number) < p - 1) {
                          acc.push("...")
                        }
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, idx) =>
                        p === "..." ? (
                          <span key={`dots-${idx}`} className="px-1 text-xs text-warm-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 min-w-[2rem] px-2 rounded-md text-xs font-medium transition-colors ${
                              p === safePage
                                ? "bg-warm-600 text-white"
                                : "border border-warm-200 bg-white text-warm-600 hover:bg-warm-100"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                    <button
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 w-8 rounded-md border border-warm-200 bg-white text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      title={t("note.nextPage")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div key={`calendar-${listLoadedAt}`} className="animate-fade-in-up">
              <CalendarView notes={filteredNotes} />
            </div>
          )}
          </div>
        </section>
      </main>

        <NewNoteDialog open={showNew} onOpenChange={setShowNew} />

        {/* 游客模式：点击示例笔记按模板类型预览示例 markdown */}
        <ExamplePreviewDialog ttype={previewTtype} onOpenChange={(o) => !o && setPreviewTtype(null)} />

        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

        <HotkeysDialog open={showHotkeys} onOpenChange={setShowHotkeys} />

        <TagFilterDialog
          open={showTagFilter}
          onOpenChange={setShowTagFilter}
          tags={tags}
          selected={filterTagIds}
          onToggle={(tagId) =>
            setFilterTagIds((cur) =>
              cur.includes(tagId) ? cur.filter((id) => id !== tagId) : [...cur, tagId],
            )
          }
          onClear={() => setFilterTagIds([])}
        />

      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("note.renameTitle")}</DialogTitle>
          </DialogHeader>
          <Input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} autoFocus className="h-11" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>{t("common.cancel")}</Button>
            <Button onClick={confirmRename} disabled={!renameVal.trim()}><Check className="w-4 h-4" /> {t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("note.deleteTitle")}</DialogTitle>
            <p className="text-sm text-warm-600 mt-2">{t("note.deleteHint")}</p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="w-4 h-4" /> {t("note.moveToTrash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tagDialog} onOpenChange={(o) => !o && setTagDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("note.manageTags")}</DialogTitle>
          </DialogHeader>
          {tagDialog && (() => {
            const note = notes.find((n) => n.id === tagDialog)
            const noteTagIds = new Set(note?.tags.map((t) => t.id) || [])
            return (
              <div className="space-y-4">
                <div className="text-sm text-warm-700">{t("note.tagCurrentNote")}<span className="font-semibold">{note?.title}</span></div>
                <div className="max-h-72 overflow-auto space-y-2 border border-warm-200 rounded-lg p-3 bg-warm-50">
                  {tags.map((tag) => {
                    const on = noteTagIds.has(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => on ? removeNoteTag(tagDialog, tag.id) : addNoteTag(tagDialog, tag.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${on ? "bg-warm-500 text-white" : "bg-white hover:bg-warm-100 border border-warm-100"}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: on ? "white" : tag.color }} />
                          {tag.name}
                        </span>
                        {on ? <Check className="w-4 h-4" /> : <span className="text-warm-400">{t("common.add")}</span>}
                      </button>
                    )
                  })}
                  {tags.length === 0 && <div className="text-xs text-warm-500 text-center py-6">{t("note.noTagsHint")}</div>}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("note.createTagPlaceholder")}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-8 text-sm bg-white"
                  />
                  <Button size="sm" variant="secondary" onClick={createTag}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button onClick={() => setTagDialog(null)}>{t("common.complete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveDialog} onOpenChange={(o) => !o && setMoveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("note.moveCategory")}</DialogTitle>
          </DialogHeader>
          {moveDialog && (() => {
            const note = notes.find((n) => n.id === moveDialog)
            return (
              <div className="space-y-3">
                <div className="text-sm text-warm-700">
                  {t("note.moveCategoryCurrentNote")}<span className="font-semibold">{note?.title}</span>
                </div>
                <select
                  defaultValue={note?.category_id ?? ""}
                  onChange={(e) => moveNote(moveDialog, e.target.value || null)}
                  className="h-11 w-full rounded-md border border-warm-200 bg-warm-50 px-3 text-base text-warm-900 focus:outline-none focus:ring-2 focus:ring-warm-400"
                  autoFocus
                >
                  <option value="">{t("note.moveToUncategorized")}</option>
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
            )
          })()}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoveDialog(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 回收站 */}
      <Dialog open={showTrash} onOpenChange={setShowTrash} className="max-w-2xl">
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="w-5 h-5" /> {t("trash.title")}
              <span className="text-sm font-normal text-warm-500">{t("trash.countText", { count: trashedNotes.length })}</span>
            </DialogTitle>
          </DialogHeader>

          {trashedNotes.length === 0 ? (
            <div className="py-12 text-center text-warm-500">
              <Trash className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("trash.empty")}</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
              <ul className="divide-y divide-warm-200">
                {trashedNotes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-warm-900">
                        {note.title || t("note.untitledNote")}
                      </p>
                      <p className="text-xs text-warm-500 mt-0.5">
                        {t("trash.deletedAt")}{formatDate(note.deleted_at ?? note.updated_at, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(note.id)}
                        className="text-warm-600 hover:text-warm-900"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" /> {t("common.restore")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPermanentDeleteId(note.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="w-4 h-4 mr-1" /> {t("trash.permanentDeleteAction")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTrash(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 永久删除确认 */}
      <Dialog
        open={!!permanentDeleteId}
        onOpenChange={(o) => !o && setPermanentDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("trash.permanentDeleteTitle")}</DialogTitle>
            <p className="text-sm text-warm-600 mt-2">
              {t("trash.permanentDeleteHint")}
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermanentDeleteId(null)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => permanentDeleteId && handlePermanentDelete(permanentDeleteId)}
            >
              <Trash className="w-4 h-4" /> {t("trash.permanentDeleteAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
