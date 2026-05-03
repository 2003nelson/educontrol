'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'
import DocenteModal, { type Docente } from '@/components/DocenteModal'
import { ModalInvitarDocente } from '@/components/ModalInvitarDocente'
import { ModalEliminarAsignaturas } from '@/components/ModalEliminarAsignaturas'
import { useDocentes } from '@/hooks/useDocentes'
import { AgregarDocenteBtn } from '@/components/docentes/AgregarDocenteBtn'
import { TablaDocentes } from '@/components/docentes/TablaDocentes'

export default function DocentesPage() {
  const { docentes, loading, error: hookError, crearDocente, editarDocente, eliminarDocente, eliminarAsignaciones, recargar } = useDocentes()

  const [busqueda, setBusqueda]                            = useState('')
  const [modalAbierto, setModalAbierto]                    = useState(false)
  const [docenteEditando, setDocenteEditando]              = useState<Docente | null>(null)
  const [docenteLimpiarAsig, setDocenteLimpiarAsig]        = useState<Docente | null>(null)
  const [docenteAEliminar, setDocenteAEliminar]            = useState<Docente | null>(null)
  const [docenteInvitando, setDocenteInvitando]            = useState<Docente | null>(null)
  const [docenteAgregado, setDocenteAgregado]              = useState(false)
  const [searchExpanded, setSearchExpanded]                = useState(false)
  const [docenteExpandido, setDocenteExpandido]            = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  async function handleGuardar(data: { nombre_completo: string; email: string; asignaciones: { grupo_id: string; asignatura_id: string }[] }) {
    if (docenteEditando) {
      const ok = await editarDocente(docenteEditando.id, { nombre_completo: data.nombre_completo, asignaciones: data.asignaciones })
      if (ok) { setModalAbierto(false); setDocenteEditando(null) }
    } else {
      const ok = await crearDocente(data)
      if (ok) { setModalAbierto(false); setDocenteAgregado(true); setTimeout(() => setDocenteAgregado(false), 2500) }
    }
  }

  async function confirmarEliminar() {
    if (!docenteAEliminar) return
    const ok = await eliminarDocente(docenteAEliminar.id)
    if (ok) setDocenteAEliminar(null)
  }

  async function handleEliminarAsignaturas(ids: string[]) {
    if (!docenteLimpiarAsig) return
    const ok = await eliminarAsignaciones(docenteLimpiarAsig.id, ids)
    if (ok) setDocenteLimpiarAsig(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes pageIn { from { opacity:0; transform:translateX(18px) scale(0.985) } to { opacity:1; transform:translateX(0) scale(1) } }
        @keyframes xBd    { from { opacity:0 } to { opacity:1 } }
        @keyframes xSp    { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>

      <Header titulo="Directorio de Docentes" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.5rem', height: 'calc(100vh - 61px)', overflow: 'hidden', animation: 'pageIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Barra de acciones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '0.75rem' }}>
          <div
            onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
            onMouseLeave={() => { if (!busqueda) setSearchExpanded(false) }}
            style={{ display: 'flex', alignItems: 'center', height: 38, width: searchExpanded ? 300 : 38, borderRadius: '0.875rem', border: '1px solid #e8e8f0', background: 'white', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s', overflow: 'hidden', cursor: searchExpanded ? 'text' : 'pointer', boxShadow: searchExpanded ? '0 0 0 3px rgba(191,219,254,0.4)' : 'none', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input ref={searchInputRef} type="text" placeholder="Buscar por nombre, asignatura o grupo..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => { if (!busqueda) setSearchExpanded(false) }}
              style={{ border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#374151', background: 'transparent', width: 'calc(100% - 38px)', paddingRight: '0.75rem', opacity: searchExpanded ? 1 : 0, transition: 'opacity 0.2s' }}/>
            {busqueda && searchExpanded && (
              <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', paddingRight: '0.5rem', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {[
                { letra: 'I', label: 'Invitar',           bg: '#f0fdf4', color: '#16a34a' },
                { letra: 'E', label: 'Editar',            bg: '#eff6ff', color: '#2563eb' },
                { letra: 'A', label: 'Elim. asignaturas', bg: '#fffbeb', color: '#d97706' },
                { letra: 'X', label: 'Eliminar docente',  bg: '#fef2f2', color: '#dc2626' },
              ].map(l => (
                <div key={l.letra} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: l.bg, color: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, fontFamily: 'Outfit, sans-serif' }}>{l.letra}</div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ width: 1, height: 24, background: '#f0f0f5' }}/>
            <AgregarDocenteBtn
              agregado={docenteAgregado}
              onClick={() => { setDocenteEditando(null); setModalAbierto(true) }}
            />
          </div>
        </div>

        {hookError && (
          <div style={{ padding: '0.875rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', flexShrink: 0 }}>
            <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>⚠️ {hookError}</p>
          </div>
        )}

        <TablaDocentes
          docentes={docentes}
          loading={loading}
          busqueda={busqueda}
          docenteExpandido={docenteExpandido}
          onToggleExpandido={id => setDocenteExpandido(prev => prev === id ? null : id)}
          onInvitar={setDocenteInvitando}
          onEditar={d => { setDocenteEditando(d); setModalAbierto(true) }}
          onEliminarAsignaturas={setDocenteLimpiarAsig}
          onEliminar={setDocenteAEliminar}
        />
      </div>

      {/* Modales */}
      {docenteInvitando && typeof window !== 'undefined' && createPortal(
        <ModalInvitarDocente
          docenteId={docenteInvitando.id}
          docenteNombre={docenteInvitando.nombre_completo}
          docenteEmail={docenteInvitando.email}
          onClose={() => setDocenteInvitando(null)}
          onSuccess={() => { setDocenteInvitando(null); recargar() }}
        />, document.body
      )}

      {docenteLimpiarAsig && typeof window !== 'undefined' && createPortal(
        <ModalEliminarAsignaturas
          docente={docenteLimpiarAsig}
          onGuardar={handleEliminarAsignaturas}
          onCerrar={() => setDocenteLimpiarAsig(null)}
        />, document.body
      )}

      {modalAbierto && (
        <DocenteModal
          docente={docenteEditando}
          onGuardar={handleGuardar}
          onCerrar={() => { setModalAbierto(false); setDocenteEditando(null) }}
        />
      )}

      {docenteAEliminar && typeof window !== 'undefined' && createPortal(
        <div onClick={() => setDocenteAEliminar(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'xBd 0.25s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.16)', width: '100%', maxWidth: 360, padding: '2.5rem', animation: 'xSp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 0.5rem', textAlign: 'center' }}>¿Estás seguro?</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem', textAlign: 'center' }}>Estás a punto de eliminar a</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 0.75rem', textAlign: 'center' }}>{docenteAEliminar.nombre_completo}</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 1.75rem', textAlign: 'center' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDocenteAEliminar(null)}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.875rem', border: 'none', background: '#1e6fcc', color: 'white', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#155ca0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1e6fcc')}>
                Cancelar
              </button>
              <button onClick={confirmarEliminar}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.875rem', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
                Eliminar
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}