"use client"

import { useT } from "@/lib/i18n"

/** 站点通用 Footer：PRODUCT / CONTACT / 法律链接。链接均为占位 #，后续接入营销站 URL 时替换 */
export function SiteFooter() {
  const { t } = useT()

  return (
    <footer className="border-t border-warm-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* PRODUCT */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-warm-400 uppercase mb-3">
              {t("siteFooter.product")}
            </h4>
            <ul className="space-y-2">
              <FooterLink href="#">{t("siteFooter.home")}</FooterLink>
              {/* <FooterLink href="#">{t("siteFooter.pricing")}</FooterLink> */}
              <FooterLink href="#">{t("siteFooter.features")}</FooterLink>
              {/* <FooterLink href="#">{t("siteFooter.blog")}</FooterLink> */}
              {/* <FooterLink href="#">{t("siteFooter.newsletter")}</FooterLink> */}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-warm-400 uppercase mb-3">
              {t("siteFooter.contact")}
            </h4>
            <ul className="space-y-2">
              <FooterLink href="#">{t("siteFooter.support")}</FooterLink>
              <FooterLink href="#">{t("siteFooter.email")}</FooterLink>
            </ul>
          </div>

          {/* 右侧留白占位（保持网格对齐） */}
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
        </div>

        <div className="mt-10 pt-6 border-t border-warm-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-warm-400">
          <span>{t("siteFooter.copyright")}</span>
          <div className="flex items-center gap-4">
            <FooterLink href="#" size="xs">{t("siteFooter.privacy")}</FooterLink>
            <FooterLink href="#" size="xs">{t("siteFooter.terms")}</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
  size = "sm",
}: {
  href: string
  children: React.ReactNode
  size?: "sm" | "xs"
}) {
  const sizeCls = size === "xs" ? "text-xs" : "text-sm"
  return (
    <li>
      <a
        href={href}
        className={`${sizeCls} text-warm-600 hover:text-warm-900 transition-colors`}
      >
        {children}
      </a>
    </li>
  )
}
