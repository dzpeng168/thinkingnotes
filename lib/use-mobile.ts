"use client"

import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * 检测当前视口是否为移动端（< 768px）。
 * SSR 期间返回 false（避免 hydration mismatch），挂载后实时检测。
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
