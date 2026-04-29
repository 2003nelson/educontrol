// src/components/docente/HeaderDocente.tsx
'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = { label: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Asistencia',     href: '/docente/grupos' },
  { label: 'Calificaciones', href: '/docente/calificaciones' },
  { label: 'Ayuda',          href: '/docente/ayuda' },
]

function isItemActive(href: string, pathname: string) {
  if (href === '/docente/grupos') return pathname === '/docente' || pathname?.startsWith('/docente/grupos')
  return pathname?.startsWith(href)
}

export default function HeaderDocente({ nombre }: { nombre: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between px-4 md:px-6 h-16">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: '#1e3a5f' }}>{nombre}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Panel Docente</p>
          </div>
        </div>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = isItemActive(item.href, pathname ?? '')
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150"
                style={{
                  background: active ? '#eff6ff' : 'transparent',
                  color:      active ? '#2563eb' : '#64748b',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: '#2563eb' }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Salir Desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all"
            style={{ background: '#fef2f2', color: '#dc2626' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Salir
          </button>

          {/* Hamburger Mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ background: '#f1f5f9' }}
          >
            <svg width="20" height="20" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      {menuOpen && (
        <div className="md:hidden border-t p-2 space-y-1" style={{ borderColor: '#e2e8f0', background: '#fafafa' }}>
          {NAV_ITEMS.map(item => {
            const active = isItemActive(item.href, pathname ?? '')
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setMenuOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm font-semibold rounded-lg transition"
                style={{ background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#64748b' }}
              >
                {item.label}
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm font-semibold rounded-lg mt-1"
            style={{ background: '#fef2f2', color: '#dc2626' }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}