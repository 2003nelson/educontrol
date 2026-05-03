'use client'
import { useState, useRef } from 'react'

export function AgregarDocenteBtn({ agregado, onClick }: { agregado: boolean; onClick: () => void }) {
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

  const expandido = hov && !agregado

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: expandido ? '0.5rem' : 0,
        height: 40,
        width: agregado ? 'auto' : expandido ? 'auto' : 40,
        minWidth: agregado ? 160 : expandido ? 110 : 40,
        padding: expandido || agregado ? '0 1.25rem' : 0,
        borderRadius: expandido || agregado ? '0.875rem' : '50%',
        background: agregado ? '#16a34a' : expandido ? '#2563eb' : '#1e6fcc',
        border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
        overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0,
        color: 'white', boxShadow: '0 2px 8px rgba(30,111,204,0.25)',
      }}
    >
      {agregado ? (
        <>
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {' '}Docente agregado
        </>
      ) : (
        <>
          <span style={{ fontSize: '1.25rem', lineHeight: 1, fontWeight: 300, flexShrink: 0 }}>+</span>
          {expandido && <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Agregar</span>}
        </>
      )}
    </button>
  )
}