"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n"
import { resolveTemplateMeta } from "@/lib/utils"
import type { TemplateType } from "@/lib/types"
import {
  NotebookPen, AlertCircle, Eye, FileText,
  LayoutGrid, ClipboardList, HardHat, Grid2X2, CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
} from "lucide-react"

const ICONS: Record<string, any> = {
  LayoutGrid, ClipboardList, HardHat, Grid2X2,
  CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
  FileText,
}

// 模板图标底色轮换（柔和色调，避免单调）
const ICON_STYLES = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-teal-100 text-teal-600",
]

const TEMPLATE_KEYS: TemplateType[] = [
  "free", "cornell", "meeting_5w2h", "six_hats", "eisenhower_matrix",
  "monthly_plan", "weekly_plan", "daily_plan", "woop", "ride",
  "prep_method", "four_d_work", "empathy_map", "smart_goal", "grai",
]

export default function LoginPage() {
  const { t, locale, setLocale } = useT()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const openAuth = (m: "signin" | "signup") => {
    setMode(m)
    setError(null)
    setAuthOpen(true)
  }

  // 游客模式：仅设置前端标记 cookie（middleware 放行页面路由），主页展示本地示例数据
  const enterGuest = () => {
    document.cookie = "tn_guest=1; path=/; max-age=" + 60 * 60 * 24 * 30
    router.push("/")
    router.refresh()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // 正式登录后清除游客标记
        document.cookie = "tn_guest=; path=/; max-age=0"
        router.push("/")
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // 未开启邮箱确认时直接登录成功；开启则提示查收邮件
        setError(t("auth.checkEmail"))
        setMode("signin")
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-100/70 via-warm-50 to-warm-50 flex flex-col">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-warm-200/80 bg-warm-50/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warm-600 text-white flex items-center justify-center">
              <NotebookPen className="w-4 h-4" />
            </div>
            <span className="font-bold text-warm-900">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="h-9 px-3 rounded-md border border-warm-200 hover:border-warm-400 text-sm text-warm-600 hover:text-warm-800 transition-colors"
            >
              {locale === "zh" ? "English" : "简体中文"}
            </button>
            <Button variant="outline" onClick={enterGuest}>
              <Eye className="w-4 h-4 mr-1.5" /> {t("auth.guestMode")}
            </Button>
            <Button variant="ghost" onClick={() => openAuth("signin")}>{t("auth.signIn")}</Button>
            <Button onClick={() => openAuth("signup")}>{t("landing.startFree")}</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-8 text-center">
        {/* 柔和背景光斑 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-[10%] w-72 h-72 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute -top-20 right-[10%] w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[640px] h-48 rounded-full bg-warm-200/50 blur-3xl" />
        </div>
        <h1 className="relative text-4xl sm:text-5xl font-bold leading-tight max-w-3xl mx-auto bg-gradient-to-r from-warm-900 via-warm-700 to-warm-500 bg-clip-text text-transparent">
          {t("app.tagline")}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-warm-600 max-w-2xl mx-auto leading-relaxed">
          {t("landing.heroSubtitle")}
        </p>
      </section>

      {/* 模板矩阵 */}
      <section className="max-w-6xl mx-auto px-6 pb-12 w-full">
        <h2 className="text-2xl font-bold text-warm-900 text-center mb-2">
          {t("landing.featuresTitle")}
        </h2>
        <p className="text-sm text-warm-600 text-center mb-8">
          {t("landing.featuresSubtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {TEMPLATE_KEYS.map((key, i) => {
            const meta = resolveTemplateMeta(key, locale, (k) => t(k as any))
            const Icon = ICONS[meta.icon]
            return (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white p-4 hover:border-warm-400 hover:shadow-warm transition-all"
              >
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${ICON_STYLES[i % ICON_STYLES.length]}`}>
                  {Icon && <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-warm-800">{meta.name}</div>
                  <div className="text-xs text-warm-600 leading-snug mt-0.5 line-clamp-2">{meta.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 底部 CTA + Footer */}
      <footer className="mt-auto border-t border-warm-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <h3 className="text-xl font-bold text-warm-900 mb-2">{t("app.name")}</h3>
          <p className="text-sm text-warm-600 mb-5">{t("landing.heroSubtitle")}</p>
          <Button size="lg" onClick={() => openAuth("signup")}>
            <Eye className="w-4 h-4 mr-1.5" />
            {t("landing.startFree")}
          </Button>
          <p className="mt-8 text-xs text-warm-400">{t("landing.footer")}</p>
        </div>
      </footer>

      {/* 登录/注册弹窗 */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
            </DialogTitle>
            <DialogDescription className="text-center">{t("app.tagline")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="flex rounded-lg border border-warm-200 p-0.5 bg-warm-50">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null) }}
                className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-white text-warm-900 shadow-sm border border-warm-200"
                    : "text-warm-500 hover:text-warm-700"
                }`}
              >
                {t("auth.signInTab")}
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null) }}
                className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-white text-warm-900 shadow-sm border border-warm-200"
                    : "text-warm-500 hover:text-warm-700"
                }`}
              >
                {t("auth.signUpTab")}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-warm-700">{t("auth.email")}</label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 bg-warm-50"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-warm-700">{t("auth.password")}</label>
              <Input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-warm-50"
              />
              {mode === "signup" && (
                <p className="text-[11px] text-warm-400">{t("auth.passwordHint")}</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy
                ? t("common.loading")
                : mode === "signin"
                  ? t("auth.signIn")
                  : t("auth.signUp")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
