"use client"

import { useCallback, useEffect, useState } from "react"
import { useHotkey } from "@/components/hotkeys-context"
import { CommandPalette } from "@/components/command-palette"
import { QuickSwitcher } from "@/components/quick-switcher"

export function GlobalHotkeys() {
  const [showPalette, setShowPalette] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)

  const openPalette = useCallback(() => setShowPalette(true), [])
  const openSwitcher = useCallback(() => setShowSwitcher(true), [])
  const goBack = useCallback(() => window.history.back(), [])
  const goForward = useCallback(() => window.history.forward(), [])

  useHotkey("app.command-palette", openPalette)
  useHotkey("app.quick-switcher", openSwitcher)
  useHotkey("nav.back", goBack)
  useHotkey("nav.forward", goForward)

  useEffect(() => {
    const h1 = () => setShowPalette(true)
    const h2 = () => setShowSwitcher(true)
    window.addEventListener("thinknote:open-command-palette", h1)
    window.addEventListener("thinknote:open-quick-switcher", h2)
    return () => {
      window.removeEventListener("thinknote:open-command-palette", h1)
      window.removeEventListener("thinknote:open-quick-switcher", h2)
    }
  }, [])

  return (
    <>
      <CommandPalette open={showPalette} onOpenChange={setShowPalette} />
      <QuickSwitcher open={showSwitcher} onOpenChange={setShowSwitcher} />
    </>
  )
}
