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
  const [loading, setLoading]           = useState(true)
  const [guardando, setGuardando]       = useState(false)
  const [parcialesToCopy, setParcialesToCopy] = useState<{ periodo: string; label: string; count: number }[]>([])
  const [copiando, setCopiando]         = useState(false)
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
      // Al copiar mantenemos el rubro de asistencia actual y copiamos el resto
      setTrabajos(prev => {
        const asistencia = prev.find(t => t.es_asistencia)
        const copiados = data
          .filter(t => !t.es_asistencia && t.nombre.toLowerCase() !== 'asistencia')
          .map((t, i) => ({ id: `new-${Date.now()}-${i}`, nombre: t.nombre, peso: t.peso, orden: i + 1 }))
        // Actualizar solo el peso de asistencia si la copia lo trae
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
    // El nombre del rubro de asistencia no se puede editar
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

  // Solo se pueden eliminar rubros que NO son asistencia
  function remove(idx: number) {
    if (trabajos[idx]?.es_asistencia) return
    setTrabajos(prev => prev.filter((_, i) => i !== idx))
  }

  function borrarTodos() {
    // Mantener solo el rubro de asistencia, borrar todos los demás
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

    setGuardando(false)
    onGuardado()
    onClose()
  }

  if (typeof window === 'undefined') return null

  // Rubros sin contar Asistencia para el check de "agregar trabajo"
  const rubrosEditables = trabajos.filter(t => !t.es_asistencia)
  const ultimoEditable = rubrosEditables[rubrosEditables.length - 1]
  const mostrarAgregar = !ultimoEditable || (ultimoEditable.nombre.trim() !== '' && Number(ultimoEditable.peso) > 0)

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'1rem' }}>
      <div onClick={e => e.stopPropagation()} className="rubros-modal-inner" style={{ background:'white', borderRadius:'1.375rem', width:'100%', maxWidth:680, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 28px 72px rgba(0,0,0,0.20)', animation:'cardIn 0.32s cubic-bezier(0.34,1.4,0.64,1)', position:'relative' }}>
        <style>{`
          @keyframes cardIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes modalBorrarIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
          .rubro-row:hover { background: #f8fafc !important; }
          .rubro-asistencia:hover { background: #e8f0fe !important; }
          .peso-btn { transition: background 0.12s, border-color 0.12s, opacity 0.12s; }
          .peso-btn:disabled { opacity: 0.3; cursor: default !important; }
          .btn-menos:not(:disabled):hover { background: #ffedd5 !important; border-color: #fb923c !important; }
          .btn-mas:not(:disabled):hover { background: #dcfce7 !important; border-color: #4ade80 !important; }
          @media (max-width: 600px) {
            .rubros-modal-inner { max-width: 100% !important; border-radius: 1rem 1rem 0 0 !important; max-height: 96vh !important; }
            .rubros-footer { flex-direction: column !important; }
            .rubros-footer button { flex: unset !important; width: 100% !important; }
            .rubro-asistencia { flex-wrap: wrap !important; }
            .asistencia-spinner { margin-left: auto !important; }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding:'1.375rem 1.625rem 1rem', borderBottom:'1px solid #f0f0f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:'1.0625rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Trabajos del parcial</h2>
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'3px 0 0', textTransform:'uppercase', letterSpacing:'0.04em' }}>{ctx.asignatura_nombre} · {['1er','2do','3er'][parseInt(ctx.periodo)-1]} Parcial</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {/* Borrar todos los rubros editables */}
            {rubrosEditables.length > 0 && (
              <button
                onClick={() => setConfirmarBorrar(true)}
                title="Borrar todos los trabajos"
                style={{ display:'flex', alignItems:'center', gap:5, padding:'0.375rem 0.75rem', borderRadius:8, border:'1px solid #fecaca', background:'#fff1f1', color:'#dc2626', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', transition:'background 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.borderColor='#fca5a5' }}
                onMouseLeave={e => { e.currentTarget.style.background='#fff1f1'; e.currentTarget.style.borderColor='#fecaca' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Borrar todos
              </button>
            )}
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'#f4f4f8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontWeight:700, fontSize:'1rem' }}>✕</button>
          </div>
        </div>

        {/* Barra de pesos */}
        <div style={{ padding:'0.625rem 1.625rem', background: pesoValido ? '#f0fdf4' : sumaPesos > 100 ? '#fef2f2' : '#fffbeb', borderBottom:'1px solid #f0f0f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:'1rem' }}>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color: pesoValido ? '#15803d' : sumaPesos > 100 ? '#dc2626' : '#92400e', flexShrink:0 }}>
            {pesoValido ? '✓ Suma 100%' : `Suma ${sumaPesos}% — debe ser 100%`}
          </span>
          <div style={{ flex:1, height:7, borderRadius:9999, background:'#e2e8f0', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(sumaPesos,100)}%`, background: pesoValido ? '#16a34a' : sumaPesos > 100 ? '#dc2626' : '#f59e0b', borderRadius:9999, transition:'width 0.3s' }}/>
          </div>
          <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#64748b', flexShrink:0, minWidth:38, textAlign:'right' }}>{sumaPesos}%</span>
        </div>

        {/* Lista de trabajos */}
        <div style={{ flex:1, overflowY:'auto', padding:'0.875rem 1.625rem' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
              <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>

              {trabajos.map((t, i) => {
                const pesoNum = Number(t.peso) || 0
                const otrosPesos = trabajos.reduce((s, tj, j) => j === i ? s : s + (Number(tj.peso) || 0), 0)
                const puedeSubir = pesoNum < 100 - otrosPesos && sumaPesos < 100
                const puedeBajar = pesoNum > 0
                const esAsistencia = !!t.es_asistencia

                return esAsistencia ? (
                  /* ── Rubro fijo: Asistencia ── */
                  <div key={t.id} className="rubro-asistencia" style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1rem', borderRadius:12, background:'#eff6ff', border:'1.5px solid #bfdbfe', transition:'background 0.12s' }}>
                    {/* Ícono asistencia */}
                    <div style={{ width:38, height:38, borderRadius:10, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>

                    {/* Nombre fijo + subtítulo */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e40af', margin:0 }}>Asistencia</p>
                        <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#2563eb', background:'#dbeafe', borderRadius:5, padding:'1px 6px', letterSpacing:'0.04em' }}>DEFAULT</span>
                      </div>
                      <p style={{ fontSize:'0.68rem', color:'#3b82f6', margin:'2px 0 0', fontWeight:500, lineHeight:1.4 }}>
                        Calculada automáticamente desde el módulo de asistencia · solo ajusta el porcentaje que vale
                      </p>
                    </div>

                    {/* Spinner de porcentaje */}
                    <div className="asistencia-spinner" style={{ display:'flex', alignItems:'center', gap:'0.25rem', flexShrink:0 }}>
                      {/* Botón − naranja */}
                      <button className="peso-btn btn-menos" disabled={!puedeBajar} onClick={() => cambiarPeso(i, -5)}
                        style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #fed7aa', background:'#fff7ed', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ea580c' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
                      </button>
                      {/* Valor */}
                      <div style={{ width:52, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'1.5px solid #bfdbfe', background:'white' }}>
                        <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#1d4ed8' }}>{pesoNum}</span>
                        <span style={{ fontSize:'0.65rem', color:'#3b82f6', marginLeft:1 }}>%</span>
                      </div>
                      {/* Botón + verde */}
                      <button className="peso-btn btn-mas" disabled={!puedeSubir} onClick={() => cambiarPeso(i, 5)}
                        style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>

                    {/* Placeholder alineado con botón eliminar de los demás */}
                    <div style={{ width:26, flexShrink:0 }} />
                  </div>
                ) : (
                  /* ── Rubro normal editable ── */
                  <div key={t.id} className="rubro-row" style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', borderRadius:11, background:'#f8fafc', border:'1px solid #e8eaf0', transition:'background 0.12s' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', width:20, flexShrink:0, textAlign:'center' }}>{i}</span>

                    <input
                      value={t.nombre}
                      onChange={e => update(i, 'nombre', e.target.value)}
                      placeholder="Nombre del trabajo"
                      style={{ flex:1, border:'none', background:'transparent', fontSize:'0.85rem', color:'#1e3a5f', outline:'none', fontWeight:500, minWidth:0 }}
                    />

                    {/* Spinner de porcentaje */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', flexShrink:0 }}>
                      {/* Botón − naranja */}
                      <button className="peso-btn btn-menos" disabled={!puedeBajar} onClick={() => cambiarPeso(i, -5)}
                        style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #fed7aa', background:'#fff7ed', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ea580c' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
                      </button>
                      <div style={{ width:52, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white' }}>
                        <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#1e3a5f' }}>{pesoNum}</span>
                        <span style={{ fontSize:'0.65rem', color:'#94a3b8', marginLeft:1 }}>%</span>
                      </div>
                      {/* Botón + verde */}
                      <button className="peso-btn btn-mas" disabled={!puedeSubir} onClick={() => cambiarPeso(i, 5)}
                        style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>

                    <button onClick={() => remove(i)}
                      style={{ width:26, height:26, borderRadius:'50%', background:'rgba(220,38,38,0.07)', border:'none', cursor:'pointer', color:'#dc2626', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background='rgba(220,38,38,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background='rgba(220,38,38,0.07)')}>✕</button>
                  </div>
                )
              })}

              {/* Copiar de otro parcial — solo si no hay rubros editables aún */}
              {parcialesToCopy.length > 0 && rubrosEditables.length === 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.875rem', borderRadius:11, background:'#f0f4fa', border:'1px solid #dde3ea', marginBottom:'0.25rem' }}>
                  <svg width="13" height="13" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span style={{ fontSize:'0.75rem', color:'#1e3a5f', fontWeight:500, flex:1 }}>Copiar trabajos de:</span>
                  {parcialesToCopy.map(p => (
                    <button key={p.periodo} onClick={() => void copiarDeParcial(p.periodo)} disabled={copiando}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, border:'1px solid #bfdbfe', background:'white', color:'#2563eb', fontSize:'0.72rem', fontWeight:600, cursor: copiando ? 'not-allowed' : 'pointer', opacity: copiando ? 0.6 : 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                      </svg>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Agregar trabajo */}
              {mostrarAgregar && (
                <button onClick={addTrabajo}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0.625rem', borderRadius:11, border:'1.5px dashed #e2e8f0', background:'transparent', cursor:'pointer', color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, marginTop:'0.25rem', transition:'border-color 0.12s, color 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.color='#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#94a3b8' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  Agregar trabajo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rubros-footer" style={{ padding:'1rem 1.625rem', borderTop:'1px solid #f0f0f5', display:'flex', gap:'0.625rem', flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'0.75rem', borderRadius:10, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.875rem', fontWeight:600, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!pesoValido || guardando}
            style={{ flex:2, padding:'0.75rem', borderRadius:10, border:'none', background: !pesoValido ? '#e2e8f0' : 'linear-gradient(135deg,#1e40af,#2563eb)', color: !pesoValido ? '#94a3b8' : 'white', fontSize:'0.875rem', fontWeight:700, cursor: !pesoValido || guardando ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.2s' }}>
            {guardando ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Guardando...</> : 'Guardar trabajos'}
          </button>
        </div>

        {/* Modal de confirmación: borrar todos */}
        {confirmarBorrar && (
          <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.35)', backdropFilter:'blur(4px)', borderRadius:'1.375rem' }}>
            <div style={{ background:'white', borderRadius:'1.125rem', width:'calc(100% - 3rem)', maxWidth:360, padding:'1.75rem', boxShadow:'0 16px 48px rgba(0,0,0,0.18)', animation:'modalBorrarIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}>
              {/* Ícono */}
              <div style={{ width:48, height:48, borderRadius:14, background:'#fff1f1', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', textAlign:'center', margin:'0 0 0.5rem' }}>¿Borrar todos los trabajos?</h3>
              <p style={{ fontSize:'0.8rem', color:'#64748b', textAlign:'center', margin:'0 0 1.375rem', lineHeight:1.55 }}>
                Se eliminarán <strong>{rubrosEditables.length} {rubrosEditables.length === 1 ? 'trabajo' : 'trabajos'}</strong> de este parcial. El rubro de Asistencia se conserva. Esta acción no se puede deshacer.
              </p>
              <div style={{ display:'flex', gap:'0.625rem' }}>
                <button onClick={() => setConfirmarBorrar(false)}
                  style={{ flex:1, padding:'0.7rem', borderRadius:10, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.875rem', fontWeight:600, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={borrarTodos}
                  style={{ flex:1, padding:'0.7rem', borderRadius:10, border:'none', background:'#dc2626', color:'white', fontSize:'0.875rem', fontWeight:700, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#b91c1c')}
                  onMouseLeave={e => (e.currentTarget.style.background='#dc2626')}>
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