// src/components/docente/grupos/AsistenciaView.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AsignaturaItem } from './ConfirmarFechaView'

type Alumno     = { id: string; nombre_completo: string; matricula?: string }
type Asistencia = Record<string, 'P' | 'A' | 'J' | 'R'>

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatFechaISO(fecha?: string) {
  if (fecha) return fecha
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

function formatFechaLegible(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function AsistenciaView({
  asignatura, grupoId, onBack, onGuardado, fechaEditar,
}: {
  asignatura: AsignaturaItem
  grupoId: string
  onBack: () => void
  onGuardado: (fechaGuardada?: string) => void
  fechaEditar?: string
}) {
  const supabase = createClient()
  const [alumnos, setAlumnos]       = useState<Alumno[]>([])
  const [asistencia, setAsistencia] = useState<Asistencia>({})
  const [loading, setLoading]       = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [guardado, setGuardado]     = useState(false)

  const fechaObjetivo = formatFechaISO(fechaEditar)
  const esEdicion     = !!fechaEditar

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_estudiantes_grupo', { p_grupo_id: grupoId })
      if (!error && data) {
        setAlumnos(data)
        const { data: prevData } = await supabase
          .from('asistencias')
          .select('estudiante_id, estado')
          .eq('grupo_id', grupoId)
          .eq('asignatura_id', asignatura.id)
          .eq('fecha', fechaObjetivo)
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
  }, [grupoId, asignatura.id, fechaObjetivo, supabase])

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
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('No autenticado')
      const { data: ud, error: udError } = await supabase
        .from('usuarios').select('plantel_id, id').eq('auth_id', user.id).single()
      if (udError || !ud?.plantel_id || !ud?.id) throw new Error('No se pudo obtener datos del docente')
      const estadoMap: Record<'P' | 'A' | 'J' | 'R', string> = {
        P: 'presente', A: 'falta', J: 'justificada', R: 'retardo',
      }
      const registros = alumnos.map(a => ({
        estudiante_id: a.id,
        grupo_id:      grupoId,
        asignatura_id: asignatura.id,
        fecha:         fechaObjetivo,
        estado:        estadoMap[asistencia[a.id] ?? 'P'],
        plantel_id:    ud.plantel_id,
        docente_id:    ud.id,
        updated_at:    new Date().toISOString(),
      }))
      const { error: upsertError } = await supabase
        .from('asistencias')
        .upsert(registros, { onConflict: 'estudiante_id,asignatura_id,fecha,docente_id', ignoreDuplicates: false })
      if (upsertError) throw upsertError
      setGuardado(true)
      window.history.replaceState({ vista: 'confirmar' }, '')
      setTimeout(() => onGuardado(fechaObjetivo), 1800)
    } catch (err) {
      console.error('Error al guardar asistencia:', err)
      alert('No se pudo guardar la asistencia. Revisa la consola.')
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
        style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {estado}
      </button>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4fa', padding: '1.25rem 0.75rem 2rem' }}>
      <style>{`
        .asist-layout { display: flex; flex-direction: column; gap: 1rem; }
        @media (min-width: 768px) {
          .asist-layout { flex-direction: row; align-items: flex-start; gap: 1.25rem; padding: 0; }
          .asist-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 80px; }
          .asist-main    { flex: 1; min-width: 0; }
          .asist-wrap    { padding: 1.5rem 1.25rem 3rem; }
        }
        .guardar-mobile { display: block; }
        @media (min-width: 768px) { .guardar-mobile { display: none; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{asignatura.nombre}</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
            {esEdicion
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', borderRadius: 9999, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>✏️ Editando</span>
                  {formatFechaLegible(fechaObjetivo)}
                </span>
              : formatFechaHoy()
            }
          </p>
        </div>
      </div>

      <div className="asist-layout">

        {/* Sidebar */}
        <div className="asist-sidebar">
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e5ea', padding: '1.125rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }}>Resumen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Presentes',    val: presentes, color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4' },
                  { label: 'Ausentes',     val: ausentes,  color: '#dc2626', dot: '#ef4444', bg: '#fef2f2' },
                  { label: 'Justificadas', val: justif,    color: '#d97706', dot: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Retardos',     val: retardos,  color: '#7c3aed', dot: '#a78bfa', bg: '#f5f3ff' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 10, background: s.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }}/>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: s.color }}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.375rem' }}>Marcar todos</p>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 0 0.625rem', lineHeight: 1.4 }}>
                Pulsa un botón para marcar a <strong style={{ color: '#64748b' }}>todos los alumnos</strong> con ese estado.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {(['P', 'A', 'J', 'R'] as const).map(e => {
                  const cfg = {
                    P: { bg: '#dcfce7', color: '#16a34a', border: '#86efac', label: 'Presente' },
                    A: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', label: 'Ausente' },
                    J: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d', label: 'Justif.' },
                    R: { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd', label: 'Retardo' },
                  }[e]
                  return (
                    <button key={e} onClick={() => marcarTodos(e)}
                      style={{ padding: '0.5rem', borderRadius: 10, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: '1rem' }}>{e}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {alumnos.length > 0 && (
              <button onClick={guardar} disabled={guardando}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 12, background: guardado ? '#dcfce7' : 'linear-gradient(135deg, #1e6fcc, #155ca0)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #86efac' : 'none', fontWeight: 700, fontSize: '0.85rem', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : guardado ? '✓ Guardada' : esEdicion ? 'Guardar cambios' : 'Guardar asistencia'}
              </button>
            )}
          </div>
        </div>

        {/* Lista alumnos */}
        <div className="asist-main">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
            </div>
          ) : alumnos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              No hay alumnos en este grupo
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {alumnos.map((alumno, idx) => (
                <div key={alumno.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: idx < alumnos.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: '#3b4a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                      {alumno.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alumno.nombre_completo}</p>
                      {alumno.matricula && <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>{alumno.matricula}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    <BtnEstado estado="P" alumnoId={alumno.id}/>
                    <BtnEstado estado="A" alumnoId={alumno.id}/>
                    <BtnEstado estado="J" alumnoId={alumno.id}/>
                    <BtnEstado estado="R" alumnoId={alumno.id}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guardar móvil */}
          {alumnos.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <button className="guardar-mobile" onClick={guardar} disabled={guardando}
                style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: guardado ? '#dcfce7' : 'linear-gradient(135deg, #1e6fcc, #155ca0)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #86efac' : 'none', fontWeight: 700, fontSize: '0.95rem', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : guardado ? '✓ Guardada' : esEdicion ? 'Guardar cambios' : 'Guardar asistencia'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}