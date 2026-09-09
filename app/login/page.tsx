"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n"
import { resolveTemplateMeta } from "@/lib/utils"
import type { TemplateType } from "@/lib/types"
import {
  NotebookPen, AlertCircle, Eye, FileText, Globe,
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
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const openAuth = (m: "signin" | "signup") => {
    setMode(m)
    setError(null)
    setForgotSent(false)
    setAuthOpen(true)
  }

  // 游客模式：仅设置前端标记 cookie（middleware 放行页面路由），主页展示本地示例数据
  const enterGuest = () => {
    document.cookie = "tn_guest=1; path=/; max-age=" + 60 * 60 * 24 * 30
    router.push("/")
    router.refresh()
  }

  /**
   * 登录/注册成功后整页跳转首页。
   * 不用 router.push：客户端路由会复用旧的 RSC 缓存与组件状态，
   * 偶发出现「已登录但首屏查不到笔记」；整页跳转可确保带着最新会话 cookie 经过 middleware。
   */
  const goHome = () => {
    document.cookie = "tn_guest=; path=/; max-age=0"
    window.location.assign("/")
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setForgotSent(false)
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setForgotSent(true)
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // 正式登录后清除游客标记
        goHome()
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          // 未开启邮箱确认：注册即登录，直接进入首页
          goHome()
        } else {
          // 开启了邮箱确认：提示查收邮件
          setError(t("auth.checkEmail"))
          setMode("signin")
        }
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-warm-600 text-white flex items-center justify-center">
              <NotebookPen className="w-4 h-4" />
            </div>
            <span className="font-bold text-warm-900 truncate">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 语言切换：移动端只留图标，避免挤占按钮空间 */}
            <button
              type="button"
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              aria-label={locale === "zh" ? "English" : "简体中文"}
              className="h-9 w-9 sm:w-auto sm:px-3 inline-flex items-center justify-center rounded-md border border-warm-200 hover:border-warm-400 text-sm text-warm-600 hover:text-warm-800 transition-colors"
            >
              <Globe className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">{locale === "zh" ? "English" : "简体中文"}</span>
            </button>
            <Button variant="outline" onClick={enterGuest} className="hidden md:inline-flex">
              <Eye className="w-4 h-4 mr-1.5" /> {t("auth.guestMode")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => openAuth("signin")}
              className="h-9 px-2.5 sm:h-10 sm:px-4"
            >
              {t("auth.signIn")}
            </Button>
            <Button
              onClick={() => openAuth("signup")}
              className="h-9 px-3 sm:h-10 sm:px-4"
            >
              {t("landing.startFree")}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-8 text-center">
        {/* 柔和背景光斑 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-[10%] w-72 h-72 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute -top-20 right-[10%] w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[640px] h-48 rounded-full bg-warm-200/50 blur-3xl" />
        </div>
        <h1 className="relative text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl mx-auto bg-gradient-to-r from-warm-900 via-warm-700 to-warm-500 bg-clip-text text-transparent">
          {t("app.tagline")}
        </h1>
        <p className="relative mt-4 sm:mt-5 text-base sm:text-lg text-warm-600 max-w-2xl mx-auto leading-relaxed">
          {t("landing.heroSubtitle")}
        </p>

        {/* CTA：移动端整行大按钮，桌面端横排 */}
        <div className="relative mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button size="lg" onClick={() => openAuth("signup")} className="w-full sm:w-auto">
            {t("landing.startFree")}
          </Button>
          <Button size="lg" variant="outline" onClick={() => openAuth("signin")} className="w-full sm:w-auto">
            {t("auth.signIn")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={enterGuest}
            className="w-full sm:w-auto md:hidden"
          >
            <Eye className="w-4 h-4 mr-1.5" /> {t("auth.guestMode")}
          </Button>
        </div>
      </section>

      {/* 模板矩阵 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-12 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-warm-900 text-center mb-2">
          {t("landing.featuresTitle")}
        </h2>
        <p className="text-sm text-warm-600 text-center mb-8">
          {t("landing.featuresSubtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
          {TEMPLATE_KEYS.map((key, i) => {
            const meta = resolveTemplateMeta(key, locale, (k) => t(k as any))
            const Icon = ICONS[meta.icon]
            return (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white p-4 hover:border-warm-400 hover:shadow-warm transition-all h-full"
              >
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${ICON_STYLES[i % ICON_STYLES.length]}`}>
                  {Icon && <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-warm-800">{meta.name}</div>
                  <div className="text-xs text-warm-600 leading-relaxed mt-0.5">{meta.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 底部 CTA + Footer */}

      <SiteFooter />

      {/* 登录/注册弹窗 */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {mode === "forgot"
                ? t("auth.forgotTitle")
                : mode === "signin"
                  ? t("auth.signIn")
                  : t("auth.signUp")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === "forgot" ? t("auth.forgotDesc") : t("app.tagline")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            {mode !== "forgot" && (
              <div className="flex rounded-lg border border-warm-200 p-0.5 bg-warm-50">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); setForgotSent(false) }}
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
                  onClick={() => { setMode("signup"); setError(null); setForgotSent(false) }}
                  className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                    mode === "signup"
                      ? "bg-white text-warm-900 shadow-sm border border-warm-200"
                      : "text-warm-500 hover:text-warm-700"
                  }`}
                >
                  {t("auth.signUpTab")}
                </button>
              </div>
            )}

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

            {mode !== "forgot" && (
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
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(null); setForgotSent(false) }}
                    className="text-[11px] text-warm-500 hover:text-warm-700 transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
            )}

            {forgotSent && (
              <div className="flex items-start gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <span className="break-all">{t("auth.forgotSent")}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy
                ? t("common.loading")
                : mode === "forgot"
                  ? t("auth.forgotSubmit")
                  : mode === "signin"
                    ? t("auth.signIn")
                    : t("auth.signUp")}
            </Button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); setForgotSent(false) }}
                className="w-full text-center text-xs text-warm-500 hover:text-warm-700 transition-colors"
              >
                {t("auth.backToSignIn")}
              </button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
