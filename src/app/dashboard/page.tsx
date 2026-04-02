'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

type TipoFiltro  = 'parcial' | 'grupo' | 'semana' | null
type TipoFormato = 'pdf' | 'excel' | null

const SEMANAS = Array.from({ length: 16 }, (_, i) => ({ key: `semana-${i+1}`, label: `Semana ${i + 1}` }))
const GRUPOS  = [
  '101','102','103','201','202','203',
  '301','302','303','401','402','403',
  '501','502','503','601','602','603',
].map(g => ({ key: g, label: `Grupo ${g}` }))

const OPCION_GENERAL = { key: 'general', label: 'General — Toda la institución' }

const stats = [
  { label: 'POBLACIÓN',        value: '840',  suffix: 'alumnos', color: 'text-gray-800'  },
  { label: 'PROMEDIO GRAL',    value: '8.7',  suffix: '',        color: 'text-blue-600'  },
  { label: 'ASISTENCIA MEDIA', value: '89.7', suffix: '%',       color: 'text-green-500' },
]

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
  const [grupo,    setGrupo]    = useState('')
  const [parcial,  setParcial]  = useState('')
  const [formato,  setFormato]  = useState<TipoFormato>(null)
  const [contenido, setContenido] = useState({ calificaciones: true, asistencia: true })
  const [cerrando, setCerrando] = useState(false)

  function handleCerrar() {
    setCerrando(true)
    setTimeout(() => onCerrar(), 480)
  }

  const listo = grupo && parcial && formato && (contenido.calificaciones || contenido.asistencia)

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      onClick={handleCerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        animation: cerrando ? 'informeBackdropOut 0.48s ease forwards' : 'informeBackdrop 0.3s ease',
      }}>
      <style>{`
        @keyframes informeBackdrop { from { opacity:0 } to { opacity:1 } }
        @keyframes informeBackdropOut { from { opacity:1 } to { opacity:0 } }
        @keyframes informeSpring {
          from { opacity:0; transform:scale(0.92) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes informeSpringOut {
          from { opacity:1; transform:scale(1) translateY(0); }
          to   { opacity:0; transform:scale(0.92) translateY(12px); }
        }
      `}</style>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full flex flex-col"
        style={{ maxWidth: '560px', maxHeight: '88vh', animation: cerrando ? 'informeSpringOut 0.48s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'informeSpring 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b shrink-0"
          style={{ borderColor: '#f1f5f9' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1e3a5f' }}>Descargar Informe</h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Selecciona el grupo, parcial y formato de descarga
            </p>
          </div>
          <button onClick={handleCerrar}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
        </div>

        <div className="overflow-y-auto px-7 py-5 space-y-5 flex-1">

          {/* Paso 1 */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
              1 · Selecciona grupo y parcial
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#475569' }}>Grupo</label>
                <select value={grupo} onChange={e => setGrupo(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0', color: grupo ? '#1e3a5f' : '#94a3b8' }}>
                  <option value="">Selecciona un grupo</option>
                  {GRUPOS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#475569' }}>Parcial</label>
                <select value={parcial} onChange={e => setParcial(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0', color: parcial ? '#1e3a5f' : '#94a3b8' }}>
                  <option value="">Selecciona un parcial</option>
                  <option value="1">1er Parcial</option>
                  <option value="2">2do Parcial</option>
                  <option value="3">3er Parcial</option>
                  <option value="final">Calificación Final</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
              2 · Contenido a incluir
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'calificaciones', label: 'Calificaciones', desc: 'Promedio por parcial y final',
                  icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                },
                { key: 'asistencia', label: 'Asistencia', desc: 'Porcentaje y faltas por alumno',
                  icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                },
              ].map(op => {
                const activo = contenido[op.key as keyof typeof contenido]
                return (
                  <button key={op.key}
                    onClick={() => setContenido(prev => ({ ...prev, [op.key]: !prev[op.key as keyof typeof prev] }))}
                    className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                    style={{ border: activo ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: activo ? '#eff6ff' : 'white' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: activo ? '#2563eb' : '#f1f5f9', color: activo ? 'white' : '#94a3b8' }}>
                      {op.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: activo ? '#2563eb' : '#1e3a5f' }}>{op.label}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{op.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paso 3 */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
              3 · Formato de descarga
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFormato(formato === 'pdf' ? null : 'pdf')}
                className="rounded-xl p-4 text-left transition-all"
                style={{ border: formato === 'pdf' ? '2px solid #dc2626' : '1px solid #e2e8f0', background: formato === 'pdf' ? '#fef2f2' : 'white' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: formato === 'pdf' ? '#dc2626' : '#f1f5f9' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={formato === 'pdf' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <polyline points="14 2 14 8 20 8" stroke={formato === 'pdf' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="9" y1="13" x2="15" y2="13" stroke={formato === 'pdf' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="9" y1="17" x2="15" y2="17" stroke={formato === 'pdf' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: formato === 'pdf' ? '#dc2626' : '#1e3a5f' }}>PDF</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Para imprimir o compartir</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Listo para imprimir', 'Firma del director'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: formato === 'pdf' ? '#fee2e2' : '#f1f5f9', color: formato === 'pdf' ? '#dc2626' : '#94a3b8' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              <button onClick={() => setFormato(formato === 'excel' ? null : 'excel')}
                className="rounded-xl p-4 text-left transition-all"
                style={{ border: formato === 'excel' ? '2px solid #16a34a' : '1px solid #e2e8f0', background: formato === 'excel' ? '#f0fdf4' : 'white' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: formato === 'excel' ? '#16a34a' : '#f1f5f9' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={formato === 'excel' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <polyline points="14 2 14 8 20 8" stroke={formato === 'excel' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="8" y1="13" x2="16" y2="13" stroke={formato === 'excel' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="8" y1="17" x2="16" y2="17" stroke={formato === 'excel' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="10" y1="9" x2="14" y2="9" stroke={formato === 'excel' ? 'white' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: formato === 'excel' ? '#16a34a' : '#1e3a5f' }}>Excel</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Para analizar o editar</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Editable', 'Filtros automáticos'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: formato === 'excel' ? '#dcfce7' : '#f1f5f9', color: formato === 'excel' ? '#16a34a' : '#94a3b8' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Resumen */}
          {listo && (
            <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Resumen</p>
              <div className="space-y-1">
                <p className="text-xs" style={{ color: '#475569' }}><span className="font-semibold" style={{ color: '#1e3a5f' }}>Grupo: </span>{grupo}</p>
                <p className="text-xs" style={{ color: '#475569' }}><span className="font-semibold" style={{ color: '#1e3a5f' }}>Parcial: </span>{parcial === 'final' ? 'Calificación Final' : `${parcial}° Parcial`}</p>
                <p className="text-xs" style={{ color: '#475569' }}><span className="font-semibold" style={{ color: '#1e3a5f' }}>Incluye: </span>{[contenido.calificaciones && 'Calificaciones', contenido.asistencia && 'Asistencia'].filter(Boolean).join(' + ')}</p>
                <p className="text-xs" style={{ color: '#475569' }}><span className="font-semibold" style={{ color: '#1e3a5f' }}>Formato: </span>{formato === 'pdf' ? 'PDF' : 'Excel (.xlsx)'}</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleCerrar}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border transition"
              style={{ borderColor: '#e2e8f0', color: '#64748b' }}>
              Cancelar
            </button>
            <button disabled={!listo}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center gap-2"
              style={{ background: !listo ? '#e2e8f0' : formato === 'pdf' ? '#dc2626' : '#16a34a', cursor: !listo ? 'not-allowed' : 'pointer', color: !listo ? '#94a3b8' : 'white' }}
              onMouseEnter={e => { if (listo) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
              {!listo ? 'Completa los campos' : `↓ Descargar ${formato === 'pdf' ? 'PDF' : 'Excel'}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

          {/* Gráfica SVG */}
          <div className="relative mb-6" style={{ flex: '1 1 0', minHeight: 0 }}>
            <svg viewBox="0 0 600 180" className="w-full h-full">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0,1,2,3,4].map(i => (
                <line key={i} x1="40" y1={20 + i * 32} x2="580" y2={20 + i * 32} stroke="#F3F4F6" strokeWidth="1" />
              ))}
              <path d="M80,140 L160,120 L240,100 L320,60 L400,55 L480,70 L560,80 L560,160 L80,160 Z" fill="url(#grad)" />
              <polyline points="80,140 160,120 240,100 320,60 400,55 480,70 560,80"
                fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {([[80,140],[160,120],[240,100],[320,60],[400,55],[480,70],[560,80]] as [number,number][]).map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
              ))}
              {['Ene','Feb','Mar','Abr','May','Jun','Jul'].map((m, i) => (
                <text key={m} x={80 + i * 80} y="175" textAnchor="middle" fill="#9CA3AF" fontSize="11">{m}</text>
              ))}
            </svg>
          </div>

          {/* Métricas + filtros */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {vistaGrafica === 'calificaciones' ? 'Promedio Actual' : 'Asistencia Media'}
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {vistaGrafica === 'calificaciones' ? '8.7' : '89.7%'}
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

        {/* Panel derecho */}
        <div className="w-72 bg-white rounded-2xl shadow-sm p-6 flex flex-col" style={{ minHeight: 0, overflowY: 'auto' }}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-blue-500">ℹ️</span>
            <h3 className="font-semibold text-gray-700">Información Institucional</h3>
          </div>
          <div className="space-y-5 flex-1">
            {stats.map(s => (
              <div key={s.label} className="border-b border-gray-100 pb-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.suffix}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-3 flex justify-end">
            <p className="text-xs text-gray-400">
              Sincronizado: <span className="text-green-500 font-medium">Justo ahora</span>
            </p>
          </div>
        </div>
      </div>

      {modalInforme && <ModalInforme onCerrar={() => setModalInforme(false)} />}
    </div>
  )
}