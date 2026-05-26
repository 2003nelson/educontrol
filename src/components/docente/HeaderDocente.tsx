// src/components/docente/HeaderDocente.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
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

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const color = active ? '#1e3a5f' : '#b0b8c8'
  const sw    = active ? 1.9 : 1.6

  if (href === '/docente/grupos') return (
    <svg width="17" height="17" fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z"/>
      <rect x="4" y="4" width="16" height="17" rx="2.5"/>
      <path d="M8.5 12.5l2.5 2.5 4.5-4.5"/>
    </svg>
  )
  if (href === '/docente/calificaciones') return (
    <svg width="17" height="17" fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 1 2 17.5V4.5z"/>
      <line x1="11" y1="2" x2="11" y2="20"/>
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5A2.5 2.5 0 0 0 22 17.5V4.5z"/>
      <line x1="14.5" y1="7" x2="20" y2="7"/>
      <line x1="14.5" y1="10" x2="20" y2="10"/>
      <line x1="4" y1="7" x2="9.5" y2="7"/>
      <line x1="4" y1="10" x2="9.5" y2="10"/>
    </svg>
  )
  if (href === '/docente/ayuda') return (
    <svg width="17" height="17" fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.95.5c0 1.7-2.45 2.5-2.45 2.5"/>
      <circle cx="12" cy="16" r="0.5" fill={color} stroke="none"/>
    </svg>
  )
  return null
}

export default function HeaderDocente({ nombre }: { nombre: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [menuOpen, setMenuOpen]     = useState(false)
  const [salirHover, setSalirHover] = useState(false)
  const [saliendo, setSaliendo]     = useState(false)

  const btnRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const navRef  = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState({ left: 0, width: 0, ready: false })

  useEffect(() => {
    const activeHref = NAV_ITEMS.find(i => isItemActive(i.href, pathname ?? ''))?.href
    if (!activeHref) return
    const btn = btnRefs.current[activeHref]
    const nav = navRef.current
    if (!btn || !nav) return
    const br = btn.getBoundingClientRect()
    const nr = nav.getBoundingClientRect()
    setBar({ left: br.left - nr.left, width: br.width, ready: true })
  }, [pathname])

  function handleNav(href: string) { router.push(href) }

  async function handleLogout() {
    if (saliendo) return
    setSaliendo(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const seccionActiva = NAV_ITEMS.find(i => isItemActive(i.href, pathname ?? ''))?.label ?? ''

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e8eaf0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .hd-desktop { display: flex !important; }
        .hd-mobile  { display: none  !important; }
        @media (max-width: 767px) {
          .hd-desktop { display: none  !important; }
          .hd-mobile  { display: flex  !important; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', padding: '0 1.75rem', height: 60, position: 'relative' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <p className="hd-desktop" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            {nombre}
          </p>
        </div>

        {/* Sección activa móvil */}
        {seccionActiva && (
          <span className="hd-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '50%', marginTop: '-10px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', pointerEvents: 'none' }}>
            {seccionActiva}
          </span>
        )}

        {/* Nav Desktop — diseño A con underline */}
        <nav
          ref={navRef}
          className="hd-desktop"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', alignItems: 'stretch', height: 60 }}
        >
          {NAV_ITEMS.map(item => {
            const active = isItemActive(item.href, pathname ?? '')
            return (
              <a
                key={item.href}
                ref={el => { btnRefs.current[item.href] = el }}
                onClick={e => { e.preventDefault(); handleNav(item.href) }}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0 1.125rem',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#1e3a5f' : '#8e8e93',
                  textDecoration: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#475569' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#8e8e93' }}
              >
                <NavIcon href={item.href} active={active} />
                {item.label}
              </a>
            )
          })}

          {/* Underline deslizante */}
          {bar.ready && (
            <div style={{
              position: 'absolute', bottom: 0, height: 2, borderRadius: 2,
              left: bar.left, width: bar.width,
              background: '#1e3a5f',
              transition: 'left 0.28s cubic-bezier(0.34,1.4,0.64,1), width 0.28s cubic-bezier(0.34,1.4,0.64,1)',
              pointerEvents: 'none',
            }} />
          )}
        </nav>

        {/* Acciones derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>

          {/* Mensajería verde */}
          <button
            className="hd-desktop items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', color: '#16a34a', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#15803d' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#16a34a' }}
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Salir */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setSalirHover(true)}
            onMouseLeave={() => { if (!saliendo) setSalirHover(false) }}
            className="hd-desktop items-center"
            style={{
              gap: salirHover || saliendo ? '0.4rem' : 0,
              padding: '0.4rem',
              paddingLeft:  salirHover || saliendo ? '0.6rem' : '0.4rem',
              paddingRight: salirHover || saliendo ? '0.7rem' : '0.4rem',
              borderRadius: 9, border: 'none',
              cursor: saliendo ? 'not-allowed' : 'pointer',
              background: saliendo ? '#fef2f2' : salirHover ? '#fee2e2' : 'transparent',
              color: '#dc2626',
              transition: 'background 0.2s, gap 0.25s, padding 0.25s',
              overflow: 'hidden',
            }}
          >
            {saliendo ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            )}
            <span style={{
              fontSize: '0.8rem', fontWeight: 600,
              maxWidth: salirHover || saliendo ? '3.5rem' : '0px',
              opacity: salirHover || saliendo ? 1 : 0,
              overflow: 'hidden', whiteSpace: 'nowrap',
              transition: 'max-width 0.25s cubic-bezier(0.34,1.2,0.64,1), opacity 0.2s',
            }}>
              {saliendo ? 'Saliendo' : 'Salir'}
            </span>
          </button>

          {/* Hamburger móvil */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="hd-mobile"
            style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
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
        <div className="hd-mobile" style={{ padding: '0.5rem 0.75rem 0.75rem', background: '#f2f2f7', borderTop: '1px solid #e5e5ea' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map(item => {
              const active = isItemActive(item.href, pathname ?? '')
              return (
                <button key={item.href} onClick={() => { handleNav(item.href); setMenuOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.15s', background: active ? 'white' : 'transparent', color: active ? '#1e3a5f' : '#3a3a3c', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <NavIcon href={item.href} active={active} />
                  {item.label}
                </button>
              )
            })}
            <div style={{ height: 1, background: '#e5e5ea', margin: '0.25rem 0' }}/>
            <button onClick={() => setMenuOpen(false)}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Mensajería
            </button>
            <div style={{ height: 1, background: '#e5e5ea', margin: '0.25rem 0' }}/>
            <button onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}