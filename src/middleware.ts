// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const path = url.pathname
  const hostname = request.headers.get('host') || ''
  
  let subdomain = 'localhost' // Default para desarrollo
  
  // Extraer subdomain real
  if (hostname.includes('dinoti.xyz')) {
    const parts = hostname.split('.')
    
    // www.dinoti.xyz o dinoti.xyz → usar 'cbta62' como default
    if (parts.length <= 2 || parts[0] === 'www') {
      subdomain = 'cbta62' // Plantel por defecto
    } else {
      // cbta62.dinoti.xyz → usar 'cbta62'
      subdomain = parts[0].toLowerCase()
    }
  }
  // Vercel preview URLs
  else if (hostname.includes('vercel.app')) {
    // Para preview, usar un slug fijo
    subdomain = 'localhost'
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