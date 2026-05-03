'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Mensajeria from './Mensajeria'

type Notificacion = {
  id: string
  tipo: 'actualizacion' | 'aviso' | 'pago'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

type DiaAsistencia = {
  fecha: string
  estado: 'P' | 'A' | 'J' | 'noClase'
}

type Alumno = {
  id: string
  nombre: string
  grupo: string
  semestre: number
  calificaciones: { parcial: 1 | 2 | 3; valor: number }[]
  promedioFinal: number
  asistencia: { parcial: 1 | 2 | 3; porcentaje: number }[]
  asistenciaFinal: number
  faltas: number
  historialDias: DiaAsistencia[]
}

function generarDias(faltas: number): DiaAsistencia[] {
  const dias: DiaAsistencia[] = []
  const inicio = new Date('2026-02-02')
  const fin    = new Date('2026-07-10')
  let faltasUsadas = 0
  const cur = new Date(inicio)
  while (cur <= fin) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const iso = cur.toISOString().split('T')[0]
      if (iso >= '2026-04-06' && iso <= '2026-04-10') {
        dias.push({ fecha: iso, estado: 'noClase' })
      } else {
        let estado: 'P' | 'A' | 'J' = 'P'
        if (faltasUsadas < faltas) {
          const totalDias = dias.filter(d => d.estado !== 'noClase').length + 1
          if (totalDias % Math.max(1, Math.floor(90 / faltas)) === 0) {
            estado = faltasUsadas % 4 === 3 ? 'J' : 'A'
            faltasUsadas++
          }
        }
        dias.push({ fecha: iso, estado })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

const alumnosMock: Alumno[] = [
  { id: '1', nombre: 'GARCÍA LÓPEZ ANA',          grupo: '101', semestre: 1, calificaciones: [{ parcial: 1, valor: 92 }, { parcial: 2, valor: 88 }, { parcial: 3, valor: 94 }], promedioFinal: 91, asistencia: [{ parcial: 1, porcentaje: 95 }, { parcial: 2, porcentaje: 90 }, { parcial: 3, porcentaje: 98 }], asistenciaFinal: 94, faltas: 3,  historialDias: generarDias(3)  },
  { id: '2', nombre: 'MARTÍNEZ RUIZ CARLOS',       grupo: '101', semestre: 1, calificaciones: [{ parcial: 1, valor: 78 }, { parcial: 2, valor: 75 }, { parcial: 3, valor: 80 }], promedioFinal: 77, asistencia: [{ parcial: 1, porcentaje: 72 }, { parcial: 2, porcentaje: 70 }, { parcial: 3, porcentaje: 75 }], asistenciaFinal: 72, faltas: 12, historialDias: generarDias(12) },
  { id: '3', nombre: 'PÉREZ TORRES DIANA',         grupo: '301', semestre: 3, calificaciones: [{ parcial: 1, valor: 85 }, { parcial: 2, valor: 82 }, { parcial: 3, valor: 87 }], promedioFinal: 85, asistencia: [{ parcial: 1, porcentaje: 88 }, { parcial: 2, porcentaje: 85 }, { parcial: 3, porcentaje: 92 }], asistenciaFinal: 88, faltas: 6,  historialDias: generarDias(6)  },
  { id: '4', nombre: 'LÓPEZ SÁNCHEZ EDUARDO',      grupo: '301', semestre: 3, calificaciones: [{ parcial: 1, valor: 96 }, { parcial: 2, valor: 94 }, { parcial: 3, valor: 97 }], promedioFinal: 96, asistencia: [{ parcial: 1, porcentaje: 100}, { parcial: 2, porcentaje: 98 }, { parcial: 3, porcentaje: 100}], asistenciaFinal: 99, faltas: 0,  historialDias: generarDias(0)  },
  { id: '5', nombre: 'HERNÁNDEZ CRUZ FERNANDA',    grupo: '501', semestre: 5, calificaciones: [{ parcial: 1, valor: 71 }, { parcial: 2, valor: 68 }, { parcial: 3, valor: 73 }], promedioFinal: 71, asistencia: [{ parcial: 1, porcentaje: 80 }, { parcial: 2, porcentaje: 75 }, { parcial: 3, porcentaje: 82 }], asistenciaFinal: 79, faltas: 9,  historialDias: generarDias(9)  },
  { id: '6', nombre: 'RAMÍREZ VEGA GABRIEL',       grupo: '501', semestre: 5, calificaciones: [{ parcial: 1, valor: 60 }, { parcial: 2, valor: 58 }, { parcial: 3, valor: 62 }], promedioFinal: 60, asistencia: [{ parcial: 1, porcentaje: 65 }, { parcial: 2, porcentaje: 62 }, { parcial: 3, porcentaje: 68 }], asistenciaFinal: 65, faltas: 18, historialDias: generarDias(18) },
]

const notificacionesMock: Notificacion[] = [
  { id: '1', tipo: 'pago',          titulo: 'Pago pendiente',                mensaje: 'Tu suscripción vence en 3 días. Realiza tu pago para mantener el acceso al sistema.', fecha: 'Hoy',    leida: false },
  { id: '2', tipo: 'actualizacion', titulo: 'Nueva actualización disponible', mensaje: 'EduControl v1.2 ya está activo. Ahora puedes generar boletas en PDF directamente.',   fecha: 'Ayer',   leida: false },
  { id: '3', tipo: 'aviso',         titulo: 'Mantenimiento programado',       mensaje: 'El domingo 23 de marzo de 2:00 a 4:00 AM el sistema estará en mantenimiento.',        fecha: '15 Mar', leida: true  },
]

const iconoTipo = {
  pago:          { bg: '#fef2f2', color: '#dc2626', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/> },
  actualizacion: { bg: '#eff6ff', color: '#2563eb', svg: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
  aviso:         { bg: '#fffbeb', color: '#d97706', svg: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
}

function colorNota(v: number) { return v >= 70 ? '#16a34a' : '#dc2626' }
function bgNota(v: number)    { return v >= 70 ? '#f0fdf4' : '#fef2f2' }

type ParcialKey = 1 | 2 | 3 | 'final'

// ── Botón icono limpio ────────────────────────────────────────────────────────
function IconBtn({ onClick, active, children, badge }: {
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  badge?: number
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: 10,
        border: '1px solid',
        borderColor: active || hov ? '#e2e8f0' : '#f0f0f5',
        background: active ? '#f8fafc' : hov ? '#f8fafc' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
      {badge && badge > 0 ? (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 16, height: 16, borderRadius: '50%',
          background: '#ef4444', color: 'white',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid white',
        }}>{badge}</span>
      ) : null}
    </button>
  )
}

function CardAlumno({ alumno, onCerrar }: { alumno: Alumno; onCerrar: () => void }) {
  const [parcialActivo, setParcialActivo] = useState<ParcialKey>(1)
  const [parcialDir, setParcialDir]       = useState<'der'|'izq'>('der')
  const [parcialVis, setParcialVis]       = useState(true)
  const [descargando, setDescargando]     = useState(false)
  const [descargado,  setDescargado]      = useState(false)

  const tabs: { key: ParcialKey; label: string }[] = [
    { key: 1, label: '1er Parcial' },
    { key: 2, label: '2do Parcial' },
    { key: 3, label: '3er Parcial' },
    { key: 'final', label: 'Final' },
  ]
  const tabIdx = tabs.findIndex(t => t.key === parcialActivo)

  function cambiarParcial(key: ParcialKey) {
    if (key === parcialActivo) return
    const newIdx = tabs.findIndex(t => t.key === key)
    setParcialDir(newIdx > tabIdx ? 'der' : 'izq')
    setParcialVis(false)
    setTimeout(() => { setParcialActivo(key); setParcialVis(true) }, 180)
  }

  const calActiva = parcialActivo === 'final'
    ? alumno.promedioFinal
    : alumno.calificaciones.find(c => c.parcial === parcialActivo)?.valor ?? 0

  function handleDescargar() {
    if (descargando || descargado) return
    setDescargando(true)
    setTimeout(() => { setDescargando(false); setDescargado(true); setTimeout(() => setDescargado(false), 2500) }, 1800)
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:'backdropIn 0.25s ease' }}>
      <style>{`
        @keyframes cardIn { from{opacity:0;transform:scale(0.93) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', boxShadow:'0 24px 64px rgba(0,0,0,0.16)', width:400, display:'flex', flexDirection:'column', overflow:'hidden', animation:'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>

        <div style={{ background:'linear-gradient(135deg,#1e6fcc,#155ca0)', padding:'1.25rem 1.5rem 1rem', position:'relative' }}>
          <button onClick={onCerrar} style={{ position:'absolute', top:'1rem', right:'1rem', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', width:28, height:28, borderRadius:'50%', color:'white', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:44, height:44, borderRadius:'0.75rem', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.125rem', fontWeight:800, color:'white', flexShrink:0 }}>
              {alumno.semestre}
            </div>
            <div>
              <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'white', margin:'0 0 0.25rem' }}>{alumno.nombre}</p>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>Grupo {alumno.grupo}</span>
                <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>{alumno.semestre}° Semestre</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'0.75rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ position:'relative', display:'flex', background:'#f8fafc', borderRadius:'0.875rem', padding:'3px' }}>
            <div style={{ position:'absolute', top:3, bottom:3, width:`calc(${100/4}% - 2px)`, left:`calc(${tabIdx*(100/4)}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', transition:'left 0.3s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
            {tabs.map(t => (
              <button key={String(t.key)} onClick={() => cambiarParcial(t.key)}
                style={{ position:'relative', zIndex:1, flex:1, padding:'0.4rem 0', fontSize:'0.7rem', fontWeight: parcialActivo===t.key ? 700 : 500, color: parcialActivo===t.key ? '#1e6fcc' : '#94a3b8', background:'transparent', border:'none', cursor:'pointer', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'1.25rem 1.5rem 1.5rem' }}>
          <div style={{ opacity: parcialVis?1:0, transform: parcialVis?'translateX(0) scale(1)':`translateX(${parcialDir==='der'?'12px':'-12px'}) scale(0.97)`, transition: parcialVis?'opacity 0.28s ease, transform 0.28s ease':'opacity 0.14s ease, transform 0.14s ease' }}>
            <div style={{ background: bgNota(calActiva), borderRadius:'1rem', padding:'2rem', textAlign:'center', border:`1px solid ${calActiva>=60?'#bbf7d0':'#fecaca'}`, marginBottom:'1rem' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.5rem' }}>{tabs.find(t=>t.key===parcialActivo)?.label}</p>
              <p style={{ fontSize:'4.5rem', fontWeight:800, color:colorNota(calActiva), margin:0, lineHeight:1 }}>{calActiva}</p>
              <p style={{ fontSize:'0.8rem', color:colorNota(calActiva), margin:'0.75rem 0 0', fontWeight:600 }}>{calActiva>=90?'Excelente':calActiva>=60?'Aprobado':'Reprobado'}</p>
            </div>
          </div>
          <button onClick={handleDescargar}
            style={{ width:'100%', padding:'0.75rem', borderRadius:'0.875rem', cursor:descargando||descargado?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.625rem', fontSize:'0.875rem', fontWeight:600, background:descargado?'#16a34a':descargando?'#f8fafc':'#fef2f2', color:descargado?'white':descargando?'#94a3b8':'#dc2626', border:descargado?'none':`1px solid ${descargando?'#e2e8f0':'#fecaca'}`, transition:'all 0.25s' }}
            onMouseEnter={e=>{ if(!descargando&&!descargado){e.currentTarget.style.background='#dc2626';e.currentTarget.style.color='white';e.currentTarget.style.border='none'} }}
            onMouseLeave={e=>{ if(!descargando&&!descargado){e.currentTarget.style.background='#fef2f2';e.currentTarget.style.color='#dc2626';e.currentTarget.style.border='1px solid #fecaca'} }}>
            {descargado ? <><svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg> Boleta descargada</>
            : descargando ? <><div style={{ width:14, height:14, border:'2px solid #e2e8f0', borderTopColor:'#94a3b8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Generando...</>
            : <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Descargar boleta PDF</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Header({ titulo }: { titulo: string }) {
  const [notifs, setNotifs]                   = useState<Notificacion[]>(notificacionesMock)
  const [panelAbierto, setPanelAbierto]       = useState(false)
  const [mensajesAbierto, setMensajesAbierto] = useState(false)
  const [busqueda, setBusqueda]               = useState('')
  const [sugerencias, setSugerencias]         = useState<Alumno[]>([])
  const [alumnoSelec, setAlumnoSelec]         = useState<Alumno | null>(null)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const [notifCerrando, setNotifCerrando]     = useState(false)
  const busquedaRef    = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const noLeidas = notifs.filter(n => !n.leida).length

  function cerrarNotifs() {
    setNotifCerrando(true)
    setTimeout(() => { setPanelAbierto(false); setNotifCerrando(false) }, 280)
  }
  function marcarLeida(id: string) { setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n)) }
  function marcarTodasLeidas()     { setNotifs(prev => prev.map(n => ({ ...n, leida: true }))) }

  function handleBusqueda(valor: string) {
    const upper = valor.toUpperCase()
    setBusqueda(upper)
    if (upper.trim().length < 2) { setSugerencias([]); setDropdownAbierto(false); return }
    const res = alumnosMock.filter(a => a.nombre.includes(upper.trim()) || a.grupo.includes(upper.trim()))
    setSugerencias(res)
    setDropdownAbierto(true)
  }

  function seleccionarAlumno(a: Alumno) {
    setAlumnoSelec(a); setBusqueda(''); setSugerencias([]); setDropdownAbierto(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (busquedaRef.current && !busquedaRef.current.contains(e.target as Node)) setDropdownAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{
      padding: '1rem 1.25rem 0.75rem',
      background: 'white',
      borderBottom: '1px solid #f0f0f5',
      position: 'sticky', top: 0, zIndex: 40,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

        {/* Título */}
        <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a1a2e', margin: 0, letterSpacing: '-0.01em' }}>
          {titulo}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* Buscador colapsable */}
          <div ref={busquedaRef} style={{ position: 'relative' }}>
            <div
              onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              onMouseLeave={() => { if (!busqueda) setSearchExpanded(false) }}
              style={{
                display: 'flex', alignItems: 'center',
                height: 36,
                width: searchExpanded ? 280 : 36,
                borderRadius: 10,
                border: `1px solid ${searchExpanded ? '#bfdbfe' : '#f0f0f5'}`,
                background: searchExpanded ? 'white' : '#f8fafc',
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), border-color 0.2s, box-shadow 0.2s',
                overflow: 'hidden',
                cursor: searchExpanded ? 'text' : 'pointer',
                boxShadow: searchExpanded ? '0 0 0 3px rgba(191,219,254,0.4)' : 'none',
                flexShrink: 0,
              }}>
              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                onBlur={() => { if (!busqueda) setSearchExpanded(false) }}
                placeholder="Buscar alumnos..."
                style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#374151', background: 'transparent', width: '100%', paddingRight: '0.5rem', opacity: searchExpanded ? 1 : 0, transition: 'opacity 0.2s' }}
              />
              {busqueda && searchExpanded && (
                <button onClick={() => handleBusqueda('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', paddingRight: '0.5rem', fontSize: '1rem', flexShrink: 0 }}>✕</button>
              )}
            </div>

            {dropdownAbierto && sugerencias.length > 0 && (
              <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', width: 300, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f0f0f5', zIndex: 100, overflow: 'hidden' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c0c0d0', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, padding: '0.75rem 1rem 0.375rem' }}>Alumnos</p>
                {sugerencias.map(a => (
                  <button key={a.id} onClick={() => seleccionarAlumno(a)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #f8fafc', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e6fcc,#155ca0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {a.nombre.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</p>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>Grupo {a.grupo} · {a.semestre}° Sem.</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {dropdownAbierto && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
              <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', width: 260, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #f0f0f5', zIndex: 100, padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Sin resultados</p>
              </div>
            )}
          </div>

          {/* Mensajes */}
          <IconBtn onClick={() => setMensajesAbierto(true)}>
            <svg width="15" height="15" fill="none" stroke="#6b7280" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </IconBtn>

          {/* Notificaciones */}
          <IconBtn onClick={() => setPanelAbierto(p => !p)} active={panelAbierto} badge={noLeidas}>
            <svg width="15" height="15" fill="none" stroke="#6b7280" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </IconBtn>

          {/* Divisor */}
          <div style={{ width: 1, height: 20, background: '#f0f0f5', flexShrink: 0 }}/>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1e6fcc,#155ca0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>D</div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', margin: 0, lineHeight: 1.2 }}>Dir. Gral.</p>
              <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>Director</p>
            </div>
          </div>

        </div>
      </div>

      {alumnoSelec && <CardAlumno alumno={alumnoSelec} onCerrar={() => setAlumnoSelec(null)} />}

      {/* Modal notificaciones */}
      {panelAbierto && typeof window !== 'undefined' && createPortal(
        <>
          <style>{`
            @keyframes notifBackdropIn  { from{opacity:0} to{opacity:1} }
            @keyframes notifBackdropOut { from{opacity:1} to{opacity:0} }
            @keyframes notifIn  { from{opacity:0;transform:scale(0.9) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes notifOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.9) translateY(12px)} }
          `}</style>
          <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: notifCerrando?'notifBackdropOut 0.28s ease forwards':'notifBackdropIn 0.22s ease' }}/>
          <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ background:'white', borderRadius:'1.25rem', boxShadow:'0 24px 64px rgba(0,0,0,0.14)', width:400, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', pointerEvents:'all', animation: notifCerrando?'notifOut 0.28s cubic-bezier(0.4,0,0.2,1) forwards':'notifIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.125rem 1.5rem 1rem', borderBottom:'1px solid #f4f4f8', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1a1a2e', margin:0 }}>Notificaciones</p>
                  {noLeidas > 0 && <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:'9999px', background:'#ef4444', color:'white' }}>{noLeidas}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  {noLeidas > 0 && (
                    <button onClick={marcarTodasLeidas} style={{ fontSize:'0.75rem', fontWeight:500, color:'#1e6fcc', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      Marcar todas
                    </button>
                  )}
                  <button onClick={cerrarNotifs} style={{ width:28, height:28, borderRadius:'50%', background:'#f4f4f8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:'0.875rem', fontWeight:700 }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#ebebf0')}
                    onMouseLeave={e=>(e.currentTarget.style.background='#f4f4f8')}>✕</button>
                </div>
              </div>

              <div style={{ overflowY:'auto', flex:1 }}>
                {notifs.map(n => {
                  const icono = iconoTipo[n.tipo]
                  return (
                    <div key={n.id} onClick={() => marcarLeida(n.id)}
                      style={{ display:'flex', gap:'0.875rem', padding:'1rem 1.5rem', cursor:'pointer', background: n.leida?'white':'#f8fbff', borderBottom:'1px solid #f4f4f8', transition:'background 0.12s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                      onMouseLeave={e=>(e.currentTarget.style.background=n.leida?'white':'#f8fbff')}>
                      <div style={{ width:38, height:38, borderRadius:10, background:icono.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                        <svg width="16" height="16" fill="none" stroke={icono.color} strokeWidth="1.8" viewBox="0 0 24 24">{icono.svg}</svg>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                          <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'#1a1a2e', margin:0 }}>{n.titulo}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexShrink:0 }}>
                            <p style={{ fontSize:'0.7rem', color:'#c0c0d0', margin:0 }}>{n.fecha}</p>
                            {!n.leida && <span style={{ width:7, height:7, borderRadius:'50%', background:'#1e6fcc', display:'inline-block' }}/>}
                          </div>
                        </div>
                        <p style={{ fontSize:'0.75rem', color:'#6b7280', margin:'0.25rem 0 0', lineHeight:1.5 }}>{n.mensaje}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding:'0.875rem 1.5rem', borderTop:'1px solid #f4f4f8', textAlign:'center', flexShrink:0 }}>
                <p style={{ fontSize:'0.65rem', color:'#c0c0d0', margin:0 }}>Notificaciones de Dinoti Platforms</p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {mensajesAbierto && typeof window !== 'undefined' && (
        <Mensajeria onCerrar={() => setMensajesAbierto(false)} />
      )}
    </div>
  )
}