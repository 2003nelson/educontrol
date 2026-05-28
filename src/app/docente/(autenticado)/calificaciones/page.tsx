'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDocente } from '@/contexts/DocenteContext'
import CalificacionesView from '@/components/docente/calificaciones/CalificacionesView'
import RubrosModal from '@/components/docente/calificaciones/RubrosModal'
import type { ContextoCalificacion } from '@/components/docente/calificaciones/types'

type AsignaturaItem = { id: string; nombre: string }
type GrupoItem      = { id: string; numero: string; grado: number; asignaturas: AsignaturaItem[] }
type PeriodoKey     = '1' | '2' | '3'

const PERIODOS: { key: PeriodoKey; label: string; short: string }[] = [
  { key: '1', label: '1er Parcial', short: 'P1' },
  { key: '2', label: '2do Parcial', short: 'P2' },
  { key: '3', label: '3er Parcial', short: 'P3' },
]

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

type Vista =
  | { tipo: 'grupos' }
  | { tipo: 'asignaturas'; grupo: GrupoItem }
  | { tipo: 'parcial'; grupo: GrupoItem; asignatura: AsignaturaItem }
  | { tipo: 'notas'; ctx: ContextoCalificacion; grupo: GrupoItem }

// ── Card de grupo para calificaciones ────────────────────────────────────────
function GrupoCardCal({ grupo, idx, onNavegar }: {
  grupo: GrupoItem
  idx: number
  onNavegar: (v: { tipo: 'asignaturas'; grupo: GrupoItem }) => void
}) {
  const [asigAbiertas, setAsigAbiertas] = useState(false)

  return (
    <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'0 6px 20px rgba(107,114,128,0.25)', animation:`cardIn 0.4s ${idx*0.07}s both`, background:'white', transition:'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(107,114,128,0.35)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(107,114,128,0.25)' }}>

      {/* Parte color — clickeable → navega a asignaturas */}
      <div onClick={() => onNavegar({ tipo:'asignaturas', grupo })}
        className="cal-card-top"
        style={{ background:'linear-gradient(135deg,#6b7280 0%,#9ca3af 100%)', padding:'1.25rem 1.25rem 1.125rem', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-10, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', zIndex:1, position:'relative' }}>
          <div>
            <h3 style={{ fontSize:'2rem', fontWeight:800, color:'white', margin:0, lineHeight:1, fontFamily:'Outfit, "Plus Jakarta Sans", sans-serif', letterSpacing:'-0.02em' }}>
              Grupo {grupo.numero}
            </h3>
            <p style={{ fontSize:'0.65rem', fontWeight:500, color:'rgba(255,255,255,0.65)', margin:'0.375rem 0 0', letterSpacing:'0.04em' }}>
              {grupo.grado}° semestre
            </p>
          </div>
          <div style={{ width:52, height:52 }} />
        </div>
      </div>

      {/* Parte blanca */}
      <div style={{ background:'white', borderTop:'1px solid #f0f0f5' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem' }}>
          {/* Dots + toggle */}
          <button
            onClick={() => setAsigAbiertas(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
            <div style={{ display:'flex', gap:4 }}>
              {(['#ff5f57','#febc2e','#28c840'] as const).map((col, i) => (
                <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:col }} />
              ))}
            </div>
            <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: asigAbiertas ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.22s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
            <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>
              {grupo.asignaturas.length} {grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
            </span>
          </button>

          {/* Ir a asignaturas */}
          <button
            onClick={() => onNavegar({ tipo:'asignaturas', grupo })}
            style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', transition:'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity='0.65')}
            onMouseLeave={e => (e.currentTarget.style.opacity='1')}>
            <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#475569' }}>Ver asignaturas</span>
            <svg width="13" height="13" fill="none" stroke="#475569" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Desplegable de asignaturas */}
        {asigAbiertas && (
          <div style={{ borderTop:'1px solid #f0f0f5', padding:'0.5rem 1rem 0.75rem', display:'flex', flexDirection:'column', gap:'0.375rem', animation:'asigIn 0.2s ease' }}>
            <style>{`@keyframes asigIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
            {grupo.asignaturas.map(a => (
              <button key={a.id}
                onClick={() => onNavegar({ tipo:'asignaturas', grupo })}
                style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 0.625rem', borderRadius:10, background:'#f8fafc', border:'1px solid #f0f0f5', cursor:'pointer', textAlign:'left', width:'100%', transition:'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background='#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background='#f8fafc')}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'linear-gradient(135deg,#6b7280,#9ca3af)', flexShrink:0 }} />
                <span style={{ fontSize:'0.78rem', fontWeight:500, color:'#374151' }}>{a.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalificacionesPage() {
  const { docente, loading } = useDocente()
  const supabase = createClient()
  const [vista, setVista]         = useState<Vista>({ tipo: 'grupos' })
  const [docenteId, setDocenteId] = useState<string | null>(null)
  const [plantelId, setPlantelId] = useState<string | null>(null)
  const [modalCtx, setModalCtx]   = useState<ContextoCalificacion | null>(null)
  const [rubrosCount, setRubrosCount] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    void Promise.resolve(supabase.auth.getUser()).then(({ data: { user } }) => {
      if (!user) return
      return Promise.resolve(
        supabase.from('usuarios').select('id, plantel_id').eq('auth_id', user.id).single()
      ).then(({ data }) => { if (data) { setDocenteId(data.id); setPlantelId(data.plantel_id) } })
    })
  }, [supabase])

  const grupos: GrupoItem[] = docente
    ? Object.values(
        docente.asignaciones.reduce((acc: Record<string, GrupoItem>, a) => {
          if (!acc[a.grupo_id]) acc[a.grupo_id] = { id: a.grupo_id, numero: a.grupo_numero, grado: a.grupo_grado, asignaturas: [] }
          acc[a.grupo_id].asignaturas.push({ id: a.asignatura_id as string, nombre: a.asignatura_nombre as string })
          return acc
        }, {})
      )
    : []

  const fetchRubrosCount = useCallback(() => {
    if (!docenteId) return Promise.resolve(null)
    return Promise.resolve(
      supabase.from('calificacion_rubros')
        .select('grupo_id, asignatura_id, periodo')
        .eq('docente_id', docenteId)
    )
  }, [docenteId, supabase])

  useEffect(() => {
    if (!docenteId) return
    fetchRubrosCount().then(res => {
      if (!res) return
      const mapa = new Map<string, number>()
      for (const r of (res.data ?? [])) {
        const key = `${r.grupo_id}:${r.asignatura_id}:${r.periodo}`
        mapa.set(key, (mapa.get(key) ?? 0) + 1)
      }
      setRubrosCount(mapa)
    }).catch(console.error)
  }, [docenteId, fetchRubrosCount])

  const recargarRubrosCount = useCallback(() =>
    fetchRubrosCount().then(res => {
      if (!res) return
      const mapa = new Map<string, number>()
      for (const r of (res.data ?? [])) {
        const key = `${r.grupo_id}:${r.asignatura_id}:${r.periodo}`
        mapa.set(key, (mapa.get(key) ?? 0) + 1)
      }
      setRubrosCount(mapa)
    }).catch(console.error)
  , [fetchRubrosCount])

  function navegar(v: Vista) { window.scrollTo({ top: 0, behavior: 'smooth' }); setVista(v) }

  // Buscar grupo completo con asignaturas
  function getGrupoCompleto(grupoId: string): GrupoItem {
    return grupos.find(g => g.id === grupoId) ?? { id: grupoId, numero: '', grado: 0, asignaturas: [] }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTopColor:'#1e3a5f', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Vista notas — pasa el grupo COMPLETO al onBack
  if (vista.tipo === 'notas') return (
    <>
      <CalificacionesView
        ctx={vista.ctx}
        onBack={() => {
          const grupoCompleto = getGrupoCompleto(vista.ctx.grupo_id)
          navegar({ tipo: 'parcial', grupo: grupoCompleto, asignatura: { id: vista.ctx.asignatura_id, nombre: vista.ctx.asignatura_nombre } })
        }}
        onAbrirRubros={() => setModalCtx(vista.ctx)}
      />
      {modalCtx && docenteId && plantelId && (
        <RubrosModal ctx={modalCtx} docenteId={docenteId} plantelId={plantelId}
          onClose={() => setModalCtx(null)}
          onGuardado={() => { setModalCtx(null); void recargarRubrosCount() }} />
      )}
    </>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fa', padding:'1.25rem 0.875rem 2rem', fontFamily:'system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* ── Grupos ── */}
      {vista.tipo === 'grupos' && (
        <>
          <div style={{ marginBottom:'1.75rem' }}>
            <h1 style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a5f', margin:'0 0 0.25rem', fontFamily:'Outfit, sans-serif' }}>Calificaciones</h1>
            <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0, textTransform:'capitalize' }}>{formatFechaHoy()}</p>
          </div>

          {grupos.length === 0 ? (
            <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.875rem', padding:'4rem 0' }}>Sin grupos asignados</p>
          ) : (
            <div className="cal-grupos-grid" style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.125rem' }}>
              <style>{`
                @media(min-width:640px){ .cal-grupos-grid { grid-template-columns: repeat(2,1fr) !important; gap: 1.375rem !important; } }
                @media(min-width:1024px){ .cal-grupos-grid { grid-template-columns: repeat(3,1fr) !important; gap: 1.5rem !important; } }
                .cal-card-top { min-height: 120px; }
                @media(min-width:640px){ .cal-card-top { min-height: 140px; } }
              `}</style>
              {grupos.map((g, idx) => (
                <GrupoCardCal key={g.id} grupo={g} idx={idx} onNavegar={navegar} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Asignaturas ── */}
      {vista.tipo === 'asignaturas' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <button onClick={() => navegar({ tipo:'grupos' })} style={{ width:34, height:34, borderRadius:9, background:'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>Grupo {vista.grupo.numero}</h1>
              <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>{vista.grupo.grado}° Semestre · Selecciona la asignatura</p>
            </div>
          </div>

          <div className="cal-asig-grid" style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            <style>{`
              @media(min-width:640px){ .cal-asig-grid { display:grid !important; grid-template-columns:repeat(2,1fr); gap:0.875rem; } }
              @media(min-width:1024px){ .cal-asig-grid { grid-template-columns:repeat(4,1fr); gap:1rem; } }
              .cal-asig-pc { display:none; }
              .cal-asig-mob { display:flex; }
              @media(min-width:640px){ .cal-asig-pc { display:flex !important; flex-direction:column; align-items:center; } .cal-asig-mob { display:none !important; } }
            `}</style>
            {vista.grupo.asignaturas.map((asig) => (
              <button key={asig.id} onClick={() => navegar({ tipo:'parcial', grupo:vista.grupo, asignatura:asig })}
                style={{ background:'white', border:'1px solid #e5e5ea', borderRadius:14, cursor:'pointer', transition:'all 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', textAlign:'left', width:'100%', display:'flex', flexDirection:'column' }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.boxShadow='0 6px 20px rgba(59,130,246,0.10)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor='#e5e5ea'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform='translateY(0)' }}>
                {/* Desktop */}
                <div className="cal-asig-pc" style={{ padding:'1.75rem 1rem 0', gap:'0.75rem', width:'100%' }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'1.5rem', lineHeight:1 }}>📒</span>
                  </div>
                  <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#1e3a5f', lineHeight:1.4, textAlign:'center', padding:'0 0.5rem' }}>{asig.nombre}</span>
                </div>
                {/* Móvil */}
                <div className="cal-asig-mob" style={{ padding:'0.875rem 1rem 0', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', width:'100%' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:40, height:40, borderRadius:11, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'1.2rem', lineHeight:1 }}>📒</span>
                    </div>
                    <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#1e3a5f' }}>{asig.nombre}</span>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="#c7c7cc" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
                {/* Footer */}
                <div style={{ width:'100%', borderTop:'1px solid #f0f0f5', marginTop:'0.875rem', padding:'0.5rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b' }}>3 parciales</span>
                  <span style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:500 }}>
                    {new Date().toLocaleDateString('es-MX', { weekday:'short', day:'numeric', month:'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Parciales ── */}
      {vista.tipo === 'parcial' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <button onClick={() => navegar({ tipo:'asignaturas', grupo:vista.grupo })} style={{ width:34, height:34, borderRadius:9, background:'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vista.asignatura.nombre}</h1>
              <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>Grupo {vista.grupo.numero} · Elige el parcial</p>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            {PERIODOS.map((p, idx) => {
              const key = `${vista.grupo.id}:${vista.asignatura.id}:${p.key}`
              const count = rubrosCount.get(key) ?? 0
              const ctx: ContextoCalificacion = {
                grupo_id: vista.grupo.id, grupo_numero: vista.grupo.numero, grupo_grado: vista.grupo.grado,
                asignatura_id: vista.asignatura.id, asignatura_nombre: vista.asignatura.nombre,
                periodo: p.key,
              }
              return (
                <div key={p.key} style={{ background:'white', borderRadius:16, border:'1px solid #e8eaf0', overflow:'hidden', animation:`cardIn 0.35s ${idx*0.07}s both`, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                  <button onClick={() => navegar({ tipo:'notas', ctx, grupo:vista.grupo })}
                    style={{ width:'100%', display:'flex', alignItems:'center', padding:'1rem 1.25rem', background:'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                    <div style={{ width:46, height:46, borderRadius:13, background: count > 0 ? 'linear-gradient(135deg,#1e3a5f,#2d5a8e)' : '#f4f5f7', border:`1.5px solid ${count > 0 ? 'transparent' : '#e2e8f0'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:'1rem' }}>
                      <span style={{ fontSize:'0.82rem', fontWeight:800, color: count > 0 ? 'white' : '#94a3b8', fontFamily:'Outfit, sans-serif' }}>{p.short}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#1e3a5f', margin:'0 0 2px' }}>{p.label}</p>
                      <p style={{ fontSize:'0.7rem', margin:0, color: count > 0 ? '#16a34a' : '#94a3b8', fontWeight:500 }}>
                        {count > 0 ? `${count} ${count === 1 ? 'trabajo' : 'trabajos'} · Listo para capturar` : 'Sin trabajos — configura primero'}
                      </p>
                    </div>
                    {count > 0 && (
                      <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'3px 10px', borderRadius:9999, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', flexShrink:0, marginRight:'0.5rem' }}>Activo</span>
                    )}
                    <svg width="14" height="14" fill="none" stroke="#c7c7cc" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <div style={{ borderTop:'1px solid #f4f5f7', padding:'0.5rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <button onClick={() => setModalCtx(ctx)}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'#2563eb', fontSize:'0.72rem', fontWeight:600, padding:'3px 0' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                      {count > 0 ? 'Editar trabajos' : 'Configurar trabajos'}
                    </button>
                    {count > 0 && (
                      <button onClick={() => navegar({ tipo:'notas', ctx, grupo:vista.grupo })}
                        style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#1e3a5f', fontSize:'0.72rem', fontWeight:600, padding:'3px 0' }}>
                        Capturar notas
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal rubros */}
      {modalCtx && docenteId && plantelId && (
        <RubrosModal ctx={modalCtx} docenteId={docenteId} plantelId={plantelId}
          onClose={() => setModalCtx(null)}
          onGuardado={() => { setModalCtx(null); void recargarRubrosCount() }} />
      )}
    </div>
  )
}