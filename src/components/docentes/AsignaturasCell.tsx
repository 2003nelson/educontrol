'use client'
import { type Docente } from '@/hooks/useDocentes'

export function AsignaturasCell({ docente, expandido, onToggle }: {
  docente: Docente
  expandido: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.375rem', borderRadius: 8 }}
    >
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }}/>
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }}/>
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }}/>
      <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginLeft: 3 }}>
        {docente.asignaciones.length}
      </span>
      <svg width="10" height="10" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24"
        style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 1 }}>
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}