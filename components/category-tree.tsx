"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  PencilLine,
  Trash2,
  Inbox,
  Library,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { categoryApi } from "@/lib/api"
import type { Category, CategoryNode } from "@/lib/types"
import { buildCategoryTree } from "@/lib/category"
import { useT } from "@/lib/i18n"

interface Props {
  categories: Category[]
  noteCounts: Record<string, number>
  totalCount: number
  uncategorizedCount: number
  selectedId: string | "all" | "uncategorized" | null
  onSelect: (id: string | "all" | "uncategorized" | null) => void
  onChanged: () => void
  /** 游客模式：只读浏览，隐藏所有编辑入口 */
  readOnly?: boolean
}

interface EditState {
  mode: "create-root" | "create-child" | "rename" | "delete" | null
  target?: Category | null
}

export function CategoryTree({
  categories,
  noteCounts,
  totalCount,
  uncategorizedCount,
  selectedId,
  onSelect,
  onChanged,
  readOnly = false,
}: Props) {
  const { t } = useT()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [edit, setEdit] = useState<EditState>({ mode: null })
  const [nameInput, setNameInput] = useState("")
  // 用于"移动到子分类"或"创建子分类"时选父分类
  const [parentInput, setParentInput] = useState<string | null>(null)

  const tree = useMemo(
    () => buildCategoryTree(categories, noteCounts),
    [categories, noteCounts],
  )

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startCreateRoot = () => {
    setEdit({ mode: "create-root" })
    setNameInput("")
    setParentInput(null)
  }
  const startCreateChild = (parent: Category) => {
    setEdit({ mode: "create-child", target: parent })
    setNameInput("")
    setParentInput(parent.id)
  }
  const startRename = (cat: Category) => {
    setEdit({ mode: "rename", target: cat })
    setNameInput(cat.name)
  }
  const startDelete = (cat: Category) => {
    setEdit({ mode: "delete", target: cat })
  }

  const submit = async () => {
    const name = nameInput.trim()
    if (!name) return
    try {
      if (edit.mode === "create-root") {
        await categoryApi.create(name, null)
      } else if (edit.mode === "create-child" && edit.target) {
        await categoryApi.create(name, edit.target.id)
      } else if (edit.mode === "rename" && edit.target) {
        await categoryApi.update({ id: edit.target.id, name })
      }
      await onChanged()
    } catch (e) {
      console.error(e)
    } finally {
      setEdit({ mode: null })
    }
  }

  const confirmDelete = async () => {
    if (!edit.target) return
    try {
      await categoryApi.delete(edit.target.id)
      // 删除后选中切换到"全部"
      onSelect("all")
      await onChanged()
    } catch (e) {
      console.error(e)
    } finally {
      setEdit({ mode: null })
    }
  }

  const renderNode = (node: CategoryNode, depth = 0): React.ReactNode => {
    const isExpanded = expanded.has(node.id)
    const isActive = selectedId === node.id
    const hasChildren = node.children.length > 0
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
            isActive
              ? "bg-warm-600 text-white"
              : "hover:bg-warm-100 text-warm-800"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => onSelect(node.id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) toggle(node.id)
            }}
            className={`w-4 h-4 flex items-center justify-center ${
              hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
            } ${isActive ? "text-white" : "text-warm-500"}`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {isExpanded && hasChildren ? (
            <FolderOpen size={14} className={isActive ? "text-white" : "text-warm-600"} />
          ) : (
            <Folder size={14} className={isActive ? "text-white" : "text-warm-600"} />
          )}
          <span className="flex-1 truncate" title={node.name}>{node.name}</span>
          <span
            className={`text-xs ${
              isActive ? "opacity-90" : "text-warm-400"
            }`}
          >
            {node.noteCount}
          </span>
          <div
            className={`flex gap-0.5 ml-1 ${
              isActive ? "" : "opacity-0 group-hover:opacity-100"
            } ${readOnly ? "hidden" : ""}`}
          >
            <button
              type="button"
              title={t("sidebar.newChild")}
              onClick={(e) => {
                e.stopPropagation()
                startCreateChild(node)
              }}
              className={`w-5 h-5 flex items-center justify-center rounded ${
                isActive ? "hover:bg-warm-700" : "hover:bg-warm-200"
              }`}
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              title={t("common.rename")}
              onClick={(e) => {
                e.stopPropagation()
                startRename(node)
              }}
              className={`w-5 h-5 flex items-center justify-center rounded ${
                isActive ? "hover:bg-warm-700" : "hover:bg-warm-200"
              }`}
            >
              <PencilLine size={12} />
            </button>
            <button
              type="button"
              title={t("common.delete")}
              onClick={(e) => {
                e.stopPropagation()
                startDelete(node)
              }}
              className={`w-5 h-5 flex items-center justify-center rounded ${
                isActive ? "hover:bg-red-700" : "hover:bg-red-100 hover:text-red-600"
              }`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children
              .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderItem = (
    id: string | "all" | "uncategorized",
    label: string,
    icon: React.ReactNode,
    count: number,
    bold = false,
  ) => {
    const isActive = selectedId === id
    return (
      <div
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm ${
          isActive
            ? "bg-warm-600 text-white"
            : "hover:bg-warm-100 text-warm-800"
        }`}
        onClick={() => onSelect(id)}
      >
        {icon}
        <span className={`flex-1 truncate ${bold ? "font-semibold" : ""}`} title={label}>{label}</span>
        <span className={`text-xs ${isActive ? "opacity-90" : "text-warm-400"}`}>{count}</span>
      </div>
    )
  }

  const dialogTitle = (() => {
    if (edit.mode === "create-root") return t("sidebar.newRootTitle")
    if (edit.mode === "create-child" && edit.target) return t("sidebar.newChildTitle", { name: edit.target.name })
    if (edit.mode === "rename") return t("sidebar.renameCategoryTitle")
    return ""
  })()

  return (
    <div className="rounded-xl border border-warm-200 bg-warm-50 p-3 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-warm-800">
          <Library className="w-4 h-4" /> {t("sidebar.title")}
        </div>
        {!readOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={startCreateRoot}
            title={t("sidebar.newRoot")}
            className="h-7 w-7 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-0.5">
        {renderItem(
          "all",
          t("note.allNotes"),
          <Library size={14} className={selectedId === "all" ? "text-white" : "text-warm-600"} />,
          totalCount,
          true,
        )}
        {tree
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
          .map((node) => renderNode(node))}
        {renderItem(
          "uncategorized",
          t("note.uncategorized"),
          <Inbox size={14} className={selectedId === "uncategorized" ? "text-white" : "text-warm-600"} />,
          uncategorizedCount,
        )}
      </div>

      {/* 新建 / 重命名对话框 */}
      <Dialog
        open={edit.mode === "create-root" || edit.mode === "create-child" || edit.mode === "rename"}
        onOpenChange={(o) => !o && setEdit({ mode: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t("sidebar.categoryNamePlaceholder")}
            autoFocus
            className="h-11"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit({ mode: null })}>{t("common.cancel")}</Button>
            <Button onClick={submit} disabled={!nameInput.trim()}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={edit.mode === "delete"}
        onOpenChange={(o) => !o && setEdit({ mode: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sidebar.deleteCategoryTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-600 mt-2">
            {t("sidebar.deleteCategoryHint", { name: edit.target?.name ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit({ mode: null })}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4" /> {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
