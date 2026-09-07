"use client"

import Link from "next/link"
import { BookOpen, Keyboard, Tag as TagIcon, Settings, Trash2 } from "lucide-react"
import { useT } from "@/lib/i18n"

interface Props {
  onTagsClick: () => void
  onSettingsClick: () => void
  onTrashClick: () => void
  onHotkeysClick: () => void
  /** 回收站笔记数量（可选徽章显示） */
  trashCount?: number
}

export function AppRail({ onTagsClick, onSettingsClick, onTrashClick, onHotkeysClick, trashCount }: Props) {
  const { t } = useT()
  return (
    <nav className="w-14 shrink-0 bg-gradient-to-b from-warm-100 to-warm-50 border-r border-warm-200 flex flex-col items-center justify-start gap-3 py-4">
      {/* 顶部 Logo */}
      <Link
        href="/login"
        target="_blank"
        rel="noopener noreferrer"
        title="回官网首页"
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-500 to-warm-700 text-white flex items-center justify-center shadow-warm hover:opacity-90 transition-opacity"
      >
        <BookOpen className="w-5 h-5" />
      </Link>

      {/* 底部按钮 */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onTagsClick}
          className="w-10 h-10 rounded-xl bg-white border border-warm-200 hover:bg-warm-100 hover:border-warm-400 text-warm-600 flex items-center justify-center transition-colors"
          title={t("rail.tagFilter")}
        >
          <TagIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onTrashClick}
          className="relative w-10 h-10 rounded-xl bg-white border border-warm-200 hover:bg-warm-100 hover:border-red-400 text-warm-600 hover:text-red-500 flex items-center justify-center transition-colors"
          title={t("rail.trash")}
        >
          <Trash2 className="w-5 h-5" />
          {trashCount !== undefined && trashCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center shadow-sm">
              {trashCount > 99 ? '99+' : trashCount}
            </span>
          )}
        </button>
        <button
          onClick={onHotkeysClick}
          className="w-10 h-10 rounded-xl bg-white border border-warm-200 hover:bg-warm-100 hover:border-warm-400 text-warm-600 flex items-center justify-center transition-colors"
          title={t("rail.hotkeys")}
        >
          <Keyboard className="w-5 h-5" />
        </button>
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-xl bg-white border border-warm-200 hover:bg-warm-100 hover:border-warm-400 text-warm-600 flex items-center justify-center transition-colors"
          title={t("rail.settings")}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
