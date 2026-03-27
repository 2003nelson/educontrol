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

const MATERIAS_DISPONIBLES = [
  'Matemáticas', 'Cálculo', 'Física', 'Química', 'Biología',
  'Español', 'Literatura', 'Historia', 'Geografía', 'Inglés',
  'Informática', 'Educación Física', 'Administración', 'Contabilidad',
]

export default function DocenteModal({ docente, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState({
    nombre: docente?.nombre ?? '',
    email:  docente?.email  ?? '',
  })
  const [materias, setMaterias] = useState<Asignacion[]>(
    docente?.asignaciones ?? []
  )
  const [mostrarTabla, setMostrarTabla]       = useState(false)
  const [mostrarMaterias, setMostrarMaterias] = useState(false)
  const [materiaSelec, setMateriaSelec]       = useState('')
  const [grupoSelec, setGrupoSelec]           = useState('')
  const [busquedaGrupo, setBusquedaGrupo]     = useState('')
  const [busquedaMateria, setBusquedaMateria] = useState('')
  const [error, setError]                     = useState('')

  const gruposFiltrados   = GRUPOS_DISPONIBLES.filter(g => g.includes(busquedaGrupo.trim()))
  const materiasFiltradas = MATERIAS_DISPONIBLES.filter(m =>
    m.toLowerCase().includes(busquedaMateria.toLowerCase())
  )

  function agregarMateria() {
    if (!grupoSelec || !materiaSelec) {
      setError('Selecciona una materia y un grupo')
      return
    }
    setMaterias(prev => [...prev, { grupo: grupoSelec, materia: materiaSelec }])
    setGrupoSelec('')
    setMateriaSelec('')
    setBusquedaGrupo('')
    setBusquedaMateria('')
    setError('')
    setMostrarTabla(false)
    setMostrarMaterias(false)
  }

  function handleSubmit() {
    if (!form.nombre.trim() || !form.email.trim()) return
    onGuardar({ nombre: form.nombre, email: form.email, asignaciones: materias })
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '60vw', minWidth: '560px', maxWidth: '860px',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem 1rem', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>
            {docente ? 'Editar Docente' : 'Nuevo Docente'}
          </h2>
          <button onClick={onCerrar}
            style={{ color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div style={{ overflowY: 'auto', padding: '0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Nombre y Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Nombre completo
              </label>
              <input type="text" placeholder="Prof. Nombre Apellido"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Correo electrónico
              </label>
              <input type="email" placeholder="correo@escuela.edu.mx"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')} />
            </div>
          </div>

          {/* Materias asignadas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                Materias asignadas
              </label>
              <button
                onClick={() => { setMostrarTabla(prev => !prev); setError(''); setMostrarMaterias(false) }}
                style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                {mostrarTabla ? '✕ Cancelar' : '+ Agregar materia'}
              </button>
            </div>

            {/* Tags — sin botón eliminar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: materias.length === 0 ? '0' : '2.25rem' }}>
              {materias.length === 0 && !mostrarTabla && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Sin materias asignadas</p>
              )}
              {materias.map((a, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                }}>
                  <span style={{
                    width: '1.25rem', height: '1.25rem', borderRadius: '0.375rem',
                    background: '#1e3a5f', color: 'white', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
                  }}>
                    {a.grupo.charAt(0)}
                  </span>
                  {a.grupo} — {a.materia}
                </span>
              ))}
            </div>

            {/* Panel agregar materia */}
            {mostrarTabla && (
              <div style={{ marginTop: '0.75rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>

                  {/* Selector materia */}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setMostrarMaterias(prev => !prev)}
                      style={{
                        width: '100%', border: `1px solid ${materiaSelec ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem', outline: 'none', cursor: 'pointer', textAlign: 'left',
                        background: materiaSelec ? '#eff6ff' : 'white',
                        color: materiaSelec ? '#1e3a5f' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontWeight: materiaSelec ? 600 : 400,
                      }}>
                      <span>{materiaSelec || 'Seleccionar materia'}</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        style={{ transform: mostrarMaterias ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, color: '#94a3b8' }}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {mostrarMaterias && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'white', borderRadius: '0.75rem', zIndex: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
                        maxHeight: '220px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                              <svg width="11" height="11" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                              </svg>
                            </span>
                            <input type="text" placeholder="Buscar materia..."
                              value={busquedaMateria}
                              onChange={e => setBusquedaMateria(e.target.value)}
                              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.5rem 0.375rem 1.75rem', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                          {materiasFiltradas.length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.75rem', margin: 0, textAlign: 'center' }}>Sin resultados</p>
                          ) : materiasFiltradas.map(m => {
                            const sel = materiaSelec === m
                            return (
                              <button key={m}
                                onClick={() => { setMateriaSelec(m); setMostrarMaterias(false); setBusquedaMateria('') }}
                                style={{
                                  width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                                  border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: sel ? 600 : 400,
                                  background: sel ? '#eff6ff' : 'transparent', color: sel ? '#2563eb' : '#334155',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  borderBottom: '1px solid #f8fafc',
                                }}
                                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                                {sel && (
                                  <svg width="10" height="10" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                                <span style={{ marginLeft: sel ? 0 : '1rem' }}>{m}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buscador grupo */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    </span>
                    <input type="text" placeholder="Buscar grupo..."
                      value={busquedaGrupo}
                      onChange={e => setBusquedaGrupo(e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Tabla grupos */}
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
                          <tr key={grupo}
                            onClick={() => setGrupoSelec(seleccionado ? '' : grupo)}
                            style={{ borderBottom: '1px solid #f8fafc', background: seleccionado ? '#eff6ff' : 'white', cursor: 'pointer' }}
                            onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { e.currentTarget.style.background = seleccionado ? '#eff6ff' : 'white' }}>
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

                {/* Footer panel */}
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {error
                      ? <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#dc2626', margin: 0 }}>{error}</p>
                      : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {materiaSelec && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                              📚 {materiaSelec}
                            </span>
                          )}
                          {grupoSelec && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                              👥 Grupo {grupoSelec}
                            </span>
                          )}
                          {!materiaSelec && !grupoSelec && (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Selecciona materia y grupo</p>
                          )}
                          {materiaSelec && !grupoSelec && (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Ahora selecciona un grupo</p>
                          )}
                          {!materiaSelec && grupoSelec && (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Ahora selecciona una materia</p>
                          )}
                        </div>
                      )
                    }
                  </div>
                  <button onClick={agregarMateria}
                    style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem', background: materiaSelec && grupoSelec ? '#1e3a5f' : '#e2e8f0', color: materiaSelec && grupoSelec ? 'white' : '#94a3b8', border: 'none', cursor: materiaSelec && grupoSelec ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (materiaSelec && grupoSelec) e.currentTarget.style.background = '#2563eb' }}
                    onMouseLeave={e => { if (materiaSelec && grupoSelec) e.currentTarget.style.background = '#1e3a5f' }}>
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button onClick={onCerrar}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
              Cancelar
            </button>
            <button onClick={handleSubmit}
              style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
              {docente ? 'Guardar cambios' : 'Agregar docente'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}