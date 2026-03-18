'use client'
import { useState } from 'react'

type Notificacion = {
  id: string
  tipo: 'actualizacion' | 'aviso' | 'pago'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

// Mock de notificaciones enviadas por Dinoti Platforms
const notificacionesMock: Notificacion[] = [
  {
    id: '1',
    tipo: 'pago',
    titulo: 'Pago pendiente',
    mensaje: 'Tu suscripción vence en 3 días. Realiza tu pago para mantener el acceso al sistema.',
    fecha: 'Hoy',
    leida: false,
  },
  {
    id: '2',
    tipo: 'actualizacion',
    titulo: 'Nueva actualización disponible',
    mensaje: 'EduControl v1.2 ya está activo. Ahora puedes generar boletas en PDF directamente.',
    fecha: 'Ayer',
    leida: false,
  },
  {
    id: '3',
    tipo: 'aviso',
    titulo: 'Mantenimiento programado',
    mensaje: 'El domingo 23 de marzo de 2:00 a 4:00 AM el sistema estará en mantenimiento.',
    fecha: '15 Mar',
    leida: true,
  },
]

const iconoTipo = {
  pago:         { bg: '#fef2f2', color: '#dc2626', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/> },
  actualizacion: { bg: '#eff6ff', color: '#2563eb', svg: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
  aviso:        { bg: '#fffbeb', color: '#d97706', svg: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
}

export default function Header({ titulo }: { titulo: string }) {
  const [notifs, setNotifs]         = useState<Notificacion[]>(notificacionesMock)
  const [panelAbierto, setPanelAbierto] = useState(false)

  const noLeidas = notifs.filter(n => !n.leida).length

  function marcarLeida(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  function marcarTodasLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return (
    <div className="px-4 pt-4">
      <header
        className="flex items-center justify-between px-6 py-3 rounded-2xl"
        style={{
          background:           'rgba(255,255,255,0.75)',
          backdropFilter:       'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:               '1px solid rgba(255,255,255,0.6)',
          boxShadow:            '0 2px 12px rgba(60,80,120,0.07)',
        }}
      >
        <h1 className="text-base font-semibold tracking-tight"
          style={{ color: '#1e3a5f', fontFamily: 'DM Sans, sans-serif' }}>
          {titulo}
        </h1>

        <div className="flex items-center gap-3">
          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar alumnos, grupos o reportes..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border:     '1px solid rgba(180,200,230,0.5)',
                color:      '#334155',
              }}
            />
          </div>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setPanelAbierto(prev => !prev)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: panelAbierto ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                border:     '1px solid rgba(180,200,230,0.4)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => {
                if (!panelAbierto) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {noLeidas > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ background: '#dc2626', fontSize: '9px', fontWeight: 700 }}>
                  {noLeidas}
                </span>
              )}
            </button>

            {/* Panel de notificaciones */}
            {panelAbierto && (
              <div
                className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ width: '340px', border: '1px solid #e2e8f0' }}
              >
                {/* Header panel */}
                <div className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>Notificaciones</p>
                    {noLeidas > 0 && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: '#dc2626' }}>
                        {noLeidas}
                      </span>
                    )}
                  </div>
                  {noLeidas > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      className="text-xs font-medium transition"
                      style={{ color: '#3b82f6' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#3b82f6')}
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>

                {/* Lista */}
                <div className="divide-y" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm" style={{ color: '#94a3b8' }}>Sin notificaciones</p>
                    </div>
                  ) : (
                    notifs.map(n => {
                      const icono = iconoTipo[n.tipo]
                      return (
                        <div
                          key={n.id}
                          onClick={() => marcarLeida(n.id)}
                          className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                          style={{ background: n.leida ? 'white' : '#f8faff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = n.leida ? 'white' : '#f8faff')}
                        >
                          {/* Ícono tipo */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: icono.bg }}>
                            <svg width="16" height="16" fill="none" stroke={icono.color}
                              strokeWidth="1.8" viewBox="0 0 24 24">
                              {icono.svg}
                            </svg>
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold" style={{ color: '#1e3a5f' }}>{n.titulo}</p>
                              {!n.leida && (
                                <span className="w-2 h-2 rounded-full shrink-0 mt-1"
                                  style={{ background: '#3b82f6' }} />
                              )}
                            </div>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                              {n.mensaje}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>{n.fecha}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    Notificaciones enviadas por Dinoti Platforms
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#1e3a5f' }}>
              D
            </div>
            <span className="text-sm font-medium" style={{ color: '#334155' }}>Dir. Gral.</span>
          </div>
        </div>
      </header>
    </div>
  )
}