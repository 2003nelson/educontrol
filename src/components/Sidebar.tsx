// src/components/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'

const navItems = [
  {
    nombre: 'Inicio',
    href: '/dashboard',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    nombre: 'Docentes',
    href: '/dashboard/docentes',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    nombre: 'Seguimiento',
    href: '/dashboard/seguimiento',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    nombre: 'Asignaturas',
    href: '/dashboard/asignaturas',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    nombre: 'Grupos',
    href: '/dashboard/grupos',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router   = useRouter()

  const linkRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef   = useRef<HTMLElement | null>(null)
  const dropRef  = useRef<HTMLDivElement | null>(null)

  const [pillStyle, setPillStyle] = useState<{ top: number; height: number; opacity: number }>({ top: 0, height: 0, opacity: 0 })
  const [dropOpen, setDropOpen]   = useState(false)
  const [cerrando, setCerrando]   = useState(false)

  // Pill animada — conservada intacta
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const activeEl = linkRefs.current[pathname] as HTMLElement | null
      const navEl    = navRef.current
      if (activeEl && navEl) {
        const navRect = navEl.getBoundingClientRect()
        const elRect  = activeEl.getBoundingClientRect()
        setPillStyle({ top: elRect.top - navRect.top + navEl.scrollTop, height: elRect.height, opacity: 1 })
      } else {
        setPillStyle(prev => ({ ...prev, opacity: 0 }))
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleCerrarSesion() {
    setCerrando(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap');

        @keyframes sidebarFadeIn {
          from { opacity:0; transform:translateX(-8px) }
          to   { opacity:1; transform:translateX(0) }
        }
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes spin { to { transform:rotate(360deg) } }

        .sb-link {
          color: #6b7280;
          font-weight: 500;
          background: transparent;
          transition: color 0.15s;
        }
        .sb-link:hover { color: #1c1c1e; }
        .sb-link:hover .sb-icon-wrap { background: rgba(0,0,0,0.05); }
        .sb-link-active { color: #1e3a8a !important; font-weight: 600; }
        .sb-link-active .sb-icon-wrap { background: rgba(30,58,138,0.1) !important; }
        .sb-link-active .sb-icon-wrap svg { stroke: #1e3a8a !important; }

        .sb-icon-wrap {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
          background: transparent;
        }
        .sb-icon-wrap svg { transition: stroke 0.15s; }

        .sb-session-btn:hover { background: rgba(0,0,0,0.04) !important; }
        .sb-session-btn:hover .sb-session-icon { background: rgba(0,0,0,0.07) !important; }

        .sb-logout-row:hover { background: rgba(239,68,68,0.06) !important; }
      `}</style>

      <aside style={{
        width: 'clamp(200px, 15vw, 240px)',
        height: '100vh',
        position: 'sticky', top: 0,
        background: '#ffffff',
        borderRight: '1px solid #f0f0f5',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        animation: 'sidebarFadeIn 0.35s cubic-bezier(0.22,1,0.36,1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        overflowY: 'auto',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid #f4f4f8', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#48484a 0%,#6b6b6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}>
            <span style={{ color:'white', fontSize:15, fontWeight:800, letterSpacing:'-0.5px', fontFamily:'Outfit, sans-serif' }}>EC</span>
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1c1e', margin: 0, letterSpacing: '-0.02em', fontFamily: '"Outfit", sans-serif' }}>EduControl</p>
        </div>

        {/* ── Nav ── */}
        <nav ref={el => { navRef.current = el }} style={{ flex: 1, padding: '1rem 0.75rem 0.5rem', position: 'relative' }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, color: '#c7c7cc', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.5rem', padding: '0 0.625rem' }}>
            Menú principal
          </p>

          {/* Pill activo — lógica conservada intacta */}
          {pillStyle.opacity > 0 && (
            <div style={{
              position: 'absolute',
              left: '0.75rem', right: '0.75rem',
              top: pillStyle.top,
              height: pillStyle.height,
              background: 'rgba(37,99,235,0.07)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(37,99,235,0.1)',
              boxShadow: '0 1px 6px rgba(37,99,235,0.08)',
              transition: 'top 0.45s cubic-bezier(0.34,1.56,0.64,1), height 0.3s ease, opacity 0.2s',
              opacity: pillStyle.opacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}/>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', zIndex: 1 }}>
            {navItems.map(item => {
              const activo = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={el => { linkRefs.current[item.href] = el }}
                  className={activo ? 'sb-link sb-link-active' : 'sb-link'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.8375rem' }}
                >
                  <div className="sb-icon-wrap">
                    {item.icon}
                  </div>
                  <span>{item.nombre}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* ── Sesión ── */}
        <div style={{ padding: '0.5rem 0.75rem 1.25rem', borderTop: '1px solid #f4f4f8', flexShrink: 0, position: 'relative' }} ref={dropRef}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, color: '#c7c7cc', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0.625rem 0 0.375rem', padding: '0 0.375rem' }}>
            Sesión
          </p>

          {/* Botón opciones de sesión */}
          <button
            className="sb-session-btn"
            onClick={() => setDropOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
          >
            <div className="sb-session-icon" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
              <svg width="15" height="15" fill="none" stroke="#6b7280" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.8375rem', fontWeight: 500, color: '#6b7280', flex: 1 }}>Opciones de sesión</span>
            <svg width="12" height="12" fill="none" stroke="#c7c7cc" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.22s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div style={{ position: 'absolute', bottom: 'calc(100% - 0.5rem)', left: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden', animation: 'dropIn 0.22s cubic-bezier(0.34,1.3,0.64,1)', zIndex: 50 }}>
              {/* Encabezado */}
              <div style={{ padding: '0.75rem 0.875rem 0.625rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1c1c1e', margin: 0 }}>Sesión activa</p>
                <p style={{ fontSize: '0.65rem', color: '#8e8e93', margin: '1px 0 0' }}>CBTA No. 62</p>
              </div>
              {/* Cerrar sesión */}
              <button
                className="sb-logout-row"
                onClick={handleCerrarSesion}
                disabled={cerrando}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', cursor: cerrando ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'background 0.12s', opacity: cerrando ? 0.6 : 1 }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {cerrando ? (
                    <div style={{ width: 12, height: 12, border: '2px solid #fecaca', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                  ) : (
                    <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', margin: 0 }}>{cerrando ? 'Cerrando…' : 'Cerrar sesión'}</p>
                  <p style={{ fontSize: '0.63rem', color: '#f87171', margin: 0 }}>Salir del sistema</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}