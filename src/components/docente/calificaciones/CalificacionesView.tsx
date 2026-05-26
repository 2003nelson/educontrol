// src/components/docente/calificaciones/CalificacionesView.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Trabajo, Alumno, ContextoCalificacion } from './types'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 70 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)    { return v === null ? '#f8fafc' : v >= 70 ? '#f0fdf4' : '#fef2f2' }
function bdNota(v: number | null)    { return v === null ? '#e2e8f0' : v >= 70 ? '#bbf7d0' : '#fecaca' }

function calcNota(trabajos: Trabajo[], alumnoId: string, notas: Map<string, number | null>): number | null {
  if (trabajos.length === 0) return null
  const suma = trabajos.reduce((s, t) => s + t.peso, 0)
  if (suma === 0) return null
  const total = trabajos.reduce((s, t) => s + (notas.get(`${t.id}:${alumnoId}`) ?? 0), 0)
  return Math.round(total * 10) / 10
}

// ── Modal evaluar alumno ──────────────────────────────────────────────────────
function ModalEvaluar({ alumno, trabajo, valorActual, onGuardar, onCerrar }: {
  alumno: Alumno
  trabajo: Trabajo
  valorActual: number | null
  onGuardar: (puntos: number) => void
  onCerrar: () => void
}) {
  const [valor, setValor] = useState(valorActual ?? 0)

  if (typeof window === 'undefined') return null
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'100%', maxWidth:380, padding:'1.75rem', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'cardIn 0.35s cubic-bezier(0.34,1.4,0.64,1)' }}>
        <style>{`@keyframes cardIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Alumno + trabajo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.375rem' }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#dde3ea', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'#6b7897', flexShrink:0 }}>
            {alumno.nombre_completo.charAt(0)}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{alumno.nombre_completo}</p>
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>{trabajo.nombre} · vale {trabajo.peso}%</p>
          </div>
        </div>

        {/* Valor numérico grande */}
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <p style={{ fontSize:'4rem', fontWeight:800, color: valor >= trabajo.peso * 0.7 ? '#16a34a' : '#dc2626', margin:0, lineHeight:1, fontFamily:'Outfit, sans-serif', transition:'color 0.2s' }}>
            {Math.round(valor * 10) / 10}
          </p>
          <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.375rem 0 0' }}>de {trabajo.peso} puntos máximos</p>
        </div>

        {/* Barra deslizable */}
        <div style={{ marginBottom:'1.5rem' }}>
          <input
            type="range"
            min={0} max={trabajo.peso} step={0.5}
            value={valor}
            onChange={e => setValor(parseFloat(e.target.value))}
            style={{ width:'100%', accentColor:'#2563eb', height:6, cursor:'pointer' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.375rem' }}>
            <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>0</span>
            <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>{trabajo.peso / 2}</span>
            <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>{trabajo.peso}</span>
          </div>
        </div>

        {/* Porcentaje del trabajo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <div style={{ flex:1, height:8, borderRadius:9999, background:'#f1f5f9', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(valor / trabajo.peso) * 100}%`, background: valor >= trabajo.peso * 0.7 ? '#16a34a' : '#ef4444', borderRadius:9999, transition:'width 0.15s, background 0.2s' }}/>
          </div>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', flexShrink:0 }}>
            {Math.round((valor / trabajo.peso) * 100)}%
          </span>
        </div>

        {/* Botones */}
        <div style={{ display:'flex', gap:'0.625rem' }}>
          <button onClick={onCerrar} style={{ flex:1, padding:'0.75rem', borderRadius:10, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.85rem', fontWeight:600, cursor:'pointer' }}>
            Regresar
          </button>
          <button onClick={() => { onGuardar(valor); onCerrar() }} style={{ flex:2, padding:'0.75rem', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1e40af,#2563eb)', color:'white', fontSize:'0.85rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(30,64,175,0.3)' }}>
            Asignar calificación
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Fila de alumno ────────────────────────────────────────────────────────────
function FilaAlumno({ alumno, trabajos, notas, onNotaChange }: {
  alumno: Alumno
  trabajos: Trabajo[]
  notas: Map<string, number | null>
  onNotaChange: (trabajoId: string, alumnoId: string, pts: number) => void
}) {
  const [modal, setModal] = useState<Trabajo | null>(null)
  const notaFinal = calcNota(trabajos, alumno.id, notas)

  return (
    <>
      <div style={{ background:'white', borderRadius:14, border:`1.5px solid ${bdNota(notaFinal)}`, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Info alumno */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', borderBottom:'1px solid #f4f5f7' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', minWidth:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:'#dde3ea', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, color:'#6b7897' }}>
              {alumno.nombre_completo.charAt(0)}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:'0.83rem', fontWeight:600, color:'#1e3a5f', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{alumno.nombre_completo}</p>
              <p style={{ fontSize:'0.68rem', color:'#94a3b8', margin:0 }}>{alumno.matricula}</p>
            </div>
          </div>
          {/* Nota final */}
          <div style={{ minWidth:46, height:36, borderRadius:9, background:bgNota(notaFinal), border:`1.5px solid ${bdNota(notaFinal)}`, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 10px', flexShrink:0 }}>
            <span style={{ fontSize:'0.9rem', fontWeight:800, color:colorNota(notaFinal) }}>{notaFinal ?? '—'}</span>
          </div>
        </div>

        {/* Trabajos — grid de botones evaluar */}
        <div style={{ padding:'0.625rem 1rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
          {trabajos.map(t => {
            const pts = notas.get(`${t.id}:${alumno.id}`) ?? null
            const evaluado = pts !== null
            return (
              <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0.75rem', borderRadius:9, background:'#f8fafc', border:'1px solid #f0f0f5' }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', margin:0 }}>{t.nombre}</p>
                  <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:0 }}>Vale {t.peso}%</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                  {evaluado && (
                    <span style={{ fontSize:'0.75rem', fontWeight:800, color: pts! >= t.peso * 0.7 ? '#16a34a' : '#dc2626', background: pts! >= t.peso * 0.7 ? '#f0fdf4' : '#fef2f2', padding:'2px 8px', borderRadius:9999 }}>
                      {pts}/{t.peso}
                    </span>
                  )}
                  <button
                    onClick={() => setModal(t)}
                    style={{
                      padding:'0.35rem 0.75rem', borderRadius:8, fontSize:'0.72rem', fontWeight:600, cursor:'pointer', border:'none', whiteSpace:'nowrap',
                      background: evaluado ? '#f1f5f9' : 'linear-gradient(135deg,#1e40af,#2563eb)',
                      color: evaluado ? '#475569' : 'white',
                      boxShadow: evaluado ? 'none' : '0 2px 8px rgba(30,64,175,0.25)',
                    }}>
                    {evaluado ? 'Editar calificación' : 'Evaluar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <ModalEvaluar
          alumno={alumno}
          trabajo={modal}
          valorActual={notas.get(`${modal.id}:${alumno.id}`) ?? null}
          onGuardar={pts => onNotaChange(modal.id, alumno.id, pts)}
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  )
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
  const [notas, setNotas]         = useState<Map<string, number | null>>(new Map())
  const [loading, setLoading]     = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [guardado, setGuardado]       = useState(false)
  const [haycambios, setHayCambios]   = useState(false)
  const [modalSalir, setModalSalir]   = useState(false)
  const [docenteId, setDocenteId] = useState<string | null>(null)
  const [plantelId, setPlantelId] = useState<string | null>(null)

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
      const notasMapa = new Map<string, number | null>()
      if (tIds.length > 0) {
        const { data: nData } = await supabase
          .from('calificaciones_detalle').select('actividad_id, estudiante_id, puntos')
          .in('actividad_id', tIds)
        for (const n of (nData ?? [])) notasMapa.set(`${n.actividad_id}:${n.estudiante_id}`, n.puntos)
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

  function handleNotaChange(trabajoId: string, alumnoId: string, pts: number) {
    setNotas(prev => { const m = new Map(prev); m.set(`${trabajoId}:${alumnoId}`, pts); return m })
    setGuardado(false)
    setHayCambios(true)
    // Auto-guardar inmediatamente
    if (!docenteId || !plantelId) return
    void Promise.resolve(
      supabase.from('calificaciones_detalle').upsert(
        [{ actividad_id: trabajoId, estudiante_id: alumnoId, plantel_id: plantelId, puntos: pts, updated_at: new Date().toISOString() }],
        { onConflict: 'actividad_id,estudiante_id', ignoreDuplicates: false }
      )
    )
  }

  async function guardarTodo() {
    if (!docenteId || !plantelId || guardando) return
    setGuardando(true)
    // Actualizar calificaciones finales por alumno
    const calFinals = alumnos.map(al => ({
      plantel_id: plantelId, estudiante_id: al.id,
      asignatura_id: ctx.asignatura_id, grupo_id: ctx.grupo_id,
      docente_id: docenteId, periodo: ctx.periodo,
      calificacion: calcNota(trabajos, al.id, notas) ?? 0,
      falta: false, updated_at: new Date().toISOString(),
    }))
    await supabase.from('calificaciones')
      .upsert(calFinals, { onConflict: 'estudiante_id,asignatura_id,grupo_id,periodo', ignoreDuplicates: false })
    setGuardando(false); setGuardado(true); setHayCambios(false)
    setTimeout(() => setGuardado(false), 3000)
  }

  const PERIODO_LABEL: Record<string, string> = { '1': '1er Parcial', '2': '2do Parcial', '3': '3er Parcial' }
  // Incluir todos los alumnos: sin nota = 0
  const notasTodos = alumnos.map(al => {
    if (trabajos.length === 0) return null
    return calcNota(trabajos, al.id, notas) ?? 0
  })
  const notasValidas = notasTodos.filter((n): n is number => n !== null)
  const promedio = notasValidas.length > 0 ? Math.round(notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length * 10) / 10 : null
  const aprobados = notasValidas.filter(n => n >= 70).length
  const sumaPesos = trabajos.reduce((s, t) => s + t.peso, 0)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fa', fontFamily:'system-ui, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header sticky */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'white', borderBottom:'1px solid #e8eaf0', padding:'0.75rem 1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={() => { if (haycambios) setModalSalir(true); else onBack() }} style={{ width:34, height:34, borderRadius:9, background:'#f4f5f7', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', flexShrink:0 }}>
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

      <div style={{ padding:'1rem 0.875rem 6rem' }}>

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

        {/* Lista alumnos */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem 0' }}>
            <div style={{ width:34, height:34, border:'3px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {alumnos.map(al => (
              <FilaAlumno key={al.id} alumno={al} trabajos={trabajos} notas={notas} onNotaChange={handleNotaChange} />
            ))}
          </div>
        )}
      </div>

      {/* Botón cerrar parcial flotante */}
      {alumnos.length > 0 && trabajos.length > 0 && (
        <div style={{ position:'fixed', bottom:'1.25rem', left:'50%', transform:'translateX(-50%)', zIndex:40, width:'calc(100% - 1.5rem)', maxWidth:460 }}>
          <button onClick={guardarTodo} disabled={guardando}
            style={{ width:'100%', padding:'0.875rem', borderRadius:14, background: guardado ? '#f0fdf4' : 'linear-gradient(135deg,#1e40af,#2563eb)', color: guardado ? '#16a34a' : 'white', border: guardado ? '1.5px solid #bbf7d0' : 'none', fontWeight:700, fontSize:'0.95rem', cursor: guardando ? 'not-allowed' : 'pointer', boxShadow: guardado ? 'none' : '0 8px 24px rgba(30,64,175,0.35)', transition:'all 0.3s', opacity: guardando ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
            {guardando
              ? <><div style={{ width:15, height:15, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Guardando...</>
              : guardado
              ? <><svg width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Calificaciones cerradas</>
              : 'Guardar calificaciones'
            }
          </button>
        </div>
      )}
    </div>
  )
}