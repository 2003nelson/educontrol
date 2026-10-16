// src/components/docente/grupos/AsistenciaView.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AsignaturaItem } from './ConfirmarFechaView'

type Alumno     = { id: string; nombre_completo: string; matricula?: string }
type Asistencia = Record<string, 'P' | 'A' | 'J' | 'R'>

const ESTADOS = ['P', 'A', 'J', 'R'] as const
type Estado = typeof ESTADOS[number]

const ESTADO_CFG: Record<Estado, { bg: string; color: string; border: string; bgActivo: string; label: string; labelCorto: string }> = {
  P: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', bgActivo: '#dcfce7', label: 'Presente',    labelCorto: 'Presente' },
  A: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', bgActivo: '#fee2e2', label: 'Ausente',     labelCorto: 'Ausente'  },
  J: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', bgActivo: '#fef3c7', label: 'Justificada', labelCorto: 'Justif.'  },
  R: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', bgActivo: '#f3e8ff', label: 'Retardo',     labelCorto: 'Retardo'  },
}
const ESTADO_COLOR: Record<Estado, string> = { P: '#16a34a', A: '#dc2626', J: '#d97706', R: '#7c3aed' }
const ESTADO_BORDER_ACTIVO: Record<Estado, string> = { P: '#86efac', A: '#fca5a5', J: '#fcd34d', R: '#c4b5fd' }

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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ idx }: { idx: number }) {
  return (
    <tr style={{ background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
      <td style={{ padding: '0.625rem 0.375rem', textAlign: 'center', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ width: 20, height: 14, borderRadius: 4, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.4s infinite' }} />
      </td>
      <td style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e5e7eb', flexShrink: 0, animation: 'shimmer 1.4s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '70%', height: 12, borderRadius: 4, background: '#e5e7eb', marginBottom: 5, animation: 'shimmer 1.4s infinite' }} />
            <div style={{ width: '45%', height: 10, borderRadius: 4, background: '#f1f5f9', animation: 'shimmer 1.4s infinite' }} />
          </div>
        </div>
      </td>
      <td style={{ padding: '0.625rem 0.5rem', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ width: 72, height: 12, borderRadius: 4, background: '#e5e7eb', animation: 'shimmer 1.4s infinite' }} />
      </td>
      {ESTADOS.map(e => (
        <td key={e} style={{ padding: '0.375rem 0.25rem', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
  )
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

  const fechaObjetivo  = formatFechaISO(fechaEditar)
  const esEdicion      = !!fechaEditar
  const [masOpciones, setMasOpciones] = useState(false)

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
        const estadoInverso: Record<string, Estado> = {
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

  function marcarTodos(estado: Estado) {
    const nuevo: Asistencia = {}
    alumnos.forEach(a => { nuevo[a.id] = estado })
    setAsistencia(nuevo)
  }

  function marcar(id: string, estado: Estado) {
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
      const estadoMap: Record<Estado, string> = { P: 'presente', A: 'falta', J: 'justificada', R: 'retardo' }
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

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4fa', padding: '1.25rem 0.75rem 2rem' }}>
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1 }
          50%  { opacity: 0.45 }
          100% { opacity: 1 }
        }
        .asist-layout { display: flex; flex-direction: column; gap: 1rem; }
        @media (min-width: 768px) {
          .asist-layout { flex-direction: row; align-items: flex-start; gap: 1.25rem; }
          .asist-sidebar { width: 250px; flex-shrink: 0; position: sticky; top: 80px; }
          .asist-main    { flex: 1; min-width: 0; }
        }
        .guardar-mobile { display: block; }
        @media (min-width: 768px) { .guardar-mobile { display: none; } }
        .asist-table-wrap { overflow-x: auto; }
        .asist-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* En móvil las columnas de nombre se acortan */
        @media (max-width: 639px) {
          .col-nombre { max-width: 140px; }
          .col-matricula { display: none; }
          .th-matricula { display: none; }
        }
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

        {/* ── Sidebar con mayor espaciado vertical ── */}
        <div className="asist-sidebar">
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5ea', padding: '1.25rem 1.125rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Resumen */}
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

            {/* Marcar todos unificado */}
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.375rem' }}>Marcar todos</p>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                Pulsa un botón para marcar a <strong style={{ color: '#64748b' }}>todos los alumnos</strong> con ese estado.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {/* Botón principal — Marcar todos como Presente */}
                <button onClick={() => { marcarTodos('P'); setMasOpciones(false) }}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: '#dcfce7', color: '#16a34a', border: '1.5px solid #86efac', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'opacity 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  <svg width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Marcar todos como Presente
                </button>

                {/* Botón más opciones */}
                <button onClick={() => setMasOpciones(v => !v)}
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 12, background: masOpciones ? '#f1f5f9' : 'white', color: '#475569', border: '1.5px solid #e2e8f0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', transition: 'background 0.15s' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: masOpciones ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                  {masOpciones ? 'Ocultar opciones' : 'Más opciones'}
                </button>

                {/* Tres opciones adicionales — desplegable */}
                {masOpciones && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', animation: 'slideDown 0.18s ease', marginTop: '0.25rem' }}>
                    {(['A', 'J', 'R'] as const).map(e => {
                      const cfg = ESTADO_CFG[e]
                      const labels: Record<string, string> = { A: 'Marcar todos como Ausente', J: 'Marcar todos como Justificada', R: 'Marcar todos como Retardo' }
                      return (
                        <button key={e} onClick={() => { marcarTodos(e); setMasOpciones(false) }}
                          style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 12, background: cfg.bgActivo, color: ESTADO_COLOR[e], border: `1.5px solid ${ESTADO_BORDER_ACTIVO[e]}`, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'opacity 0.12s' }}
                          onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0, border: `1.5px solid ${ESTADO_BORDER_ACTIVO[e]}` }}>{e}</span>
                          {labels[e]}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Guardar desktop con espacio extra superior */}
            {alumnos.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={guardar} disabled={guardando}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: 12, background: guardado ? '#dcfce7' : 'linear-gradient(135deg,#1e6fcc,#155ca0)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #86efac' : 'none', fontWeight: 700, fontSize: '0.875rem', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : guardado ? '✓ Guardada' : esEdicion ? 'Guardar cambios' : 'Guardar asistencia'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabla principal ── */}
        <div className="asist-main">
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Info bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.875rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                {loading ? '—' : `${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''}`}
              </span>
              {/* Leyenda de colores */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {ESTADOS.map(e => (
                  <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR[e] }}/>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>{ESTADO_CFG[e].labelCorto}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="asist-table-wrap">
              <table className="asist-table">
                <colgroup>
                  <col style={{ width: 40 }} />
                  <col style={{ minWidth: 160 }} />
                  <col className="th-matricula" style={{ width: 100 }} />
                  {ESTADOS.map(e => <col key={e} style={{ width: 52 }} />)}
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '0.625rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Alumno</th>
                    <th className="th-matricula" style={{ padding: '0.625rem 0.5rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderRight: '1.5px solid #e2e8f0' }}>Matrícula</th>
                    {ESTADOS.map(e => (
                      <th key={e} style={{ padding: '0.5rem 0.25rem', fontSize: '0.66rem', fontWeight: 700, color: ESTADO_COLOR[e], textAlign: 'center', borderLeft: '1px solid #eef1f6' }}>
                        {e}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                    : alumnos.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                          No hay alumnos en este grupo
                        </td>
                      </tr>
                    )
                    : alumnos.map((alumno, idx) => {
                        const estadoActual = asistencia[alumno.id] ?? 'P'
                        const par = idx % 2 === 1
                        return (
                          <tr key={alumno.id}
                            style={{ background: par ? '#fafbfc' : 'white' }}
                            onMouseEnter={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = '#f0f7ff' }}
                            onMouseLeave={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = par ? '#fafbfc' : 'white' }}>

                            {/* # */}
                            <td style={{ padding: '0.5rem 0.375rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>
                              {idx + 1}
                            </td>

                            {/* Nombre */}
                            <td className="col-nombre" style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: '#3b4a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
                                  {alumno.nombre_completo.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {alumno.nombre_completo}
                                </span>
                              </div>
                            </td>

                            {/* Matrícula */}
                            <td className="col-matricula" style={{ padding: '0.5rem 0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, borderRight: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>
                              {alumno.matricula ?? '—'}
                            </td>

                            {/* Botones P / A / J / R */}
                            {ESTADOS.map(e => {
                              const activo = estadoActual === e
                              return (
                                <td key={e} style={{ padding: '0.375rem 0.25rem', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>
                                  <button
                                    onClick={() => marcar(alumno.id, e)}
                                    style={{
                                      width: 36, height: 36, borderRadius: 10,
                                      background: activo ? ESTADO_CFG[e].bgActivo : 'transparent',
                                      color: activo ? ESTADO_COLOR[e] : '#d1d5db',
                                      border: `1.5px solid ${activo ? ESTADO_BORDER_ACTIVO[e] : 'transparent'}`,
                                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                      transition: 'all 0.1s',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                    onMouseEnter={ev => {
                                      if (!activo) {
                                        ev.currentTarget.style.background = ESTADO_CFG[e].bgActivo
                                        ev.currentTarget.style.color = ESTADO_COLOR[e]
                                        ev.currentTarget.style.borderColor = ESTADO_BORDER_ACTIVO[e]
                                        ev.currentTarget.style.opacity = '0.6'
                                      }
                                    }}
                                    onMouseLeave={ev => {
                                      if (!activo) {
                                        ev.currentTarget.style.background = 'transparent'
                                        ev.currentTarget.style.color = '#d1d5db'
                                        ev.currentTarget.style.borderColor = 'transparent'
                                        ev.currentTarget.style.opacity = '1'
                                      }
                                    }}
                                  >
                                    {e}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Guardar móvil */}
          {alumnos.length > 0 && (
            <div style={{ marginTop: '1rem' }} className="guardar-mobile">
              <button onClick={guardar} disabled={guardando}
                style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: guardado ? '#dcfce7' : 'linear-gradient(135deg,#1e6fcc,#155ca0)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #86efac' : 'none', fontWeight: 700, fontSize: '0.95rem', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : guardado ? '✓ Guardada' : esEdicion ? 'Guardar cambios' : 'Guardar asistencia'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}