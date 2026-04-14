'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navDocente = [
  { nombre: 'Mis Aulas',    href: '/docente' },
  { nombre: 'Asistencia',   href: '/docente/asistencia' },
  { nombre: 'Calificaciones', href: '/docente/calificaciones' },
]

export default function SidebarDocente() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient() // ← CORRECCIÓN

  async function handleCerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function linkStyle(activo: boolean) {
    return {
      color:      activo ? '#1e3a5f' : '#3d5a80',
      background: activo ? 'rgba(255,255,255,0.55)' : 'transparent',
      fontWeight: activo ? 600 : 400,
    } as React.CSSProperties
  }

  return (
    <div className="p-4 min-h-screen shrink-0" style={{ width: '220px' }}>
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
          {/* Badge rol */}
          <div className="mt-3 px-2 py-1 rounded-lg inline-flex items-center gap-1.5"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
            <span className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>Docente</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-0.5">
          <div className="pb-1">
            <p className="px-3 text-xs font-semibold uppercase"
              style={{ color: 'rgba(61,90,128,0.5)', letterSpacing: '0.1em' }}>
              Mi panel
            </p>
          </div>

          {navDocente.map(item => {
            const activo = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={linkStyle(activo)}
                onMouseEnter={e => { if (!activo) e.currentTarget.style.background = 'rgba(255,255,255,0.30)' }}
                onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'transparent' }}
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