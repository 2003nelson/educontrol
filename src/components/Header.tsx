'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAlumnoSearch } from './useAlumnoSearch'
import AlumnoCard from './AlumnoCard'
import Mensajeria from './Mensajeria'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Notificacion = {
  id: string
  tipo: 'actualizacion' | 'aviso' | 'pago'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

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

// ─── Botón icono ──────────────────────────────────────────────────────────────
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

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header({ titulo }: { titulo: string }) {
  const {
    query,
    sugerencias,
    cargando,
    dropdownAbierto,
    alumnoSelec,
    cargandoDetalle,
    handleInput,
    seleccionarAlumno,
    cerrarDetalle,
    cerrarDropdown,
    limpiarQuery,
  } = useAlumnoSearch()

  const [notifs, setNotifs]                   = useState<Notificacion[]>(notificacionesMock)
  const [panelAbierto, setPanelAbierto]       = useState(false)
  const [mensajesAbierto, setMensajesAbierto] = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const [notifCerrando, setNotifCerrando]     = useState(false)

  const busquedaRef    = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const noLeidas = notifs.filter(n => !n.leida).length

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (busquedaRef.current && !busquedaRef.current.contains(e.target as Node)) {
        cerrarDropdown()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [cerrarDropdown])

  function cerrarNotifs() {
    setNotifCerrando(true)
    setTimeout(() => { setPanelAbierto(false); setNotifCerrando(false) }, 280)
  }
  function marcarLeida(id: string) { setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n)) }
  function marcarTodasLeidas()     { setNotifs(prev => prev.map(n => ({ ...n, leida: true }))) }

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

          {/* ── Buscador colapsable ── */}
          <div ref={busquedaRef} style={{ position: 'relative' }}>
            <div
              onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              onMouseLeave={() => { if (!query) setSearchExpanded(false) }}
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
              }}
            >
              {/* Icono lupa / spinner */}
              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {cargando ? (
                  <div style={{ width: 13, height: 13, border: '2px solid #e2e8f0', borderTopColor: '#6b7280', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => handleInput(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                onBlur={() => { if (!query) setSearchExpanded(false) }}
                placeholder="Buscar alumno..."
                autoComplete="off"
                style={{
                  border: 'none', outline: 'none',
                  fontSize: '0.8rem', color: '#374151',
                  background: 'transparent', width: '100%',
                  paddingRight: '0.5rem',
                  opacity: searchExpanded ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              />
              {query && searchExpanded && (
                <button
                  onClick={limpiarQuery}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', paddingRight: '0.5rem', fontSize: '1rem', flexShrink: 0 }}
                >✕</button>
              )}
            </div>

            {/* Dropdown de sugerencias */}
            {dropdownAbierto && sugerencias.length > 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 'calc(100% + 6px)',
                width: 300, background: 'white',
                borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #f0f0f5', zIndex: 100, overflow: 'hidden',
              }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c0c0d0', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, padding: '0.75rem 1rem 0.375rem' }}>
                  Alumnos
                </p>
                {sugerencias.map(a => (
                  <button
                    key={a.id}
                    onClick={() => seleccionarAlumno(a)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #f8fafc', transition: 'background 0.12s' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {a.nombre_completo.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.nombre_completo}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>
                        {a.grupo_label} · Mat. {a.matricula}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sin resultados */}
            {dropdownAbierto && sugerencias.length === 0 && query.length >= 2 && !cargando && (
              <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', width: 260, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #f0f0f5', zIndex: 100, padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Sin resultados</p>
              </div>
            )}

            {/* Spinner cargando detalle */}
            {cargandoDetalle && typeof window !== 'undefined' && createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '0.875rem', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}>
                  <div style={{ width: 18, height: 18, border: '2.5px solid #e2e8f0', borderTopColor: '#1e40af', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Cargando alumno...</p>
                </div>
              </div>,
              document.body
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
          <div style={{ width: 1, height: 20, background: '#f0f0f5', flexShrink: 0 }} />

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>D</div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', margin: 0, lineHeight: 1.2 }}>Dir. Gral.</p>
              <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>Director</p>
            </div>
          </div>

        </div>
      </div>

      {/* Card detalle alumno */}
      {alumnoSelec && <AlumnoCard alumno={alumnoSelec} onCerrar={cerrarDetalle} />}

      {/* ── Modal notificaciones ── */}
      {panelAbierto && typeof window !== 'undefined' && createPortal(
        <>
          <style>{`
            @keyframes notifBackdropIn  { from{opacity:0} to{opacity:1} }
            @keyframes notifBackdropOut { from{opacity:1} to{opacity:0} }
            @keyframes notifIn  { from{opacity:0;transform:scale(0.9) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes notifOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.9) translateY(12px)} }
          `}</style>
          <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: notifCerrando ? 'notifBackdropOut 0.28s ease forwards' : 'notifBackdropIn 0.22s ease' }} />
          <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ background:'white', borderRadius:'1.25rem', boxShadow:'0 24px 64px rgba(0,0,0,0.14)', width:400, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', pointerEvents:'all', animation: notifCerrando ? 'notifOut 0.28s cubic-bezier(0.4,0,0.2,1) forwards' : 'notifIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.125rem 1.5rem 1rem', borderBottom:'1px solid #f4f4f8', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1a1a2e', margin:0 }}>Notificaciones</p>
                  {noLeidas > 0 && <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:9999, background:'#ef4444', color:'white' }}>{noLeidas}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  {noLeidas > 0 && (
                    <button onClick={marcarTodasLeidas} style={{ fontSize:'0.75rem', fontWeight:500, color:'#1e6fcc', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      Marcar todas
                    </button>
                  )}
                  <button onClick={cerrarNotifs} style={{ width:28, height:28, borderRadius:'50%', background:'#f4f4f8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:'0.875rem', fontWeight:700 }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#ebebf0')}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#f4f4f8')}
                  >✕</button>
                </div>
              </div>

              <div style={{ overflowY:'auto', flex:1 }}>
                {notifs.map(n => {
                  const icono = iconoTipo[n.tipo]
                  return (
                    <div key={n.id} onClick={() => marcarLeida(n.id)}
                      style={{ display:'flex', gap:'0.875rem', padding:'1rem 1.5rem', cursor:'pointer', background: n.leida ? 'white' : '#f8fbff', borderBottom:'1px solid #f4f4f8', transition:'background 0.12s' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = n.leida ? 'white' : '#f8fbff')}
                    >
                      <div style={{ width:38, height:38, borderRadius:10, background:icono.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                        <svg width="16" height="16" fill="none" stroke={icono.color} strokeWidth="1.8" viewBox="0 0 24 24">{icono.svg}</svg>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                          <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'#1a1a2e', margin:0 }}>{n.titulo}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexShrink:0 }}>
                            <p style={{ fontSize:'0.7rem', color:'#c0c0d0', margin:0 }}>{n.fecha}</p>
                            {!n.leida && <span style={{ width:7, height:7, borderRadius:'50%', background:'#1e6fcc', display:'inline-block' }} />}
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