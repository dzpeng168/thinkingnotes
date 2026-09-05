"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import {
  DEFAULT_HOTKEYS,
  comboMatchesEvent,
  type HotkeyDefinition,
  type HotkeyCombo,
} from "@/lib/hotkeys"

export type HotkeyHandler = (e: KeyboardEvent | Event) => void | Promise<void>

interface RegisteredHandler {
  id: string
  handler: HotkeyHandler
  scope: string
  preventDefault?: boolean
  stopPropagation?: boolean
  priority: number
}

interface HotkeysContextValue {
  register: (
    id: string,
    handler: HotkeyHandler,
    options?: {
      scope?: string
      preventDefault?: boolean
      stopPropagation?: boolean
      priority?: number
    },
  ) => void
  unregister: (id: string, scope?: string) => void
  getHotkeys: () => HotkeyDefinition[]
  setScope: (scope: string | null) => void
  currentScope: string | null
  isScopeActive: (scope: string) => boolean
}

const HotkeysContext = createContext<HotkeysContextValue | null>(null)

interface HotkeysProviderProps {
  children: React.ReactNode
}

export function HotkeysProvider({ children }: HotkeysProviderProps) {
  const handlersRef = useRef<Map<string, RegisteredHandler>>(new Map())
  const scopeRef = useRef<string | null>(null)
  const [, forceRender] = React.useState(0)

  const register: HotkeysContextValue["register"] = useCallback(
    (id, handler, options = {}) => {
      const {
        scope = "global",
        preventDefault = true,
        stopPropagation = false,
        priority = 0,
      } = options
      const key = `${scope}:${id}`
      handlersRef.current.set(key, {
        id,
        handler,
        scope,
        preventDefault,
        stopPropagation,
        priority,
      })
    },
    [],
  )

  const unregister: HotkeysContextValue["unregister"] = useCallback(
    (id, scope = "global") => {
      const key = `${scope}:${id}`
      handlersRef.current.delete(key)
    },
    [],
  )

  const getHotkeys = useCallback(() => DEFAULT_HOTKEYS, [])

  const setScope = useCallback((scope: string | null) => {
    scopeRef.current = scope
    forceRender((n) => n + 1)
  }, [])

  const isScopeActive = useCallback((scope: string) => {
    const cur = scopeRef.current
    if (cur === null) return true
    if (cur === scope) return true
    return false
  }, [])

  useEffect(() => {
    const hotkeyMap = new Map<string, HotkeyDefinition>()
    for (const h of DEFAULT_HOTKEYS) {
      hotkeyMap.set(h.id, h)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tagName = target?.tagName
      const isTyping =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable

      const currentScope = scopeRef.current

      const allHandlers = Array.from(handlersRef.current.values()).filter((h) => {
        if (h.scope === "global") return true
        if (currentScope === null) return false
        return h.scope === currentScope
      })

      const matchedHandlers: (RegisteredHandler & { def: HotkeyDefinition })[] = []
      for (const h of allHandlers) {
        const def = hotkeyMap.get(h.id)
        if (!def) continue
        if (!comboMatchesEvent(def.combo, e)) continue
        matchedHandlers.push({ ...h, def })
      }

      if (matchedHandlers.length === 0) return

      matchedHandlers.sort((a, b) => b.priority - a.priority)

      for (const h of matchedHandlers) {
        const { def } = h
        const isEditShortcut =
          def.id.startsWith("edit.") ||
          def.id === "editor.search" ||
          def.id === "editor.toggle-mode"

        if (isTyping && !isEditShortcut && def.category !== "app" && !isAppShortcutAllowedInInput(def.id, target)) {
          if (!["ctrl+s", "ctrl+n", "ctrl+p", "ctrl+o", "ctrl+,"].includes(normalizeCombo(def.combo))) {
            continue
          }
        }

        if (h.preventDefault) e.preventDefault()
        if (h.stopPropagation) e.stopPropagation()
        try {
          h.handler(e)
        } catch (err) {
          console.error("[Hotkeys] handler error for", h.id, err)
        }
        break
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [])

  const value = useMemo<HotkeysContextValue>(
    () => ({
      register,
      unregister,
      getHotkeys,
      setScope,
      currentScope: scopeRef.current,
      isScopeActive,
    }),
    [register, unregister, getHotkeys, setScope, isScopeActive],
  )

  return (
    <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>
  )
}

function normalizeCombo(combo: HotkeyCombo): string {
  const mods = [...combo.modifiers].sort()
  return `${mods.join("+")}+${combo.key.toLowerCase()}`
}

function isAppShortcutAllowedInInput(id: string, target: HTMLElement | null): boolean {
  if (id === "ctrl+f" && target?.tagName !== "INPUT") return true
  return false
}

export function useHotkeys(): HotkeysContextValue {
  const ctx = useContext(HotkeysContext)
  if (!ctx) {
    throw new Error("useHotkeys must be used within a HotkeysProvider")
  }
  return ctx
}

export function useHotkey(
  id: string,
  handler: HotkeyHandler,
  options: {
    scope?: string
    preventDefault?: boolean
    stopPropagation?: boolean
    priority?: number
    enabled?: boolean
  } = {},
) {
  const { register, unregister } = useHotkeys()
  const {
    enabled = true,
    scope = "global",
    preventDefault,
    stopPropagation,
    priority,
  } = options
  const registerOpts = useMemo(
    () => ({ scope, preventDefault, stopPropagation, priority }),
    [scope, preventDefault, stopPropagation, priority],
  )

  useEffect(() => {
    if (!enabled) return
    register(id, handler, registerOpts)
    return () => unregister(id, registerOpts.scope)
  }, [register, unregister, id, handler, enabled, registerOpts])
}
