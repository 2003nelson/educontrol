// src/app/docente/(autenticado)/grupos/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useDocente } from '@/contexts/DocenteContext'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AsignaturaItem { id: string; nombre: string }
interface GrupoAgrupado { id: string; numero: string; grado: number; asignaturas: AsignaturaItem[] }
interface Alumno { id: string; nombre_completo: string; matricula?: string }
type Asistencia = Record<string, 'P' | 'A' | 'J'>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatFechaCorta() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Colores del sistema principal ────────────────────────────────────────────
// Recuadro gris igual al sistema principal
const BADGE_STYLE = {
  background: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0',
}

// ─── Componente: Lista de asistencia ─────────────────────────────────────────

function AsistenciaView({
  asignatura,
  grupoId,
  onBack,
}: {
  asignatura: AsignaturaItem
  grupoId: string
  onBack: () => void
}) {
  const supabase = createClient()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [asistencia, setAsistencia] = useState<Asistencia>({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      // Query directa con JOIN via RPC para evitar URLs largas
      // Usar RPC para evitar problemas de RLS con .in()
      const { data, error } = await supabase
        .rpc('get_estudiantes_grupo', { p_grupo_id: grupoId })

      if (!error && data) {
        const lista: Alumno[] = data
        setAlumnos(lista)
        const init: Asistencia = {}
        lista.forEach(a => { init[a.id] = 'P' })
        setAsistencia(init)
      }
      setLoading(false)
    }
    cargar()
  }, [grupoId, supabase])

  function marcarTodos(estado: 'P' | 'A' | 'J') {
    const nuevo: Asistencia = {}
    alumnos.forEach(a => { nuevo[a.id] = estado })
    setAsistencia(nuevo)
  }

  function marcar(id: string, estado: 'P' | 'A' | 'J') {
    setAsistencia(prev => ({ ...prev, [id]: estado }))
  }

  async function guardar() {
    setGuardando(true)
    const hoy = new Date().toISOString().split('T')[0]
    // Obtener plantel_id del docente desde la sesión
    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('plantel_id')
      .eq('auth_id', user?.id)
      .single()

    const registros = alumnos.map(a => ({
      estudiante_id: a.id,
      grupo_id: grupoId,
      asignatura_id: asignatura.id,
      fecha: hoy,
      estado: asistencia[a.id] ?? 'P',
      plantel_id: usuarioData?.plantel_id,
    }))
    await supabase.from('asistencias').upsert(registros, {
      onConflict: 'estudiante_id,grupo_id,asignatura_id,fecha',
    })
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  const presentes = Object.values(asistencia).filter(v => v === 'P').length
  const ausentes  = Object.values(asistencia).filter(v => v === 'A').length
  const justif    = Object.values(asistencia).filter(v => v === 'J').length

  const btnEstado = (estado: 'P' | 'A' | 'J', alumnoId: string) => {
    const activo = asistencia[alumnoId] === estado
    const cfg = {
      P: { bg: activo ? '#dcfce7' : '#f8fafc', color: activo ? '#16a34a' : '#94a3b8', border: activo ? '#86efac' : '#e2e8f0', label: 'P' },
      A: { bg: activo ? '#fee2e2' : '#f8fafc', color: activo ? '#dc2626' : '#94a3b8', border: activo ? '#fca5a5' : '#e2e8f0', label: 'A' },
      J: { bg: activo ? '#fef3c7' : '#f8fafc', color: activo ? '#d97706' : '#94a3b8', border: activo ? '#fcd34d' : '#e2e8f0', label: 'J' },
    }[estado]
    return (
      <button
        onClick={() => marcar(alumnoId, estado)}
        style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: cfg.bg, color: cfg.color,
          border: `1.5px solid ${cfg.border}`,
          fontWeight: 700, fontSize: '0.8rem',
          cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {cfg.label}
      </button>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#475569', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>{asignatura.nombre}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{formatFechaHoy()}</p>
        </div>
      </div>

      {/* Stats + marcar todos */}
      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Contadores */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}/>
              <span style={{ color: '#64748b' }}>Presentes: <strong style={{ color: '#16a34a' }}>{presentes}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/>
              <span style={{ color: '#64748b' }}>Ausentes: <strong style={{ color: '#dc2626' }}>{ausentes}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}/>
              <span style={{ color: '#64748b' }}>Justif.: <strong style={{ color: '#d97706' }}>{justif}</strong></span>
            </div>
          </div>

          {/* Marcar todos */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Marcar todos:</span>
            {(['P', 'A', 'J'] as const).map(e => {
              const cfg = {
                P: { bg: '#dcfce7', color: '#16a34a', border: '#86efac', label: 'P' },
                A: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', label: 'A' },
                J: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d', label: 'J' },
              }[e]
              return (
                <button
                  key={e}
                  onClick={() => marcarTodos(e)}
                  style={{
                    padding: '5px 14px', borderRadius: '10px',
                    background: cfg.bg, color: cfg.color,
                    border: `1.5px solid ${cfg.border}`,
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de alumnos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
        </div>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: '#94a3b8' }}>
          No hay alumnos registrados en este grupo
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
          {alumnos.map((alumno, idx) => (
            <div
              key={alumno.id}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: idx < alumnos.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
              }}
            >
              {/* Info alumno */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{
                    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.8rem',
                  }}
                >
                  {alumno.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1e3a5f' }}>
                    {alumno.nombre_completo}
                  </p>
                  {alumno.matricula && (
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{alumno.matricula}</p>
                  )}
                </div>
              </div>
              {/* Botones P A J */}
              <div className="flex gap-2 flex-shrink-0">
                {btnEstado('P', alumno.id)}
                {btnEstado('A', alumno.id)}
                {btnEstado('J', alumno.id)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón guardar */}
      {alumnos.length > 0 && (
        <button
          onClick={guardar}
          disabled={guardando}
          style={{
            width: '100%', padding: '0.875rem', borderRadius: '14px',
            background: guardado ? '#dcfce7' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            color: guardado ? '#16a34a' : 'white',
            border: guardado ? '1.5px solid #86efac' : 'none',
            fontWeight: 700, fontSize: '0.95rem', cursor: guardando ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s', opacity: guardando ? 0.7 : 1,
          }}
        >
          {guardando ? 'Guardando...' : guardado ? '✓ Asistencia guardada' : 'Guardar asistencia'}
        </button>
      )}
    </div>
  )
}

// ─── Componente: Selección de asignatura ──────────────────────────────────────

function AsignaturasView({
  grupo,
  onSelect,
  onBack,
}: {
  grupo: GrupoAgrupado
  onSelect: (asig: AsignaturaItem) => void
  onBack: () => void
}) {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#475569', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>Grupo {grupo.numero}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Selecciona la asignatura para tomar asistencia</p>
        </div>
      </div>

      {/* Cards de asignaturas */}
      <div className="space-y-3">
        {grupo.asignaturas.map(asig => (
          <button
            key={asig.id}
            onClick={() => onSelect(asig)}
            className="w-full text-left"
            style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '16px', padding: '1rem 1.25rem',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.1)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="flex items-center gap-3">
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '1rem',
              }}>
                {asig.nombre.charAt(0)}
              </div>
              <span className="font-semibold text-sm" style={{ color: '#1e3a5f' }}>{asig.nombre}</span>
            </div>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

type Vista =
  | { tipo: 'grupos' }
  | { tipo: 'asignaturas'; grupo: GrupoAgrupado }
  | { tipo: 'asistencia'; grupo: GrupoAgrupado; asignatura: AsignaturaItem }

export default function GruposPage() {
  const { docente, loading, error } = useDocente()
  const [vista, setVista] = useState<Vista>({ tipo: 'grupos' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando tus grupos...</p>
        </div>
      </div>
    )
  }

  if (error || !docente) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>Error al cargar datos</p>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{error}</p>
        </div>
      </div>
    )
  }

  // Agrupar por grupo
  const gruposPorId = docente.asignaciones.reduce((acc, asig) => {
    if (!acc[asig.grupo_id]) {
      acc[asig.grupo_id] = { id: asig.grupo_id, numero: asig.grupo_numero, grado: asig.grupo_grado, asignaturas: [] }
    }
    acc[asig.grupo_id].asignaturas.push({ id: asig.asignatura_id, nombre: asig.asignatura_nombre })
    return acc
  }, {} as Record<string, GrupoAgrupado>)
  const grupos = Object.values(gruposPorId)

  // Vistas secundarias
  if (vista.tipo === 'asistencia') {
    return (
      <AsistenciaView
        asignatura={vista.asignatura}
        grupoId={vista.grupo.id}
        onBack={() => setVista({ tipo: 'asignaturas', grupo: vista.grupo })}
      />
    )
  }

  if (vista.tipo === 'asignaturas') {
    return (
      <AsignaturasView
        grupo={vista.grupo}
        onSelect={asig => setVista({ tipo: 'asistencia', grupo: vista.grupo, asignatura: asig })}
        onBack={() => setVista({ tipo: 'grupos' })}
      />
    )
  }

  // Vista principal: lista de grupos
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold" style={{ color: '#1e3a5f' }}>Mis grupos asignados</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#94a3b8' }}>{formatFechaHoy()}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full w-fit"
          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          {grupos.length} {grupos.length === 1 ? 'grupo activo' : 'grupos activos'}
        </span>
      </div>

      {/* Grid */}
      {grupos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
              <svg width="32" height="32" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1e3a5f' }}>No tienes grupos asignados</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Contacta al administrador para que te asigne grupos y asignaturas</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {grupos.map(grupo => (
            <div
              key={grupo.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all cursor-pointer"
              style={{ border: '1px solid #e2e8f0' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.14)'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              {/* Banner azul */}
              <div className="relative px-5 pt-5 pb-8 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
                <div style={{ position: 'absolute', right: '20px', bottom: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full mb-3 inline-block"
                  style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>
                  {grupo.grado}° Semestre
                </span>

                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Grupo {grupo.numero}
                    </h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {grupo.asignaturas.length} {grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
                    </p>
                  </div>
                  {/* Recuadro gris con nombre del grupo — igual al sistema principal */}
                  <div style={{
                    ...BADGE_STYLE,
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'Outfit, sans-serif',
                    minWidth: '48px',
                    textAlign: 'center',
                  }}>
                    {grupo.numero}
                  </div>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="px-5 pt-4 pb-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>ASIGNATURAS:</p>
                  <div className="flex flex-wrap gap-2">
                    {grupo.asignaturas.map(asig => (
                      <span key={asig.id} className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {asig.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mb-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span style={{ color: '#64748b' }}>{formatFechaCorta()}</span>
                  </div>
                </div>

                <button
                  className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}
                  onClick={() => setVista({ tipo: 'asignaturas', grupo })}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Tomar asistencia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}