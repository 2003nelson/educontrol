// src/components/docente/calificaciones/RubrosModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Trabajo, ContextoCalificacion } from './types'

// Nombre canónico del rubro fijo de asistencia — debe coincidir con lo que se guarda en BD
const NOMBRE_ASISTENCIA = 'Asistencia'

export default function RubrosModal({ ctx, docenteId, plantelId, onClose, onGuardado }: {
  ctx: ContextoCalificacion
  docenteId: string
  plantelId: string
  onClose: () => void
  onGuardado: () => void
}) {
  const supabase = createClient()
  const [trabajos, setTrabajos]         = useState<Trabajo[]>([])
  const [loading, setLoading]          = useState(true)
  const [guardando, setGuardando]      = useState(false)
  const [parcialesToCopy, setParcialesToCopy] = useState<{ periodo: string; label: string; count: number }[]>([])
  const [copiando, setCopiando]        = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)

  useEffect(() => {
    const p1 = Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('id, nombre, peso, orden, es_asistencia')
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo)
        .eq('docente_id', docenteId)
        .order('orden')
    )
    const p2 = Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('periodo')
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('docente_id', docenteId)
        .neq('periodo', ctx.periodo)
    )
    Promise.all([p1, p2]).then(([r1, r2]) => {
      const rubros = (r1.data ?? []) as Trabajo[]

      // Si no existe el rubro de Asistencia, lo agregamos al frente como rubro nuevo con peso 0
      const yaExiste = rubros.some(t => t.es_asistencia || t.nombre.toLowerCase() === 'asistencia')
      const lista: Trabajo[] = yaExiste
        ? rubros
        : [{ id: `new-asistencia-${Date.now()}`, nombre: NOMBRE_ASISTENCIA, peso: 0, orden: 0, es_asistencia: true }, ...rubros]

      // Aseguramos que el de asistencia siempre quede primero
      lista.sort((a, b) => (b.es_asistencia ? 1 : 0) - (a.es_asistencia ? 1 : 0) || a.orden - b.orden)

      setTrabajos(lista)

      const map: Record<string, number> = {}
      for (const r of (r2.data ?? [])) {
        map[r.periodo] = (map[r.periodo] ?? 0) + 1
      }
      const LABELS: Record<string, string> = { '1': '1er Parcial', '2': '2do Parcial', '3': '3er Parcial' }
      setParcialesToCopy(
        Object.entries(map).map(([periodo, count]) => ({ periodo, label: LABELS[periodo] ?? `Parcial ${periodo}`, count }))
      )
      setLoading(false)
    }).catch(console.error)
  }, [supabase, ctx, docenteId])

  const sumaPesos = trabajos.reduce((s, t) => s + (Number(t.peso) || 0), 0)
  const pesoValido = Math.abs(sumaPesos - 100) < 0.01

  function addTrabajo() {
    setTrabajos(prev => [...prev, { id: `new-${Date.now()}`, nombre: '', peso: 0, orden: prev.length }])
  }

  async function copiarDeParcial(periodo: string) {
    setCopiando(true)
    const { data } = await supabase.from('calificacion_rubros')
      .select('nombre, peso, orden, es_asistencia')
      .eq('grupo_id', ctx.grupo_id)
      .eq('asignatura_id', ctx.asignatura_id)
      .eq('periodo', periodo)
      .eq('docente_id', docenteId)
      .order('orden')
    if (data && data.length > 0) {
      setTrabajos(prev => {
        const asistencia = prev.find(t => t.es_asistencia)
        const copiados = data
          .filter(t => !t.es_asistencia && t.nombre.toLowerCase() !== 'asistencia')
          .map((t, i) => ({ id: `new-${Date.now()}-${i}`, nombre: t.nombre, peso: t.peso, orden: i + 1 }))
        const pesoAsistenciaCopia = data.find(t => t.es_asistencia || t.nombre.toLowerCase() === 'asistencia')?.peso ?? asistencia?.peso ?? 0
        return [
          ...(asistencia ? [{ ...asistencia, peso: pesoAsistenciaCopia }] : []),
          ...copiados
        ]
      })
    }
    setCopiando(false)
  }

  function update(idx: number, campo: keyof Trabajo, valor: string | number) {
    if (campo === 'nombre' && trabajos[idx]?.es_asistencia) return
    setTrabajos(prev => prev.map((t, i) => i === idx ? { ...t, [campo]: valor } : t))
  }

  function cambiarPeso(idx: number, delta: number) {
    setTrabajos(prev => {
      const copia = [...prev]
      const actual = Number(copia[idx].peso) || 0
      const otrosPesos = prev.reduce((s, t, i) => i === idx ? s : s + (Number(t.peso) || 0), 0)
      const nuevo = Math.max(0, Math.min(100 - otrosPesos, actual + delta))
      copia[idx] = { ...copia[idx], peso: nuevo }
      return copia
    })
  }

  function remove(idx: number) {
    if (trabajos[idx]?.es_asistencia) return
    setTrabajos(prev => prev.filter((_, i) => i !== idx))
  }

  function borrarTodos() {
    setTrabajos(prev => prev.filter(t => t.es_asistencia))
    setConfirmarBorrar(false)
  }

  async function guardar() {
    if (!pesoValido || guardando) return
    setGuardando(true)

    const existentes = trabajos.filter(t => !t.id.startsWith('new-') && t.nombre.trim())
    const nuevos     = trabajos.filter(t => t.id.startsWith('new-') && t.nombre.trim())
    const idsActuales = existentes.map(t => t.id)

    const { data: rubrosOriginales } = await supabase.from('calificacion_rubros')
      .select('id')
      .eq('grupo_id', ctx.grupo_id)
      .eq('asignatura_id', ctx.asignatura_id)
      .eq('periodo', ctx.periodo)
      .eq('docente_id', docenteId)

    const idsEliminar = (rubrosOriginales ?? [])
      .map(r => r.id as string)
      .filter(id => !idsActuales.includes(id))

    if (idsEliminar.length > 0) {
      await supabase.from('calificacion_rubros').delete().in('id', idsEliminar)
    }

    for (const t of existentes) {
      await supabase.from('calificacion_rubros')
        .update({ nombre: t.nombre, peso: t.peso, orden: t.orden, updated_at: new Date().toISOString() })
        .eq('id', t.id)
    }

    if (nuevos.length > 0) {
      await supabase.from('calificacion_rubros').insert(
        nuevos.map((t, i) => ({
          plantel_id: plantelId, docente_id: docenteId,
          asignatura_id: ctx.asignatura_id, grupo_id: ctx.grupo_id,
          periodo: ctx.periodo, nombre: t.nombre, peso: t.peso,
          orden: existentes.length + i,
          es_asistencia: t.es_asistencia ?? false,
        }))
      )
    }

    // Recarga inmediata del navegador directamente para congelar la pantalla y evitar destellos
    window.location.reload()
  }

  if (typeof window === 'undefined') return null

  const rubrosEditables = trabajos.filter(t => !t.es_asistencia)
  const ultimoEditable = rubrosEditables[rubrosEditables.length - 1]
  const mostrarAgregar = !ultimoEditable || (ultimoEditable.nombre.trim() !== '' && Number(ultimoEditable.peso) > 0)

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'0.75rem' }}>
      <div onClick={e => e.stopPropagation()} className="rubros-modal-inner" style={{ background:'white', borderRadius:'1.25rem', width:'100%', maxWidth:720, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.15)', animation:'cardIn 0.3s cubic-bezier(0.34,1.3,0.64,1)', position:'relative' }}>
        <style>{`
          @keyframes cardIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes modalBorrarIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
          .rubro-row:hover { background: #f8fafc !important; }
          .peso-btn { transition: background 0.12s, border-color 0.12s, opacity 0.12s; }
          .peso-btn:disabled { opacity: 0.25; cursor: default !important; }
          .btn-menos:not(:disabled):hover { background: #fff1f2 !important; border-color: #fda4af !important; color: #e11d48 !important; }
          .btn-mas:not(:disabled):hover { background: #f0fdf4 !important; border-color: #86efac !important; color: #16a34a !important; }
          @media (max-width: 600px) {
            .rubros-modal-inner { max-width: 100% !important; border-radius: 1rem !important; max-height: 86vh !important; }
            .rubros-footer { flex-direction: column !important; padding: 0.65rem 1rem !important; }
            .rubros-footer button { flex: unset !important; width: 100% !important; padding: 0.55rem !important; font-size: 0.78rem !important; }
            .rubros-header { padding: 0.85rem 1rem 0.65rem !important; }
            .rubros-body { padding: 0.75rem 1rem !important; gap: 0.45rem !important; }
            .rubro-row-item { padding: 0.45rem 0.65rem !important; gap: 0.3rem !important; }
          }
        `}</style>

        {/* Header */}
        <div className="rubros-header" style={{ padding:'1.125rem 1.5rem 0.85rem', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Trabajos del parcial</h2>
            <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.04em' }}>{ctx.asignatura_nombre} · {['1er','2do','3er'][parseInt(ctx.periodo)-1]} Parcial</p>
          </div>
          {!guardando && (
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:'50%', background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontWeight:600, fontSize:'0.78rem' }}>✕</button>
          )}
        </div>

        {/* Barra de pesos minimalista */}
        <div style={{ padding:'0.45rem 1.25rem', background: pesoValido ? '#f8fafc' : sumaPesos > 100 ? '#fef2f2' : '#fffbeb', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:'0.75rem' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:600, color: pesoValido ? '#16a34a' : sumaPesos > 100 ? '#dc2626' : '#d97706', flexShrink:0 }}>
            {pesoValido ? '✓ Suma 100%' : `Suma ${sumaPesos}% — debe ser 100%`}
          </span>
          <div style={{ flex:1, height:4, borderRadius:9999, background:'#e2e8f0', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(sumaPesos,100)}%`, background: pesoValido ? '#16a34a' : sumaPesos > 100 ? '#dc2626' : '#f59e0b', borderRadius:9999, transition:'width 0.25s' }}/>
          </div>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#475569', flexShrink:0, minWidth:30, textAlign:'right' }}>{sumaPesos}%</span>
        </div>

        {/* Lista de trabajos compacta y desplazable */}
        <div className="rubros-body" style={{ flex:1, overflowY:'auto', padding:'0.85rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}>
              <div style={{ width:22, height:22, border:'2px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.4s linear infinite' }}/>
            </div>
          ) : (
            <>
              {trabajos.map((t, i) => {
                const pesoNum = Number(t.peso) || 0
                const otrosPesos = trabajos.reduce((s, tj, j) => j === i ? s : s + (Number(tj.peso) || 0), 0)
                const puedeSubir = pesoNum < 100 - otrosPesos && sumaPesos < 100
                const puedeBajar = pesoNum > 0
                const esAsistencia = !!t.es_asistencia

                const tieneNombre = t.nombre.trim() !== ''
                const tienePeso = pesoNum > 0

                return esAsistencia ? (
                  <div key={t.id} className="rubro-row-item" style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.55rem 0.75rem', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                    <div style={{ width:26, height:26, borderRadius:7, background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#475569' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      </svg>
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: '0.3rem' }}>
                        <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>Asistencia</p>
                        <span style={{ fontSize:'0.52rem', fontWeight:700, color:'#64748b', background:'#e2e8f0', borderRadius:4, padding:'1px 3px' }}>AUTOMÁTICO</span>
                      </div>
                      <p style={{ fontSize:'0.6rem', color:'#94a3b8', margin:0 }}>Calculada desde asistencia</p>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:'0.15rem', flexShrink:0 }}>
                      <button className="peso-btn btn-menos" disabled={!puedeBajar || guardando} onClick={() => cambiarPeso(i, -5)}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.7rem' }}>-</button>
                      <div style={{ width:38, height:24, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'1px solid #e2e8f0', background:'white' }}>
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1e3a5f' }}>{pesoNum}%</span>
                      </div>
                      <button className="peso-btn btn-mas" disabled={!puedeSubir || guardando} onClick={() => cambiarPeso(i, 5)}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.7rem' }}>+</button>
                    </div>

                    <div style={{ width:20, flexShrink:0 }} />
                  </div>
                ) : (
                  <div key={t.id} className="rubro-row rubro-row-item" style={{ display:'flex', flexDirection:'column', gap:'0.25rem', padding:'0.55rem 0.75rem', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0', transition:'background 0.1s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <span style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', width:14, flexShrink:0, textAlign:'center' }}>{i}</span>

                      <input
                        value={t.nombre}
                        disabled={guardando}
                        onChange={e => update(i, 'nombre', e.target.value)}
                        placeholder="Nombre del trabajo (ej. Tarea, Examen)"
                        style={{ flex:1, border:'none', background:'transparent', fontSize:'0.78rem', color:'#1e3a5f', outline:'none', fontWeight:500, minWidth:0 }}
                      />

                      <div style={{ display:'flex', alignItems:'center', gap:'0.15rem', flexShrink:0 }}>
                        <button className="peso-btn btn-menos" disabled={!puedeBajar || guardando} onClick={() => cambiarPeso(i, -5)}
                          style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.7rem' }}>-</button>
                        <div style={{ width:38, height:24, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'1px solid #e2e8f0', background:'white' }}>
                          <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1e3a5f' }}>{pesoNum}%</span>
                        </div>
                        <button className="peso-btn btn-mas" disabled={!puedeSubir || guardando} onClick={() => cambiarPeso(i, 5)}
                          style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.7rem' }}>+</button>
                      </div>

                      <button onClick={() => remove(i)} disabled={guardando}
                        style={{ width:20, height:20, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:'0.7rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'color 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.color='#dc2626')}
                        onMouseLeave={e => (e.currentTarget.style.color='#cbd5e1')}>✕</button>
                    </div>

                    <div style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {!tieneNombre ? (
                        <p style={{ fontSize: '0.62rem', color: '#2563eb', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span>ℹ️</span> Asigna un nombre a tu rubro
                        </p>
                      ) : !tienePeso ? (
                        <p style={{ fontSize: '0.62rem', color: '#2563eb', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span>ℹ️</span> Añade un porcentaje a este trabajo
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.62rem', color: '#16a34a', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span>✓</span> Rubro cargado correctamente
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {parcialesToCopy.length > 0 && rubrosEditables.length === 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.45rem 0.75rem', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0', marginTop:'0.15rem' }}>
                  <span style={{ fontSize:'0.68rem', color:'#64748b', fontWeight:500, flex:1 }}>Copiar de:</span>
                  {parcialesToCopy.map(p => (
                    <button key={p.periodo} onClick={() => void copiarDeParcial(p.periodo)} disabled={copiando}
                      style={{ padding:'2px 6px', borderRadius:5, border:'1px solid #cbd5e1', background:'white', color:'#475569', fontSize:'0.66rem', fontWeight:600, cursor: copiando ? 'not-allowed' : 'pointer' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {mostrarAgregar && !guardando && (
                <button onClick={addTrabajo}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'0.45rem', borderRadius:10, border:'1px dashed #cbd5e1', background:'transparent', cursor:'pointer', color:'#64748b', fontSize:'0.74rem', fontWeight:600, marginTop:'0.15rem', transition:'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#94a3b8'; e.currentTarget.style.color='#1e3a5f' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.color='#64748b' }}>
                  + Agregar trabajo
                </button>
              )}

              {rubrosEditables.length > 0 && !guardando && (
                <button
                  onClick={() => setConfirmarBorrar(true)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'0.45rem', borderRadius:10, border:'1px solid #fecaca', background:'#fff1f1', cursor:'pointer', color:'#dc2626', fontSize:'0.74rem', fontWeight:600, marginTop:'0.15rem', transition:'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.borderColor='#fca5a5' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#fff1f1'; e.currentTarget.style.borderColor='#fecaca' }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Borrar todos los trabajos
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="rubros-footer" style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'0.5rem', flexShrink:0 }}>
          <button onClick={onClose} disabled={guardando} style={{ flex:1, padding:'0.55rem', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.78rem', fontWeight:600, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.6 : 1 }}>Cancelar</button>
          <button onClick={guardar} disabled={!pesoValido || guardando}
            style={{ flex:2, padding:'0.55rem', borderRadius:8, border:'none', background: !pesoValido ? '#e2e8f0' : '#1e3a5f', color: !pesoValido ? '#94a3b8' : 'white', fontSize:'0.78rem', fontWeight:600, cursor: !pesoValido || guardando ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'background 0.15s' }}>
            {guardando ? <><div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.4s linear infinite' }}/> Guardando...</> : 'Guardar trabajos'}
          </button>
        </div>

        {/* Modal de confirmación: borrar todos */}
        {confirmarBorrar && (
          <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.35)', backdropFilter:'blur(4px)', borderRadius:'1.25rem' }}>
            <div style={{ background:'white', borderRadius:'1rem', width:'calc(100% - 3rem)', maxWidth:340, padding:'1.25rem', boxShadow:'0 16px 40px rgba(0,0,0,0.15)', animation:'modalBorrarIn 0.2s cubic-bezier(0.34,1.3,0.64,1)' }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', textAlign:'center', margin:'0 0 0.35rem' }}>¿Borrar todos los trabajos?</h3>
              <p style={{ fontSize:'0.72rem', color:'#64748b', textAlign:'center', margin:'0 0 1rem', lineHeight:1.4 }}>
                Se eliminarán todos los trabajos de este parcial. El rubro de Asistencia se conservará.
              </p>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => setConfirmarBorrar(false)}
                  style={{ flex:1, padding:'0.5rem', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.76rem', fontWeight:600, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={borrarTodos}
                  style={{ flex:1, padding:'0.5rem', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:'0.76rem', fontWeight:600, cursor:'pointer' }}>
                  Sí, borrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  )
}