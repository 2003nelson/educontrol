// src/app/docente/grupos/page.tsx
'use client'
import { useDocente } from '@/contexts/DocenteContext'
import { useRouter } from 'next/navigation'

// Colores por materia para el banner de la card
const MATERIA_COLORES: Record<string, { from: string; to: string; icon: string }> = {
  'Matemáticas':   { from: '#3b82f6', to: '#2563eb', icon: '∑' },
  'Cálculo':       { from: '#8b5cf6', to: '#7c3aed', icon: '∫' },
  'Física':        { from: '#14b8a6', to: '#0d9488', icon: 'φ' },
  'Química':       { from: '#f59e0b', to: '#d97706', icon: 'CH' },
  'Historia':      { from: '#ec4899', to: '#db2777', icon: 'Hz' },
  'Inglés':        { from: '#10b981', to: '#059669', icon: 'En' },
  'Biología':      { from: '#84cc16', to: '#65a30d', icon: 'Bio' },
  'Informática':   { from: '#06b6d4', to: '#0891b2', icon: '</>' },
  'Literatura':    { from: '#f43f5e', to: '#e11d48', icon: '📚' },
  'Geografía':     { from: '#06b6d4', to: '#0891b2', icon: '🌍' },
}

interface AsignaturaItem {
  id: string
  nombre: string
}

interface GrupoAgrupado {
  id: string
  numero: string
  grado: number
  asignaturas: AsignaturaItem[]
}

function getColorMateria(materia: string) {
  return MATERIA_COLORES[materia] ?? { from: '#1e3a5f', to: '#2563eb', icon: materia.charAt(0) }
}

function formatFechaHoy() {
  const hoy = new Date()
  return hoy.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatFechaCorta() {
  const hoy = new Date()
  return hoy.toLocaleDateString('es-MX', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}

export default function GruposPage() {
  const { docente, loading, error } = useDocente()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div 
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
          />
          <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando tus grupos...</p>
        </div>
      </div>
    )
  }

  if (error || !docente) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fef2f2' }}
          >
            <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: '#1e3a5f' }}>
            Error al cargar datos
          </p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {error || 'No se pudo cargar la información del docente'}
          </p>
        </div>
      </div>
    )
  }

  // Agrupar asignaciones por grupo
  const gruposPorId = docente.asignaciones.reduce((acc, asig) => {
    if (!acc[asig.grupo_id]) {
      acc[asig.grupo_id] = {
        id: asig.grupo_id,
        numero: asig.grupo_numero,
        grado: asig.grupo_grado,
        asignaturas: [],
      }
    }
    acc[asig.grupo_id].asignaturas.push({
      id: asig.asignatura_id,
      nombre: asig.asignatura_nombre,
    })
    return acc
  }, {} as Record<string, GrupoAgrupado>)

  const grupos = Object.values(gruposPorId)

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      
      {/* Header de la página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold" style={{ color: '#1e3a5f' }}>
            Mis grupos asignados
          </h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#94a3b8' }}>
            {formatFechaHoy()}
          </p>
        </div>
        <span 
          className="text-xs font-semibold px-3 py-1.5 rounded-full w-fit"
          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
        >
          {grupos.length} {grupos.length === 1 ? 'grupo activo' : 'grupos activos'}
        </span>
      </div>

      {/* Grid de grupos */}
      {grupos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-md">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#eff6ff' }}
            >
              <svg width="32" height="32" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1e3a5f' }}>
              No tienes grupos asignados
            </p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Contacta al administrador para que te asigne grupos y asignaturas
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {grupos.map(grupo => {
            const primeraAsignatura = grupo.asignaturas[0]?.nombre ?? 'Grupo'
            const col = getColorMateria(primeraAsignatura)

            return (
              <div 
                key={grupo.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all cursor-pointer"
                style={{ border: '1px solid #e2e8f0' }}
                onClick={() => router.push(`/docente/asistencia/${grupo.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform  = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow  = '0 8px 24px rgba(59,130,246,0.14)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform  = 'translateY(0)'
                  e.currentTarget.style.boxShadow  = 'none'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                {/* Banner degradado */}
                <div 
                  className="relative px-5 md:px-6 pt-5 md:pt-6 pb-6 md:pb-8 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
                >
                  {/* Círculos decorativos */}
                  <div style={{
                    position: 'absolute', right: '-20px', top: '-20px',
                    width: '110px', height: '110px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                  }} />
                  <div style={{
                    position: 'absolute', right: '20px', bottom: '-30px',
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                  }} />

                  {/* Badge semestre */}
                  <span 
                    className="text-xs font-semibold px-2.5 py-1 rounded-full mb-3 inline-block"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                  >
                    {grupo.grado}° Semestre
                  </span>

                  <div className="flex items-end justify-between">
                    <div>
                      <h3 
                        className="text-xl md:text-2xl font-bold text-white mb-0.5"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        Grupo {grupo.numero}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {grupo.asignaturas.length} {grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
                      </p>
                    </div>
                    {/* Símbolo */}
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
                      style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        color: 'white', 
                        fontFamily: 'Outfit, sans-serif' 
                      }}
                    >
                      {col.icon}
                    </div>
                  </div>
                </div>

                {/* Cuerpo card */}
                <div className="px-4 md:px-5 pt-4 pb-5">
                  {/* Asignaturas */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>
                      ASIGNATURAS:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grupo.asignaturas.map((asig: AsignaturaItem) => (
                        <span 
                          key={asig.id}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg"
                          style={{ background: '#eff6ff', color: '#2563eb' }}
                        >
                          {asig.nombre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="font-medium" style={{ color: '#64748b' }}>
                        {formatFechaCorta()}
                      </span>
                    </div>
                  </div>

                  {/* Botón */}
                  <button
                    className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${col.from}, ${col.to})`, 
                      color: 'white', 
                      border: 'none' 
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Tomar asistencia
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}