// src/components/grupos/BotonesAccionGrupo.tsx
'use client'
import { useState, useRef } from 'react'

interface BotonesAccionGrupoProps {
  onEditar: () => void
  onEliminar: () => void
  onAsignarEstudiantes: () => void
}

export default function BotonesAccionGrupo({
  onEditar,
  onEliminar,
  onAsignarEstudiantes,
}: BotonesAccionGrupoProps) {
  const [hovEditar, setHovEditar] = useState(false)
  const [hovEliminar, setHovEliminar] = useState(false)
  const [hovAsignar, setHovAsignar] = useState(false)

  // Debounce timers para evitar parpadeo
  const editarEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eliminarEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eliminarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const asignarEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const asignarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
      
      {/* Botón Asignar Estudiantes */}
      <div style={{ position: 'relative', width: '28px', height: '28px' }}>
        <button
          onClick={onAsignarEstudiantes}
          onMouseEnter={() => {
            if (asignarLeaveTimer.current) clearTimeout(asignarLeaveTimer.current)
            asignarEnterTimer.current = setTimeout(() => setHovAsignar(true), 150)
          }}
          onMouseLeave={() => {
            if (asignarEnterTimer.current) clearTimeout(asignarEnterTimer.current)
            asignarLeaveTimer.current = setTimeout(() => setHovAsignar(false), 250)
          }}
          style={{
            position: hovAsignar ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            zIndex: hovAsignar ? 10 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: hovAsignar ? '0.4rem' : '0',
            height: '28px',
            width: hovAsignar ? '150px' : '28px',
            padding: hovAsignar ? '0 0.75rem' : '0',
            borderRadius: hovAsignar ? '0.5rem' : '50%',
            background: hovAsignar ? '#dbeafe' : '#eff6ff',
            border: hovAsignar ? '1px solid #3b82f6' : '1px solid #bfdbfe',
            cursor: 'pointer',
            transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="11" height="11" fill="none" stroke="#3b82f6" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hovAsignar && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>
              Asignar alumnos
            </span>
          )}
        </button>
      </div>

      {/* Botón Editar */}
      <div style={{ position: 'relative', width: '28px', height: '28px' }}>
        <button
          onClick={onEditar}
          onMouseEnter={() => {
            if (editarLeaveTimer.current) clearTimeout(editarLeaveTimer.current)
            editarEnterTimer.current = setTimeout(() => setHovEditar(true), 150)
          }}
          onMouseLeave={() => {
            if (editarEnterTimer.current) clearTimeout(editarEnterTimer.current)
            editarLeaveTimer.current = setTimeout(() => setHovEditar(false), 250)
          }}
          style={{
            position: hovEditar ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            zIndex: hovEditar ? 10 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: hovEditar ? '0.4rem' : '0',
            height: '28px',
            width: hovEditar ? '120px' : '28px',
            padding: hovEditar ? '0 0.75rem' : '0',
            borderRadius: hovEditar ? '0.5rem' : '50%',
            background: hovEditar ? '#fef3c7' : '#fef9c3',
            border: hovEditar ? '1px solid #f59e0b' : '1px solid #fde68a',
            cursor: 'pointer',
            transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="11" height="11" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hovEditar && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
              Editar grupo
            </span>
          )}
        </button>
      </div>

      {/* Botón Eliminar */}
      <div style={{ position: 'relative', width: '28px', height: '28px' }}>
        <button
          onClick={onEliminar}
          onMouseEnter={() => {
            if (eliminarLeaveTimer.current) clearTimeout(eliminarLeaveTimer.current)
            eliminarEnterTimer.current = setTimeout(() => setHovEliminar(true), 150)
          }}
          onMouseLeave={() => {
            if (eliminarEnterTimer.current) clearTimeout(eliminarEnterTimer.current)
            eliminarLeaveTimer.current = setTimeout(() => setHovEliminar(false), 250)
          }}
          style={{
            position: hovEliminar ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            zIndex: hovEliminar ? 10 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: hovEliminar ? '0.4rem' : '0',
            height: '28px',
            width: hovEliminar ? '130px' : '28px',
            padding: hovEliminar ? '0 0.75rem' : '0',
            borderRadius: hovEliminar ? '0.5rem' : '50%',
            background: hovEliminar ? '#fee2e2' : '#fef2f2',
            border: hovEliminar ? '1px solid #dc2626' : '1px solid #fecaca',
            cursor: 'pointer',
            transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="11" height="11" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
          {hovEliminar && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626' }}>
              Eliminar grupo
            </span>
          )}
        </button>
      </div>
    </div>
  )
}