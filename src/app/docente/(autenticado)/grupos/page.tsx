// src/app/docente/(autenticado)/grupos/page.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useDocente } from '@/contexts/DocenteContext'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface AsignaturaItem { id: string; nombre: string }
interface GrupoAgrupado  { id: string; numero: string; grado: number; asignaturas: AsignaturaItem[] }
interface Alumno         { id: string; nombre_completo: string; matricula?: string }
type Asistencia = Record<string, 'P' | 'A' | 'J' | 'R'>

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatFechaISO() {
  // Usar fecha local (México) en lugar de UTC para evitar cambio de día prematuro
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = String(hoy.getMonth() + 1).padStart(2, '0')
  const d = String(hoy.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function formatFechaLegible(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-MX', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

// ─── Vista: Confirmar fecha + historial ──────────────────────────────────────
function ConfirmarFechaView({
  asignatura, grupo, onConfirmar, onBack,
}: {
  asignatura: AsignaturaItem
  grupo: GrupoAgrupado
  onConfirmar: () => void
  onBack: () => void
}) {
  const supabase = createClient()
  const [historial, setHistorial]     = useState<string[] | null>(null)
  const [loadingHist, setLoadingHist] = useState(true)

  useEffect(() => {
    async function cargar() {
      // Obtener el id del docente autenticado para filtrar solo SUS registros
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingHist(false); return }

      const { data: ud } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      if (!ud?.id) { setLoadingHist(false); return }

      const { data } = await supabase
        .from('asistencias')
        .select('fecha')
        .eq('grupo_id', grupo.id)
        .eq('asignatura_id', asignatura.id)
        .eq('docente_id', ud.id)
        .order('fecha', { ascending: false })
        .limit(1000)
      if (data) {
        const fechas = [...new Set(data.map(r => r.fecha as string))].slice(0, 10)
        setHistorial(fechas)
      }
      setLoadingHist(false)
    }
    cargar()
  }, [grupo.id, asignatura.id, supabase])

  const hoy      = formatFechaISO()
  const yaHayHoy = historial !== null && historial.includes(hoy)

  return (
    <div className="p-4 md:p-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>{asignatura.nombre}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Grupo {grupo.numero} · {grupo.grado}° Semestre</p>
        </div>
      </div>

      {/* Layout: columnas en desktop, apilado en móvil */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>

        {/* Card izquierda — acción del día */}
        <div className="rounded-2xl" style={{
          background: 'white',
          border: '1px solid #f0f0f5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>


          <div style={{ padding: '2.5rem 2rem 1.5rem', flex: 1 }}>


            {/* Fecha grande */}
            <p style={{ color: '#1e3a5f', fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1, textTransform: 'capitalize', marginBottom: '0.5rem' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              {new Date().getFullYear()}
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: '#f4f4f8', margin: '1.25rem 0' }}/>

            {/* Asignatura */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f4f8', border: '1px solid #ebebf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, lineHeight: 1.3 }}>
                {asignatura.nombre}
              </p>
            </div>
          </div>

          {/* Botón acción */}
          <div style={{ padding: '0 2rem 2rem', display: 'flex', gap: '0.75rem' }}>
            {historial === null ? (
              <div style={{ flex: 1, height: 48, borderRadius: '0.875rem', background: '#f4f4f8', animation: 'pulse 1.5s ease-in-out infinite' }}/>
            ) : yaHayHoy ? (
              <>
                <div style={{ flex: 1, padding: '0.875rem 1rem', borderRadius: '0.875rem', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>Asistencia tomada</span>
                </div>
                <button onClick={onConfirmar}
                  style={{ padding: '0.875rem 1.25rem', background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Editar
                </button>
              </>
            ) : (
              <button onClick={onConfirmar} style={{ width: '100%', background: 'linear-gradient(135deg, #1e6fcc, #155ca0)', color: 'white', border: 'none', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 700, padding: '0.95rem', fontSize: '0.9rem' }}>
                Tomar asistencia ahora →
              </button>
            )}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>

        {/* Card derecha — historial */}
        <div style={{
          background: 'white', borderRadius: '1rem',
          border: '1px solid #f0f0f5',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}>
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Historial de asistencias</p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>Últimas 10 sesiones registradas</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
            {loadingHist ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"/>
              </div>
            ) : !historial || historial.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" fill="none" stroke="#c0c0d0" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Sin registros aún</p>
              </div>
            ) : (historial ?? []).map((fecha, idx) => {
              const esHoy = fecha === hoy
              return (
                <div key={fecha} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.5rem', borderBottom: idx < historial.length - 1 ? '1px solid #f7f7fb' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: esHoy ? '#eff6ff' : '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: esHoy ? '1px solid #bfdbfe' : '1px solid #ebebf0' }}>
                      <svg width="14" height="14" fill="none" stroke={esHoy ? '#2563eb' : '#94a3b8'} strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: esHoy ? '#2563eb' : '#1e3a5f', margin: 0, textTransform: 'capitalize' }}>{formatFechaLegible(fecha)}</p>
                      {esHoy
                        ? <p style={{ fontSize: '0.7rem', color: '#2563eb', margin: 0, fontWeight: 500 }}>Hoy</p>
                        : <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Registrada</p>
                      }
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Vista: Lista de asistencia ───────────────────────────────────────────────
function AsistenciaView({
  asignatura, grupoId, onBack, onGuardado,
}: {
  asignatura: AsignaturaItem
  grupoId: string
  onBack: () => void
  onGuardado: () => void
}) {
  const supabase = createClient()
  const [alumnos, setAlumnos]       = useState<Alumno[]>([])
  const [asistencia, setAsistencia] = useState<Asistencia>({})
  const [loading, setLoading]       = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [guardado, setGuardado]     = useState(false)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_estudiantes_grupo', { p_grupo_id: grupoId })
      if (!error && data) {
        setAlumnos(data)
        const hoy = formatFechaISO()
        const { data: prevData } = await supabase
          .from('asistencias')
          .select('estudiante_id, estado')
          .eq('grupo_id', grupoId)
          .eq('asignatura_id', asignatura.id)
          .eq('fecha', hoy)
        const init: Asistencia = {}
        data.forEach((a: Alumno) => { init[a.id] = 'P' })
        const estadoInverso: Record<string, 'P' | 'A' | 'J' | 'R'> = {
          presente: 'P', falta: 'A', justificada: 'J', retardo: 'R',
        }
        if (prevData) {
          prevData.forEach((r: { estudiante_id: string; estado: string }) => {
            init[r.estudiante_id] = estadoInverso[r.estado] ?? 'P'
          })
        }
        setAsistencia(init)
      }
      setLoading(false)
    }
    cargar()
  }, [grupoId, asignatura.id, supabase])

  function marcarTodos(estado: 'P' | 'A' | 'J' | 'R') {
    const nuevo: Asistencia = {}
    alumnos.forEach(a => { nuevo[a.id] = estado })
    setAsistencia(nuevo)
  }

  function marcar(id: string, estado: 'P' | 'A' | 'J' | 'R') {
    setAsistencia(prev => ({ ...prev, [id]: estado }))
  }

  async function guardar() {
    setGuardando(true)
    try {
      const hoy = formatFechaISO()

      // Obtener datos del docente autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('No autenticado')

      // ── FIX: obtener plantel_id E id del docente ──────────────────────────
      const { data: ud, error: udError } = await supabase
        .from('usuarios')
        .select('plantel_id, id')
        .eq('auth_id', user.id)
        .single()
      if (udError || !ud?.plantel_id || !ud?.id) throw new Error('No se pudo obtener datos del docente')

      const estadoMap: Record<'P' | 'A' | 'J' | 'R', string> = {
        P: 'presente', A: 'falta', J: 'justificada', R: 'retardo',
      }

      const registros = alumnos.map(a => ({
        estudiante_id: a.id,
        grupo_id:      grupoId,
        asignatura_id: asignatura.id,
        fecha:         hoy,
        estado:        estadoMap[asistencia[a.id] ?? 'P'],
        plantel_id:    ud.plantel_id,
        docente_id:    ud.id,          // ── FIX: docente_id requerido ─────────
      }))

      const { error: upsertError } = await supabase
        .from('asistencias')
        .upsert(registros, {
          onConflict: 'estudiante_id,asignatura_id,fecha,docente_id',
          ignoreDuplicates: false,
        })

      if (upsertError) throw upsertError

      setGuardado(true)
      // Reemplazar la entrada actual en el historial para que el botón atrás
      // no regrese a la vista de tomar asistencia
      window.history.replaceState({ vista: 'confirmar' }, '')
      setTimeout(() => onGuardado(), 1800)
    } catch (err) {
      console.error('Error al guardar asistencia:', err)
      alert('No se pudo guardar la asistencia. Revisa la consola para más detalles.')
    } finally {
      setGuardando(false)
    }
  }

  const presentes = Object.values(asistencia).filter(v => v === 'P').length
  const ausentes  = Object.values(asistencia).filter(v => v === 'A').length
  const justif    = Object.values(asistencia).filter(v => v === 'J').length
  const retardos  = Object.values(asistencia).filter(v => v === 'R').length

  const BtnEstado = ({ estado, alumnoId }: { estado: 'P' | 'A' | 'J' | 'R'; alumnoId: string }) => {
    const activo = asistencia[alumnoId] === estado
    const cfg = {
      P: { bg: activo ? '#dcfce7' : '#f8fafc', color: activo ? '#16a34a' : '#94a3b8', border: activo ? '#86efac' : '#e2e8f0' },
      A: { bg: activo ? '#fee2e2' : '#f8fafc', color: activo ? '#dc2626' : '#94a3b8', border: activo ? '#fca5a5' : '#e2e8f0' },
      J: { bg: activo ? '#fef3c7' : '#f8fafc', color: activo ? '#d97706' : '#94a3b8', border: activo ? '#fcd34d' : '#e2e8f0' },
      R: { bg: activo ? '#f3e8ff' : '#f8fafc', color: activo ? '#7c3aed' : '#94a3b8', border: activo ? '#c4b5fd' : '#e2e8f0' },
    }[estado]
    return (
      <button onClick={() => marcar(alumnoId, estado)}
        style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, color: cfg.color, border: ('1.5px solid ' + cfg.border), fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {estado}
      </button>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>{asignatura.nombre}</h1>
          <p className="text-xs capitalize" style={{ color: '#94a3b8' }}>{formatFechaHoy()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-4 text-sm">
            {[
              { label: 'Presentes', val: presentes, color: '#16a34a', dot: '#22c55e' },
              { label: 'Ausentes',  val: ausentes,  color: '#dc2626', dot: '#ef4444' },
              { label: 'Justif.',   val: justif,    color: '#d97706', dot: '#f59e0b' },
              { label: 'Retardo',   val: retardos,  color: '#7c3aed', dot: '#a78bfa' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }}/>
                <span style={{ color: '#64748b' }}>{s.label}: <strong style={{ color: s.color }}>{s.val}</strong></span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Todos:</span>
            {(['P', 'A', 'J', 'R'] as const).map(e => {
              const cfg = {
                P: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                A: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
                J: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
                R: { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
              }[e]
              return (
                <button key={e} onClick={() => marcarTodos(e)}
                  style={{ padding: '5px 14px', borderRadius: 10, background: cfg.bg, color: cfg.color, border: ('1.5px solid ' + cfg.border), fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                  {e}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
        </div>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: '#94a3b8' }}>No hay alumnos en este grupo</div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
          {alumnos.map((alumno, idx) => (
            <div key={alumno.id} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: idx < alumnos.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                  {alumno.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1e3a5f' }}>{alumno.nombre_completo}</p>
                  {alumno.matricula && <p className="text-xs" style={{ color: '#94a3b8' }}>{alumno.matricula}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <BtnEstado estado="P" alumnoId={alumno.id}/>
                <BtnEstado estado="A" alumnoId={alumno.id}/>
                <BtnEstado estado="J" alumnoId={alumno.id}/>
                <BtnEstado estado="R" alumnoId={alumno.id}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {alumnos.length > 0 && (
        <button onClick={guardar} disabled={guardando}
          style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: guardado ? '#dcfce7' : 'linear-gradient(135deg, #1e6fcc, #155ca0)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #86efac' : 'none', fontWeight: 700, fontSize: '0.95rem', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : guardado ? '✓ Asistencia guardada' : 'Guardar asistencia'}
        </button>
      )}
    </div>
  )
}

// ─── Vista: Selección de asignatura ──────────────────────────────────────────
function AsignaturasView({ grupo, onSelect, onBack }: { grupo: GrupoAgrupado; onSelect: (a: AsignaturaItem) => void; onBack: () => void }) {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>Grupo {grupo.numero}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Selecciona la asignatura</p>
        </div>
      </div>
      <div className="space-y-3">
        {grupo.asignaturas.map(asig => (
          <button key={asig.id} onClick={() => onSelect(asig)} className="w-full text-left"
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
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

// ─── Botón macOS ─────────────────────────────────────────────────────────────
function MacButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const dots = [
    { color: '#ff5f57', shadow: 'rgba(255,95,87,0.5)'  },
    { color: '#febc2e', shadow: 'rgba(254,188,46,0.5)' },
    { color: '#28c840', shadow: 'rgba(40,200,64,0.5)'  },
  ]
  const fechaCorta = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <>
      <style>{`
        @keyframes macBounce {
          0%   { transform: translateY(0); }
          30%  { transform: translateY(-5px); }
          60%  { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
        @media (max-width: 767px) { .mac-btn-desktop { display: none !important; } .mac-btn-mobile { display: flex !important; } }
        @media (min-width: 768px) { .mac-btn-desktop { display: flex !important; } .mac-btn-mobile { display: none !important; } }
      `}</style>
      <button className="mac-btn-desktop" onClick={onClick}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {dots.map((dot, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: dot.color, boxShadow: hovered ? ('0 0 6px ' + dot.shadow) : 'none', animation: hovered ? ('macBounce 0.45s cubic-bezier(0.34,1.56,0.64,1) ' + (i * 0.08) + 's both') : 'none', transition: 'box-shadow 0.2s' }}/>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: hovered ? '#1e3a5f' : '#94a3b8', transition: 'color 0.2s', letterSpacing: '0.01em', lineHeight: 1.3 }}>
            Tomar asistencia
          </span>
          <span style={{ fontSize: '0.68rem', color: '#5b9af0', fontWeight: 500, maxHeight: hovered ? '20px' : '0px', opacity: hovered ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.2s ease', letterSpacing: '0.01em', marginTop: hovered ? 1 : 0 }}>
            {fechaCorta}
          </span>
        </div>
      </button>
      <button className="mac-btn-mobile" onClick={onClick}
        style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Fecha a la izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoy</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', textTransform: 'capitalize' }}>{fechaCorta}</span>
        </div>
        {/* Botón a la derecha */}
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #1e6fcc, #155ca0)', padding: '6px 14px', borderRadius: 9, flexShrink: 0 }}>
          Tomar asistencia
        </span>
      </button>
    </>
  )
}

// ─── Tipos de vista ───────────────────────────────────────────────────────────
type Vista =
  | { tipo: 'grupos' }
  | { tipo: 'asignaturas'; grupo: GrupoAgrupado }
  | { tipo: 'confirmar'; grupo: GrupoAgrupado; asignatura: AsignaturaItem; ts?: number }
  | { tipo: 'asistencia'; grupo: GrupoAgrupado; asignatura: AsignaturaItem }

// ─── Página principal ─────────────────────────────────────────────────────────
export default function GruposPage() {
  const { docente, loading, error } = useDocente()
  const [vista, setVista] = useState<Vista>({ tipo: 'grupos' })

  // ── Manejo del botón atrás del teléfono ──────────────────────────────────
  // Estrategia: guardamos la vista en el state del historial.
  // Al navegar entre vistas empujamos entradas con la vista destino.
  // Cuando el browser dispara popstate, leemos el state y restauramos.
  // Desde 'grupos' con un atrás más → login.
  useEffect(() => {
    // Reemplazar la entrada actual con la vista inicial
    window.history.replaceState({ vista: 'grupos' }, '')
  }, [])

  // Cada vez que la vista cambia por botones internos, empujar al historial
  const vistaRef = React.useRef<Vista>({ tipo: 'grupos' })
  const setVistaConHistorial = useCallback((nuevaVista: Vista) => {
    window.history.pushState({ vista: nuevaVista.tipo, data: JSON.stringify(nuevaVista) }, '')
    vistaRef.current = nuevaVista
    setVista(nuevaVista)
  }, [])

  const handlePopState = useCallback((e: PopStateEvent) => {
    const state = e.state as { vista?: string; data?: string } | null

    if (!state?.vista) {
      // Sin estado — salir al login
      window.location.href = '/login'
      return
    }

    if (state.vista === 'grupos') {
      // Estamos en grupos y dan atrás → ir al login
      // Pero si venimos de una vista interior, ir a grupos
      if (vistaRef.current.tipo === 'grupos') {
        window.location.href = '/login'
      } else {
        setVista({ tipo: 'grupos' })
        vistaRef.current = { tipo: 'grupos' }
      }
      return
    }

    // Restaurar vista desde el state del historial
    try {
      if (state.data) {
        const vistaGuardada = JSON.parse(state.data) as Vista
        setVista(vistaGuardada)
        vistaRef.current = vistaGuardada
      }
    } catch {
      setVista({ tipo: 'grupos' })
      vistaRef.current = { tipo: 'grupos' }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando tus grupos...</p>
      </div>
    </div>
  )

  if (error || !docente) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm" style={{ color: '#dc2626' }}>{error || 'Error al cargar datos'}</p>
    </div>
  )

  const gruposPorId = docente.asignaciones.reduce((acc, asig) => {
    if (!acc[asig.grupo_id]) acc[asig.grupo_id] = { id: asig.grupo_id, numero: asig.grupo_numero, grado: asig.grupo_grado, asignaturas: [] }
    acc[asig.grupo_id].asignaturas.push({ id: asig.asignatura_id, nombre: asig.asignatura_nombre })
    return acc
  }, {} as Record<string, GrupoAgrupado>)
  const grupos = Object.values(gruposPorId)

  if (vista.tipo === 'asistencia') return (
    <AsistenciaView
      asignatura={vista.asignatura}
      grupoId={vista.grupo.id}
      onBack={() => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })}
      onGuardado={() => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })}
    />
  )

  if (vista.tipo === 'confirmar') return (
    <ConfirmarFechaView
      key={`${vista.grupo.id}-${vista.asignatura.id}-${vista.ts ?? 0}`}
      asignatura={vista.asignatura}
      grupo={vista.grupo}
      onConfirmar={() => setVistaConHistorial({ tipo: 'asistencia', grupo: vista.grupo, asignatura: vista.asignatura })}
      onBack={() => setVistaConHistorial({ tipo: 'asignaturas', grupo: vista.grupo })}
    />
  )

  if (vista.tipo === 'asignaturas') return (
    <AsignaturasView
      grupo={vista.grupo}
      onSelect={asig => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: asig })}
      onBack={() => setVistaConHistorial({ tipo: 'grupos' })}
    />
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto" style={{ minHeight: '100vh' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold" style={{ color: '#1e3a5f' }}>Mis grupos asignados</h1>
          <p className="text-xs md:text-sm mt-1 capitalize" style={{ color: '#94a3b8' }}>{formatFechaHoy()}</p>
        </div>
      </div>

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
            <p className="text-xs" style={{ color: '#94a3b8' }}>Contacta al administrador</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {grupos.map(grupo => (
            <div key={grupo.id}
              style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* Cabecera */}
              <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.3rem', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
                      Grupo {grupo.numero}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                        {grupo.grado}° Semestre
                      </p>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#c7c7cc', display: 'inline-block' }}/>
                      <p style={{ fontSize: '0.7rem', color: '#8e8e93', margin: 0, fontWeight: 500 }}>
                        {grupo.asignaturas.length} {grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
                      </p>
                    </div>
                  </div>
                  {/* Número grande */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#3a3a3c', fontFamily: 'Outfit, sans-serif' }}>{grupo.numero}</span>
                  </div>
                </div>
              </div>

              {/* Lista de asignaturas */}
              <div style={{ padding: '0.75rem 1.25rem 1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', maxHeight: 112, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e5e5ea transparent' }}>
                  {grupo.asignaturas.map((asig) => (
                    <div key={asig.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 8, background: '#f9f9fb' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f2f2f7', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" fill="none" stroke="#8e8e93" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: '0.775rem', color: '#3a3a3c', fontWeight: 500, lineHeight: 1.3 }}>{asig.nombre}</span>
                    </div>
                  ))}
                </div>
                <MacButton onClick={() => setVistaConHistorial({ tipo: 'asignaturas', grupo })}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}