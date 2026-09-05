"use client"

import { useEffect, useState } from "react"
import { Palette, Sun, Briefcase } from "lucide-react"
import { useT } from "@/lib/i18n"

type Theme = "minimal" | "business"

export function ThemeToggle() {
  const { t } = useT()
  const [theme, setTheme] = useState<Theme>("minimal")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = (localStorage.getItem("thinkingnotes-theme") as Theme | null) || "minimal"
    setTheme(t)
    setMounted(true)
  }, [])

  const apply = (t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
    try {
      localStorage.setItem("thinkingnotes-theme", t)
    } catch {}
  }

  if (!mounted) {
    return (
      <button className="h-9 px-3 rounded-md border border-warm-200 text-sm text-warm-500 flex items-center gap-1.5 opacity-0">
        <Palette className="w-4 h-4" /> {t("settings.appearanceTitle")}
      </button>
    )
  }

  const isBusiness = theme === "business"

  return (
    <button
      onClick={() => apply(isBusiness ? "minimal" : "business")}
      className="h-9 px-3 rounded-md border border-warm-200 hover:border-warm-400 bg-white hover:bg-warm-50 text-sm text-warm-700 flex items-center gap-1.5 transition-colors"
      title={isBusiness ? t("settings.themeBusiness") : t("settings.themeMinimal")}
    >
      {isBusiness ? (
        <>
          <Briefcase className="w-4 h-4 text-warm-600" />
          <span>{t("settings.themeBusiness")}</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-warm-600" />
          <span>{t("settings.themeMinimal")}</span>
        </>
      )}
    </button>
  )
}
