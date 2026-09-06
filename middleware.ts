import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 会话守卫：
 * - 未登录访问业务页 → 重定向 /login
 * - 游客模式（tn_guest=1 cookie）放行页面路由，仅作前端示例预览
 * - 已登录访问 /login → 重定向 /
 * - 静态资源与 /api 不在此处理（API 各自返回 401 JSON，游客不可写）
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isGuest = request.cookies.get('tn_guest')?.value === '1'

  if (!user && !isGuest && pathname !== '/login' && pathname !== '/reset-password') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
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
     * - favicon、图片、模板 md 等静态文件
     * - /api（Route Handler 自行鉴权，返回 401 而非重定向）
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|md|css|js|txt|xml)|api/).*)',
  ],
}
