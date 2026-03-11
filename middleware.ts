import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  const subdominio = hostname.split('.')[0]
  
  const reservados = ['www', 'localhost', 'educontrol-pi', 'dinoti']
  
  if (!reservados.includes(subdominio)) {
    const response = NextResponse.next()
    response.headers.set('x-tenant', subdominio)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}