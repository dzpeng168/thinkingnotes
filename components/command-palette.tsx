"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Search, FileText, Plus, Settings, ArrowRight, ArrowLeft,
  LayoutGrid, Calendar, Tags, SlidersHorizontal,
} from "lucide-react"
import { findHotkey, formatCombo } from "@/lib/hotkeys"
import { useT } from "@/lib/i18n"

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  hotkeyId?: string
  onRun: () => void
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  extraItems?: CommandItem[]
}

export function CommandPalette({ open, onOpenChange, extraItems = [] }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const baseItems: CommandItem[] = useMemo(() => [
    {
      id: "nav.home",
      title: t("commands.backHome"),
      description: t("commands.backHomeDesc"),
      icon: LayoutGrid,
      hotkeyId: "nav.back",
      onRun: () => router.push("/"),
    },
    {
      id: "note.new",
      title: t("commands.newNote"),
      description: t("commands.newNoteDesc"),
      icon: Plus,
      hotkeyId: "app.new-note",
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:new-note")
          window.dispatchEvent(ev)
        }, 50)
      },
    },
    {
      id: "view.calendar",
      title: t("commands.viewCalendar"),
      description: t("commands.viewCalendarDesc"),
      icon: Calendar,
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:set-view", { detail: { view: "calendar" } })
          window.dispatchEvent(ev)
        }, 50)
      },
    },
    {
      id: "view.list",
      title: t("commands.viewList"),
      description: t("commands.viewListDesc"),
      icon: LayoutGrid,
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:set-view", { detail: { view: "list" } })
          window.dispatchEvent(ev)
        }, 50)
      },
    },
    {
      id: "app.settings",
      title: t("commands.openSettings"),
      description: t("commands.openSettingsDesc"),
      icon: Settings,
      hotkeyId: "app.open-settings",
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:open-settings")
          window.dispatchEvent(ev)
        }, 50)
      },
    },
    {
      id: "app.quick-switcher",
      title: t("commands.quickSwitcher"),
      description: t("commands.quickSwitcherDesc"),
      icon: Search,
      hotkeyId: "app.quick-switcher",
      onRun: () => {
        const ev = new CustomEvent("thinknote:open-quick-switcher")
        window.dispatchEvent(ev)
      },
    },
    {
      id: "nav.back",
      title: t("commands.navBack"),
      icon: ArrowLeft,
      hotkeyId: "nav.back",
      onRun: () => window.history.back(),
    },
    {
      id: "nav.forward",
      title: t("commands.navForward"),
      icon: ArrowRight,
      hotkeyId: "nav.forward",
      onRun: () => window.history.forward(),
    },
    {
      id: "filter.tags",
      title: t("commands.tagFilter"),
      description: t("commands.tagFilterDesc"),
      icon: Tags,
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:open-tag-filter")
          window.dispatchEvent(ev)
        }, 50)
      },
    },
    {
      id: "filter.focus-search",
      title: t("commands.focusSearch"),
      description: t("commands.focusSearchDesc"),
      icon: SlidersHorizontal,
      hotkeyId: "app.global-search",
      onRun: () => {
        router.push("/")
        setTimeout(() => {
          const ev = new CustomEvent("thinknote:focus-search")
          window.dispatchEvent(ev)
        }, 50)
      },
    },
  ], [router, t])

  const allItems = useMemo(() => [...baseItems, ...extraItems], [baseItems, extraItems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter((it) => {
      const t = it.title.toLowerCase()
      const d = it.description?.toLowerCase() ?? ""
      return t.includes(q) || d.includes(q)
    })
  }, [allItems, query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selected])

  const run = (i: number) => {
    const it = filtered[i]
    if (!it) return
    onOpenChange(false)
    setTimeout(() => it.onRun(), 30)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(filtered.length - 1, s + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(0, s - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      run(selected)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 border-warm-200 shadow-warm-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-200 bg-warm-50">
          <Search className="w-4 h-4 text-warm-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("commands.placeholder")}
            className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-auto p-2 bg-white"
        >
          {filtered.length === 0 ? (
            <div className="text-sm text-warm-400 text-center py-8">{t("commands.noMatch")}</div>
          ) : (
            filtered.map((it, i) => {
              const Icon = it.icon ?? FileText
              const active = i === selected
              const hk = it.hotkeyId ? findHotkey(it.hotkeyId) : null
              return (
                <button
                  key={it.id}
                  data-idx={i}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => run(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    active ? "bg-warm-100 text-warm-900" : "hover:bg-warm-50 text-warm-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    active ? "bg-warm-500 text-white" : "bg-warm-100 text-warm-600"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.title}</div>
                    {it.description && (
                      <div className="text-xs text-warm-500 truncate">{it.description}</div>
                    )}
                  </div>
                  {hk && (
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md border border-warm-200 bg-warm-50 text-xs text-warm-600 font-mono">
                      {formatCombo(hk.combo)}
                    </kbd>
                  )}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
