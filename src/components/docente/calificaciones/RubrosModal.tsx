// src/components/docente/calificaciones/RubrosModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Trabajo, ContextoCalificacion } from './types'

export default function RubrosModal({ ctx, docenteId, plantelId, onClose, onGuardado }: {
  ctx: ContextoCalificacion
  docenteId: string
  plantelId: string
  onClose: () => void
  onGuardado: () => void
}) {
  const supabase = createClient()
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [loading, setLoading]   = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    void Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('id, nombre, peso, orden')
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo)
        .eq('docente_id', docenteId)
        .order('orden')
    ).then(({ data }) => {
      setTrabajos((data ?? []) as Trabajo[])
      setLoading(false)
    })
  }, [supabase, ctx, docenteId])

  const sumaPesos = trabajos.reduce((s, t) => s + (Number(t.peso) || 0), 0)
  const pesoValido = Math.abs(sumaPesos - 100) < 0.01

  function addTrabajo() {
    setTrabajos(prev => [...prev, { id: `new-${Date.now()}`, nombre: '', peso: 0, orden: prev.length }])
  }
  function update(idx: number, campo: keyof Trabajo, valor: string | number) {
    setTrabajos(prev => prev.map((t, i) => i === idx ? { ...t, [campo]: valor } : t))
  }
  function remove(idx: number) {
    setTrabajos(prev => prev.filter((_, i) => i !== idx))
  }

  async function guardar() {
    if (!pesoValido || guardando) return
    setGuardando(true)

    const existentes = trabajos.filter(t => !t.id.startsWith('new-') && t.nombre.trim())
    const nuevos     = trabajos.filter(t => t.id.startsWith('new-') && t.nombre.trim())

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
        }))
      )
    }
    setGuardando(false)
    onGuardado()
    onClose()
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'100%', maxWidth:480, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'cardIn 0.35s cubic-bezier(0.34,1.4,0.64,1)' }}>
        <style>{`@keyframes cardIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Header */}
        <div style={{ padding:'1.25rem 1.375rem 1rem', borderBottom:'1px solid #f0f0f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Trabajos del parcial</h2>
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'2px 0 0' }}>{ctx.asignatura_nombre} · {['1er','2do','3er'][parseInt(ctx.periodo)-1]} Parcial</p>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'#f4f4f8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontWeight:700 }}>✕</button>
        </div>

        {/* Barra de pesos */}
        <div style={{ padding:'0.625rem 1.375rem', background: pesoValido ? '#f0fdf4' : sumaPesos > 100 ? '#fef2f2' : '#fffbeb', borderBottom:'1px solid #f0f0f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:'1rem' }}>
          <span style={{ fontSize:'0.75rem', fontWeight:600, color: pesoValido ? '#15803d' : sumaPesos > 100 ? '#dc2626' : '#92400e' }}>
            {pesoValido ? '✓ Suma 100%' : `Suma ${sumaPesos}% — debe ser 100%`}
          </span>
          <div style={{ flex:1, height:6, borderRadius:9999, background:'#e2e8f0', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(sumaPesos,100)}%`, background: pesoValido ? '#16a34a' : sumaPesos > 100 ? '#dc2626' : '#f59e0b', borderRadius:9999, transition:'width 0.3s' }}/>
          </div>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#64748b', flexShrink:0 }}>{sumaPesos}%</span>
        </div>

        {/* Lista trabajos */}
        <div style={{ flex:1, overflowY:'auto', padding:'1rem 1.375rem' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
              <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {trabajos.map((t, i) => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.875rem', borderRadius:10, background:'#f8fafc', border:'1px solid #e8eaf0' }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', width:18, flexShrink:0 }}>{i+1}</span>
                  <input
                    value={t.nombre}
                    onChange={e => update(i, 'nombre', e.target.value)}
                    placeholder="Nombre del trabajo (ej. Examen parcial)"
                    style={{ flex:1, border:'none', background:'transparent', fontSize:'0.82rem', color:'#1e3a5f', outline:'none', fontWeight:500 }}
                  />
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                    <input
                      type="number" min="0" max="100" step="5"
                      value={t.peso}
                      onChange={e => update(i, 'peso', parseFloat(e.target.value) || 0)}
                      style={{ width:52, textAlign:'center', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:'0.82rem', fontWeight:700, color:'#1e3a5f', padding:'4px 6px', outline:'none' }}
                    />
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>%</span>
                  </div>
                  <button onClick={() => remove(i)} style={{ width:22, height:22, borderRadius:'50%', background:'rgba(220,38,38,0.08)', border:'none', cursor:'pointer', color:'#dc2626', fontSize:'0.7rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                </div>
              ))}

              <button onClick={addTrabajo} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0.625rem', borderRadius:10, border:'1.5px dashed #e2e8f0', background:'transparent', cursor:'pointer', color:'#94a3b8', fontSize:'0.8rem', fontWeight:600, marginTop:'0.25rem' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Agregar trabajo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'0.875rem 1.375rem', borderTop:'1px solid #f0f0f5', display:'flex', gap:'0.625rem', flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'0.7rem', borderRadius:10, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:'0.85rem', fontWeight:600, cursor:'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={!pesoValido || guardando} style={{ flex:2, padding:'0.7rem', borderRadius:10, border:'none', background: !pesoValido ? '#e2e8f0' : 'linear-gradient(135deg,#1e40af,#2563eb)', color: !pesoValido ? '#94a3b8' : 'white', fontSize:'0.85rem', fontWeight:700, cursor: !pesoValido || guardando ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {guardando ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Guardando...</> : 'Guardar trabajos'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}