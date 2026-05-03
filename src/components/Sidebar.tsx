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
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    nombre: 'Docentes',
    href: '/dashboard/docentes',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    nombre: 'Asignaturas',
    href: '/dashboard/asignaturas',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    nombre: 'Grupos',
    href: '/dashboard/grupos',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
]

// ─── Dots macOS cerrar sesión ─────────────────────────────────────────────────
function CerrarSesionBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onEnter() {
    if (leaveT.current) clearTimeout(leaveT.current)
    enterT.current = setTimeout(() => setHov(true), 80)
  }
  function onLeave() {
    if (enterT.current) clearTimeout(enterT.current)
    leaveT.current = setTimeout(() => setHov(false), 220)
  }

  const dots = [
    { color: '#ef4444', delay: '0ms' },
    { color: '#f59e0b', delay: '80ms' },
    { color: '#22c55e', delay: '160ms' },
  ]

  return (
    <button
      onClick={onClick}
      onMouseEnter={e => { onEnter(); (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
      onMouseLeave={e => { onLeave(); (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', padding: '0.75rem 1rem',
        borderRadius: '0.875rem', border: 'none', background: 'transparent',
        cursor: 'pointer', gap: '0.375rem', overflow: 'hidden',
        transition: 'background 0.18s',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
        {dots.map((d, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: d.color,
            boxShadow: `0 1px 3px ${d.color}55`,
            animation: hov ? `dotBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) ${d.delay} both` : 'none',
          }}/>
        ))}
      </div>
      <span style={{
        fontSize: '0.7rem', fontWeight: 600, color: '#ef4444',
        maxHeight: hov ? '1.2rem' : '0',
        opacity: hov ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease, opacity 0.22s ease',
        transitionDelay: hov ? '0.18s' : '0s',
        whiteSpace: 'nowrap',
      }}>
        Cerrar sesión
      </span>
    </button>
  )
}

export default function Sidebar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const linkRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLElement | null>(null)
  const [pillStyle, setPillStyle] = useState<{ top: number; height: number; opacity: number }>({ top: 0, height: 0, opacity: 0 })

  useEffect(() => {
    // rAF para esperar que el DOM renderice el nuevo link activo
    const raf = requestAnimationFrame(() => {
      const activeEl = linkRefs.current[pathname] as HTMLElement | null
      const navEl = navRef.current
      if (activeEl && navEl) {
        const navRect = navEl.getBoundingClientRect()
        const elRect  = activeEl.getBoundingClientRect()
        setPillStyle({
          top:     elRect.top - navRect.top + navEl.scrollTop,
          height:  elRect.height,
          opacity: 1,
        })
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  async function handleCerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0) }
          40%       { transform: translateY(-5px) }
          60%       { transform: translateY(-2px) }
        }
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-6px) }
          to   { opacity: 1; transform: translateX(0) }
        }
      `}</style>

      <aside style={{
        width: 'clamp(200px, 15vw, 260px)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        borderRight: '1px solid #f0f0f5',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        animation: 'sidebarFadeIn 0.35s cubic-bezier(0.22,1,0.36,1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.25rem 1.25rem',
          borderBottom: '1px solid #f4f4f8',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #1e6fcc, #155ca0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(30,111,204,0.3)',
            }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700, letterSpacing: '-0.3px' }}>EC</span>
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e', margin: 0, letterSpacing: '-0.02em' }}>EduControl</p>
          </div>
        </div>

        {/* Nav */}
        <nav
          ref={el => { navRef.current = el }}
          style={{ flex: 1, padding: '0.875rem 0.875rem 0.5rem', position: 'relative' }}
        >
          {/* Etiqueta sección */}
          <p style={{
            fontSize: '0.62rem', fontWeight: 700, color: '#c0c0d0',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            margin: '0 0 0.5rem', padding: '0 0.5rem',
          }}>
            Menú principal
          </p>

          {/* Pill activo — glassmorphism */}
          {pillStyle.opacity > 0 && (
            <div style={{
              position: 'absolute',
              left: '0.875rem', right: '0.875rem',
              top: pillStyle.top,
              height: pillStyle.height,
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 2px 12px rgba(30,111,204,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
              transition: 'top 0.45s cubic-bezier(0.34,1.56,0.64,1), height 0.3s ease',
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    color: activo ? '#1e6fcc' : '#6b7280',
                    fontWeight: activo ? 600 : 500,
                    fontSize: '0.875rem',
                    background: 'transparent',
                    transition: 'color 0.18s, background 0.18s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!activo) {
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.background = '#f9fafb'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!activo) {
                      e.currentTarget.style.color = '#6b7280'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Indicador activo izquierdo */}
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: activo ? '60%' : 0,
                    background: '#1e6fcc',
                    borderRadius: '0 2px 2px 0',
                    transition: 'height 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}/>
                  <span style={{ color: activo ? '#1e6fcc' : '#9ca3af', transition: 'color 0.18s', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span>{item.nombre}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Divisor + Cerrar sesión */}
        <div style={{ padding: '0.5rem 0.875rem 1.25rem', borderTop: '1px solid #f4f4f8', flexShrink: 0 }}>
          <p style={{
            fontSize: '0.62rem', fontWeight: 700, color: '#c0c0d0',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            margin: '0.75rem 0 0.375rem', padding: '0 0.125rem',
          }}>
            Sesión
          </p>
          <CerrarSesionBtn onClick={handleCerrarSesion} />
        </div>
      </aside>
    </>
  )
}