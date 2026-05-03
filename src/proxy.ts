// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTAS_PUBLICAS = ['/login', '/cambiar-password', '/auth/confirmar', '/auth/callback']
const RUTAS_DOCENTE   = ['/docente']
const RUTAS_SUPERADMIN = ['/super-admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (RUTAS_PUBLICAS.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  const rol = usuarioData?.rol ?? user.user_metadata?.rol as string

  if (RUTAS_DOCENTE.some(r => pathname.startsWith(r)) && rol !== 'docente') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (RUTAS_SUPERADMIN.some(r => pathname.startsWith(r)) && rol !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fondo.png|logo.svg|icon.*|apple-icon.*).*)',
  ],
}