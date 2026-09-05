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
  NotebookPen, AlertCircle, Eye, Languages, Palette, Undo2, CloudUpload, FileText, FolderTree,
  LayoutGrid, ClipboardList, HardHat, Grid2X2, CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
} from "lucide-react"

const ICONS: Record<string, any> = {
  LayoutGrid, ClipboardList, HardHat, Grid2X2,
  CalendarDays, Calendar, CalendarClock,
  Sparkles, MessageSquare, ListOrdered, ListTodo, HeartHandshake, Target, RotateCcw,
  FileText,
}

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

  const highlights: { icon: typeof CloudUpload; title: string; desc: string }[] = [
    { icon: CloudUpload, title: t("landing.cloudSync"), desc: t("landing.cloudSyncDesc") },
    { icon: FileText, title: t("landing.markdownEditor"), desc: t("landing.markdownEditorDesc") },
    { icon: FolderTree, title: t("landing.organize"), desc: t("landing.organizeDesc") },
    { icon: Languages, title: t("landing.multilang"), desc: t("landing.multilangDesc") },
    { icon: Palette, title: t("landing.themes"), desc: t("landing.themesDesc") },
    { icon: Undo2, title: t("landing.trash"), desc: t("landing.trashDesc") },
  ]

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
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
            <Button onClick={() => openAuth("signin")}>{t("auth.signIn")}</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-warm-200 bg-white px-3 py-1 text-xs text-warm-600 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-warm-500" />
          {t("landing.heroBadge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-warm-900 leading-tight max-w-3xl mx-auto">
          {t("app.tagline")}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-warm-600 max-w-2xl mx-auto leading-relaxed">
          {t("landing.heroSubtitle")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" onClick={() => openAuth("signup")}>
            {t("landing.startFree")}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => openAuth("signin")}>
            {t("auth.signIn")}
          </Button>
          <Button size="lg" variant="ghost" onClick={enterGuest}>
            <Eye className="w-4 h-4 mr-1.5" /> {t("auth.guestMode")}
          </Button>
        </div>
      </section>

      {/* 功能亮点 */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full">
        <h2 className="text-2xl font-bold text-warm-900 text-center mb-2">
          {t("landing.highlightsTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-warm-200 bg-white p-5 shadow-warm">
              <div className="w-10 h-10 rounded-lg bg-warm-100 text-warm-600 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-warm-900 mb-1">{title}</div>
              <div className="text-sm text-warm-600 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 模板矩阵 */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full">
        <h2 className="text-2xl font-bold text-warm-900 text-center mb-2">
          {t("landing.featuresTitle")}
        </h2>
        <p className="text-sm text-warm-600 text-center mb-8">
          {t("landing.featuresSubtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {TEMPLATE_KEYS.map((key) => {
            const meta = resolveTemplateMeta(key, locale, (k) => t(k as any))
            const Icon = ICONS[meta.icon]
            return (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white p-4 hover:border-warm-400 hover:shadow-warm transition-all"
              >
                <div className="w-9 h-9 shrink-0 rounded-lg bg-warm-100 text-warm-600 flex items-center justify-center">
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
