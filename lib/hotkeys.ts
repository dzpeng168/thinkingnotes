"use client"

export type HotkeyModifier = "ctrl" | "shift" | "alt" | "meta"

export interface HotkeyCombo {
  modifiers: HotkeyModifier[]
  key: string
}

export interface HotkeyDefinition {
  id: string
  description: string
  combo: HotkeyCombo
  category: "app" | "editor" | "navigation" | "edit"
  global?: boolean
}

export const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

export const formatKey = (key: string): string => {
  const map: Record<string, string> = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Escape: "Esc",
    Enter: "Enter",
    Backspace: "⌫",
    Delete: "Del",
    Tab: "Tab",
    ",": "，",
    "[": "[",
    "]": "]",
  }
  if (key.length === 1) return key.toUpperCase()
  return map[key] ?? key
}

export const formatCombo = (combo: HotkeyCombo): string => {
  const mac = isMac()
  const parts: string[] = []
  for (const m of combo.modifiers) {
    if (m === "ctrl") parts.push(mac ? "⌃" : "Ctrl")
    if (m === "meta") parts.push(mac ? "⌘" : "Win")
    if (m === "alt") parts.push(mac ? "⌥" : "Alt")
    if (m === "shift") parts.push(mac ? "⇧" : "Shift")
  }
  parts.push(formatKey(combo.key))
  const sep = mac ? "" : "+"
  return parts.join(sep)
}

export const comboMatchesEvent = (combo: HotkeyCombo, e: KeyboardEvent): boolean => {
  const needCtrl = combo.modifiers.includes("ctrl")
  const needShift = combo.modifiers.includes("shift")
  const needAlt = combo.modifiers.includes("alt")
  const needMeta = combo.modifiers.includes("meta")
  if (needCtrl !== e.ctrlKey) return false
  if (needShift !== e.shiftKey) return false
  if (needAlt !== e.altKey) return false
  if (needMeta !== e.metaKey) return false
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
  const comboKey = combo.key.length === 1 ? combo.key.toLowerCase() : combo.key
  return k === comboKey
}

export const DEFAULT_HOTKEYS: HotkeyDefinition[] = [
  {
    id: "app.save",
    description: "保存文件",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "s" },
  },
  {
    id: "app.new-note",
    description: "创建新笔记",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "n" },
  },
  {
    id: "app.command-palette",
    description: "打开命令面板",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "p" },
  },
  {
    id: "app.quick-switcher",
    description: "打开快速切换器",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "o" },
  },
  {
    id: "app.global-search",
    description: "在所有文件中搜索",
    category: "app",
    combo: { modifiers: ["ctrl", "shift"], key: "f" },
  },
  {
    id: "app.graph-view",
    description: "打开图表视图",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "g" },
  },
  {
    id: "nav.back",
    description: "向后导航",
    category: "navigation",
    combo: { modifiers: ["ctrl", "alt"], key: "ArrowLeft" },
  },
  {
    id: "nav.forward",
    description: "向前导航",
    category: "navigation",
    combo: { modifiers: ["ctrl", "alt"], key: "ArrowRight" },
  },
  {
    id: "editor.search",
    description: "搜索当前文件",
    category: "editor",
    combo: { modifiers: ["ctrl"], key: "f" },
  },
  {
    id: "editor.toggle-mode",
    description: "切换编辑或预览模式",
    category: "editor",
    combo: { modifiers: ["ctrl"], key: "e" },
  },
  {
    id: "app.open-settings",
    description: "打开设置",
    category: "app",
    combo: { modifiers: ["ctrl"], key: "," },
  },
  {
    id: "edit.bold",
    description: "加粗所选文本",
    category: "edit",
    combo: { modifiers: ["ctrl"], key: "b" },
  },
  {
    id: "edit.italic",
    description: "选定文本倾斜",
    category: "edit",
    combo: { modifiers: ["ctrl"], key: "i" },
  },
  {
    id: "edit.link",
    description: "插入外部链接",
    category: "edit",
    combo: { modifiers: ["ctrl"], key: "k" },
  },
  {
    id: "edit.indent",
    description: "缩进",
    category: "edit",
    combo: { modifiers: ["ctrl"], key: "]" },
  },
  {
    id: "edit.outdent",
    description: "取消缩进",
    category: "edit",
    combo: { modifiers: ["ctrl"], key: "[" },
  },
  {
    id: "edit.follow-link",
    description: "跳转到选定的反向链接",
    category: "edit",
    combo: { modifiers: ["alt"], key: "Enter" },
  },
]

export const findHotkey = (id: string): HotkeyDefinition | undefined =>
  DEFAULT_HOTKEYS.find((h) => h.id === id)
