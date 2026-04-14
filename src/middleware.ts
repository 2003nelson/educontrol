// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const path = url.pathname
  const hostname = request.headers.get('host') || ''
  
  // Extraer subdomain o usar dominio base
  const parts = hostname.split('.')
  let subdomain = 'localhost' // Default para desarrollo
  
  // En producción con dinoti.xyz
  if (hostname.includes('dinoti.xyz')) {
    if (parts.length >= 3) {
      // Subdominio: cbta62.dinoti.xyz → 'cbta62'
      subdomain = parts[0].toLowerCase()
    } else {
      // Dominio base: dinoti.xyz → 'dinoti'
      subdomain = 'dinoti'
    }
  }
  // En Vercel preview: something.vercel.app
  else if (hostname.includes('vercel.app')) {
    subdomain = parts[0].toLowerCase()
  }

  // ─────────────────────────────────────────────────────────────
  // 🏠 REDIRECT: Ruta raíz → /login
  // ─────────────────────────────────────────────────────────────
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ─────────────────────────────────────────────────────────────
  // 🔄 REWRITE: Rutas dinámicas a [slug]
  // ─────────────────────────────────────────────────────────────
  if (
    path.startsWith('/login') || 
    path.startsWith('/dashboard') || 
    path.startsWith('/docente')
  ) {
    const response = NextResponse.rewrite(new URL(`/${subdomain}${path}`, request.url))
    response.headers.set('x-tenant', subdomain)
    return response
  }

  // ─────────────────────────────────────────────────────────────
  // ✅ PASAR TODO LO DEMÁS
  // ─────────────────────────────────────────────────────────────
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fondo.png|logo.svg).*)',
  ],
}