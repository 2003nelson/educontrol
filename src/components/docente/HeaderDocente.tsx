// src/components/docente/HeaderDocente.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = { label: string; href: string }

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/docente/grupos': (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  '/docente/calificaciones': (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  '/docente/ayuda': (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
    </svg>
  ),
}

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
  const [salirHover, setSalirHover] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  const seccionActiva = NAV_ITEMS.find(item => isItemActive(item.href, pathname ?? ''))?.label ?? ''
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const [selectorStyle, setSelectorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    const activeHref = NAV_ITEMS.find(item => isItemActive(item.href, pathname ?? ''))?.href
    if (!activeHref) return
    const btn = btnRefs.current[activeHref]
    const container = navContainerRef.current
    if (btn && container) {
      const btnRect = btn.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      setSelectorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      })
    }
  }, [pathname])

  function handleNav(href: string) {
    router.push(href)
  }

  async function handleLogout() {
    if (saliendo) return
    setSaliendo(true)
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
            style={{ background: '#8e8e93' }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: '#1e3a5f' }}>{nombre}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Panel Docente</p>
          </div>
        </div>

        {/* Sección activa — solo móvil, centrada */}
        {seccionActiva && (
          <span
            className="md:hidden absolute left-1/2 -translate-x-1/2 text-sm font-semibold"
            style={{ color: '#1e293b', letterSpacing: '0.01em', pointerEvents: 'none' }}
          >
            {seccionActiva}
          </span>
        )}

        {/* Nav Desktop — segmented control estilo Apple */}
        <nav className="hidden md:flex">
          <div
            ref={navContainerRef}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center',
              background: '#f2f2f7',
              borderRadius: 10,
              padding: '3px',
              gap: 0,
            }}
          >
            {/* Selector blanco animado */}
            <div style={{
              position: 'absolute',
              top: 3, height: 'calc(100% - 6px)',
              left: selectorStyle.left + 3,
              width: selectorStyle.width,
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)',
              transition: 'left 0.28s cubic-bezier(0.34,1.56,0.64,1), width 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s',
              opacity: selectorStyle.opacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}/>
            {NAV_ITEMS.map(item => {
              const active = isItemActive(item.href, pathname ?? '')
              return (
                <button
                  key={item.href}
                  ref={el => { btnRefs.current[item.href] = el }}
                  onClick={() => handleNav(item.href)}
                  style={{
                    position: 'relative', zIndex: 1,
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem', fontWeight: 600,
                    border: 'none', background: 'transparent',
                    borderRadius: 8, cursor: 'pointer',
                    color: active ? '#1c1c1e' : '#6e6e73',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                  }}
                >
                  {NAV_ICONS[item.href]}
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Salir Desktop — expandible */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setSalirHover(true)}
            onMouseLeave={() => { if (!saliendo) setSalirHover(false) }}
            className="hidden md:flex items-center"
            style={{
              gap: salirHover || saliendo ? '0.4rem' : 0,
              padding: '0.45rem',
              borderRadius: 10,
              border: 'none',
              cursor: saliendo ? 'not-allowed' : 'pointer',
              background: saliendo ? '#fef2f2' : salirHover ? '#fee2e2' : 'transparent',
              color: '#dc2626',
              transition: 'background 0.2s, gap 0.25s, padding 0.25s',
              overflow: 'hidden',
              paddingLeft: salirHover || saliendo ? '0.65rem' : '0.45rem',
              paddingRight: salirHover || saliendo ? '0.75rem' : '0.45rem',
            }}
          >
            {saliendo ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            )}
            <span style={{
              fontSize: '0.8125rem', fontWeight: 600,
              maxWidth: salirHover || saliendo ? '3.5rem' : '0px',
              opacity: salirHover || saliendo ? 1 : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'max-width 0.25s cubic-bezier(0.34,1.2,0.64,1), opacity 0.2s',
            }}>
              {saliendo ? 'Saliendo' : 'Salir'}
            </span>
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

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
        <div className="md:hidden" style={{ padding: '0.5rem 0.75rem 0.75rem', background: '#f2f2f7', borderTop: '1px solid #e5e5ea' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map(item => {
              const active = isItemActive(item.href, pathname ?? '')
              return (
                <button
                  key={item.href}
                  onClick={() => { handleNav(item.href); setMenuOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                    fontSize: '0.875rem', fontWeight: 600, borderRadius: 10,
                    border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                    background: active ? 'white' : 'transparent',
                    color: active ? '#2563eb' : '#3a3a3c',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {item.label}
                </button>
              )
            })}
            <div style={{ height: 1, background: '#e5e5ea', margin: '0.25rem 0' }}/>
            <button
              onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}