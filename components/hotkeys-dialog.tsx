"use client"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCombo, DEFAULT_HOTKEYS, type HotkeyDefinition } from "@/lib/hotkeys"
import { useT } from "@/lib/i18n"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

const CATEGORY_ORDER: HotkeyDefinition["category"][] = ["app", "navigation", "editor", "edit"]

// 把 hotkey id 映射到 messages key（仅展示在 HotkeysDialog 与设置中时翻译）
const HOTKEY_DESC_KEY: Record<string, string> = {
  "app.save": "hotkeys.save",
  "app.new-note": "hotkeys.newNote",
  "app.command-palette": "hotkeys.commandPalette",
  "app.quick-switcher": "hotkeys.quickSwitcher",
  "app.global-search": "hotkeys.searchAllFiles",
  "app.graph-view": "hotkeys.graphView",
  "nav.back": "hotkeys.navBack",
  "nav.forward": "hotkeys.navForward",
  "editor.search": "hotkeys.editorSearch",
  "editor.toggle-mode": "hotkeys.editorToggleMode",
  "app.open-settings": "hotkeys.openSettings",
  "edit.bold": "hotkeys.bold",
  "edit.italic": "hotkeys.italic",
  "edit.link": "hotkeys.insertLink",
  "edit.indent": "hotkeys.indent",
  "edit.outdent": "hotkeys.outdent",
  "edit.follow-link": "hotkeys.followLink",
}

const CATEGORY_LABEL_KEY: Record<HotkeyDefinition["category"], string> = {
  app: "hotkeys.globalSection",
  navigation: "hotkeys.globalSection",
  editor: "hotkeys.editorSection",
  edit: "hotkeys.editorSection",
}

export function HotkeysDialog({ open, onOpenChange }: Props) {
  const { t } = useT()
  // 按 category 分组
  const grouped: Record<string, HotkeyDefinition[]> = {}
  for (const h of DEFAULT_HOTKEYS) {
    const list = grouped[h.category] || []
    list.push(h)
    grouped[h.category] = list
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <DialogContent className="max-w-xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{t("hotkeys.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped[cat]
            if (!list || list.length === 0) return null
            const labelKey = CATEGORY_LABEL_KEY[cat]
            return (
              <div key={cat}>
                <div className="text-sm font-medium text-warm-700 mb-2 pb-1 border-b border-warm-200">
                  {t(labelKey as any)}
                </div>
                <div className="space-y-1.5">
                  {list.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-warm-100 transition-colors"
                    >
                      <span className="text-sm text-warm-800">
                        {HOTKEY_DESC_KEY[h.id] ? t(HOTKEY_DESC_KEY[h.id] as any) : h.description}
                      </span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white border border-warm-300 text-warm-800 text-xs font-mono shadow-sm whitespace-nowrap">
                        {formatCombo(h.combo)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="shrink-0">
          <Button onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
