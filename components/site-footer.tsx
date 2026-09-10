"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n"

/** 站点通用 Footer：PRODUCT / CONTACT / 法律链接。链接均为占位 #，后续接入营销站 URL 时替换 */
export function SiteFooter() {
  const { t } = useT()

  return (
    <footer className="border-t border-warm-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {/* PRODUCT */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-warm-400 uppercase mb-3">
              {t("siteFooter.product")}
            </h4>
            <ul className="space-y-2">
              {/* <FooterLink href="/">{t("siteFooter.home")}</FooterLink> */}
              {/* <FooterLink href="#">{t("siteFooter.pricing")}</FooterLink> */}
              <li>
                <Link
                  href="/docs/features"
                  className="text-sm text-warm-600 hover:text-warm-900 transition-colors"
                >
                  {t("siteFooter.features")}
                </Link>
              </li>
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
              
              <li>
                <a
                  href="mailto:dzpeng168@gmail.com"
                  className="text-sm text-warm-600 hover:text-warm-900 transition-colors"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* 右侧留白占位（保持网格对齐） */}
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
        </div>

        {/* 友情链接 */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-warm-100">
          <h4 className="text-xs font-semibold tracking-wider text-warm-400 uppercase mb-3">
            {t("siteFooter.links")}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://xinquji.com"
              target="_blank"
              rel="noopener noreferrer"
              title="新趣集"
              className="inline-flex shrink-0 opacity-90 hover:opacity-100 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://xinquji.com/badge"
                alt="Featured on 新趣集"
                style={{ width: "200px", height: "54px" }}
                width={200}
                height={54}
              />
            </a>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 border-t border-warm-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-warm-400">
          <span>{t("siteFooter.copyright")}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
