// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas públicas — no requieren sesión
const RUTAS_PUBLICAS = ['/login', '/cambiar-password', '/auth/confirmar', '/auth/callback']

// Rutas por rol
const RUTAS_DOCENTE   = ['/docente']
const RUTAS_SUPERADMIN = ['/super-admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect raíz al login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutas públicas — dejar pasar
  if (RUTAS_PUBLICAS.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Crear respuesta base
  let response = NextResponse.next({ request })

  // Crear cliente Supabase con cookies
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

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión — redirigir al login guardando la URL de retorno
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    // Guardar la ruta actual para redirigir después del login
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión — verificar rol para rutas restringidas
  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  const rol = usuarioData?.rol ?? user.user_metadata?.rol as string

  // Proteger rutas de docente
  if (RUTAS_DOCENTE.some(r => pathname.startsWith(r)) && rol !== 'docente') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Proteger rutas de super_admin
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