'use client'
import { useState } from 'react'
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

export default function DocentesPage() {
  const [docentes, setDocentes]               = useState<Docente[]>(docentesIniciales)
  const [busqueda, setBusqueda]               = useState('')
  const [modalAbierto, setModalAbierto]       = useState(false)
  const [docenteEditando, setDocenteEditando] = useState<Docente | null>(null)

  const docentesFiltrados = docentes.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.asignaciones.some(a =>
      a.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.grupo.includes(busqueda)
    )
  )

  function handleGuardar(data: Omit<Docente, 'id'>) {
    if (docenteEditando) {
      setDocentes(prev => prev.map(d =>
        d.id === docenteEditando.id ? { ...data, id: d.id } : d
      ))
    } else {
      setDocentes(prev => [...prev, { ...data, id: Date.now().toString() }])
    }
    setModalAbierto(false)
    setDocenteEditando(null)
  }

  function handleEliminar(id: string) {
    setDocentes(prev => prev.filter(d => d.id !== id))
  }

  function handleEditar(docente: Docente) {
    setDocenteEditando(docente)
    setModalAbierto(true)
  }

  function materiasUnicas(asignaciones: Asignacion[]) {
    return [...new Set(asignaciones.map(a => a.materia))].join(', ')
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Directorio de Docentes" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, materia o grupo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={() => { setDocenteEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
            style={{ background: '#1e3a5f' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
          >
            <span className="text-lg leading-none">+</span> Agregar Docente
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Docente', 'Materias', 'Correo', 'Grupos', 'Acciones'].map(col => (
                  <th key={col} className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#94a3b8' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm" style={{ color: '#94a3b8' }}>
                    No se encontraron docentes
                  </td>
                </tr>
              ) : (
                docentesFiltrados.map(docente => (
                  <tr key={docente.id}
                    style={{ borderBottom: '1px solid #f8fafc' }}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: '#1e3a5f' }}>
                          {docente.nombre.charAt(5)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#1e3a5f' }}>
                          {docente.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: '#475569' }}>
                        {materiasUnicas(docente.asignaciones)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: '#64748b' }}>{docente.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {docente.asignaciones.map((a, i) => (
                          <span key={i}
                            className="text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                            title={a.materia}>
                            {a.grupo}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditar(docente)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                          style={{ background: '#eff6ff', color: '#2563eb' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(docente.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                          style={{ background: '#fef2f2', color: '#dc2626' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {modalAbierto && (
        <DocenteModal
          docente={docenteEditando}
          onGuardar={handleGuardar}
          onCerrar={() => { setModalAbierto(false); setDocenteEditando(null) }}
        />
      )}
    </div>
  )
}