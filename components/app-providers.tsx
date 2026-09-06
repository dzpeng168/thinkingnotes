"use client"

import { HotkeysProvider } from "@/components/hotkeys-context"
import { GlobalHotkeys } from "@/components/global-hotkeys"
import { I18nProvider } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { AuthProvider } from "@/components/auth-context"

export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <AuthProvider>
        <HotkeysProvider>
          {children}
          <GlobalHotkeys />
        </HotkeysProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
