// src/components/docente/HeaderDocente.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Grupos', href: '/docente/grupos' },
  { label: 'Asistencia', href: '/docente/asistencia' },
  { label: 'Calificaciones', href: '/docente/calificaciones' },
  { label: 'Ayuda', href: '/docente/ayuda' },
]

export default function HeaderDocente({ nombre }: { nombre: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Estado para el indicador animado
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const navRef = useRef<HTMLDivElement>(null)

  // Calcular posición del indicador
  useEffect(() => {
    if (!navRef.current) return

    const activeIndex = NAV_ITEMS.findIndex(item => {
      if (item.href === '/docente/grupos') {
        return pathname === '/docente' || pathname === '/docente/grupos'
      }
      return pathname?.startsWith(item.href)
    })

    if (activeIndex === -1) return

    const activeButton = navRef.current.children[activeIndex] as HTMLElement
    if (!activeButton) return

    setIndicatorStyle({
      width: activeButton.offsetWidth,
      left: activeButton.offsetLeft,
    })
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header 
      className="sticky top-0 z-50 bg-white shadow-sm"
      style={{ borderBottom: '1px solid #e2e8f0' }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        
        {/* Logo / Nombre */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}
          >
            {nombre.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>
              {nombre}
            </p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Panel Docente
            </p>
          </div>
        </div>

        {/* Navegación Desktop */}
        <div className="hidden md:flex items-center gap-1 relative" ref={navRef}>
          {/* Indicador animado */}
          <div
            className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #2563eb, #1e3a5f)',
              ...indicatorStyle,
            }}
          />
          
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/docente/grupos' 
              ? pathname === '/docente' || pathname === '/docente/grupos'
              : pathname?.startsWith(item.href)

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="px-4 py-2 text-sm font-medium transition-colors relative"
                style={{
                  color: isActive ? '#1e3a5f' : '#64748b',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#1e3a5f'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#64748b'
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Botón Menú Móvil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg"
          style={{ background: '#f1f5f9' }}
        >
          <svg width="20" height="20" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>

        {/* Botón Cerrar Sesión Desktop */}
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
          style={{ background: '#fef2f2', color: '#dc2626' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Salir
        </button>
      </div>

      {/* Menú Móvil */}
      {menuOpen && (
        <div 
          className="md:hidden border-t"
          style={{ borderColor: '#e2e8f0', background: '#fafafa' }}
        >
          <div className="flex flex-col p-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/docente/grupos'
                ? pathname === '/docente' || pathname === '/docente/grupos'
                : pathname?.startsWith(item.href)

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href)
                    setMenuOpen(false)
                  }}
                  className="text-left px-4 py-3 text-sm font-medium rounded-lg transition"
                  style={{
                    background: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#64748b',
                  }}
                >
                  {item.label}
                </button>
              )
            })}
            
            <button
              onClick={handleLogout}
              className="text-left px-4 py-3 text-sm font-medium rounded-lg transition mt-2"
              style={{ background: '#fef2f2', color: '#dc2626' }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}