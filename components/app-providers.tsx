"use client"

import { HotkeysProvider } from "@/components/hotkeys-context"
import { GlobalHotkeys } from "@/components/global-hotkeys"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider } from "@/components/auth-context"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <HotkeysProvider>
          {children}
          <GlobalHotkeys />
        </HotkeysProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
