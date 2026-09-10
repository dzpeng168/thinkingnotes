import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 会话守卫：
 * - 未登录访问业务页 → 重定向 /login
 * - 游客模式（tn_guest=1 cookie）放行页面路由，仅作前端示例预览
 * - 已登录访问 /login → 重定向 /
 * - 静态资源与 /api 不在此处理（API 各自返回 401 JSON，游客不可写）
 *
 * 性能：用 getSession() 本地 decode cookie，零 RPC（getUser() 每次去 Auth server 验签要 300ms+）。
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getSession()：自动从 cookie 读 access token，本地 JWT decode，零 RPC
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const { pathname } = request.nextUrl
  const isGuest = request.cookies.get('tn_guest')?.value === '1'

  if (!user && !isGuest && pathname !== '/login' && pathname !== '/reset-password' && !pathname.startsWith('/docs/')) {
    // 只对"页面导航"做重定向：
    // Vercel Analytics 的上报请求（/_vercel/insights/* 或项目唯一路径）是 fetch 而非导航，
    // 若被重定向到 /login，统计会全部丢失。业务数据仍由 /api 自行 401 兜底。
    const secDest = request.headers.get('sec-fetch-dest')
    const accept = request.headers.get('accept') ?? ''
    const isDocument = secDest === 'document' || (secDest === null && accept.includes('text/html'))
    if (isDocument) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，但排除：
     * - _next/static, _next/image（Next 内部资源）
     * - _vercel/*（Vercel Analytics / Speed Insights 的脚本与上报端点，不能被登录守卫重定向）
     * - favicon、图片、模板 md 等静态文件
     * - /api（Route Handler 自行鉴权，返回 401 而非重定向）
     */
    '/((?!_next/static|_next/image|_vercel/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|md|css|js|txt|xml)|api/).*)',
  ],
}
