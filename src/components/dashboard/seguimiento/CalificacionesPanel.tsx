// src/components/dashboard/seguimiento/CalificacionesPanel.tsx
'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Periodo = '1' | '2' | '3' | 'final'

interface Alumno {
  id: string
  nombre_completo: string
  matricula: string | null
}

interface NotaParcial {
  estudiante_id: string
  calificacion: number | null
  periodo: string
  docente_id: string
}

interface TrabajoDetalle {
  trabajo_id: string
  trabajo_nombre: string
  peso: number
  puntos: number | null
}

interface DetalleAlumno {
  estudiante_id: string
  trabajos: TrabajoDetalle[]
  nota_calculada: number
}

interface TrabajoParcial {
  id: string
  nombre: string
  peso: number
}

type RubroRaw = { id: string; nombre: string; peso: number }

// ── Helpers ───────────────────────────────────────────────────────────────────
function colorNota(v: number | null) {
  if (v === null) return '#94a3b8'
  if (v >= 60) return '#16a34a'
  return '#dc2626'
}
function bgNota(v: number | null) {
  if (v === null) return '#f8fafc'
  if (v >= 60) return '#f0fdf4'
  return '#fef2f2'
}
function bdNota(v: number | null) {
  if (v === null) return '#e2e8f0'
  if (v >= 60) return '#bbf7d0'
  return '#fecaca'
}

const PERIODO_LABELS: Record<Periodo, string> = {
  '1': '1er Parcial',
  '2': '2do Parcial',
  '3': '3er Parcial',
  'final': 'Final',
}

// ── Fila expandible de alumno ─────────────────────────────────────────────────
function FilaAlumno({ alumno, nota, trabajos, detalle, observacion, idx }: {
  alumno: Alumno
  nota: number | null
  trabajos: TrabajoParcial[]
  detalle: DetalleAlumno | null
  observacion: string
  idx: number
}) {
  const [openTrabajos, setOpenTrabajos] = useState(false)
  const [openObs, setOpenObs]           = useState(false)
  const tieneObs = Boolean(observacion && observacion.trim().length > 0)

  return (
    <>
      <tr
        style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.12s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>{idx + 1}</td>
        
        <td style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {alumno.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1e3a5f' }}>{alumno.nombre_completo}</span>
          </div>
        </td>

        <td style={{ padding: '0.875rem 1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{alumno.matricula ?? '—'}</span>
        </td>

        <td style={{ padding: '0.875rem 1.25rem' }}>
          {tieneObs ? (
            <button
              onClick={() => setOpenObs(v => !v)}
              style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a', padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>{openObs ? 'Ocultar observación' : 'Ver observación'}</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                style={{ transform: openObs ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 500 }}>Sin observaciones</span>
          )}
        </td>

        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', minWidth: 48, padding: '3px 10px',
            borderRadius: 9999, fontSize: '0.875rem', fontWeight: 800,
            color: colorNota(nota), background: bgNota(nota),
            border: `1px solid ${bdNota(nota)}`,
          }}>
            {nota ?? '—'}
          </span>
        </td>

        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: nota !== null && nota >= 60 ? '#16a34a' : nota !== null ? '#dc2626' : '#94a3b8' }}>
            {nota === null ? '—' : nota >= 60 ? 'Aprobado' : 'Reprobado'}
          </span>
        </td>

        {trabajos.length > 0 && (
          <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => setOpenTrabajos(v => !v)}>
            <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: openTrabajos ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </td>
        )}
      </tr>

      {/* Fila desplegable integrada para la Observación */}
      {openObs && tieneObs && (
        <tr style={{ background: '#fffbeb' }}>
          <td colSpan={trabajos.length > 0 ? 7 : 6} style={{ padding: '0.75rem 1.25rem 0.75rem 3.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Observación del Periodo
              </span>
              <p style={{ fontSize: '0.8rem', color: '#854d0e', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {observacion}
              </p>
            </div>
          </td>
        </tr>
      )}

      {/* Fila desplegable integrada para los Trabajos */}
      {openTrabajos && detalle && (
        <tr style={{ background: '#f8fafc' }}>
          <td colSpan={trabajos.length > 0 ? 7 : 6} style={{ padding: '0 1.25rem 0.75rem 3.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
              {trabajos.map(t => {
                const d = detalle.trabajos.find(x => x.trabajo_id === t.id)
                const rawPts = d?.puntos ?? null
                const pts = rawPts !== null ? Math.min(rawPts, t.peso) : null
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.375rem 0.75rem', borderRadius: 9, background: 'white',
                    border: '1px solid #e8eaf0', fontSize: '0.75rem',
                  }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>{t.nombre}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{t.peso}%</span>
                    <span style={{
                      fontWeight: 700, minWidth: 28, textAlign: 'center',
                      padding: '1px 6px', borderRadius: 6,
                      color: pts === null ? '#94a3b8' : pts >= t.peso * 0.7 ? '#16a34a' : '#dc2626',
                      background: pts === null ? '#f4f4f8' : pts >= t.peso * 0.7 ? '#f0fdf4' : '#fef2f2',
                    }}>
                      {pts !== null ? `${pts}/${t.peso}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CalificacionesPanel({
  grupoId,
  asignaturaId,
  docenteId,
  nombreAsignatura,
}: {
  grupoId: string
  asignaturaId: string
  docenteId: string
  nombreAsignatura: string
}): React.ReactElement {
  const supabase = createClient()
  const [periodo, setPeriodo]             = useState<Periodo>('1')
  const [alumnos, setAlumnos]             = useState<Alumno[]>([])
  const [notas, setNotas]                 = useState<NotaParcial[]>([])
  const [trabajos, setTrabajos]           = useState<TrabajoParcial[]>([])
  const [detalles, setDetalles]           = useState<DetalleAlumno[]>([])
  const [observacionesAlumnos, setObservacionesAlumnos] = useState<Map<string, string>>(new Map())
  const [observacionGrupo, setObservacionGrupo]         = useState<string>('')
  const [loading, setLoading]             = useState(true)
  const [loadingPeriodo, setLoadingPeriodo] = useState(true)
  const [isRefreshing, setIsRefreshing]    = useState(false)

  const [menuAbierto, setMenuAbierto]     = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Cargar Alumnos
  useEffect(() => {
    void Promise.resolve(
      supabase.from('estudiantes')
        .select('id, nombre_completo, matricula')
        .eq('grupo_id', grupoId)
        .eq('activo', true)
        .order('nombre_completo')
    ).then(({ data }) => {
      setAlumnos((data ?? []) as Alumno[])
      setLoading(false)
    })
  }, [grupoId, supabase])

  // 2. Cargar Observaciones
  const cargarObservaciones = useCallback(async () => {
    // a) Observaciones de Estudiantes
    const { data: obsAlum, error: errAlum } = await supabase
      .from('observaciones_estudiantes')
      .select('estudiante_id, contenido, periodo')
      .eq('grupo_id', grupoId)
      .eq('asignatura_id', asignaturaId)

    if (errAlum) {
      console.error('Error obteniendo observaciones_estudiantes:', errAlum)
    } else {
      const mapaObs = new Map<string, string>()
      for (const item of (obsAlum ?? [])) {
        if (String(item.periodo) === String(periodo) && item.contenido?.trim()) {
          mapaObs.set(item.estudiante_id, item.contenido)
        }
      }
      setObservacionesAlumnos(mapaObs)
    }

    // b) Observación de Grupo
    const { data: obsGrp, error: errGrp } = await supabase
      .from('observaciones_grupo')
      .select('contenido, periodo')
      .eq('grupo_id', grupoId)
      .eq('asignatura_id', asignaturaId)

    if (errGrp) {
      console.error('Error obteniendo observaciones_grupo:', errGrp)
    } else {
      const matchGrp = (obsGrp ?? []).find(item => String(item.periodo) === String(periodo))
      setObservacionGrupo(matchGrp?.contenido ?? '')
    }
  }, [grupoId, asignaturaId, periodo, supabase])

  useEffect(() => {
    cargarObservaciones().catch(console.error)
  }, [cargarObservaciones])

  // 3. Fetch Notas Finales
  const fetchFinal = useCallback(() =>
    Promise.resolve(
      supabase.from('calificaciones')
        .select('estudiante_id, calificacion, periodo')
        .eq('grupo_id', grupoId)
        .eq('asignatura_id', asignaturaId)
        .in('periodo', ['1', '2', '3'])
    ).then(({ data }) => {
      const map: Record<string, number[]> = {}
      for (const r of (data ?? [])) {
        if (!map[r.estudiante_id]) map[r.estudiante_id] = []
        if (r.calificacion !== null) map[r.estudiante_id].push(r.calificacion as number)
      }
      return Object.entries(map).map(([est_id, vals]) => ({
        estudiante_id: est_id,
        calificacion: vals.length > 0
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
          : null,
        periodo: 'final',
        docente_id: docenteId,
      } as NotaParcial))
    })
  , [grupoId, asignaturaId, docenteId, supabase])

  // 4. Fetch Notas Parciales
  const fetchParcial = useCallback(() => {
    const p1 = Promise.resolve(
      supabase.from('calificaciones')
        .select('estudiante_id, calificacion, periodo, docente_id')
        .eq('grupo_id', grupoId)
        .eq('asignatura_id', asignaturaId)
        .eq('periodo', periodo)
    )
    const p2 = Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('id, nombre, peso')
        .eq('grupo_id', grupoId)
        .eq('asignatura_id', asignaturaId)
        .eq('periodo', periodo)
        .order('orden')
    )
    return Promise.all([p1, p2]).then(async ([r1, r2]) => {
      const ts = (r2.data ?? []) as RubroRaw[]
      let dets: DetalleAlumno[] = []
      if (ts.length > 0) {
        const ids = ts.map(t => t.id)
        const { data: detData } = await supabase
          .from('calificaciones_detalle')
          .select('actividad_id, estudiante_id, puntos')
          .in('actividad_id', ids)
        const map: Record<string, DetalleAlumno> = {}
        for (const d of (detData ?? [])) {
          if (!map[d.estudiante_id]) {
            map[d.estudiante_id] = { estudiante_id: d.estudiante_id, trabajos: [], nota_calculada: 0 }
          }
          map[d.estudiante_id].trabajos.push({
            trabajo_id: d.actividad_id as string,
            trabajo_nombre: ts.find(t => t.id === d.actividad_id)?.nombre ?? '',
            peso: ts.find(t => t.id === d.actividad_id)?.peso ?? 0,
            puntos: d.puntos as number | null,
          })
        }
        dets = Object.values(map)
      }
      return {
        notas: (r1.data ?? []) as NotaParcial[],
        trabajos: ts.map(t => ({ id: t.id, nombre: t.nombre, peso: t.peso })),
        detalles: dets,
      }
    })
  }, [grupoId, asignaturaId, periodo, docenteId, supabase])

  const cargarNotasPeriodo = useCallback(() => {
    setLoadingPeriodo(true)
    if (periodo === 'final') {
      fetchFinal()
        .then(finales => {
          setNotas(finales)
          setTrabajos([])
          setDetalles([])
          setLoadingPeriodo(false)
        })
        .catch(err => {
          console.error(err)
          setLoadingPeriodo(false)
        })
      return
    }
    fetchParcial()
      .then(({ notas: n, trabajos: t, detalles: d }) => {
        setNotas(n)
        setTrabajos(t)
        setDetalles(d)
        setLoadingPeriodo(false)
      })
      .catch(err => {
        console.error(err)
        setLoadingPeriodo(false)
      })
  }, [periodo, fetchFinal, fetchParcial])

  useEffect(() => {
    cargarNotasPeriodo()
  }, [cargarNotasPeriodo])

  // Función de actualización manual (Refresh)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      cargarObservaciones(),
      new Promise<void>(resolve => {
        cargarNotasPeriodo()
        setTimeout(resolve, 400)
      })
    ])
    setIsRefreshing(false)
  }

  const notaMap   = Object.fromEntries(notas.map(n => [n.estudiante_id, n.calificacion]))
  const detalleMap = Object.fromEntries(detalles.map(d => [d.estudiante_id, d]))

  const aprobados = alumnos.filter(a => (notaMap[a.id] ?? null) !== null && (notaMap[a.id] as number) >= 60).length
  const reprobados = alumnos.filter(a => (notaMap[a.id] ?? null) !== null && (notaMap[a.id] as number) < 60).length
  const notasConValor = notas.filter(n => n.calificacion !== null)
  const promedio = notasConValor.length > 0
    ? Math.round(notasConValor.reduce((s, n) => s + (n.calificacion as number), 0) / notasConValor.length * 10) / 10
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Selector de periodo y Botón compacto de calificaciones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginRight: 4 }}>Parcial:</span>
          {(['1', '2', '3', 'final'] as Periodo[]).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: periodo === p ? '#1e3a5f' : '#f1f5f9',
                color: periodo === p ? 'white' : '#64748b',
                boxShadow: periodo === p ? '0 2px 8px rgba(30,58,95,0.25)' : 'none',
              }}>
              {PERIODO_LABELS[p]}
            </button>
          ))}
        </div>

        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuAbierto(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: 10, background: 'white',
              border: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', whiteSpace: 'nowrap'
            }}
          >
            <span>Calificaciones</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              style={{ transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {menuAbierto && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20,
              background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0', padding: '0.375rem', minWidth: 160
            }}>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
                Vista actual
              </div>
              <div style={{ padding: '0.625rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', background: '#f8fafc', borderRadius: 8, marginTop: 4 }}>
                Calificaciones
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 2 CARDS SUPERIORES */}
      {!loading && alumnos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>

          <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem 1.5rem', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.375rem' }}>Promedio del Grupo</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: colorNota(promedio), margin: 0, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{promedio ?? '—'}</p>
            </div>
            <div style={{ height: 40, width: 1, background: '#f0f0f5' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c759' }} />
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Aprobados: <strong style={{ color: '#1e3a5f' }}>{aprobados}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b30' }} />
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Reprobados: <strong style={{ color: '#1e3a5f' }}>{reprobados}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem 1.5rem', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Observación del Grupo</p>
            <p style={{ fontSize: '0.8125rem', color: observacionGrupo ? '#334155' : '#94a3b8', fontStyle: observacionGrupo ? 'normal' : 'italic', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {observacionGrupo ? observacionGrupo : 'Sin observaciones'}
            </p>
          </div>

        </div>
      )}

      {/* Tabla de Alumnos con botón de Refresh en la esquina superior izquierda */}
      <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        
        {/* Barra de título de la tabla con el botón Refresh */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Actualizar datos"
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                color: '#1e3a5f',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => { if (!isRefreshing) e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { if (!isRefreshing) e.currentTarget.style.background = 'white' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"
                style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {isRefreshing ? 'Actualizando...' : 'Lista de Estudiantes'}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{nombreAsignatura}</span>
        </div>

        {loading || loadingPeriodo ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div style={{ width: 34, height: 34, border: '3px solid #e2e8f0', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
          </div>
        ) : (
          <>
            <div style={{ maxHeight: 'calc(8 * 56px + 44px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    {['#', 'Alumno', 'Matrícula', 'Observaciones', 'Calificación', 'Estado', ...(trabajos.length > 0 ? ['Detalle'] : [])].map(col => (
                      <th key={col} style={{
                        textAlign: col === 'Calificación' || col === 'Estado' || col === 'Detalle' ? 'center' : 'left',
                        padding: '0.75rem 1.25rem', fontSize: '0.65rem', fontWeight: 700,
                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((al, i) => (
                    <FilaAlumno
                      key={al.id}
                      alumno={al}
                      nota={notaMap[al.id] ?? null}
                      trabajos={trabajos}
                      detalle={detalleMap[al.id] ?? null}
                      observacion={observacionesAlumnos.get(al.id) ?? ''}
                      idx={i}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                {alumnos.length} alumnos · {PERIODO_LABELS[periodo]}
              </p>
              {trabajos.length > 0 && (
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                  Clic en la flecha para ver detalle por trabajo
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}