'use client'
import { useState } from 'react'

type Docente = {
  id: string
  nombre: string
  materia: string
  email: string
  grupos: string
}

type Props = {
  docente: Docente | null
  onGuardar: (data: Omit<Docente, 'id'>) => void
  onCerrar: () => void
}

export default function DocenteModal({ docente, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState({
    nombre: docente?.nombre ?? '',
    materia: docente?.materia ?? '',
    email: docente?.email ?? '',
    grupos: docente?.grupos ?? '',
  })

  function handleSubmit() {
    if (!form.nombre || !form.materia || !form.email) return
    onGuardar(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {docente ? 'Editar Docente' : 'Nuevo Docente'}
          </h2>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Nombre completo', key: 'nombre', placeholder: 'Prof. Nombre Apellido' },
            { label: 'Materia', key: 'materia', placeholder: 'Ej. Matemáticas' },
            { label: 'Correo electrónico', key: 'email', placeholder: 'correo@escuela.edu.mx' },
            { label: 'Grupos asignados', key: 'grupos', placeholder: 'Ej. 101, 201, 301' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
          >
            {docente ? 'Guardar cambios' : 'Agregar docente'}
          </button>
        </div>
      </div>
    </div>
  )
}