"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, FileText, LayoutGrid, Calendar as CalendarIcon, Tag as TagIcon } from "lucide-react"
import { noteApi, categoryApi } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import type { NoteListItem, Category } from "@/lib/types"
import { useT } from "@/lib/i18n"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

type SwitcherItem =
  | { type: "note"; data: NoteListItem }
  | { type: "category"; data: Category }

export function QuickSwitcher({ open, onOpenChange }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery("")
    setSelected(0)
    ;(async () => {
      const [ns, cs] = await Promise.all([noteApi.list(), categoryApi.list()])
      setNotes(ns)
      setCategories(cs)
    })()
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const items = useMemo<SwitcherItem[]>(() => {
    const q = query.trim().toLowerCase()
    const filteredNotes = notes
      .filter((n) => {
        if (!q) return true
        const title = n.title.toLowerCase()
        const tagMatch = n.tags.some((t) => t.name.toLowerCase().includes(q))
        return title.includes(q) || tagMatch
      })
      .sort((a, b) => {
        const tA = a.title.toLowerCase().startsWith(q) ? 0 : 1
        const tB = b.title.toLowerCase().startsWith(q) ? 0 : 1
        if (tA !== tB) return tA - tB
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      .slice(0, 30)
      .map<SwitcherItem>((n) => ({ type: "note", data: n }))

    const filteredCats = categories
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 10)
      .map<SwitcherItem>((c) => ({ type: "category", data: c }))

    return [...filteredCats, ...filteredNotes]
  }, [query, notes, categories])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selected])

  const openItem = (i: number) => {
    const it = items[i]
    if (!it) return
    onOpenChange(false)
    setTimeout(() => {
      if (it.type === "note") {
        router.push(`/note?id=${it.data.id}`)
      } else {
        router.push("/")
        const ev = new CustomEvent("thinknote:select-category", {
          detail: { id: it.data.id },
        })
        window.dispatchEvent(ev)
      }
    }, 30)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(items.length - 1, s + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(0, s - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      openItem(selected)
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
            placeholder={t("quickSwitcher.placeholder")}
            className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-auto p-2 bg-white"
        >
          {items.length === 0 ? (
            <div className="text-sm text-warm-400 text-center py-8">{t("quickSwitcher.noResults")}</div>
          ) : (
            items.map((it, i) => {
              const active = i === selected
              if (it.type === "note") {
                const n = it.data
                return (
                  <button
                    key={`n-${n.id}`}
                    data-idx={i}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => openItem(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      active ? "bg-warm-100 text-warm-900" : "hover:bg-warm-50 text-warm-800"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      active ? "bg-warm-500 text-white" : "bg-warm-100 text-warm-600"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {n.title || <span className="text-warm-400 italic">{t("note.untitledNote")}</span>}
                      </div>
                      <div className="text-xs text-warm-500 flex items-center gap-2 mt-0.5">
                        <span>{formatDate(n.updated_at)}</span>
                        {n.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <TagIcon className="w-3 h-3" />
                            {n.tags.slice(0, 3).map((t) => t.name).join("、")}
                            {n.tags.length > 3 && ` +${n.tags.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              }
              const c = it.data
              return (
                <button
                  key={`c-${c.id}`}
                  data-idx={i}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => openItem(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    active ? "bg-warm-100 text-warm-900" : "hover:bg-warm-50 text-warm-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    active ? "bg-warm-500 text-white" : "bg-warm-100 text-warm-600"
                  }`}>
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-warm-500 flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3 h-3" /> {t("quickSwitcher.category")}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
