// src/components/docente/calificaciones/CalificacionesView.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TablaCalificaciones from './TablaCalificaciones'
import type { Trabajo, Alumno, ContextoCalificacion } from './types'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 60 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)    { return v === null ? '#f8fafc' : v >= 60 ? '#f0fdf4' : '#fef2f2' }

// `notas` guarda la calificación 0-100 que el docente capturó por rubro (NO los puntos
// absolutos almacenados en BD). Para el total: (calif/100) * peso del rubro.
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

// ── Vista principal ───────────────────────────────────────────────────────────
export default function CalificacionesView({ ctx, onBack, onAbrirRubros }: {
  ctx: ContextoCalificacion
  onBack: () => void
  onAbrirRubros: () => void
}) {
  const supabase = createClient()
  const [trabajos, setTrabajos]   = useState<Trabajo[]>([])
  const [alumnos, setAlumnos]     = useState<Alumno[]>([])
  // notas: calificación 0-100 capturada por el docente para cada rubro
  const [notas, setNotas]         = useState<Map<string, number | null>>(new Map())
  const [loading, setLoading]     = useState(true)
  const [docenteId, setDocenteId] = useState<string | null>(null)
  const [plantelId, setPlantelId] = useState<string | null>(null)

  // Pushear entrada al historial para interceptar el botón atrás
  useEffect(() => {
    // Al montar, empujar un estado para poder interceptar el popstate
    window.history.pushState({ calView: true }, '')
  }, [])

  // Interceptar botón atrás del navegador/teléfono — todo se autoguarda, regresar directo
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
    type TrabajoRaw = { id: string; nombre: string; peso: number; orden: number }
    return Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('id, nombre, peso, orden')
        .eq('grupo_id', ctx.grupo_id).eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo).eq('docente_id', docenteId).order('orden')
    ).then(async ({ data: tData }) => {
      const ts = (tData ?? []) as TrabajoRaw[]
      const { data: alumnosData } = await supabase.rpc('get_estudiantes_grupo', { p_grupo_id: ctx.grupo_id })
      const tIds = ts.map(t => t.id)
      const pesoMap = new Map(ts.map(t => [t.id, t.peso]))
      const notasMapa = new Map<string, number | null>()
      if (tIds.length > 0) {
        const { data: nData } = await supabase
          .from('calificaciones_detalle').select('actividad_id, estudiante_id, puntos')
          .in('actividad_id', tIds)
        for (const n of (nData ?? [])) {
          // Convertir puntos absolutos (0-peso) a calificación 0-100 para la tabla
          const peso = pesoMap.get(n.actividad_id) ?? 0
          const calif = peso > 0 && n.puntos !== null
            ? Math.round((Math.min(n.puntos, peso) / peso) * 100)
            : null
          notasMapa.set(`${n.actividad_id}:${n.estudiante_id}`, calif)
        }
      }
      return { trabajos: ts, alumnos: (alumnosData ?? []) as Alumno[], notasMapa }
    })
  }, [docenteId, plantelId, ctx, supabase])

  useEffect(() => {
    if (!docenteId) return
    fetchDatos().then(res => {
      if (!res) return
      setTrabajos(res.trabajos)
      setAlumnos(res.alumnos)
      setNotas(res.notasMapa)
      setLoading(false)
    }).catch(console.error)
  }, [docenteId, fetchDatos])

  // calif: calificación 0-100 capturada en la celda. Se convierte a puntos (0-peso) para guardar.
  function handleNotaChange(trabajoId: string, alumnoId: string, calif: number) {
    let notasActualizadas: Map<string, number | null> = new Map()
    setNotas(prev => {
      const m = new Map(prev)
      m.set(`${trabajoId}:${alumnoId}`, calif)
      notasActualizadas = m
      return m
    })
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
    // Auto-guardar la calificación final del alumno para este parcial
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


  const PERIODO_LABEL: Record<string, string> = { '1': '1er Parcial', '2': '2do Parcial', '3': '3er Parcial' }
  // Incluir todos los alumnos: sin nota = 0
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
          <button onClick={onAbrirRubros} style={{ display:'flex', alignItems:'center', gap:5, padding:'0.4rem 0.75rem', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#2563eb', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            Trabajos
          </button>
        </div>
      </div>

      <div style={{ padding:'1rem 0.875rem 2rem' }}>

        {/* Advertencia pesos */}
        {!loading && trabajos.length > 0 && Math.abs(sumaPesos - 100) > 0.01 && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 0.875rem', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', marginBottom:'1rem' }}>
            <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span style={{ fontSize:'0.73rem', color:'#92400e', fontWeight:500 }}>Los trabajos suman {sumaPesos}% — deben ser 100%.</span>
          </div>
        )}

        {/* Sin trabajos CTA */}
        {!loading && trabajos.length === 0 && (
          <div style={{ background:'white', borderRadius:14, border:'1.5px dashed #bfdbfe', padding:'2rem 1.5rem', textAlign:'center', marginBottom:'1.25rem' }}>
            <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem' }}>Sin trabajos configurados</p>
            <p style={{ fontSize:'0.78rem', color:'#94a3b8', margin:'0 0 1rem' }}>Define los trabajos y sus porcentajes antes de evaluar.</p>
            <button onClick={onAbrirRubros} style={{ padding:'0.625rem 1.25rem', borderRadius:10, background:'linear-gradient(135deg,#1e40af,#2563eb)', color:'white', border:'none', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
              Configurar trabajos
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && alumnos.length > 0 && trabajos.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.125rem' }}>
            {/* Promedio */}
            <div style={{ background:'white', borderRadius:14, padding:'0.875rem 1rem', border:'1px solid #e8eaf0', display:'flex', alignItems:'center', gap:'0.75rem', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width:40, height:40, borderRadius:12, background: promedio !== null ? bgNota(promedio) : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="17" height="17" fill="none" stroke={colorNota(promedio)} strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <p style={{ fontSize:'0.58rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 1px' }}>Promedio</p>
                <p style={{ fontSize:'1.375rem', fontWeight:800, color:colorNota(promedio), margin:0, lineHeight:1, fontFamily:'Outfit, sans-serif' }}>{promedio ?? '—'}</p>
              </div>
            </div>
            {/* Aprobados */}
            <div style={{ background:'white', borderRadius:14, padding:'0.875rem 1rem', border:'1px solid #e8eaf0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize:'0.58rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 6px' }}>Resultado</p>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }}/>
                  <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#16a34a' }}>{aprobados}</span>
                  <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>aprobados</span>
                </div>
                <div style={{ width:1, height:14, background:'#e2e8f0' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444' }}/>
                  <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#ef4444' }}>{alumnos.length - aprobados}</span>
                  <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>reprobados</span>
                </div>
              </div>
              <div style={{ height:4, borderRadius:9999, background:'#f1f5f9', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${alumnos.length > 0 && notasValidas.length > 0 ? (aprobados/alumnos.length)*100 : 0}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:9999, transition:'width 0.6s' }}/>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de calificaciones estilo Excel */}
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
              onNotaChange={handleNotaChange}
            />
          )
        )}
      </div>
    </div>
  )
}