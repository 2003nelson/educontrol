'use client'
import { useState } from 'react'
import { type Docente } from '@/components/DocenteModal'

const PALETA = [
  { from: '#3b82f6', to: '#2563eb' },
  { from: '#8b5cf6', to: '#7c3aed' },
  { from: '#14b8a6', to: '#0d9488' },
  { from: '#f59e0b', to: '#d97706' },
  { from: '#ec4899', to: '#db2777' },
  { from: '#10b981', to: '#059669' },
]

function getColor(nombre: string) {
  return PALETA[nombre.charCodeAt(0) % PALETA.length]
}

export function ModalEliminarAsignaturas({
  docente, onGuardar, onCerrar,
}: {
  docente: Docente
  onGuardar: (ids: string[]) => void
  onCerrar: () => void
}) {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const col = getColor(docente.nombre_completo)

  function toggleSeleccion(i: number) {
    setSeleccionadas(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  function eliminar() {
    const ids = docente.asignaciones.filter((_, i) => seleccionadas.includes(i)).map(a => a.id)
    onGuardar(ids)
  }

  if (confirmando) {
    const selec = docente.asignaciones.filter((_, i) => seleccionadas.includes(i))
    return (
      <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '420px', maxHeight: '88vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 0.5rem', textAlign: 'center' }}>¿Confirmar eliminación?</h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 0.25rem', textAlign: 'center' }}>
            Se eliminarán <strong>{seleccionadas.length}</strong> asignación{seleccionadas.length > 1 ? 'es' : ''} de
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 1rem', textAlign: 'center' }}>{docente.nombre_completo}</p>
          <div style={{ width: '100%', background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 220, overflowY: 'auto' }}>
            {selec.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: '#fee2e2', color: '#dc2626' }}>{a.grupo_grado}°-{a.grupo_numero}</span>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }}>{a.asignatura_nombre}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.5rem', textAlign: 'center' }}>Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button onClick={() => setConfirmando(false)} style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Regresar</button>
            <button onClick={eliminar} style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 1.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Eliminar asignaturas</h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{docente.nombre_completo}</p>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: '0.875rem 1.75rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
          <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>Selecciona las asignaciones a eliminar. Esta acción es para fin de semestre.</p>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.75rem' }}>
          {docente.asignaciones.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Sin asignaciones</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {docente.asignaciones.map((a, i) => {
                const marcada = seleccionadas.includes(i)
                return (
                  <button key={i} onClick={() => toggleSeleccion(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', border: marcada ? '2px solid #dc2626' : '1px solid #e2e8f0', background: marcada ? '#fef2f2' : 'white', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: marcada ? '2px solid #dc2626' : '2px solid #e2e8f0', background: marcada ? '#dc2626' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {marcada && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '0.375rem', flexShrink: 0, background: marcada ? '#fee2e2' : `linear-gradient(135deg, ${col.from}18, ${col.to}18)`, color: marcada ? '#dc2626' : col.from, border: `1px solid ${marcada ? '#fecaca' : col.from + '30'}` }}>
                      {a.grupo_grado}°-{a.grupo_numero}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: marcada ? '#dc2626' : '#1e3a5f' }}>{a.asignatura_nombre}</span>
                    {marcada && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600, color: '#dc2626' }}>Se eliminará</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, flex: 1 }}>
            {seleccionadas.length === 0 ? 'Selecciona asignaciones' : `${seleccionadas.length} seleccionada${seleccionadas.length > 1 ? 's' : ''}`}
          </p>
          <button onClick={onCerrar} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => setConfirmando(true)} disabled={seleccionadas.length === 0}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', cursor: seleccionadas.length === 0 ? 'not-allowed' : 'pointer', background: seleccionadas.length === 0 ? '#e2e8f0' : '#dc2626', color: seleccionadas.length === 0 ? '#94a3b8' : 'white' }}>
            Eliminar seleccionadas
          </button>
        </div>
      </div>
    </div>
  )
}