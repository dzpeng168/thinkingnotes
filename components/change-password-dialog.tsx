"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n"
import { KeyRound, CircleCheck } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

/** 修改密码：先校验当前密码（重新登录验证），再调用 Supabase updateUser 更新 */
export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const { t } = useT()
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // 打开时重置表单状态
  useEffect(() => {
    if (open) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      setDone(false)
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (newPassword.length < 6) {
      setError(t("settings.changePasswordHint"))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"))
      return
    }

    setBusy(true)
    try {
      const supabase = createClient()
      // 重新验证当前密码，防止会话被冒用时改密
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      })
      if (verifyError) {
        setError(t("settings.currentPasswordError"))
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setDone(true)
      // 稍作停留展示成功提示后自动关闭
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-warm-500" /> {t("settings.changePassword")}
          </DialogTitle>
          <DialogDescription>{t("settings.changePasswordHint")}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex items-center gap-2 py-6 justify-center text-warm-700">
            <CircleCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">{t("settings.changePasswordSuccess")}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t("settings.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 break-all">{error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
              <Button type="submit" disabled={busy}>
                {t("settings.changePasswordSubmit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
