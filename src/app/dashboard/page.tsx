'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

type TipoFiltro  = 'parcial' | 'grupo' | 'semana' | null

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
    { key: '1',     label: '1er Parcial'        },
    { key: '2',     label: '2do Parcial'        },
    { key: '3',     label: '3er Parcial'        },
    { key: 'final', label: 'Calificación Final' },
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
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col" style={{ minHeight: 0, overflowY: 'auto' }}>
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
            `}</style>
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

              return (
                <svg key={`${grupoSelec}-${vistaGrafica}-${parcialSelec}-${semanaSelec}`}
                  viewBox="0 0 600 180" className="w-full h-full"
                  style={{ animation:'chartIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={vistaGrafica === 'calificaciones' ? '#3B82F6' : '#10B981'} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={vistaGrafica === 'calificaciones' ? '#3B82F6' : '#10B981'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0,1,2,3,4].map(i => (
                    <line key={i} x1="40" y1={20 + i * 32} x2="580" y2={20 + i * 32} stroke="#F3F4F6" strokeWidth="1" />
                  ))}
                  <path d="M80,140 L160,120 L240,100 L320,60 L400,55 L480,70 L560,80 L560,160 L80,160 Z" fill="url(#grad)" />
                  <polyline points="80,140 160,120 240,100 320,60 400,55 480,70 560,80"
                    fill="none" stroke={vistaGrafica === 'calificaciones' ? '#3B82F6' : '#10B981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {([[80,140],[160,120],[240,100],[320,60],[400,55],[480,70],[560,80]] as [number,number][]).map(([x,y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={vistaGrafica === 'calificaciones' ? '#3B82F6' : '#10B981'} strokeWidth="2.5" />
                  ))}
                  {['Ene','Feb','Mar','Abr','May','Jun','Jul'].map((m, i) => (
                    <text key={m} x={80 + i * 80} y="175" textAnchor="middle" fill="#9CA3AF" fontSize="11">{m}</text>
                  ))}
                </svg>
              )
            })()}
          </div>

          {/* Métricas + filtros */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {vistaGrafica === 'calificaciones' ? 'Promedio Actual' : 'Asistencia Media'}
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {(grupoSelec !== 'general' && (vistaGrafica === 'calificaciones' ? parcialSelec !== 'general' : semanaSelec !== 'general')) ? (vistaGrafica === 'calificaciones' ? '8.7' : '89.7%') : '—'}
              </p>
            </div>

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

          // Datos mock por grupo
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

          return (
            <div className="w-72 bg-white rounded-2xl shadow-sm flex flex-col" style={{ minHeight:0 }}>

              {/* Header */}
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.25rem' }}>
                  {graficaActiva ? `Grupo ${grupoSelec}` : 'Institución'}
                </p>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>
                  {graficaActiva
                    ? (vistaGrafica === 'calificaciones' ? 'Estadísticas de calificaciones' : 'Estadísticas de asistencia')
                    : 'Población escolar'}
                </p>
              </div>

              {/* Cuerpo */}
              <div style={{ padding:'1.25rem 1.5rem', flex:1, display:'flex', flexDirection:'column', gap:'1.125rem' }}>

                {!graficaActiva ? (
                  /* Estado inicial — solo total alumnos */
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
                ) : (
                  /* Estado con gráfica activa */
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                      {/* Alumnos en grupo */}
                      <div style={{ background:'#f8fafc', borderRadius:'0.875rem', padding:'0.875rem 1rem' }}>
                        <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>Alumnos en grupo</p>
                        <p style={{ fontSize:'2rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>
                          {grupo?.alumnos ?? '—'}
                        </p>
                        <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.25rem 0 0' }}>de 840 total institución</p>
                      </div>

                      {/* Métrica principal según vista */}
                      <div style={{ background: vistaGrafica === 'calificaciones' ? '#eff6ff' : '#f0fdf4', borderRadius:'0.875rem', padding:'0.875rem 1rem', border:`1px solid ${vistaGrafica==='calificaciones'?'#bfdbfe':'#bbf7d0'}` }}>
                        <p style={{ fontSize:'0.65rem', fontWeight:600, color: vistaGrafica==='calificaciones' ? '#2563eb' : '#16a34a', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>
                          {vistaGrafica === 'calificaciones' ? 'Promedio grupo' : 'Asistencia grupo'}
                        </p>
                        <p style={{ fontSize:'2rem', fontWeight:800, color: vistaGrafica==='calificaciones' ? '#2563eb' : '#16a34a', margin:0, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>
                          {vistaGrafica === 'calificaciones'
                            ? (grupo?.promedio ?? '—')
                            : `${grupo?.asistencia ?? '—'}%`}
                        </p>
                        <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.25rem 0 0' }}>
                          {vistaGrafica === 'calificaciones'
                            ? (PARCIALES.find(p=>p.key===parcialSelec)?.label ?? '')
                            : (SEMANAS.find(s=>s.key===semanaSelec)?.label ?? '')}
                        </p>
                      </div>
                    </div>
                  </>
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