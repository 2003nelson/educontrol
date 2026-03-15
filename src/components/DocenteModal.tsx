'use client'
import { useState } from 'react'

// Un docente puede tener el mismo grupo con diferente materia
export type Asignacion = {
  grupo: string
  materia: string
}

export type Docente = {
  id: string
  nombre: string
  email: string
  asignaciones: Asignacion[]
}

type Props = {
  docente: Docente | null
  onGuardar: (data: Omit<Docente, 'id'>) => void
  onCerrar: () => void
}

// Grupos disponibles en el sistema
const GRUPOS_DISPONIBLES = [
  '101', '102', '103',
  '201', '202', '203',
  '301', '302', '303',
  '401', '402', '403',
  '501', '502', '503',
  '601', '602', '603',
]

export default function DocenteModal({ docente, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState({
    nombre: docente?.nombre ?? '',
    email:  docente?.email  ?? '',
  })
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(
    docente?.asignaciones ?? []
  )
  const [mostrarTabla, setMostrarTabla]   = useState(false)
  const [nuevaMateria, setNuevaMateria]   = useState('')
  const [grupoSelec, setGrupoSelec]       = useState('')
  const [busquedaGrupo, setBusquedaGrupo] = useState('')
  const [error, setError]                 = useState('')

  // Grupos filtrados por búsqueda
  const gruposFiltrados = GRUPOS_DISPONIBLES.filter(g =>
    g.includes(busquedaGrupo.trim())
  )

  function agregarAsignacion() {
    if (!grupoSelec || !nuevaMateria.trim()) {
      setError('Selecciona un grupo y escribe la materia')
      return
    }
    setAsignaciones(prev => [...prev, { grupo: grupoSelec, materia: nuevaMateria.trim() }])
    setGrupoSelec('')
    setNuevaMateria('')
    setBusquedaGrupo('')
    setError('')
    setMostrarTabla(false)
  }

  function eliminarAsignacion(index: number) {
    setAsignaciones(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!form.nombre.trim() || !form.email.trim()) return
    onGuardar({ nombre: form.nombre, email: form.email, asignaciones })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
            {docente ? 'Editar Docente' : 'Nuevo Docente'}
          </h2>
          <button onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">
            ✕
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-sm font-medium" style={{ color: '#475569' }}>
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Prof. Nombre Apellido"
              value={form.nombre}
              onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium" style={{ color: '#475569' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="correo@escuela.edu.mx"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>

          {/* Grupos asignados — etiquetas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#475569' }}>
                Grupos asignados
              </label>
              <button
                onClick={() => { setMostrarTabla(prev => !prev); setError('') }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ background: '#eff6ff', color: '#2563eb' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
              >
                {mostrarTabla ? '✕ Cancelar' : '+ Agregar grupo'}
              </button>
            </div>

            {/* Tags de asignaciones actuales */}
            <div className="flex flex-wrap gap-2 min-h-9">
              {asignaciones.length === 0 && !mostrarTabla && (
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  Sin grupos asignados
                </p>
              )}
              {asignaciones.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                >
                  <span
                    className="w-5 h-5 rounded-md text-white text-xs flex items-center justify-center font-bold shrink-0"
                    style={{ background: '#1e3a5f' }}
                  >
                    {a.grupo.charAt(0)}
                  </span>
                  {a.grupo} — {a.materia}
                  <button
                    onClick={() => eliminarAsignacion(i)}
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center transition hover:bg-red-100"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Panel para agregar nuevo grupo */}
            {mostrarTabla && (
              <div className="mt-3 rounded-xl overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}>

                {/* Campo materia */}
                <div className="p-3 border-b" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
                  <input
                    type="text"
                    placeholder="Materia para este grupo (ej. Matemáticas)"
                    value={nuevaMateria}
                    onChange={e => setNuevaMateria(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ border: '1px solid #e2e8f0' }}
                  />
                </div>

                {/* Buscador de grupos */}
                <div className="p-3 border-b" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar grupo..."
                      value={busquedaGrupo}
                      onChange={e => setBusquedaGrupo(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-sm rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                      style={{ border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                {/* Tabla de grupos */}
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#94a3b8' }}>Grupo</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#94a3b8' }}>Semestre</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {gruposFiltrados.map(grupo => {
                        const semestre = Math.ceil(parseInt(grupo.charAt(0)) )
                        const seleccionado = grupoSelec === grupo
                        return (
                          <tr
                            key={grupo}
                            onClick={() => setGrupoSelec(seleccionado ? '' : grupo)}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderBottom: '1px solid #f8fafc',
                              background: seleccionado ? '#eff6ff' : 'white',
                            }}
                            onMouseEnter={e => {
                              if (!seleccionado) e.currentTarget.style.background = '#f8fafc'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = seleccionado ? '#eff6ff' : 'white'
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{ background: seleccionado ? '#2563eb' : '#1e3a5f' }}>
                                  {grupo.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
                                  {grupo}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs" style={{ color: '#64748b' }}>
                                {semestre}° Semestre
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {seleccionado && (
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                                  style={{ background: '#dbeafe', color: '#2563eb' }}>
                                  Seleccionado
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Error y botón confirmar */}
                <div className="p-3 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
                  {error
                    ? <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
                    : <p className="text-xs" style={{ color: '#94a3b8' }}>
                        {grupoSelec
                          ? `Grupo ${grupoSelec} seleccionado`
                          : 'Selecciona un grupo de la tabla'}
                      </p>
                  }
                  <button
                    onClick={agregarAsignacion}
                    className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition shrink-0"
                    style={{ background: '#1e3a5f' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCerrar}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border transition"
              style={{ borderColor: '#e2e8f0', color: '#64748b' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
              style={{ background: '#1e3a5f' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
            >
              {docente ? 'Guardar cambios' : 'Agregar docente'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}