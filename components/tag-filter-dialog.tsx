"use client"

import { Check, X, Tag as TagIcon } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Tag } from "@/lib/types"
import { useT } from "@/lib/i18n"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  tags: Tag[]
  selected: string[]
  onToggle: (tagId: string) => void
  onClear: () => void
}

export function TagFilterDialog({ open, onOpenChange, tags, selected, onToggle, onClear }: Props) {
  const { t } = useT()
  const sel = new Set(selected)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" /> {t("tagFilter.title")}
          </DialogTitle>
          <DialogDescription>
            {t("tagFilter.selectedCount", { count: selected.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {tags.length === 0 ? (
            <div className="text-center py-8 text-sm text-warm-500">
              {t("tagFilter.empty")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
              {tags.map((tagItem) => {
                const on = sel.has(tagItem.id)
                return (
                  <button
                    key={tagItem.id}
                    onClick={() => onToggle(tagItem.id)}
                    className={`flex items-center gap-1.5 px-3 h-8 rounded-full border text-sm transition-colors ${
                      on
                        ? "bg-warm-500 text-white border-warm-500"
                        : "bg-white text-warm-700 border-warm-200 hover:border-warm-400 hover:bg-warm-50"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: on ? "white" : tagItem.color }}
                    />
                    {tagItem.name}
                    {on && <Check className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" onClick={onClear} disabled={selected.length === 0}>
            <X className="w-4 h-4" /> {t("tagFilter.clearFilter")}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t("common.complete")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
