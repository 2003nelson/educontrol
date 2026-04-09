'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

type TipoFiltro  = 'parcial' | 'grupo' | 'semana' | 'asig' | null

const SEMANAS = Array.from({ length: 16 }, (_, i) => ({ key: `semana-${i+1}`, label: `Semana ${i + 1}` }))
const GRUPOS  = [
  '101','102','103','201','202','203',
  '301','302','303','401','402','403',
  '501','502','503','601','602','603',
].map(g => ({ key: g, label: `Grupo ${g}` }))

const OPCION_GENERAL = { key: 'general', label: 'Quitar selección' }

// ─── Botón descargar expandible ───────────────────────────────────────────────
function DescargaBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    enterTimer.current = setTimeout(() => setHov(true), 120)
  }
  function handleLeave() {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setHov(false), 200)
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: hov ? '0.5rem' : '0',
        height: '34px',
        width: hov ? 'auto' : '34px',
        minWidth: hov ? '160px' : '34px',
        padding: hov ? '0 1rem' : '0',
        borderRadius: hov ? '0.75rem' : '50%',
        background: 'transparent',
        border: '1.5px solid #2563eb',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden', whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
      {/* Ícono flecha descargar */}
      <svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {hov && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>Descargar informe</span>}
    </button>
  )
}

// ─── Spring Dropdown con animación de cierre ─────────────────────────────────
function SpringDropdown({ opciones, seleccionado, onSeleccionar, onCerrar, forceCerrando = false }: {
  opciones: { key: string; label: string }[]
  seleccionado: string
  onSeleccionar: (key: string) => void
  onCerrar: () => void
  forceCerrando?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [cerrando, setCerrando] = useState(false)

  const efectivamenteCerrando = cerrando || forceCerrando

  function cerrar() {
    setCerrando(true)
    setTimeout(() => onCerrar(), 280)
  }

  useEffect(() => {
    function cerrarExterno() {
      setCerrando(true)
      setTimeout(() => onCerrar(), 280)
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrarExterno()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onCerrar])

  return (
    <>
      <style>{`
        @keyframes springDropIn  { from { opacity:0; transform:scale(0.94) translateY(-8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes springDropOut { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.94) translateY(-8px) } }
      `}</style>
      <div ref={ref}
        style={{
          position:'absolute', right:0, bottom:'calc(100% + 8px)',
          background:'white', borderRadius:'1rem',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border:'1px solid #f1f5f9',
          minWidth:'200px', maxHeight:'280px', overflowY:'auto', zIndex:50,
          animation: efectivamenteCerrando
            ? 'springDropOut 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards'
            : 'springDropIn 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
        {[OPCION_GENERAL, ...opciones].map(op => {
          const activo = seleccionado === op.key
          return (
            <button key={op.key}
              onClick={() => { onSeleccionar(op.key); cerrar() }}
              style={{
                width:'100%', textAlign:'left', padding:'0.625rem 1rem',
                fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.5rem',
                background: activo ? '#eff6ff' : 'white',
                color:      activo ? '#2563eb' : '#475569',
                fontWeight: activo ? 600 : 400,
                border:'none', borderBottom:'1px solid #f8fafc', cursor:'pointer',
                transition:'background 0.1s',
              }}
              onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'white' }}>
              {activo
                ? <svg width="11" height="11" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <span style={{ width:'11px', display:'inline-block' }}/>
              }
              {op.label}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ─── Modal Descargar Informe ──────────────────────────────────────────────────
function ModalInforme({ onCerrar }: { onCerrar: () => void }) {
  const [grupo,      setGrupo]      = useState('')
  const [parcial,    setParcial]    = useState('')
  const [alcance,    setAlcance]    = useState<'general'|'asignatura'>('general')
  const [asignatura, setAsignatura] = useState('')
  const [cerrando,   setCerrando]   = useState(false)

  function handleCerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }

  const listo = grupo && parcial && (alcance === 'general' || asignatura)

  if (typeof window === 'undefined') return null

  const ASIGS = ['Matemáticas','Español','Historia','Física','Química','Inglés','Biología','Informática','Cálculo','Literatura','Administración','Geografía','Ed. Física','Contabilidad']

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation: cerrando ? 'informeBackdropOut 0.38s ease forwards' : 'informeBackdrop 0.25s ease' }}>
      <style>{`
        @keyframes informeBackdrop    { from{opacity:0} to{opacity:1} }
        @keyframes informeBackdropOut { from{opacity:1} to{opacity:0} }
        @keyframes informeSpring    { from{opacity:0;transform:scale(0.93) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes informeSpringOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.93) translateY(10px)} }
        @keyframes asigIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', animation: cerrando ? 'informeSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'informeSpring 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Descargar informe</h2>
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.1rem 0 0' }}>Grupo · Período · Alcance</p>
          </div>
          <button onClick={handleCerrar} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.8rem' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
        </div>

        <div style={{ padding:'1rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>

          {/* Grupo + Período en fila */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
            <div>
              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Grupo</label>
              <select value={grupo} onChange={e => setGrupo(e.target.value)}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.45rem 0.75rem', fontSize:'0.8rem', color: grupo ? '#1e3a5f' : '#94a3b8', outline:'none', background:'white', boxSizing:'border-box' }}
                onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}>
                <option value="">Selecciona</option>
                {GRUPOS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Período</label>
              <select value={parcial} onChange={e => setParcial(e.target.value)}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.45rem 0.75rem', fontSize:'0.8rem', color: parcial ? '#1e3a5f' : '#94a3b8', outline:'none', background:'white', boxSizing:'border-box' }}
                onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}>
                <option value="">Selecciona</option>
                <option value="1">1er Parcial</option>
                <option value="2">2do Parcial</option>
                <option value="3">3er Parcial</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          {/* Alcance */}
          <div>
            <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Alcance</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.375rem' }}>
              {[{key:'general',label:'General',desc:'Todo el grupo'},{key:'asignatura',label:'Por asignatura',desc:'Una materia'}].map(op=>(
                <button key={op.key} onClick={()=>{ setAlcance(op.key as typeof alcance); setAsignatura('') }}
                  style={{ padding:'0.5rem 0.75rem', borderRadius:'0.625rem', textAlign:'left', border: alcance===op.key ? '1.5px solid #2563eb' : '1px solid #e2e8f0', background: alcance===op.key ? '#eff6ff' : 'white', cursor:'pointer', transition:'all 0.15s' }}>
                  <p style={{ fontSize:'0.775rem', fontWeight:700, color: alcance===op.key ? '#2563eb' : '#1e3a5f', margin:'0 0 0.1rem' }}>{op.label}</p>
                  <p style={{ fontSize:'0.68rem', color:'#94a3b8', margin:0 }}>{op.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Asignaturas pills */}
          {alcance === 'asignatura' && (
            <div style={{ animation:'asigIn 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Asignatura</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
                {ASIGS.map(a=>(
                  <button key={a} onClick={()=>setAsignatura(a)}
                    style={{ padding:'0.2rem 0.6rem', borderRadius:'9999px', fontSize:'0.72rem', fontWeight: asignatura===a ? 700 : 400, border: asignatura===a ? '1.5px solid #2563eb' : '1px solid #e2e8f0', background: asignatura===a ? '#eff6ff' : 'white', color: asignatura===a ? '#2563eb' : '#475569', cursor:'pointer', transition:'all 0.12s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resumen siempre visible */}
          <div style={{ background:'#f8fafc', borderRadius:'0.75rem', padding:'0.625rem 0.875rem', border:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>Resumen</p>
            <p style={{ fontSize:'0.775rem', color:'#475569', margin:'0 0 0.15rem' }}><span style={{ fontWeight:600, color:'#1e3a5f' }}>Grupo: </span>{grupo || <span style={{ color:'#cbd5e1' }}>—</span>}</p>
            <p style={{ fontSize:'0.775rem', color:'#475569', margin:'0 0 0.15rem' }}><span style={{ fontWeight:600, color:'#1e3a5f' }}>Período: </span>{parcial ? (parcial==='final'?'Final':`${parcial}° Parcial`) : <span style={{ color:'#cbd5e1' }}>—</span>}</p>
            <p style={{ fontSize:'0.775rem', color:'#475569', margin:0 }}><span style={{ fontWeight:600, color:'#1e3a5f' }}>Alcance: </span>{alcance==='general' ? 'Todo el grupo' : (asignatura || <span style={{ color:'#cbd5e1' }}>—</span>)}</p>
          </div>

          {/* Botones */}
          <div style={{ display:'flex', gap:'0.625rem' }}>
            <button onClick={handleCerrar}
              style={{ flex:1, padding:'0.6rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
              Cancelar
            </button>
            <button disabled={!listo}
              style={{ flex:1, padding:'0.6rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: listo ? '#1e3a5f' : '#e2e8f0', color: listo ? 'white' : '#94a3b8', cursor: listo ? 'pointer' : 'not-allowed', transition:'background 0.15s' }}
              onMouseEnter={e=>{ if(listo) e.currentTarget.style.background='#2563eb' }} onMouseLeave={e=>{ if(listo) e.currentTarget.style.background='#1e3a5f' }}>
              {listo ? '↓ Descargar' : 'Completa los campos'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function DashboardPage() {
  const [vistaGrafica, setVistaGrafica]   = useState<'calificaciones' | 'asistencias'>('calificaciones')
  const [filtroAbierto, setFiltroAbierto] = useState<TipoFiltro>(null)
  const [filtroSaliendo, setFiltroSaliendo] = useState<TipoFiltro>(null)
  const [grupoSelec, setGrupoSelec]       = useState('general')
  const [parcialSelec, setParcialSelec]   = useState('general')
  const [semanaSelec, setSemanaSelec]     = useState('general')
  const [asigSelecCalif, setAsigSelecCalif] = useState<string|null>(null)
  const [refreshing, setRefreshing]         = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 900)
  }
  const [modalInforme, setModalInforme]   = useState(false)

  function toggleFiltro(tipo: TipoFiltro) {
    if (filtroAbierto === tipo) {
      setFiltroSaliendo(tipo)
      setTimeout(() => { setFiltroAbierto(null); setFiltroSaliendo(null) }, 280)
    } else {
      setFiltroSaliendo(null)
      setFiltroAbierto(tipo)
    }
  }

  const PARCIALES = [
    { key: '1',       label: 'Parcial 1' },
    { key: '2',       label: 'Parcial 2' },
    { key: 'semestre', label: 'Semestre'  },
  ]

  function labelGrupo()   { return grupoSelec  === 'general' ? 'Grupo'   : `Grupo ${grupoSelec}` }
  function labelParcial() { return parcialSelec === 'general' ? 'Parcial' : PARCIALES.find(p => p.key === parcialSelec)?.label ?? 'Parcial' }
  function labelSemana()  { return semanaSelec  === 'general' ? 'Semana'  : SEMANAS.find(s => s.key === semanaSelec)?.label ?? 'Semana' }

  function subtitulo() {
    const partes: string[] = []
    if (grupoSelec !== 'general') partes.push(`Grupo ${grupoSelec}`)
    else partes.push('Institución Completa')
    if (vistaGrafica === 'calificaciones' && parcialSelec !== 'general')
      partes.push(PARCIALES.find(p => p.key === parcialSelec)?.label ?? '')
    if (vistaGrafica === 'asistencias' && semanaSelec !== 'general')
      partes.push(SEMANAS.find(s => s.key === semanaSelec)?.label ?? '')
    return partes.filter(Boolean).join(' — ')
  }

  function cambiarVista(v: 'calificaciones' | 'asistencias') {
    setVistaGrafica(v)
    setFiltroAbierto(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Centro Estadístico" />

      <style>{`
        @keyframes dashPageIn {
          from { opacity:0; transform:translateX(18px) scale(0.985); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
      `}</style>
      <div className="flex gap-4 px-4 pb-4 pt-3" style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden', animation:'dashPageIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Panel principal */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col" style={{ minHeight: 0, overflowY: 'auto', border: '2px solid #bfdbfe' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {vistaGrafica === 'calificaciones' ? 'Promedio General' : 'Asistencia General'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{subtitulo()}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Asistencias / Calificaciones — Apple slide */}
              <div style={{ position:'relative', display:'flex', background:'rgba(148,163,184,0.15)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', borderRadius:'0.875rem', padding:'3px', border:'1px solid rgba(148,163,184,0.2)' }}>
                {(() => {
                  const opts = [{key:'asistencias',label:'Asistencias'},{key:'calificaciones',label:'Calificaciones'}]
                  const idx  = opts.findIndex(o => o.key === vistaGrafica)
                  return (
                    <>
                      <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 3px)`, left:`calc(${idx*50}% + 3px)`, background:'rgba(255,255,255,0.92)', borderRadius:'0.625rem', boxShadow:'0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(148,163,184,0.3)', transition:'left 0.35s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                      {opts.map(({key,label}) => (
                        <button key={key} onClick={() => cambiarVista(key as 'calificaciones' | 'asistencias')}
                          style={{ position:'relative', zIndex:1, padding:'0.375rem 0.875rem', fontSize:'0.75rem', fontWeight: vistaGrafica===key ? 600 : 500, color: vistaGrafica===key ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.625rem', transition:'color 0.2s', whiteSpace:'nowrap' }}>
                          {label}
                        </button>
                      ))}
                    </>
                  )
                })()}
              </div>

              {/* Botón descargar — aro azul expandible */}
              <DescargaBtn onClick={() => setModalInforme(true)} />
            </div>
          </div>

          {/* Gráfica SVG — con spring al mostrar/ocultar */}
          <div className="relative mb-6" style={{ flex: '1 1 0', minHeight: 0 }}>
            <style>{`
              @keyframes chartIn  { from { opacity:0; transform:translateY(14px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
              @keyframes chartOut { from { opacity:1; transform:translateY(0) scale(1) } to { opacity:0; transform:translateY(14px) scale(0.97) } }
              @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>

            {/* Filtro asignatura — flota a la izquierda del pastel */}
            {vistaGrafica === 'calificaciones' && grupoSelec !== 'general' && parcialSelec !== 'general' && (
              <div style={{ position:'absolute', left:0, top:'0.5rem', zIndex:10, display:'flex', flexDirection:'column', gap:'0.4rem', alignItems:'flex-start' }}>
                <div style={{ position:'relative' }}>
                  <button onClick={() => setFiltroAbierto(prev => prev === 'asig' ? null : 'asig' as TipoFiltro)}
                    style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'32px', padding:'0 0.875rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, border: asigSelecCalif ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: asigSelecCalif ? '#eff6ff' : 'white', color: asigSelecCalif ? '#2563eb' : '#64748b', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {asigSelecCalif ?? 'Asignatura'}
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: filtroAbierto==='asig'?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }}><path d="M6 9l6 6 6-6" strokeLinecap="round"/></svg>
                  </button>
                  {filtroAbierto === 'asig' && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'white', borderRadius:'0.875rem', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0', padding:'0.375rem', zIndex:50, minWidth:'180px', maxHeight:'180px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.15rem' }}>
                      {['Matemáticas','Español','Historia','Física','Química','Inglés'].map(m => (
                        <button key={m} onClick={() => { setAsigSelecCalif(m); setFiltroAbierto(null) }}
                          style={{ textAlign:'left', padding:'0.5rem 0.75rem', borderRadius:'0.625rem', fontSize:'0.8rem', fontWeight: asigSelecCalif===m?700:400, color: asigSelecCalif===m?'#2563eb':'#334155', background: asigSelecCalif===m?'#eff6ff':'transparent', border:'none', cursor:'pointer', transition:'background 0.12s', flexShrink:0 }}
                          onMouseEnter={e=>{ if(asigSelecCalif!==m) e.currentTarget.style.background='#f8fafc' }}
                          onMouseLeave={e=>{ if(asigSelecCalif!==m) e.currentTarget.style.background='transparent' }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {asigSelecCalif && (
                  <button onClick={() => setAsigSelecCalif(null)}
                    style={{ display:'flex', alignItems:'center', gap:'0.3rem', height:'28px', padding:'0 0.625rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', cursor:'pointer', boxShadow:'0 1px 4px rgba(220,38,38,0.1)', transition:'all 0.15s', whiteSpace:'nowrap' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fef2f2'}>
                    ✕ Quitar
                  </button>
                )}
              </div>
            )}
            {(() => {
              const tieneGrupo   = grupoSelec !== 'general'
              const tienePeriodo = vistaGrafica === 'calificaciones' ? parcialSelec !== 'general' : semanaSelec !== 'general'
              const mostrar      = tieneGrupo && tienePeriodo

              if (!mostrar) {
                const msg = !tieneGrupo && !tienePeriodo
                  ? 'Selecciona un grupo y un período'
                  : !tieneGrupo
                  ? 'Ahora selecciona un grupo'
                  : 'Ahora selecciona un período'

                const sub = !tieneGrupo && !tienePeriodo
                  ? 'Usa los filtros de abajo para configurar la consulta'
                  : !tieneGrupo
                  ? 'El período está listo, solo falta elegir el grupo'
                  : 'El grupo está listo, solo falta elegir el período'

                return (
                  <div key="placeholder" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.875rem', animation:'chartIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'1rem', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#64748b', margin:'0 0 0.25rem' }}>{msg}</p>
                      <p style={{ fontSize:'0.775rem', color:'#94a3b8', margin:0 }}>{sub}</p>
                    </div>
                  </div>
                )
              }


              if (vistaGrafica === 'asistencias') {
                const dias  = ['Lun','Mar','Mié','Jue','Vie']
                const vals  = [92, 88, 95, 84, 90]
                const color = '#10B981'
                const W=600,H=200,padL=44,padB=30,padT=12,padR=16
                const chartW=W-padL-padR, chartH=H-padB-padT
                const barW=chartW/dias.length*0.52, gap=chartW/dias.length
                return (
                  <svg key={`${grupoSelec}-asistencias-${semanaSelec}`} viewBox="0 0 600 200" className="w-full h-full" style={{ animation:'chartIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <defs>
                      {dias.map((_,i) => (
                        <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#34d399" stopOpacity="1"/>
                          <stop offset="40%"  stopColor={color}   stopOpacity="1"/>
                          <stop offset="100%" stopColor="#059669" stopOpacity="1"/>
                        </linearGradient>
                      ))}
                      <linearGradient id="barShine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" stopOpacity="1"/>
                        <stop offset="50%"  stopColor="rgba(255,255,255,0.06)" stopOpacity="1"/>
                        <stop offset="100%" stopColor="rgba(0,0,0,0.08)"       stopOpacity="1"/>
                      </linearGradient>
                    </defs>
                    {[0,25,50,75,100].map(v => {
                      const y=padT+chartH-(v/100)*chartH
                      return (<g key={v}>
                        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#f1f5f9" strokeWidth={v===0?1.5:1}/>
                        <text x={padL-6} y={y+4} textAnchor="end" fill="#94a3b8" fontSize="10">{v}%</text>
                      </g>)
                    })}
                    {dias.map((d,i) => {
                      const x=padL+i*gap+gap/2-barW/2, barH=(vals[i]/100)*chartH, y=padT+chartH-barH
                      return (<g key={d}>
                        <rect x={x} y={padT} width={barW} height={chartH} rx="5" fill="#f8fafc"/>
                        <rect x={x} y={y} width={barW} height={barH} rx="5" fill={`url(#barGrad${i})`}/>
                        <rect x={x} y={y} width={barW} height={barH} rx="5" fill="url(#barShine)"/>
                        <rect x={x} y={y} width={barW} height="3" rx="2" fill="rgba(255,255,255,0.5)"/>
                        <text x={x+barW/2} y={y-5} textAnchor="middle" fill={color} fontSize="11" fontWeight="700">{vals[i]}%</text>
                        <text x={x+barW/2} y={H-8} textAnchor="middle" fill="#94a3b8" fontSize="11">{d}</text>
                      </g>)
                    })}
                  </svg>
                )
              }

              // Calificaciones — placeholder si no hay asignatura
              if (!asigSelecCalif) {
                return (
                  <div key="calif-no-asig" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.875rem', animation:'chartIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'1rem', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#64748b', margin:'0 0 0.25rem' }}>Selecciona una asignatura</p>
                      <p style={{ fontSize:'0.775rem', color:'#94a3b8', margin:0 }}>para ver la gráfica de aprobados y reprobados</p>
                    </div>
                  </div>
                )
              }


              // Cuando hay asignatura — gráfica de pastel
              const aprobDataPie: Record<string,{aprobados:number;reprobados:number}> = {
                'Matemáticas':{aprobados:21,reprobados:7},'Español':{aprobados:25,reprobados:3},
                'Historia':{aprobados:24,reprobados:4},'Física':{aprobados:18,reprobados:10},
                'Química':{aprobados:20,reprobados:8},'Inglés':{aprobados:26,reprobados:2},
              }
              const pieData = aprobDataPie[asigSelecCalif] ?? {aprobados:20,reprobados:8}
              const pieTotal = pieData.aprobados + pieData.reprobados
              const pctAp = pieData.aprobados / pieTotal
              const cx=300,cy=95,r=80
              const sa=-Math.PI/2, ea=sa+pctAp*2*Math.PI
              const px1=cx+r*Math.cos(sa),py1=cy+r*Math.sin(sa)
              const px2=cx+r*Math.cos(ea),py2=cy+r*Math.sin(ea)
              const la=pctAp>0.5?1:0
              return (
                <svg key={`pie-${grupoSelec}-${parcialSelec}-${asigSelecCalif}`} viewBox="0 0 600 200" className="w-full h-full" style={{ animation:'chartIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <defs>
                    <linearGradient id="pgAp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#059669"/></linearGradient>
                    <linearGradient id="pgRep" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fca5a5"/><stop offset="100%" stopColor="#dc2626"/></linearGradient>
                    <filter id="ps"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.1"/></filter>
                  </defs>
                  {/* Reprobados full circle bg */}
                  <circle cx={cx} cy={cy} r={r} fill="url(#pgRep)" filter="url(#ps)"/>
                  {/* Aprobados slice */}
                  {pctAp>0&&pctAp<1&&<path d={`M${cx},${cy} L${px1},${py1} A${r},${r} 0 ${la} 1 ${px2},${py2} Z`} fill="url(#pgAp)" filter="url(#ps)"/>}
                  {pctAp===1&&<circle cx={cx} cy={cy} r={r} fill="url(#pgAp)" filter="url(#ps)"/>}
                  {/* Shine */}
                  <ellipse cx={cx-20} cy={cy-26} rx={30} ry={20} fill="rgba(255,255,255,0.18)" transform={`rotate(-30 ${cx} ${cy})`}/>
                  {/* Donut */}
                  <circle cx={cx} cy={cy} r={r*0.5} fill="white"/>
                  <text x={cx} y={cy-6}  textAnchor="middle" fill="#16a34a" fontSize="24" fontWeight="800">{Math.round(pctAp*100)}%</text>
                  <text x={cx} y={cy+14} textAnchor="middle" fill="#94a3b8" fontSize="12">aprobados</text>
                </svg>
              )
            })()}
          </div>

          {/* Filtros + refresh */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Botón refresh */}
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1.5px solid #e2e8f0', background:'white', cursor: refreshing ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s', flexShrink:0 }}
              onMouseEnter={e=>{ if(!refreshing){ e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.background='#eff6ff' } }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}>
              <svg width="15" height="15" fill="none" stroke={refreshing?'#2563eb':'#64748b'} strokeWidth="2.2" viewBox="0 0 24 24"
                style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>
                <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="flex items-center gap-0">
              {/* Filtro Grupo */}
              <div className="relative">
                <button onClick={() => toggleFiltro('grupo')}
                  style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0.625rem', color: grupoSelec !== 'general' ? '#2563eb' : '#64748b', fontWeight: grupoSelec !== 'general' ? 600 : 500, fontSize:'0.8rem', transition:'color 0.15s' }}
                  onMouseEnter={e => { if (grupoSelec === 'general') e.currentTarget.style.color = '#334155' }}
                  onMouseLeave={e => { if (grupoSelec === 'general') e.currentTarget.style.color = '#64748b' }}>
                  {labelGrupo()}
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: filtroAbierto === 'grupo' ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {(filtroAbierto === 'grupo' || filtroSaliendo === 'grupo') && (
                  <SpringDropdown
                    opciones={GRUPOS} seleccionado={grupoSelec}
                    forceCerrando={filtroSaliendo === 'grupo'}
                    onSeleccionar={setGrupoSelec} onCerrar={() => setFiltroAbierto(null)} />
                )}
              </div>

              {/* Separador vertical */}
              <div style={{ width:'1px', height:'16px', background:'#e2e8f0' }}/>

              {/* Filtro Parcial */}
              {vistaGrafica === 'calificaciones' && (
                <div className="relative">
                  <button onClick={() => toggleFiltro('parcial')}
                    style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0.625rem', color: parcialSelec !== 'general' ? '#2563eb' : '#64748b', fontWeight: parcialSelec !== 'general' ? 600 : 500, fontSize:'0.8rem', transition:'color 0.15s' }}
                    onMouseEnter={e => { if (parcialSelec === 'general') e.currentTarget.style.color = '#334155' }}
                    onMouseLeave={e => { if (parcialSelec === 'general') e.currentTarget.style.color = '#64748b' }}>
                    {labelParcial()}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: filtroAbierto === 'parcial' ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {(filtroAbierto === 'parcial' || filtroSaliendo === 'parcial') && (
                    <SpringDropdown
                      opciones={PARCIALES} seleccionado={parcialSelec}
                      forceCerrando={filtroSaliendo === 'parcial'}
                      onSeleccionar={setParcialSelec} onCerrar={() => setFiltroAbierto(null)} />
                  )}
                </div>
              )}

              {/* Filtro Semana */}
              {vistaGrafica === 'asistencias' && (
                <div className="relative">
                  <button onClick={() => toggleFiltro('semana')}
                    style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0.625rem', color: semanaSelec !== 'general' ? '#2563eb' : '#64748b', fontWeight: semanaSelec !== 'general' ? 600 : 500, fontSize:'0.8rem', transition:'color 0.15s' }}
                    onMouseEnter={e => { if (semanaSelec === 'general') e.currentTarget.style.color = '#334155' }}
                    onMouseLeave={e => { if (semanaSelec === 'general') e.currentTarget.style.color = '#64748b' }}>
                    {labelSemana()}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: filtroAbierto === 'semana' ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {(filtroAbierto === 'semana' || filtroSaliendo === 'semana') && (
                    <SpringDropdown
                      opciones={SEMANAS} seleccionado={semanaSelec}
                      forceCerrando={filtroSaliendo === 'semana'}
                      onSeleccionar={setSemanaSelec} onCerrar={() => setFiltroAbierto(null)} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho — contextual */}
        {(() => {
          const tieneGrupo   = grupoSelec !== 'general'
          const tienePeriodo = vistaGrafica === 'calificaciones' ? parcialSelec !== 'general' : semanaSelec !== 'general'
          const graficaActiva = tieneGrupo && tienePeriodo
          const alguno        = tieneGrupo || tienePeriodo

          const datosGrupo: Record<string, { alumnos: number; promedio: number; asistencia: number }> = {
            '101': { alumnos: 28, promedio: 82, asistencia: 91 },
            '102': { alumnos: 30, promedio: 78, asistencia: 87 },
            '103': { alumnos: 27, promedio: 85, asistencia: 93 },
            '201': { alumnos: 29, promedio: 76, asistencia: 84 },
            '202': { alumnos: 31, promedio: 80, asistencia: 89 },
            '203': { alumnos: 26, promedio: 83, asistencia: 90 },
            '301': { alumnos: 28, promedio: 79, asistencia: 86 },
            '302': { alumnos: 27, promedio: 81, asistencia: 88 },
            '401': { alumnos: 25, promedio: 77, asistencia: 85 },
            '501': { alumnos: 24, promedio: 74, asistencia: 83 },
            '502': { alumnos: 26, promedio: 76, asistencia: 82 },
            '601': { alumnos: 22, promedio: 80, asistencia: 87 },
          }
          const grupo = datosGrupo[grupoSelec]

          const aprobData2: Record<string, {aprobados:number;reprobados:number}> = {
            'Matemáticas': {aprobados:21,reprobados:7},
            'Español':     {aprobados:25,reprobados:3},
            'Historia':    {aprobados:24,reprobados:4},
            'Física':      {aprobados:18,reprobados:10},
            'Química':     {aprobados:20,reprobados:8},
            'Inglés':      {aprobados:26,reprobados:2},
          }
          const aprobInfo = asigSelecCalif ? aprobData2[asigSelecCalif] : null
          const docenteMap: Record<string,string> = {
            'Matemáticas':'Prof. Ramírez Torres','Español':'Prof. López Herrera',
            'Historia':'Prof. Gutiérrez Paz','Física':'Prof. Mendoza Ríos',
            'Química':'Prof. Castillo Vera','Inglés':'Prof. Flores Aguilar',
          }

          const mostrarCalif = graficaActiva && vistaGrafica === 'calificaciones' && asigSelecCalif && aprobInfo

          return (
            <div className="w-72 bg-white rounded-2xl shadow-sm flex flex-col" style={{ minHeight:0 }}>

              {/* Header */}
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.25rem' }}>
                  {mostrarCalif ? `Grupo ${grupoSelec} · ${asigSelecCalif}` : graficaActiva ? `Grupo ${grupoSelec}` : alguno ? 'Selección parcial' : 'Institución'}
                </p>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>
                  {mostrarCalif ? 'Aprobados y reprobados'
                    : graficaActiva ? (vistaGrafica === 'calificaciones' ? 'Estadísticas de calificaciones' : 'Estadísticas de asistencia')
                    : alguno ? 'Selecciona el campo faltante'
                    : 'Población escolar'}
                </p>
              </div>

              {/* Cuerpo */}
              <div style={{ padding:'1.25rem 1.5rem', flex:1, display:'flex', flexDirection:'column', gap:'1rem' }}>

                {!alguno ? (
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', textAlign:'center' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'1rem', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.25rem' }}>
                      <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <p style={{ fontSize:'2.75rem', fontWeight:800, color:'#1e3a5f', margin:0, lineHeight:1, fontFamily:'Outfit,sans-serif' }}>840</p>
                    <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>alumnos registrados</p>
                    <p style={{ fontSize:'0.7rem', color:'#cbd5e1', margin:'0.5rem 0 0' }}>Selecciona grupo y período<br/>para ver estadísticas</p>
                  </div>
                ) : !graficaActiva ? (
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', textAlign:'center' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'1rem', background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.25rem' }}>
                      <svg width="24" height="24" fill="none" stroke="#d97706" strokeWidth="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                      {!tieneGrupo ? 'Selecciona un grupo' : 'Selecciona un período'}
                    </p>
                    <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:0 }}>para ver las estadísticas</p>
                  </div>
                ) : mostrarCalif ? (
                  /* Calificaciones con asignatura seleccionada — layout plano sin scroll */
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    {/* Materia + parcial */}
                    <div style={{ paddingBottom:'0.625rem', borderBottom:'1px solid #f1f5f9' }}>
                      <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.2rem' }}>Asignatura</p>
                      <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{asigSelecCalif}</p>
                      <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>{PARCIALES.find(p=>p.key===parcialSelec)?.label ?? ''}</p>
                    </div>
                    {/* Aprobados */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#16a34a', flexShrink:0 }}/>
                        <p style={{ fontSize:'0.8rem', color:'#475569', margin:0 }}>Aprobados</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontSize:'1.375rem', fontWeight:800, color:'#16a34a', fontFamily:'Outfit,sans-serif' }}>{aprobInfo!.aprobados}</span>
                        <span style={{ fontSize:'0.72rem', color:'#94a3b8', marginLeft:'0.3rem' }}>{Math.round(aprobInfo!.aprobados/(aprobInfo!.aprobados+aprobInfo!.reprobados)*100)}%</span>
                      </div>
                    </div>
                    {/* Reprobados */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>
                        <p style={{ fontSize:'0.8rem', color:'#475569', margin:0 }}>Reprobados</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontSize:'1.375rem', fontWeight:800, color:'#dc2626', fontFamily:'Outfit,sans-serif' }}>{aprobInfo!.reprobados}</span>
                        <span style={{ fontSize:'0.72rem', color:'#94a3b8', marginLeft:'0.3rem' }}>{Math.round(aprobInfo!.reprobados/(aprobInfo!.aprobados+aprobInfo!.reprobados)*100)}%</span>
                      </div>
                    </div>
                    {/* Barra visual */}
                    <div style={{ height:'6px', borderRadius:'9999px', background:'#f1f5f9', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.round(aprobInfo!.aprobados/(aprobInfo!.aprobados+aprobInfo!.reprobados)*100)}%`, background:'#16a34a', borderRadius:'9999px', transition:'width 0.4s cubic-bezier(0.4,0,0.2,1)' }}/>
                    </div>
                    {/* Docente */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', paddingTop:'0.375rem', borderTop:'1px solid #f1f5f9' }}>
                      <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, color:'#475569', flexShrink:0 }}>
                        {docenteMap[asigSelecCalif]?.split(' ').slice(1).map((w:string)=>w[0]).join('')}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.6rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Docente</p>
                        <p style={{ fontSize:'0.775rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>{docenteMap[asigSelecCalif]}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Estado activo normal sin asignatura */
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                    <div style={{ background:'#f8fafc', borderRadius:'0.875rem', padding:'0.875rem 1rem' }}>
                      <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>Alumnos en grupo</p>
                      <p style={{ fontSize:'2rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{grupo?.alumnos ?? '—'}</p>
                      <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.25rem 0 0' }}>de 840 total institución</p>
                    </div>
                    <div style={{ background: vistaGrafica === 'calificaciones' ? '#eff6ff' : '#f0fdf4', borderRadius:'0.875rem', padding:'0.875rem 1rem', border:`1px solid ${vistaGrafica==='calificaciones'?'#bfdbfe':'#bbf7d0'}` }}>
                      <p style={{ fontSize:'0.65rem', fontWeight:600, color: vistaGrafica==='calificaciones'?'#2563eb':'#16a34a', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>
                        {vistaGrafica === 'calificaciones' ? 'Promedio grupo' : 'Asistencia grupo'}
                      </p>
                      <p style={{ fontSize:'2rem', fontWeight:800, color: vistaGrafica==='calificaciones'?'#2563eb':'#16a34a', margin:0, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>
                        {vistaGrafica === 'calificaciones' ? (grupo?.promedio ?? '—') : `${grupo?.asistencia ?? '—'}%`}
                      </p>
                      <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.25rem 0 0' }}>
                        {vistaGrafica === 'calificaciones' ? (PARCIALES.find(p=>p.key===parcialSelec)?.label ?? '') : (SEMANAS.find(s=>s.key===semanaSelec)?.label ?? '')}
                      </p>
                    </div>
                    {vistaGrafica === 'calificaciones' && (
                      <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:0, textAlign:'center' }}>Selecciona una asignatura<br/>para ver aprobados y reprobados</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end' }}>
                <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>
                  {graficaActiva
                    ? <>Sincronizado: <span style={{ color:'#16a34a', fontWeight:600 }}>Justo ahora</span></>
                    : <span style={{ color:'#cbd5e1' }}>Served by Dinoti</span>
                  }
                </p>
              </div>
            </div>
          )
        })()}
      </div>

      {modalInforme && <ModalInforme onCerrar={() => setModalInforme(false)} />}
    </div>
  )
}