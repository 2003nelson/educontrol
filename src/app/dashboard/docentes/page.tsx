'use client'
import { useState } from 'react'
import Header from '@/components/Header'
import DocenteModal from '@/components/DocenteModal'

type Docente = {
  id: string
  nombre: string
  materia: string
  email: string
  grupos: string
}

const docentesIniciales: Docente[] = [
  { id: '1', nombre: 'Prof. Carlos Méndez', materia: 'Matemáticas', email: 'cmendez@escuela.edu.mx', grupos: '101, 201, 301' },
  { id: '2', nombre: 'Prof. Laura Sánchez', materia: 'Español', email: 'lsanchez@escuela.edu.mx', grupos: '102, 202' },
  { id: '3', nombre: 'Prof. Roberto Pérez', materia: 'Historia', email: 'rperez@escuela.edu.mx', grupos: '103, 303, 503' },
]

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>(docentesIniciales)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [docenteEditando, setDocenteEditando] = useState<Docente | null>(null)

  const docentesFiltrados = docentes.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.materia.toLowerCase().includes(busqueda.toLowerCase())
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

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Directorio de Docentes" />

      <div className="p-6">
        {/* Barra de acciones */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o materia..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>
          <button
            onClick={() => { setDocenteEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <span className="text-lg leading-none">+</span> Agregar Docente
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Docente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Materia</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Grupos</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No se encontraron docentes
                  </td>
                </tr>
              ) : (
                docentesFiltrados.map((docente, i) => (
                  <tr key={docente.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {docente.nombre.charAt(5)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{docente.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{docente.materia}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{docente.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{docente.grupos}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditar(docente)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(docente.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer tabla */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
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