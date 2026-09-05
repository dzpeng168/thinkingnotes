"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-context"
import {
  Settings2, Globe, Check as CheckIcon, User as UserIcon, LogOut, Info,
} from "lucide-react"
import { LOCALES as _LOCALES, useT, type Locale } from "@/lib/i18n"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const { t, locale, setLocale } = useT()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  // —— 语言切换项 ——
  const localeList: { value: Locale; label: string }[] = [
    { value: "zh", label: t("settings.languageZh") },
    { value: "en", label: t("settings.languageEn") },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-warm-500" /> {t("settings.title")}
          </DialogTitle>
          <DialogDescription>{t("settings.languageChangeHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 外观主题 */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-warm-200 bg-white">
            <div>
              <div className="text-sm font-medium text-warm-800">{t("settings.appearanceTitle")}</div>
              <div className="text-xs text-warm-500 mt-0.5">
                {t("settings.themeSwitchHint")}
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* 语言 */}
          <div className="p-3 rounded-lg border border-warm-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-warm-800">
                <Globe className="w-4 h-4 text-warm-500" /> {t("settings.languageTitle")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {localeList.map((opt) => {
                const active = locale === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLocale(opt.value)}
                    className={`relative flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      active
                        ? "border-warm-500 bg-warm-100 shadow-warm"
                        : "border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        active ? "bg-warm-500 text-white" : "bg-warm-100 text-warm-600"
                      }`}>
                        {opt.value === "zh" ? "中" : "EN"}
                      </span>
                      <span className={`text-sm ${active ? "text-warm-800 font-medium" : "text-warm-700"}`}>
                        {opt.label}
                      </span>
                    </div>
                    {active && <CheckIcon className="w-4 h-4 text-warm-600" />}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-warm-500 mt-2">{t("settings.languageChangeHint")}</p>
          </div>

          {/* 账户 */}
          <div className="p-4 rounded-xl border border-warm-200 bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-warm-100 border border-warm-200 text-warm-500 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-warm-800">{t("settings.accountTitle")}</div>
                  <div className="text-sm text-warm-600 break-all font-mono mt-0.5">
                    {user?.email ?? "—"}
                  </div>
                  <div className="text-xs text-warm-400 mt-1">{t("settings.accountDesc")}</div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={signingOut}
                className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              >
                <LogOut className="w-4 h-4 mr-1.5" /> {t("settings.signOut")}
              </Button>
            </div>
          </div>

          <div className="text-xs text-warm-400 leading-relaxed pt-2 border-t border-warm-100">
            <div className="flex items-center gap-1.5 mb-1 text-warm-500">
              <Info className="w-3.5 h-3.5" /> {t("settings.noteLabel")}
            </div>
            {t("settings.storageDesc")}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
