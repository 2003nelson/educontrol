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

// ─── Botón cerrar sesión ─────────────────────────────────────────────────────
function CerrarSesionBtn({ onClick }: { onClick: () => void }) {
  const [fase, setFase] = useState<'idle' | 'spinning' | 'rojo'>('idle')

  function handleClick() {
    // Fase 1: anillo gira y se pone rojo
    setFase('spinning')
    setTimeout(() => {
      // Fase 2: completamente rojo, luego llama onClick
      setFase('rojo')
      setTimeout(() => {
        onClick()
      }, 500)
    }, 600)
  }

  const color = fase === 'idle' ? '#22c55e' : '#ef4444'
  const ring  = fase === 'idle' ? '60 22' : '82 0'

  return (
    <button
      onClick={handleClick}
      disabled={fase !== 'idle'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        width: '100%', padding: '0.625rem 0.75rem',
        borderRadius: '0.875rem', border: 'none',
        background: fase !== 'idle' ? '#fef2f2' : 'transparent',
        cursor: fase === 'idle' ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
    >
      {/* Ícono power con anillo */}
      <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
        {/* Anillo exterior */}
        <svg
          width="32" height="32" viewBox="0 0 32 32"
          style={{
            position: 'absolute', inset: 0,
            transform: fase === 'spinning' ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: fase === 'spinning' ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' : 'none',
          }}
        >
          <circle
            cx="16" cy="16" r="13"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray={ring}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.4,0,0.2,1), stroke 0.3s' }}
          />
        </svg>
        {/* Power icon */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke={color} strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.3s' }}
          >
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </div>
      </div>

      {/* Texto */}
      <span style={{
        fontSize: '0.8rem', fontWeight: 600,
        color: fase !== 'idle' ? '#ef4444' : '#6b7280',
        transition: 'color 0.3s',
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
      } else {
        setPillStyle(prev => ({ ...prev, opacity: 0 }))
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
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-6px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        .nav-link {
          color: #6b7280;
          font-weight: 500;
          background: transparent;
          transition: color 0.18s, background 0.18s;
        }
        .nav-link:hover {
          color: #374151;
          background: #f9fafb;
        }
        .nav-link-active {
          color: #1e6fcc !important;
          font-weight: 600;
          background: transparent !important;
        }
        .nav-link .nav-indicator {
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 0;
          background: #1e6fcc;
          border-radius: 0 2px 2px 0;
          transition: height 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .nav-link-active .nav-indicator {
          height: 60%;
        }
        .nav-link .nav-icon { color: #9ca3af; transition: color 0.18s; }
        .nav-link:hover .nav-icon { color: #374151; }
        .nav-link-active .nav-icon { color: #1e6fcc !important; }
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
                  className={activo ? 'nav-link nav-link-active' : 'nav-link'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    position: 'relative',
                  }}
                >
                  {/* Indicador activo izquierdo */}
                  <div className="nav-indicator"/>
                  <span className="nav-icon" style={{ flexShrink: 0 }}>{item.icon}</span>
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