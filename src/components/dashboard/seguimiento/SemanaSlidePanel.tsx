// src/components/dashboard/seguimiento/SemanaSlidePanel.tsx
'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export type Semana = { inicio: string; fin: string; label: string }

interface Props {
  semanas: Semana[]
  semanaSelec: string | null
  onSelec: (inicio: string | null) => void
  onCerrar: () => void
}

export default function SemanaSlidePanel({ semanas, semanaSelec, onSelec, onCerrar }: Props) {
  const [fase, setFase] = useState<'entrando' | 'visible' | 'saliendo'>('entrando')

  useEffect(() => {
    // Pequeño delay para que el browser pinte el estado inicial antes de animar
    const t = requestAnimationFrame(() => setFase('visible'))
    return () => cancelAnimationFrame(t)
  }, [])

  function cerrar() {
    setFase('saliendo')
    setTimeout(onCerrar, 280)
  }

  // Duración y easing diferenciados entrada/salida
  const panelTransition = fase === 'saliendo'
    ? 'transform 0.28s ease-in, opacity 0.28s ease-in'
    : 'transform 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.36s ease-out'

  const overlayTransition = fase === 'saliendo'
    ? 'opacity 0.28s ease-in'
    : 'opacity 0.22s ease-out'

  const panelTransform = fase === 'visible' ? 'translateX(0)' : 'translateX(100%)'
  const overlayOpacity = fase === 'visible' ? 1 : 0

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', justifyContent: 'flex-end' }}>

      {/* Overlay */}
      <div
        onClick={cerrar}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(2px)',
          opacity: overlayOpacity,
          transition: overlayTransition,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 300,
        background: 'white',
        boxShadow: '-6px 0 28px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        transform: panelTransform,
        opacity: fase === 'saliendo' ? 0 : 1,
        transition: panelTransition,
      }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Semanas registradas</p>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
              {semanas.length} semana{semanas.length !== 1 ? 's' : ''} con asistencia
            </p>
          </div>
          <button
            onClick={cerrar}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {semanas.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Sin semanas con asistencia registrada aún</p>
            </div>
          ) : semanas.map((sem) => {
            const selec = semanaSelec === sem.inicio
            return (
              <button
                key={sem.inicio}
                onClick={() => { onSelec(selec ? null : sem.inicio); cerrar() }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  background: selec ? '#eff6ff' : 'white',
                  border: selec ? '1px solid #bfdbfe' : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: '0.25rem',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { if (!selec) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' } }}
                onMouseLeave={e => { if (!selec) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'transparent' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0,
                    background: selec ? 'linear-gradient(135deg,#1e3a5f,#2563eb)' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <svg width="13" height="13" fill="none" stroke={selec ? 'white' : '#94a3b8'} strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: selec ? 700 : 500, color: selec ? '#1e3a5f' : '#334155', margin: 0 }}>
                      {sem.label}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.1rem 0 0' }}>
                      Sem. {sem.inicio}
                    </p>
                  </div>
                </div>
                {selec && (
                  <svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer — quitar filtro */}
        {semanaSelec && (
          <div style={{ padding: '0.875rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => { onSelec(null); cerrar() }}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
            >
              Quitar filtro de semana
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}