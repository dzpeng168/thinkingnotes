"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n"
import { NotebookPen, AlertCircle, KeyRound } from "lucide-react"

/**
 * 重置密码页：由 Supabase 找回邮件链接跳转而来。
 * URL hash 包含 access_token / refresh_token / type=recovery，
 * 客户端先 setSession 恢复会话，再让用户设置新密码。
 */
export default function ResetPasswordPage() {
  const { t } = useT()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [done, setDone] = useState(false)

  // 从 URL hash 恢复 Supabase 会话
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // 已有 recovery 会话（Supabase 隐式流已自动处理）
        setReady(true)
        return
      }
      // 尝试从 URL hash 手动解析（兼容部分浏览器/配置）
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      if (accessToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
          .then(({ error }) => {
            if (error) {
              setInvalid(true)
            } else {
              setReady(true)
            }
          })
      } else {
        setInvalid(true)
      }
    })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (newPassword.length < 6) {
      setError(t("auth.passwordHint"))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"))
      return
    }

    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setDone(true)
      // 清理 recovery 会话后引导用户重新登录
      await supabase.auth.signOut()
      setTimeout(() => router.push("/login"), 2000)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-100/70 via-warm-50 to-warm-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 sm:mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-warm-600 text-white flex items-center justify-center">
            <NotebookPen className="w-4 h-4" />
          </div>
          <span className="font-bold text-warm-900 text-lg">{t("app.name")}</span>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-8 shadow-sm">
          {invalid ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-warm-900 mb-1">
                  {t("auth.resetTokenInvalid")}
                </h2>
                <p className="text-sm text-warm-500">
                  {t("auth.forgotDesc")}
                </p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full">
                {t("auth.backToSignIn")}
              </Button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-warm-900">{t("auth.resetSuccess")}</h2>
              <p className="text-xs text-warm-500">{t("settings.storageDesc")}</p>
              <Button onClick={() => router.push("/login")} className="w-full">
                {t("auth.signIn")}
              </Button>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-warm-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-3 text-sm text-warm-500">Loading...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <KeyRound className="w-8 h-8 text-warm-500 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-warm-900">{t("auth.resetTitle")}</h2>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-warm-700">{t("auth.resetNewPassword")}</label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-warm-50"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-warm-700">{t("auth.resetConfirmPassword")}</label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-warm-50"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="break-all">{error}</span>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? t("common.loading") : t("auth.resetSubmit")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
