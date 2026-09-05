"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTemplateMeta, formatDate } from "@/lib/utils"
import type { NoteListItem } from "@/lib/types"
import { useT } from "@/lib/i18n"

interface Props {
  notes: NoteListItem[]
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function groupByDate(ns: NoteListItem[]): Record<string, NoteListItem[]> {
  const map: Record<string, NoteListItem[]> = {}
  for (const n of ns) {
    let d: Date
    try {
      d = new Date(n.updated_at)
      if (isNaN(d.getTime())) continue
    } catch {
      continue
    }
    const k = toDateKey(d)
    if (!map[k]) map[k] = []
    map[k].push(n)
  }
  return map
}

function buildMonthMatrix(year: number, month: number): Array<Array<Date | null>> {
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push(new Date(year, month, dd))
  while (cells.length < 42) cells.push(null)
  const rows: Array<Array<Date | null>> = []
  for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, (i + 1) * 7))
  return rows
}

function TemplateBadge({ ttype }: { ttype: string }) {
  const meta = useTemplateMeta(ttype)
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 text-warm-600">
      {meta.name}
    </span>
  )
}

export function CalendarView({ notes }: Props) {
  const { t } = useT()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [dialogDate, setDialogDate] = useState<string | null>(null)

  const grouped = useMemo(() => groupByDate(notes), [notes])
  const matrix = useMemo(() => buildMonthMatrix(year, month), [year, month])

  const weekdayKeys = ["calendar.weekMon", "calendar.weekTue", "calendar.weekWed", "calendar.weekThu", "calendar.weekFri", "calendar.weekSat", "calendar.weekSun"] as const

  const monthLabel = t("calendar.monthTitle", { year, month: month + 1 })

  const todayKey = toDateKey(today)

  const goPrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }
  const goNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }
  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  const dialogNotes: NoteListItem[] = dialogDate ? grouped[dialogDate] ?? [] : []

  const cellBase = "min-h-[110px] p-1.5 rounded-lg border text-left flex flex-col gap-1 transition-colors"
  const cellClassOf = (hasNotes: boolean, isToday: boolean): string => {
    if (hasNotes) {
      return `${cellBase} border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50 cursor-pointer`
    }
    if (isToday) {
      return `${cellBase} border-warm-300 bg-warm-50/60`
    }
    return `${cellBase} border-warm-100 bg-white/40`
  }

  const noTitleText = t("common.untitled")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="w-8 h-8 rounded-md border border-warm-200 hover:bg-warm-50 text-warm-600 flex items-center justify-center"
            title={t("calendar.prevMonth")}
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-lg font-semibold text-warm-800 min-w-[110px] text-center">{monthLabel}</h3>
          <button
            onClick={goNext}
            className="w-8 h-8 rounded-md border border-warm-200 hover:bg-warm-50 text-warm-600 flex items-center justify-center"
            title={t("calendar.nextMonth")}
            type="button"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={goToday}
          className="h-8 px-3 rounded-md border border-warm-200 hover:bg-warm-50 text-xs text-warm-600 flex items-center gap-1.5"
          type="button"
        >
          <CalendarDays className="w-3.5 h-3.5" /> {t("calendar.today")}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekdayKeys.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-warm-500 py-1">
            {t(w)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {matrix.flat().map((d, idx) => {
          if (!d) {
            return <div key={idx} className="min-h-[110px] rounded-lg bg-warm-50/40" />
          }
          const key = toDateKey(d)
          const dayNotes = grouped[key] ?? []
          const isToday = key === todayKey
          const hasNotes = dayNotes.length > 0
          const dateClass = isToday
            ? "text-xs font-medium text-warm-700"
            : "text-xs font-medium text-warm-500"
          return (
            <button
              key={idx}
              onClick={() => hasNotes && setDialogDate(key)}
              className={cellClassOf(hasNotes, isToday)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span className={dateClass}>{d.getDate()}</span>
                {hasNotes && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warm-500 text-white">
                    {dayNotes.length}
                  </span>
                )}
              </div>
              {hasNotes && (
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1 max-h-[80px]">
                  {dayNotes.map((n) => (
                    <div
                      key={n.id}
                      className="text-[11px] text-warm-700 leading-tight truncate bg-warm-100/60 rounded px-1 py-0.5"
                      title={n.title || noTitleText}
                    >
                      {n.title || noTitleText}
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Dialog open={!!dialogDate} onOpenChange={(o) => !o && setDialogDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{dialogDate}</span>
              <span className="text-sm font-normal text-warm-500">· {t("note.countText", { count: dialogNotes.length })}</span>
            </DialogTitle>
            <DialogDescription>{dialogNotes.length > 0
              ? t("calendar.hintOpen")
              : t("calendar.emptyDay")
            }</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              {dialogNotes.map((n) => {
                const timeStr = formatDate(n.updated_at).slice(11, 16)
                return (
                  <Link
                    key={n.id}
                    href={`/note?id=${n.id}`}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TemplateBadge ttype={n.template_type} />
                        <span className="text-xs text-warm-500">{timeStr || t("calendar.allDay")}</span>
                      </div>
                      <div className="text-sm font-medium text-warm-900 truncate">
                        {n.title || t("note.untitledNote")}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-warm-400 group-hover:text-warm-600 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
