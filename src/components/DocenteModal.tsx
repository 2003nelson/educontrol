'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'

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

  // typeof window evita error en SSR sin necesitar useEffect
  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      onClick={onCerrar}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:    'white',
          borderRadius:  '1rem',
          boxShadow:     '0 20px 60px rgba(0,0,0,0.2)',
          width:         '60vw',
          minWidth:      '560px',
          maxWidth:      '860px',
          maxHeight:     '88vh',
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header fijo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem 1rem', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>
            {docente ? 'Editar Docente' : 'Nuevo Docente'}
          </h2>
          <button
            onClick={onCerrar}
            style={{ color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            ✕
          </button>
        </div>

        {/* Contenido con scroll interno */}
        <div style={{ overflowY: 'auto', padding: '0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Nombre y Email en fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Prof. Nombre Apellido"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="correo@escuela.edu.mx"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>
          </div>

          {/* Grupos asignados */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                Grupos asignados
              </label>
              <button
                onClick={() => { setMostrarTabla(prev => !prev); setError('') }}
                style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
              >
                {mostrarTabla ? '✕ Cancelar' : '+ Agregar grupo'}
              </button>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '2.25rem' }}>
              {asignaciones.length === 0 && !mostrarTabla && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Sin grupos asignados</p>
              )}
              {asignaciones.map((a, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  <span style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.375rem', background: '#1e3a5f', color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {a.grupo.charAt(0)}
                  </span>
                  {a.grupo} — {a.materia}
                  <button
                    onClick={() => eliminarAsignacion(i)}
                    style={{ marginLeft: '0.25rem', width: '1rem', height: '1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Panel agregar grupo */}
            {mostrarTabla && (
              <div style={{ marginTop: '0.75rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <input
                    type="text"
                    placeholder="Materia (ej. Matemáticas)"
                    value={nuevaMateria}
                    onChange={e => setNuevaMateria(e.target.value)}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar grupo..."
                      value={busquedaGrupo}
                      onChange={e => setBusquedaGrupo(e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: '12rem', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grupo</th>
                        <th style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semestre</th>
                        <th style={{ padding: '0.625rem 1.25rem' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {gruposFiltrados.map(grupo => {
                        const semestre     = parseInt(grupo.charAt(0))
                        const seleccionado = grupoSelec === grupo
                        return (
                          <tr
                            key={grupo}
                            onClick={() => setGrupoSelec(seleccionado ? '' : grupo)}
                            style={{ borderBottom: '1px solid #f8fafc', background: seleccionado ? '#eff6ff' : 'white', cursor: 'pointer' }}
                            onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { e.currentTarget.style.background = seleccionado ? '#eff6ff' : 'white' }}
                          >
                            <td style={{ padding: '0.75rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: seleccionado ? '#2563eb' : '#1e3a5f', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {grupo.charAt(0)}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>{grupo}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{semestre}° Semestre</span>
                            </td>
                            <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                              {seleccionado && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.5rem', background: '#dbeafe', color: '#2563eb' }}>
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

                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  {error
                    ? <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#dc2626', margin: 0 }}>{error}</p>
                    : <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                        {grupoSelec ? `Grupo ${grupoSelec} seleccionado` : 'Selecciona un grupo de la tabla'}
                      </p>
                  }
                  <button
                    onClick={agregarAsignacion}
                    style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#1e3a5f', color: 'white', border: 'none', cursor: 'pointer', flexShrink: 0 }}
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
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              onClick={onCerrar}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
            >
              {docente ? 'Guardar cambios' : 'Agregar docente'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}