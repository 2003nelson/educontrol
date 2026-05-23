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

// Iconos refinados estilo SF Symbols
function NavIcon({ href, active }: { href: string; active: boolean }) {
  const color  = active ? '#1e3a5f' : '#b0b8c8'
  const sw     = active ? 1.75 : 1.5
  const w      = 22

  // Asistencia — checkmark dentro de clipboard, proporciones SF
  if (href === '/docente/grupos') return (
    <svg width={w} height={w} fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {/* Clipboard body */}
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z"/>
      <rect x="4" y="4" width="16" height="17" rx="2.5"/>
      {/* Check elegante */}
      <path d="M8.5 12.5l2.5 2.5 4.5-4.5"/>
    </svg>
  )

  // Calificaciones — libro abierto con estrella, más detallado
  if (href === '/docente/calificaciones') return (
    <svg width={w} height={w} fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {/* Libro izquierdo */}
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 1 2 17.5V4.5z"/>
      {/* Lomo / spine */}
      <line x1="11" y1="2" x2="11" y2="20"/>
      {/* Libro derecho */}
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5A2.5 2.5 0 0 0 22 17.5V4.5z"/>
      {/* Líneas de texto derecho */}
      <line x1="14.5" y1="7" x2="20" y2="7"/>
      <line x1="14.5" y1="10" x2="20" y2="10"/>
      {/* Líneas de texto izquierdo */}
      <line x1="4" y1="7" x2="9.5" y2="7"/>
      <line x1="4" y1="10" x2="9.5" y2="10"/>
    </svg>
  )

  // Ayuda — globo de diálogo con signo ? más refinado
  if (href === '/docente/ayuda') return (
    <svg width={w} height={w} fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {/* Burbuja principal */}
      <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      {/* Signo ? curvo */}
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

  const [menuOpen, setMenuOpen]   = useState(false)
  const [salirHover, setSalirHover] = useState(false)
  const [saliendo, setSaliendo]   = useState(false)

  // Underline animado — rastrea posición del item activo
  const btnRefs      = useRef<Record<string, HTMLButtonElement | null>>({})
  const navRef       = useRef<HTMLDivElement | null>(null)
  const [underline, setUnderline] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    const activeHref = NAV_ITEMS.find(item => isItemActive(item.href, pathname ?? ''))?.href
    if (!activeHref) return
    const btn       = btnRefs.current[activeHref]
    const container = navRef.current
    if (btn && container) {
      const br = btn.getBoundingClientRect()
      const cr = container.getBoundingClientRect()
      setUnderline({ left: br.left - cr.left, width: br.width, opacity: 1 })
    }
  }, [pathname])

  function handleNav(href: string) { router.push(href) }

  async function handleLogout() {
    if (saliendo) return
    setSaliendo(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const seccionActiva = NAV_ITEMS.find(item => isItemActive(item.href, pathname ?? ''))?.label ?? ''

  return (
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: '1px solid #e8eaf0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 0.5rem 1.25rem 0.45rem;
          border: none; background: transparent; cursor: pointer;
          position: relative;
        }
        .nav-btn .nav-icon-wrap {
          transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1);
        }
        /* Label siempre ocupa espacio — solo cambia visibilidad */
        .nav-btn .nav-btn-label {
          font-size: 0.63rem; font-weight: 600; letter-spacing: 0.03em;
          white-space: nowrap; text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.18s ease;
          display: block;
          line-height: 1;
        }
        .nav-btn:hover .nav-icon-wrap {
          transform: translateY(-2px);
        }
        .nav-btn.is-active .nav-icon-wrap {
          transform: translateY(-2px) scale(0.88);
        }
        .nav-btn:hover .nav-btn-label,
        .nav-btn.is-active .nav-btn-label {
          opacity: 1;
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.75rem', height: 64 }}>

        {/* Logo / Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <p className="hidden md:block" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            {nombre}
          </p>
        </div>

        {/* Sección activa — solo móvil centrada */}
        {seccionActiva && (
          <span className="md:hidden" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', pointerEvents: 'none' }}>
            {seccionActiva}
          </span>
        )}

        {/* Nav Desktop — iconos + label + underline */}
        <nav className="hidden md:block" style={{ position: 'relative' }}>
          <div ref={navRef} style={{ display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
            {NAV_ITEMS.map(item => {
              const active = isItemActive(item.href, pathname ?? '')
              return (
                <button
                  key={item.href}
                  ref={el => { btnRefs.current[item.href] = el }}
                  className={`nav-btn${active ? ' is-active' : ''}`}
                  onClick={() => handleNav(item.href)}
                >
                  <div className="nav-icon-wrap" style={{
                    width: 40, height: 40,
                    borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? '#e8edf7' : '#f4f5f7',
                    border: active ? '1px solid #c8d4ea' : '1px solid transparent',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}>
                    <NavIcon href={item.href} active={active} />
                  </div>
                  <span
                    className="nav-btn-label"
                    style={{ color: active ? '#1e3a5f' : '#b0b8c8' }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}

            {/* Underline animado */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: underline.left,
              width: underline.width,
              height: 2,
              borderRadius: 2,
              background: '#1e3a5f',
              opacity: underline.opacity,
              transition: 'left 0.3s cubic-bezier(0.34,1.4,0.64,1), width 0.3s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s',
              pointerEvents: 'none',
            }} />
          </div>
        </nav>

        {/* Acciones derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>

          {/* Mensajería Desktop */}
          <button
            className="hidden md:flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f2f2f7'; e.currentTarget.style.color = '#3a3a3c' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8e8e93' }}
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Salir Desktop — expandible */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setSalirHover(true)}
            onMouseLeave={() => { if (!saliendo) setSalirHover(false) }}
            className="hidden md:flex items-center"
            style={{
              gap: salirHover || saliendo ? '0.375rem' : 0,
              padding: '0.4rem',
              paddingLeft:  salirHover || saliendo ? '0.6rem' : '0.4rem',
              paddingRight: salirHover || saliendo ? '0.7rem' : '0.4rem',
              borderRadius: 9,
              border: 'none',
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

          {/* Hamburger Mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
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
                    color: active ? '#1e3a5f' : '#3a3a3c',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                  }}
                >
                  <NavIcon href={item.href} active={active} />
                  {item.label}
                </button>
              )
            })}
            <div style={{ height: 1, background: '#e5e5ea', margin: '0.25rem 0' }}/>
            <button
              onClick={() => setMenuOpen(false)}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#3a3a3c', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Mensajería
            </button>
            <div style={{ height: 1, background: '#e5e5ea', margin: '0.25rem 0' }}/>
            <button
              onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
            >
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