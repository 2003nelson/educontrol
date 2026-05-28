// src/components/Header.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAlumnoSearch } from './useAlumnoSearch'
import AlumnoCard from './AlumnoCard'
import Mensajeria from './Mensajeria'

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

export default function Header({ titulo }: { titulo: string }) {
  const {
    query, sugerencias, cargando, dropdownAbierto, alumnoSelec,
    cargandoDetalle, handleInput, seleccionarAlumno, cerrarDetalle,
    cerrarDropdown, limpiarQuery,
  } = useAlumnoSearch()

  const [notifs, setNotifs]               = useState<Notificacion[]>(notificacionesMock)
  const [panelAbierto, setPanelAbierto]   = useState(false)
  const [mensajesAbierto, setMensajesAbierto] = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const [notifCerrando, setNotifCerrando]     = useState(false)

  const busquedaRef    = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const noLeidas = notifs.filter(n => !n.leida).length

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
      padding: '0 1.5rem',
      height: 52,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      position: 'sticky', top: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes hdBtnPop { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      {/* Título */}
      <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1c1c1e', margin: 0, letterSpacing: '-0.015em' }}>
        {titulo}
      </h1>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>

        {/* Buscador */}
        <div ref={busquedaRef} style={{ position: 'relative', marginRight: '0.125rem' }}>
          <div
            onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
            onMouseLeave={() => { if (!query) setSearchExpanded(false) }}
            style={{
              display: 'flex', alignItems: 'center',
              height: 36,
              width: searchExpanded ? 220 : 36,
              borderRadius: 8,
              border: `1px solid ${searchExpanded ? '#3b82f6' : 'rgba(59,130,246,0.35)'}`,
              background: searchExpanded ? 'white' : 'rgba(59,130,246,0.04)',
              transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.15s, background 0.15s',
              overflow: 'hidden',
              cursor: searchExpanded ? 'text' : 'pointer',
              boxShadow: searchExpanded ? '0 0 0 3px rgba(59,130,246,0.18)' : '0 0 0 2px rgba(59,130,246,0.08)',
            }}
          >
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cargando ? (
                <div style={{ width: 12, height: 12, border: '1.5px solid #e2e8f0', borderTopColor: '#6b7280', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <svg width="17" height="17" fill="none" stroke={searchExpanded ? '#1c1c1e' : '#3b82f6'} strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              )}
            </div>
            <input
              ref={searchInputRef}
              type="text" value={query}
              onChange={e => handleInput(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => { if (!query) setSearchExpanded(false) }}
              placeholder="Buscar alumno..."
              autoComplete="off"
              style={{ border:'none', outline:'none', fontSize:'0.78rem', color:'#1c1c1e', background:'transparent', width:'100%', paddingRight:'0.375rem', opacity: searchExpanded ? 1 : 0, transition:'opacity 0.15s' }}
            />
            {query && searchExpanded && (
              <button onClick={limpiarQuery} style={{ background:'none', border:'none', cursor:'pointer', color:'#8e8e93', paddingRight:'0.5rem', fontSize:'0.875rem', flexShrink:0, lineHeight:1 }}>✕</button>
            )}
          </div>

          {/* Dropdown */}
          {dropdownAbierto && sugerencias.length > 0 && (
            <div style={{ position:'absolute', left:0, top:'calc(100% + 8px)', width:280, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)', zIndex:100, overflow:'hidden', animation:'hdBtnPop 0.18s ease' }}>
              <p style={{ fontSize:'0.6rem', fontWeight:600, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase', margin:0, padding:'0.625rem 0.875rem 0.25rem' }}>Alumnos</p>
              {sugerencias.map(a => (
                <button key={a.id} onClick={() => seleccionarAlumno(a)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 0.875rem', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1e40af,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'white', flexShrink:0 }}>
                    {a.nombre_completo.charAt(0)}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#1c1c1e', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombre_completo}</p>
                    <p style={{ fontSize:'0.65rem', color:'#8e8e93', margin:0 }}>{a.grupo_label} · {a.matricula}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {dropdownAbierto && sugerencias.length === 0 && query.length >= 2 && !cargando && (
            <div style={{ position:'absolute', left:0, top:'calc(100% + 8px)', width:220, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(20px)', borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)', zIndex:100, padding:'1rem', textAlign:'center' }}>
              <p style={{ fontSize:'0.78rem', color:'#8e8e93', margin:0 }}>Sin resultados</p>
            </div>
          )}
          {cargandoDetalle && typeof window !== 'undefined' && createPortal(
            <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)', backdropFilter:'blur(4px)' }}>
              <div style={{ background:'white', borderRadius:'1rem', padding:'1.25rem 2rem', display:'flex', alignItems:'center', gap:'0.75rem', boxShadow:'0 16px 48px rgba(0,0,0,0.14)' }}>
                <div style={{ width:16, height:16, border:'2px solid #e2e8f0', borderTopColor:'#1e40af', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                <p style={{ fontSize:'0.82rem', fontWeight:600, color:'#1c1c1e', margin:0 }}>Cargando alumno...</p>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* ── Botones estilo macOS menubar ── */}
        {/* Mensajes */}
        <HeaderBtn onClick={() => setMensajesAbierto(true)} title="Mensajes">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </HeaderBtn>

        {/* Notificaciones */}
        <HeaderBtn onClick={() => setPanelAbierto(p => !p)} active={panelAbierto} title="Notificaciones" badge={noLeidas}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </HeaderBtn>
      </div>

      {/* Card alumno */}
      {alumnoSelec && <AlumnoCard alumno={alumnoSelec} onCerrar={cerrarDetalle} />}

      {/* Panel notificaciones */}
      {panelAbierto && typeof window !== 'undefined' && createPortal(
        <>
          <style>{`
            @keyframes notifBackdropIn  { from{opacity:0} to{opacity:1} }
            @keyframes notifBackdropOut { from{opacity:1} to{opacity:0} }
            @keyframes notifIn  { from{opacity:0;transform:translateY(-8px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes notifOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-8px) scale(0.96)} }
          `}</style>
          <div style={{ position:'fixed', inset:0, zIndex:9990, animation: notifCerrando ? 'notifBackdropOut 0.28s ease forwards' : 'notifBackdropIn 0.18s ease' }}
            onClick={cerrarNotifs}/>
          <div style={{ position:'fixed', top:60, right:16, zIndex:9991, width:360, maxHeight:'75vh', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', animation: notifCerrando ? 'notifOut 0.24s cubic-bezier(0.4,0,0.2,1) forwards' : 'notifIn 0.28s cubic-bezier(0.34,1.3,0.64,1)' }}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.125rem 0.75rem', borderBottom:'1px solid rgba(0,0,0,0.06)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1c1c1e', margin:0 }}>Notificaciones</p>
                {noLeidas > 0 && <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'1px 6px', borderRadius:9999, background:'#ff3b30', color:'white' }}>{noLeidas}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                {noLeidas > 0 && (
                  <button onClick={marcarTodasLeidas} style={{ fontSize:'0.72rem', fontWeight:500, color:'#007aff', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Marcar todas
                  </button>
                )}
                <button onClick={cerrarNotifs}
                  style={{ width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#8e8e93', fontSize:'0.7rem', fontWeight:700 }}>
                  ✕
                </button>
              </div>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>
              {notifs.map(n => {
                const icono = iconoTipo[n.tipo]
                return (
                  <div key={n.id} onClick={() => marcarLeida(n.id)}
                    style={{ display:'flex', gap:'0.75rem', padding:'0.875rem 1.125rem', cursor:'pointer', background: n.leida ? 'transparent' : 'rgba(0,122,255,0.04)', borderBottom:'1px solid rgba(0,0,0,0.04)', transition:'background 0.1s' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background='rgba(0,0,0,0.03)')}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = n.leida ? 'transparent' : 'rgba(0,122,255,0.04)')}>
                    <div style={{ width:34, height:34, borderRadius:9, background:icono.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <svg width="15" height="15" fill="none" stroke={icono.color} strokeWidth="1.8" viewBox="0 0 24 24">{icono.svg}</svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                        <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#1c1c1e', margin:0 }}>{n.titulo}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                          <p style={{ fontSize:'0.65rem', color:'#8e8e93', margin:0 }}>{n.fecha}</p>
                          {!n.leida && <div style={{ width:6, height:6, borderRadius:'50%', background:'#007aff', flexShrink:0 }}/>}
                        </div>
                      </div>
                      <p style={{ fontSize:'0.72rem', color:'#6b7280', margin:'3px 0 0', lineHeight:1.5 }}>{n.mensaje}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding:'0.625rem 1.125rem', borderTop:'1px solid rgba(0,0,0,0.06)', textAlign:'center', flexShrink:0 }}>
              <p style={{ fontSize:'0.62rem', color:'#c0c0d0', margin:0 }}>Notificaciones de Dinoti Platforms</p>
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

// ── Botón estilo macOS menubar ────────────────────────────────────────────────
function HeaderBtn({ onClick, active, children, badge, title }: {
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  badge?: number
  title?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: 9,
        border: `1px solid ${active || hov ? 'rgba(0,0,0,0.09)' : 'rgba(0,0,0,0.06)'}`,
        background: active || hov ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.12s',
        color: active ? '#1c1c1e' : '#3a3a3c',
        flexShrink: 0,
      }}
    >
      {children}
      {badge && badge > 0 ? (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 16, height: 16, borderRadius: 8,
          background: '#ff3b30', color: 'white',
          fontSize: '0.55rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid white',
          padding: '0 2px',
        }}>{badge}</span>
      ) : null}
    </button>
  )
}