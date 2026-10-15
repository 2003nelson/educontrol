// src/components/docente/calificaciones/CalificacionesView.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TablaCalificaciones from './TablaCalificaciones'
import ObservacionesCard from './ObservacionesCard'
import type { Trabajo, Alumno, ContextoCalificacion } from './types'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 60 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)   { return v === null ? '#f8fafc' : v >= 60 ? '#f0fdf4' : '#fef2f2' }

function calcNota(trabajos: Trabajo[], alumnoId: string, notas: Map<string, number | null>): number | null {
  if (trabajos.length === 0) return null
  const suma = trabajos.reduce((s, t) => s + t.peso, 0)
  if (suma === 0) return null
  const total = trabajos.reduce((s, t) => {
    const calif = notas.get(`${t.id}:${alumnoId}`) ?? 0
    const califClamp = Math.max(0, Math.min(100, calif))
    return s + (califClamp / 100) * t.peso
  }, 0)
  return Math.round(total * 10) / 10
}

export default function CalificacionesView({ ctx, onBack, onAbrirRubros }: {
  ctx: ContextoCalificacion
  onBack: () => void
  onAbrirRubros: () => void
}) {
  const supabase = createClient()
  const [trabajos, setTrabajos]   = useState<Trabajo[]>([])
  const [alumnos, setAlumnos]     = useState<Alumno[]>([])
  const [notas, setNotas]         = useState<Map<string, number | null>>(new Map())
  const [observacionesAlumnos, setObservacionesAlumnos] = useState<Map<string, string>>(new Map())
  const [loading, setLoading]     = useState(true)
  const [docenteId, setDocenteId] = useState<string | null>(null)
  const [plantelId, setPlantelId] = useState<string | null>(null)

  useEffect(() => {
    window.history.pushState({ calView: true }, '')
  }, [])

  const handlePopState = useCallback(() => {
    onBack()
  }, [onBack])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  useEffect(() => {
    void Promise.resolve(supabase.auth.getUser()).then(({ data: { user } }) => {
      if (!user) return
      return Promise.resolve(
        supabase.from('usuarios').select('id, plantel_id').eq('auth_id', user.id).single()
      ).then(({ data }) => { if (data) { setDocenteId(data.id); setPlantelId(data.plantel_id) } })
    })
  }, [supabase])

  const fetchDatos = useCallback(() => {
    if (!docenteId || !plantelId) return Promise.resolve(null)
    type TrabajoRaw = { id: string; nombre: string; peso: number; orden: number; es_asistencia?: boolean }
    return Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('id, nombre, peso, orden, es_asistencia')
        .eq('grupo_id', ctx.grupo_id).eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo).eq('docente_id', docenteId).order('orden')
    ).then(async ({ data: tData }) => {
      const ts = (tData ?? []) as TrabajoRaw[]
      const { data: alumnosData } = await supabase.rpc('get_estudiantes_grupo', { p_grupo_id: ctx.grupo_id })
      const alumnos = (alumnosData ?? []) as Alumno[]
      const tIds = ts.map(t => t.id)
      const pesoMap = new Map(ts.map(t => [t.id, t.peso]))
      const notasMapa = new Map<string, number | null>()

      if (tIds.length > 0) {
        const { data: nData } = await supabase
          .from('calificaciones_detalle').select('actividad_id, estudiante_id, puntos')
          .in('actividad_id', tIds)
        for (const n of (nData ?? [])) {
          const peso = pesoMap.get(n.actividad_id) ?? 0
          const calif = peso > 0 && n.puntos !== null
            ? Math.round((Math.min(n.puntos, peso) / peso) * 100)
            : null
          notasMapa.set(`${n.actividad_id}:${n.estudiante_id}`, calif)
        }
      }

      // Cargar observaciones de alumnos filtrando por docente, grupo, asignatura y periodo actual
      const { data: obsAlumnosData } = await supabase
        .from('observaciones_estudiantes')
        .select('estudiante_id, contenido')
        .eq('docente_id', docenteId)
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo)

      const obsMap = new Map<string, string>()
      for (const o of (obsAlumnosData ?? [])) {
        if (o.contenido && o.contenido.trim().length > 0) {
          obsMap.set(o.estudiante_id, o.contenido)
        }
      }

      const ESTADO_PRESENTE = 'presente'
      const rubroAsistencia = ts.find(t => t.es_asistencia || t.nombre?.toLowerCase() === 'asistencia')
      if (rubroAsistencia && alumnos.length > 0) {
        const { data: asistData } = await supabase
          .from('asistencias')
          .select('estudiante_id, fecha, estado')
          .eq('docente_id', docenteId)
          .eq('grupo_id', ctx.grupo_id)

        if (asistData && asistData.length > 0) {
          const diasUnicos = new Set(asistData.map(a => a.fecha as string)).size

          if (diasUnicos > 0) {
            const presenciasPorAlumno = new Map<string, number>()
            for (const a of asistData) {
              if ((a.estado as string)?.toLowerCase() === ESTADO_PRESENTE) {
                presenciasPorAlumno.set(a.estudiante_id, (presenciasPorAlumno.get(a.estudiante_id) ?? 0) + 1)
              }
            }
            for (const al of alumnos) {
              const presencias = presenciasPorAlumno.get(al.id) ?? 0
              const califAsist = Math.round((presencias / diasUnicos) * 100)
              notasMapa.set(`${rubroAsistencia.id}:${al.id}`, califAsist)
            }
          }
        }
      }

      return { trabajos: ts, alumnos, notasMapa, obsMap }
    })
  }, [docenteId, plantelId, ctx, supabase])

  useEffect(() => {
    if (!docenteId) return
    fetchDatos().then(res => {
      if (!res) return
      setTrabajos(res.trabajos)
      setAlumnos(res.alumnos)
      setNotas(res.notasMapa)
      setObservacionesAlumnos(res.obsMap)
      setLoading(false)
    }).catch(console.error)
  }, [docenteId, fetchDatos])

  function handleNotaChange(trabajoId: string, alumnoId: string, calif: number | null) {
    let notasActualizadas: Map<string, number | null> = new Map()
    setNotas(prev => {
      const m = new Map(prev)
      m.set(`${trabajoId}:${alumnoId}`, calif)
      notasActualizadas = m
      return m
    })
    if (calif === null) return
    if (!docenteId || !plantelId) return
    const peso = trabajos.find(t => t.id === trabajoId)?.peso ?? 0
    const califClamp = Math.max(0, Math.min(100, calif))
    const puntos = Math.round(((califClamp / 100) * peso) * 100) / 100
    void Promise.resolve(
      supabase.from('calificaciones_detalle').upsert(
        [{ actividad_id: trabajoId, estudiante_id: alumnoId, plantel_id: plantelId, puntos, updated_at: new Date().toISOString() }],
        { onConflict: 'actividad_id,estudiante_id', ignoreDuplicates: false }
      )
    )
    const notaFinal = calcNota(trabajos, alumnoId, notasActualizadas) ?? 0
    void Promise.resolve(
      supabase.from('calificaciones').upsert(
        [{
          plantel_id: plantelId, estudiante_id: alumnoId,
          asignatura_id: ctx.asignatura_id, grupo_id: ctx.grupo_id,
          docente_id: docenteId, periodo: ctx.periodo,
          calificacion: notaFinal, falta: false, updated_at: new Date().toISOString(),
        }],
        { onConflict: 'estudiante_id,asignatura_id,grupo_id,periodo', ignoreDuplicates: false }
      )
    )
  }

  const handleGuardarObservacionAlumno = async (alumnoId: string, texto: string) => {
    if (!docenteId || !plantelId) return

    const textoLimpio = texto.trim()

    setObservacionesAlumnos(prev => {
      const m = new Map(prev)
      if (textoLimpio.length === 0) m.delete(alumnoId)
      else m.set(alumnoId, textoLimpio)
      return m
    })

    if (textoLimpio.length === 0) {
      await supabase
        .from('observaciones_estudiantes')
        .delete()
        .eq('docente_id', docenteId)
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('estudiante_id', alumnoId)
        .eq('periodo', ctx.periodo)
    } else {
      await supabase.from('observaciones_estudiantes').upsert([{
        plantel_id: plantelId,
        docente_id: docenteId,
        grupo_id: ctx.grupo_id,
        asignatura_id: ctx.asignatura_id,
        estudiante_id: alumnoId,
        periodo: ctx.periodo,
        contenido: textoLimpio,
        updated_at: new Date().toISOString()
      }], { onConflict: 'docente_id,grupo_id,asignatura_id,estudiante_id,periodo' })
    }
  }

  const PERIODO_LABEL: Record<string, string> = { '1': '1er Parcial', '2': '2do Parcial', '3': '3er Parcial' }
  const notasTodos = alumnos.map(al => {
    if (trabajos.length === 0) return null
    return calcNota(trabajos, al.id, notas) ?? 0
  })
  const notasValidas = notasTodos.filter((n): n is number => n !== null)
  const promedio = notasValidas.length > 0 ? Math.round(notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length * 10) / 10 : null
  const aprobados = notasValidas.filter(n => n >= 60).length
  const sumaPesos = trabajos.reduce((s, t) => s + t.peso, 0)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fa', fontFamily:'system-ui, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header sticky */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'white', borderBottom:'1px solid #e8eaf0', padding:'0.75rem 1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={onBack} style={{ width:34, height:34, borderRadius:9, background:'#f4f5f7', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', flexShrink:0 }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ctx.asignatura_nombre}</h1>
            <p style={{ fontSize:'0.68rem', color:'#94a3b8', margin:0 }}>Grupo {ctx.grupo_numero} · {ctx.grupo_grado}° Sem · {PERIODO_LABEL[ctx.periodo]}</p>
          </div>
          <button
            onClick={onAbrirRubros}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'0 0.75rem', height:34, borderRadius:9, background:'#f4f5f7', border:'none', color:'#111827', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', flexShrink:0, transition:'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#e9eaec' }}
            onMouseLeave={e => { e.currentTarget.style.background='#f4f5f7'; e.currentTarget.style.color='#111827' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            Trabajos
          </button>
        </div>
      </div>

      <div style={{ padding:'1rem 0.875rem 2rem' }}>

        {!loading && trabajos.length > 0 && Math.abs(sumaPesos - 100) > 0.01 && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 0.875rem', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', marginBottom:'1rem' }}>
            <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span style={{ fontSize:'0.73rem', color:'#92400e', fontWeight:500 }}>Los trabajos suman {sumaPesos}% — deben ser 100%.</span>
          </div>
        )}

        {!loading && trabajos.length === 0 && (
          <div style={{ background:'white', borderRadius:14, border:'1.5px dashed #bfdbfe', padding:'2rem 1.5rem', textAlign:'center', marginBottom:'1.25rem' }}>
            <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem' }}>Sin trabajos configurados</p>
            <p style={{ fontSize:'0.78rem', color:'#94a3b8', margin:'0 0 1rem' }}>Define los trabajos y sus porcentajes antes de evaluar.</p>
            <button onClick={onAbrirRubros} style={{ padding:'0.625rem 1.25rem', borderRadius:10, background:'linear-gradient(135deg,#1e40af,#2563eb)', color:'white', border:'none', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
              Configurar trabajos
            </button>
          </div>
        )}

        {!loading && alumnos.length > 0 && trabajos.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'1.125rem' }}>

            <div style={{ background:'white', borderRadius:14, border:'1px solid #e8eaf0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'1rem 1.25rem' }}>
              
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background: promedio !== null ? bgNota(promedio) : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="17" height="17" fill="none" stroke={colorNota(promedio)} strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize:'0.58rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 1px' }}>Promedio</p>
                    <p style={{ fontSize:'1.375rem', fontWeight:800, color:colorNota(promedio), margin:0, lineHeight:1, fontFamily:'Outfit, sans-serif' }}>{promedio ?? '—'}</p>
                  </div>
                </div>

                <div style={{ width:1, height:35, background:'#f0f0f5', flexShrink:0 }} />

                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'0.58rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 4px' }}>Resultado</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', flexShrink:0 }}/>
                      <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#16a34a' }}>{aprobados}</span>
                      <span style={{ fontSize:'0.6rem', color:'#94a3b8' }}>aprobados</span>
                    </div>
                    <div style={{ width:1, height:10, background:'#e2e8f0', flexShrink:0 }}/>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', flexShrink:0 }}/>
                      <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#ef4444' }}>{alumnos.length - aprobados}</span>
                      <span style={{ fontSize:'0.6rem', color:'#94a3b8' }}>reprobados</span>
                    </div>
                  </div>
                  <div style={{ height:3, borderRadius:9999, background:'#f1f5f9', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${alumnos.length > 0 && notasValidas.length > 0 ? (aprobados/alumnos.length)*100 : 0}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:9999 }}/>
                  </div>
                </div>

              </div>

              <div style={{ height:'1px', background:'#f0f0f5', margin:'0.875rem 0 0.75rem' }}/>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                  <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', letterSpacing:'0.04em', textTransform:'uppercase' }}>Descargar informe</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <button title="Descargar Excel" style={{ width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="18" rx="3" fill="#16a34a"/>
                      <path d="M7 8l3.5 4L7 16h2.5l2-2.8 2 2.8H16l-3.5-4L16 8h-2.5l-2 2.8L9.5 8H7z" fill="white"/>
                    </svg>
                  </button>
                  <button title="Descargar PDF" style={{ width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="18" rx="3" fill="#dc2626"/>
                      <text x="4" y="15.5" fontSize="8" fontWeight="800" fill="white" fontFamily="system-ui,sans-serif">PDF</text>
                    </svg>
                  </button>
                  <button title="Descargar Word" style={{ width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="18" rx="3" fill="#2563eb"/>
                      <path d="M5 8h1.5l1.8 6 1.8-6H12l1.8 6 1.8-6H17l-2.5 8h-1.8L11 10l-1.5 6H7.5L5 8z" fill="white"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>

            <ObservacionesCard
              ctx={ctx}
              docenteId={docenteId}
              plantelId={plantelId}
              onVerAlumnosObs={() => {
                alert('Próximamente: ver observaciones hechas a los alumnos')
              }}
            />

          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem 0' }}>
            <div style={{ width:34, height:34, border:'3px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
          </div>
        ) : (
          alumnos.length > 0 && trabajos.length > 0 && (
            <TablaCalificaciones
              alumnos={alumnos}
              trabajos={trabajos}
              notas={notas}
              observacionesAlumnos={observacionesAlumnos}
              onNotaChange={handleNotaChange}
              onGuardarObservacionAlumno={handleGuardarObservacionAlumno}
            />
          )
        )}
      </div>
    </div>
  )
}