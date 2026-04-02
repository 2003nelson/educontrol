'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const navPrincipal = [
  { nombre: 'Inicio',      href: '/dashboard' },
  { nombre: 'Docentes',    href: '/dashboard/docentes' },
  { nombre: 'Seguimiento', href: '/dashboard/seguimiento' },
  { nombre: 'Asignaturas', href: '/dashboard/asignaturas' },
  { nombre: 'Grupos',      href: '/dashboard/grupos' },
]

const navAvanzado = [
  { nombre: 'Ciclo Escolar',     href: '/dashboard/ciclo' },
  { nombre: 'Sistema',           href: '/dashboard/sistema' },
  { nombre: 'Roles del sistema', href: '/dashboard/roles' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  // Refs para cada link
  const linkRefs = useRef<Record<string, HTMLElement | null>>({})
  const [pillStyle, setPillStyle] = useState<{ top: number; height: number; opacity: number }>({ top: 0, height: 0, opacity: 0 })
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    const activeEl = linkRefs.current[pathname]
    if (activeEl) {
      const parent = activeEl.offsetParent as HTMLElement
      const parentRect = parent?.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      setPillStyle({
        top:     elRect.top - (parentRect?.top ?? 0) + (parent?.scrollTop ?? 0),
        height:  elRect.height,
        opacity: 1,
      })
    }
    prevPathRef.current = pathname
  }, [pathname])

  async function handleCerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-4 min-h-screen shrink-0" style={{ width: '220px' }}>
      <style>{`
        @keyframes sidebarSlide {
          from { opacity: 0; transform: translateX(-8px) }
          to   { opacity: 1; transform: translateX(0) }
        }
      `}</style>
      <aside
        className="h-full rounded-2xl flex flex-col py-5 px-3"
        style={{
          background:           'rgba(99, 130, 180, 0.18)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:               '1px solid rgba(255,255,255,0.22)',
          boxShadow:            '0 4px 32px rgba(60,80,120,0.10)',
          minHeight:            'calc(100vh - 2rem)',
        }}
      >
        {/* Logo */}
        <div className="px-3 pb-5 mb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.85)' }}>
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                EC
              </span>
            </div>
            <span className="text-sm font-bold tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#1e3a5f' }}>
              EduControl
            </span>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 space-y-0.5" style={{ position: 'relative' }}>

          {/* Pill deslizante cristalina */}
          {pillStyle.opacity > 0 && (
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              top:    pillStyle.top,
              height: pillStyle.height,
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 2px 12px rgba(59,130,246,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'top 0.45s cubic-bezier(0.34,1.56,0.64,1), height 0.3s ease, opacity 0.2s ease',
              opacity: pillStyle.opacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}/>
          )}

          {navPrincipal.map(item => {
            const activo = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                ref={el => { linkRefs.current[item.href] = el }}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  position: 'relative', zIndex: 1,
                  color:      activo ? '#1e3a5f' : '#3d5a80',
                  fontWeight: activo ? 600 : 400,
                  background: 'transparent',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => { if (!activo) e.currentTarget.style.color = '#1e3a5f' }}
                onMouseLeave={e => { if (!activo) e.currentTarget.style.color = '#3d5a80' }}
              >
                {item.nombre}
              </Link>
            )
          })}

          {/* Avanzado */}
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold uppercase"
              style={{ color: 'rgba(61,90,128,0.5)', letterSpacing: '0.1em' }}>
              Avanzado
            </p>
          </div>

          {navAvanzado.map(item => {
            const activo = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                ref={el => { linkRefs.current[item.href] = el }}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  position: 'relative', zIndex: 1,
                  color:      activo ? '#1e3a5f' : '#3d5a80',
                  fontWeight: activo ? 600 : 400,
                  background: 'transparent',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => { if (!activo) e.currentTarget.style.color = '#1e3a5f' }}
                onMouseLeave={e => { if (!activo) e.currentTarget.style.color = '#3d5a80' }}
              >
                {item.nombre}
              </Link>
            )
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <button onClick={handleCerrarSesion}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: '#c0392b' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,57,43,0.10)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </div>
  )
}