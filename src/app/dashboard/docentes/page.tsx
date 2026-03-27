'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'
import DocenteModal, { type Docente, type Asignacion } from '@/components/DocenteModal'

const docentesIniciales: Docente[] = [
  {
    id: '1',
    nombre: 'Prof. Carlos Méndez',
    email: 'cmendez@escuela.edu.mx',
    asignaciones: [
      { grupo: '101', materia: 'Matemáticas' },
      { grupo: '201', materia: 'Matemáticas' },
      { grupo: '301', materia: 'Cálculo' },
    ],
  },
  {
    id: '2',
    nombre: 'Prof. Laura Sánchez',
    email: 'lsanchez@escuela.edu.mx',
    asignaciones: [
      { grupo: '102', materia: 'Español' },
      { grupo: '202', materia: 'Español' },
    ],
  },
  {
    id: '3',
    nombre: 'Prof. Roberto Pérez',
    email: 'rperez@escuela.edu.mx',
    asignaciones: [
      { grupo: '103', materia: 'Historia' },
      { grupo: '303', materia: 'Historia' },
      { grupo: '503', materia: 'Historia Universal' },
    ],
  },
]

// Color único por docente basado en su nombre
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

// Agrupa asignaciones por materia para mostrarlas de forma compacta
function agruparPorMateria(asignaciones: Asignacion[]) {
  const mapa: Record<string, string[]> = {}
  asignaciones.forEach(a => {
    if (!mapa[a.materia]) mapa[a.materia] = []
    mapa[a.materia].push(a.grupo)
  })
  return Object.entries(mapa)
}

// ─── Modal eliminar materias ──────────────────────────────────────────────────
function ModalEliminarMaterias({
  docente,
  onGuardar,
  onCerrar,
}: {
  docente: Docente
  onGuardar: (asignaciones: Asignacion[]) => void
  onCerrar: () => void
}) {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([])
  const [confirmando, setConfirmando]     = useState(false)

  function toggleSeleccion(i: number) {
    setSeleccionadas(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  function eliminar() {
    const nuevas = docente.asignaciones.filter((_, i) => !seleccionadas.includes(i))
    onGuardar(nuevas)
  }

  const col = getColor(docente.nombre)

  if (confirmando) {
    const selec = docente.asignaciones.filter((_, i) => seleccionadas.includes(i))
    return (
      <div onClick={onCerrar} style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: 'white', borderRadius: '1rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: '420px', padding: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 0.5rem', textAlign: 'center' }}>
            ¿Confirmar eliminación?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 0.25rem', textAlign: 'center' }}>
            Se eliminarán <strong>{seleccionadas.length}</strong> asignación{seleccionadas.length > 1 ? 'es' : ''} de
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 1rem', textAlign: 'center' }}>
            {docente.nombre}
          </p>
          <div style={{ width: '100%', background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {selec.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: '#fee2e2', color: '#dc2626', fontFamily: 'Outfit, sans-serif' }}>
                  {a.grupo}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }}>{a.materia}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.5rem', textAlign: 'center' }}>
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button onClick={() => setConfirmando(false)}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
              Regresar
            </button>
            <button onClick={eliminar}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '480px', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>
              Eliminar materias
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
              {docente.nombre}
            </p>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700 }}>✕</button>
        </div>

        {/* Instrucción */}
        <div style={{ padding: '0.875rem 1.75rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
          <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>
            Selecciona las asignaciones que deseas eliminar. Esta acción es para fin de semestre cuando el docente cambia de materias.
          </p>
        </div>

        {/* Lista asignaciones */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.75rem' }}>
          {docente.asignaciones.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
              Este docente no tiene asignaciones
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {docente.asignaciones.map((a, i) => {
                const marcada = seleccionadas.includes(i)
                return (
                  <button key={i} onClick={() => toggleSeleccion(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                      border: marcada ? '2px solid #dc2626' : '1px solid #e2e8f0',
                      background: marcada ? '#fef2f2' : 'white',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!marcada) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!marcada) e.currentTarget.style.background = 'white' }}
                  >
                    {/* Checkbox visual */}
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                      border: marcada ? '2px solid #dc2626' : '2px solid #e2e8f0',
                      background: marcada ? '#dc2626' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {marcada && (
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Badge grupo */}
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem', flexShrink: 0,
                      background: marcada ? '#fee2e2' : `linear-gradient(135deg, ${col.from}18, ${col.to}18)`,
                      color: marcada ? '#dc2626' : col.from,
                      border: `1px solid ${marcada ? '#fecaca' : col.from + '30'}`,
                      fontFamily: 'Outfit, sans-serif',
                    }}>
                      {a.grupo}
                    </span>

                    {/* Materia */}
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: marcada ? '#dc2626' : '#1e3a5f' }}>
                      {a.materia}
                    </span>

                    {marcada && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600, color: '#dc2626' }}>
                        Se eliminará
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, flex: 1 }}>
            {seleccionadas.length === 0
              ? 'Selecciona las asignaciones a eliminar'
              : `${seleccionadas.length} asignación${seleccionadas.length > 1 ? 'es' : ''} seleccionada${seleccionadas.length > 1 ? 's' : ''}`
            }
          </p>
          <button onClick={onCerrar}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => setConfirmando(true)}
            disabled={seleccionadas.length === 0}
            style={{
              padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
              borderRadius: '0.75rem', border: 'none', cursor: seleccionadas.length === 0 ? 'not-allowed' : 'pointer',
              background: seleccionadas.length === 0 ? '#e2e8f0' : '#dc2626',
              color: seleccionadas.length === 0 ? '#94a3b8' : 'white',
            }}
            onMouseEnter={e => { if (seleccionadas.length > 0) e.currentTarget.style.background = '#b91c1c' }}
            onMouseLeave={e => { if (seleccionadas.length > 0) e.currentTarget.style.background = '#dc2626' }}>
            Eliminar seleccionadas
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocentesPage() {
  const [docentes, setDocentes]                 = useState<Docente[]>(docentesIniciales)
  const [busqueda, setBusqueda]                 = useState('')
  const [modalAbierto, setModalAbierto]         = useState(false)
  const [docenteEditando, setDocenteEditando]   = useState<Docente | null>(null)
  const [docenteLimpiarMaterias, setDocenteLimpiarMaterias] = useState<Docente | null>(null)
  const [docenteAEliminar, setDocenteAEliminar] = useState<Docente | null>(null)

  const docentesFiltrados = docentes.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.asignaciones.some(a =>
      a.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.grupo.includes(busqueda)
    )
  )

  function handleGuardar(data: Omit<Docente, 'id'>) {
    if (docenteEditando) {
      setDocentes(prev => prev.map(d => d.id === docenteEditando.id ? { ...data, id: d.id } : d))
    } else {
      setDocentes(prev => [...prev, { ...data, id: Date.now().toString() }])
    }
    setModalAbierto(false)
    setDocenteEditando(null)
  }

  function confirmarEliminar() {
    if (!docenteAEliminar) return
    setDocentes(prev => prev.filter(d => d.id !== docenteAEliminar.id))
    setDocenteAEliminar(null)
  }

  function handleEditar(docente: Docente) {
    setDocenteEditando(docente)
    setModalAbierto(true)
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Directorio de Docentes" />

      <div className="p-6 flex flex-col" style={{ flex: 1, minHeight: 0, gap: '1rem' }}>
        {/* Barra de acciones */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input type="text" placeholder="Buscar por nombre, materia o grupo..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <button
            onClick={() => { setDocenteEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
            style={{ background: '#1e3a5f' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
            <span className="text-lg leading-none">+</span> Agregar Docente
          </button>
        </div>

        {/* Tabla rediseñada */}
        <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Cabecera */}
          <div className="grid px-6 py-3" style={{
            gridTemplateColumns: '2.5fr 2fr 2fr 1fr',
            borderBottom: '1px solid #f1f5f9',
          }}>
            {['Docente', 'Asignaciones', 'Correo', 'Acciones'].map(col => (
              <span key={col} className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                {col}
              </span>
            ))}
          </div>

          {/* Filas */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {docentesFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#94a3b8' }}>No se encontraron docentes</p>
            </div>
          ) : (
            docentesFiltrados.map((docente, idx) => {
              const col    = getColor(docente.nombre)
              const grupos = agruparPorMateria(docente.asignaciones)
              const ini    = docente.nombre
                .split(' ')
                .filter(w => w.length > 0)
                .slice(0, 2)
                .map(w => w[0].toUpperCase())
                .join('')

              return (
                <div key={docente.id}
                  className="grid px-6 py-4 items-center hover:bg-slate-50 transition-colors"
                  style={{
                    gridTemplateColumns: '2.5fr 2fr 2fr 1fr',
                    borderBottom: idx < docentesFiltrados.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>

                  {/* Columna docente */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})`, fontFamily: 'Outfit, sans-serif' }}>
                      {ini}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>{docente.nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        {docente.asignaciones.length} grupo{docente.asignaciones.length !== 1 ? 's' : ''} asignado{docente.asignaciones.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Columna asignaciones — por materia con grupos */}
                  <div className="flex flex-col gap-1.5 pr-4">
                    {grupos.map(([materia, gruposMateria]) => (
                      <div key={materia} className="flex items-center gap-2 flex-wrap">
                        {/* Badge materia */}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                          style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {materia}
                        </span>
                        {/* Grupos de esa materia */}
                        <div className="flex gap-1 flex-wrap">
                          {gruposMateria.map(g => (
                            <span key={g}
                              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                              style={{
                                background: `linear-gradient(135deg, ${col.from}18, ${col.to}18)`,
                                color: col.from,
                                border: `1px solid ${col.from}30`,
                                fontFamily: 'Outfit, sans-serif',
                              }}>
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Columna correo */}
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24" className="shrink-0">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span className="text-xs" style={{ color: '#64748b' }}>{docente.email}</span>
                  </div>

                  {/* Columna acciones */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleEditar(docente)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                      style={{ background: '#eff6ff', color: '#2563eb' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                      Editar
                    </button>
                    <button onClick={() => setDocenteLimpiarMaterias(docente)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                      style={{ background: '#fffbeb', color: '#d97706' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fffbeb')}>
                      Materias
                    </button>
                    <button onClick={() => setDocenteAEliminar(docente)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                      style={{ background: '#fef2f2', color: '#dc2626' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })
          )}

          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Modal eliminar materias individuales */}
      {docenteLimpiarMaterias && typeof window !== 'undefined' && createPortal(
        <ModalEliminarMaterias
          docente={docenteLimpiarMaterias}
          onGuardar={(asignaciones) => {
            setDocentes(prev => prev.map(d =>
              d.id === docenteLimpiarMaterias.id ? { ...d, asignaciones } : d
            ))
            setDocenteLimpiarMaterias(null)
          }}
          onCerrar={() => setDocenteLimpiarMaterias(null)}
        />,
        document.body
      )}

      {/* Modal agregar / editar */}
      {modalAbierto && (
        <DocenteModal
          docente={docenteEditando}
          onGuardar={handleGuardar}
          onCerrar={() => { setModalAbierto(false); setDocenteEditando(null) }}
        />
      )}

      {/* Modal confirmar eliminar */}
      {docenteAEliminar && typeof window !== 'undefined' && createPortal(
        <div onClick={() => setDocenteAEliminar(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-center mb-2" style={{ color: '#1e3a5f' }}>¿Estás seguro?</h3>
            <p className="text-sm text-center mb-1" style={{ color: '#475569' }}>Estás a punto de eliminar a</p>
            <p className="text-sm font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>{docenteAEliminar.nombre}</p>
            <p className="text-xs text-center mb-6" style={{ color: '#94a3b8' }}>No podrás recuperarlo si lo borras.</p>
            <div className="flex gap-3">
              <button onClick={() => setDocenteAEliminar(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                style={{ background: '#2563eb' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
                Regresar
              </button>
              <button onClick={confirmarEliminar}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                style={{ background: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}