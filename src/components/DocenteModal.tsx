'use client'
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useGrupos } from '@/hooks/useGrupos'
import { useAsignaturas } from '@/hooks/useAsignaturas'

export type Asignacion = {
  grupo_id: string
  asignatura_id: string
  grupo_numero?: string
  grupo_grado?: number
  asignatura_nombre?: string
}

export type Docente = {
  id: string
  nombre_completo: string
  email: string
  email_institucional: string | null
  asignaciones: {
    id: string
    grupo_id: string
    asignatura_id: string
    grupo_numero: string
    grupo_grado: number
    asignatura_nombre: string
  }[]
}

type Props = {
  docente: Docente | null
  onGuardar: (data: { nombre_completo: string; email: string; asignaciones: { grupo_id: string; asignatura_id: string }[] }) => void
  onCerrar: () => void
}

const DOMINIOS_PERMITIDOS = [
  'gmail.com', 'outlook.com', 'hotmail.com',
  'yahoo.com', 'icloud.com', 'live.com', 'protonmail.com'
]

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Validación pura — sin setState, se calcula en render
function validarEmail(email: string, docenteEmailOriginal?: string): {
  valido: boolean | null
  mensaje: string
} {
  const trimmed = email.trim().toLowerCase()

  // Si es el mismo email que ya tenía el docente, es válido sin más
  if (docenteEmailOriginal && trimmed === docenteEmailOriginal.toLowerCase()) {
    return { valido: true, mensaje: '' }
  }

  if (!trimmed) return { valido: null, mensaje: '' }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valido: false, mensaje: '✕ Formato de correo inválido' }
  }

  const [, dominio] = trimmed.split('@')
  if (!DOMINIOS_PERMITIDOS.includes(dominio)) {
    return { valido: false, mensaje: '✕ Usa Gmail, Outlook, Yahoo o iCloud para recibir la invitación' }
  }

  return { valido: true, mensaje: '✓ Correo válido - se enviará la invitación aquí' }
}

export default function DocenteModal({ docente, onGuardar, onCerrar }: Props) {
  const { grupos: gruposDB, loading: loadingGrupos } = useGrupos()
  const { asignaturas: asignaturasDB, loading: loadingAsignaturas } = useAsignaturas()

  const [form, setForm] = useState({
    nombre_completo: docente?.nombre_completo ?? '',
    email: docente?.email ?? '',
  })

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(
    docente?.asignaciones.map(a => ({
      grupo_id: a.grupo_id,
      asignatura_id: a.asignatura_id,
      grupo_numero: a.grupo_numero,
      grupo_grado: a.grupo_grado,
      asignatura_nombre: a.asignatura_nombre,
    })) ?? []
  )

  const [mostrarTabla, setMostrarTabla] = useState(false)
  const [mostrarAsignaturas, setMostrarAsignaturas] = useState(false)
  const [asignaturaSelec, setAsignaturaSelec] = useState('')
  const [grupoSelec, setGrupoSelec] = useState('')
  const [busquedaGrupo, setBusquedaGrupo] = useState('')
  const [busquedaAsignatura, setBusquedaAsignatura] = useState('')
  const [error, setError] = useState('')
  const [agregado, setAgregado] = useState(false)

  // Validación derivada en render — sin useEffect ni setState
  const { valido: emailValido, mensaje: emailMensaje } = useMemo(
    () => validarEmail(form.email, docente?.email),
    [form.email, docente?.email]
  )

  const asignaturasYaAsignadas = new Set(
    asignaciones.filter(a => a.grupo_id === grupoSelec).map(a => a.asignatura_id)
  )

  const gruposFiltrados = gruposDB.filter(g =>
    `${g.grado}${g.numero}`.toLowerCase().includes(busquedaGrupo.toLowerCase())
  )

  const asignaturasFiltradas = asignaturasDB.filter(a =>
    !asignaturasYaAsignadas.has(a.id) &&
    a.nombre.toLowerCase().includes(busquedaAsignatura.toLowerCase())
  )

  function agregarAsignacion() {
    if (!grupoSelec || !asignaturaSelec) { setError('Selecciona una asignatura y un grupo'); return }
    const grupo = gruposDB.find(g => g.id === grupoSelec)
    const asignatura = asignaturasDB.find(a => a.id === asignaturaSelec)
    if (!grupo || !asignatura) { setError('Grupo o asignatura no encontrada'); return }

    setAsignaciones(prev => [...prev, {
      grupo_id: grupo.id, asignatura_id: asignatura.id,
      grupo_numero: grupo.numero, grupo_grado: grupo.grado,
      asignatura_nombre: asignatura.nombre,
    }])
    setGrupoSelec(''); setAsignaturaSelec(''); setBusquedaGrupo(''); setBusquedaAsignatura('')
    setError(''); setMostrarAsignaturas(false)
    setAgregado(true); setTimeout(() => setAgregado(false), 1200)
  }

  function eliminarAsignacion(index: number) {
    setAsignaciones(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!form.nombre_completo.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.email.trim()) { setError('El correo es obligatorio'); return }
    if (emailValido === false) { setError('El correo no es válido'); return }
    if (emailValido === null) { setError('Escribe un correo válido'); return }

    onGuardar({
      nombre_completo: form.nombre_completo.trim(),
      email: form.email.trim().toLowerCase(),
      asignaciones: asignaciones.map(a => ({ grupo_id: a.grupo_id, asignatura_id: a.asignatura_id }))
    })
  }

  const formularioValido = form.nombre_completo.trim() && form.email.trim() && emailValido === true
  const cargandoDatos = loadingGrupos || loadingAsignaturas

  if (typeof window === 'undefined') return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      animation: 'backdropIn 0.3s ease',
    }}>
      <style>{`
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>

      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '60vw', minWidth: '560px', maxWidth: '860px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem 1rem', flexShrink: 0 }}>
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
        <div style={{ padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* Nombre */}
          {!mostrarTabla && (
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Nombre completo
              </label>
              <input type="text" placeholder="Prof. Nombre Apellido"
                value={form.nombre_completo}
                onChange={e => setForm(prev => ({ ...prev, nombre_completo: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')} />
            </div>
          )}

          {/* Email personal */}
          {!mostrarTabla && (
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Correo personal (Gmail, Outlook, etc)
              </label>
              <input type="email" placeholder="profesor@gmail.com"
                value={form.email}
                onChange={e => { setForm(prev => ({ ...prev, email: e.target.value })); setError('') }}
                disabled={docente !== null}
                style={{
                  width: '100%',
                  border: `2px solid ${emailValido === true ? '#10b981' : emailValido === false ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', outline: 'none',
                  boxSizing: 'border-box',
                  background: docente !== null ? '#f8fafc' : 'white',
                  cursor: docente !== null ? 'not-allowed' : 'text',
                }}
                onFocus={e => { if (!docente) e.currentTarget.style.boxShadow = '0 0 0 2px #93c5fd' }}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')} />
              {emailMensaje && (
                <p style={{ fontSize: '0.75rem', color: emailValido ? '#10b981' : '#dc2626', margin: '0.375rem 0 0', fontWeight: 500 }}>
                  {emailMensaje}
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.375rem 0 0' }}>
                📧 Aquí se enviará el link de invitación para activar su cuenta
              </p>
            </div>
          )}

          {/* Asignaciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                Asignaturas asignadas
              </label>
              <button
                onClick={() => { setMostrarTabla(prev => !prev); setError(''); setMostrarAsignaturas(false) }}
                disabled={cargandoDatos}
                style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: cargandoDatos ? '#e2e8f0' : '#eff6ff', color: cargandoDatos ? '#94a3b8' : '#2563eb', border: 'none', cursor: cargandoDatos ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!cargandoDatos) e.currentTarget.style.background = '#dbeafe' }}
                onMouseLeave={e => { if (!cargandoDatos) e.currentTarget.style.background = '#eff6ff' }}>
                {cargandoDatos ? 'Cargando...' : mostrarTabla ? '✕ Cerrar' : '+ Agregar asignatura'}
              </button>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', overflowY: 'auto', flexShrink: 0, ...(mostrarTabla ? { maxHeight: '5.5rem' } : { maxHeight: '7rem' }) }}>
              {asignaciones.length === 0 && !mostrarTabla && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Sin asignaturas asignadas</p>
              )}
              {asignaciones.map((a, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                  height: 'fit-content',
                }}>
                  <span style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.375rem', background: '#1e3a5f', color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {a.grupo_grado}
                  </span>
                  {a.grupo_grado}°-{a.grupo_numero} — {a.asignatura_nombre}
                  <button onClick={() => eliminarAsignacion(i)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0 0 0 0.25rem', fontSize: '0.875rem', lineHeight: 1 }}>✕</button>
                </span>
              ))}
            </div>

            {/* Panel agregar */}
            {mostrarTabla && (
              <div style={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                  {/* Selector asignatura */}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { if (grupoSelec) setMostrarAsignaturas(prev => !prev) }}
                      style={{
                        width: '100%', border: `1px solid ${asignaturaSelec ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none',
                        cursor: grupoSelec ? 'pointer' : 'not-allowed', textAlign: 'left',
                        background: !grupoSelec ? '#f8fafc' : asignaturaSelec ? '#eff6ff' : 'white',
                        color: !grupoSelec ? '#cbd5e1' : asignaturaSelec ? '#1e3a5f' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontWeight: asignaturaSelec ? 600 : 400, opacity: grupoSelec ? 1 : 0.6,
                      }}>
                      <span>{!grupoSelec ? 'Selecciona un grupo primero' : asignaturaSelec ? asignaturasDB.find(a => a.id === asignaturaSelec)?.nombre : 'Seleccionar asignatura'}</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        style={{ transform: mostrarAsignaturas ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, color: '#94a3b8' }}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {mostrarAsignaturas && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', borderRadius: '0.75rem', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', maxHeight: '252px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <input type="text" placeholder="Buscar asignatura..." value={busquedaAsignatura}
                            onChange={e => setBusquedaAsignatura(e.target.value)}
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.5rem', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                          {asignaturasFiltradas.map(a => {
                            const sel = asignaturaSelec === a.id
                            return (
                              <button key={a.id} onClick={() => { setAsignaturaSelec(a.id); setMostrarAsignaturas(false); setBusquedaAsignatura('') }}
                                style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: sel ? 600 : 400, background: sel ? '#eff6ff' : 'transparent', color: sel ? '#2563eb' : '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f8fafc' }}
                                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                                {sel && <svg width="10" height="10" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                <span style={{ marginLeft: sel ? 0 : '1rem' }}>{a.nombre}</span>
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
                      <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </span>
                    <input type="text" placeholder="Buscar grupo..." value={busquedaGrupo}
                      onChange={e => setBusquedaGrupo(e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Tabla grupos */}
                <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grupo</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grado</th>
                        <th style={{ padding: '0.5rem 1.25rem' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {gruposFiltrados.map(grupo => {
                        const seleccionado = grupoSelec === grupo.id
                        return (
                          <tr key={grupo.id}
                            style={{ borderBottom: '1px solid #f8fafc', background: seleccionado ? '#eff6ff' : 'white', cursor: 'pointer' }}
                            onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { e.currentTarget.style.background = seleccionado ? '#eff6ff' : 'white' }}
                            onClick={() => { setGrupoSelec(seleccionado ? '' : grupo.id); setAsignaturaSelec(''); setMostrarAsignaturas(false); setBusquedaAsignatura('') }}>
                            <td style={{ padding: '0.625rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: seleccionado ? '#2563eb' : '#1e3a5f', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {grupo.grado}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>{grupo.grado}° - {grupo.numero}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.625rem 1.25rem' }}><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{grupo.grado}° Grado</span></td>
                            <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right' }}>
                              {seleccionado && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.5rem', background: '#dbeafe', color: '#2563eb' }}>Seleccionado</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer confirmar */}
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    {error
                      ? <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#dc2626', margin: 0 }}>{error}</p>
                      : <>
                          {asignaturaSelec && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>{asignaturasDB.find(a => a.id === asignaturaSelec)?.nombre}</span>}
                          {grupoSelec && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Grupo {gruposDB.find(g => g.id === grupoSelec)?.numero}</span>}
                          {!asignaturaSelec && !grupoSelec && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Selecciona asignatura y grupo</p>}
                        </>
                    }
                  </div>
                  <button onClick={agregarAsignacion} disabled={!asignaturaSelec || !grupoSelec}
                    style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', flexShrink: 0, minWidth: '100px', cursor: asignaturaSelec && grupoSelec ? 'pointer' : 'not-allowed', background: agregado ? '#16a34a' : asignaturaSelec && grupoSelec ? '#1e3a5f' : '#e2e8f0', color: agregado ? 'white' : asignaturaSelec && grupoSelec ? 'white' : '#94a3b8', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (asignaturaSelec && grupoSelec && !agregado) e.currentTarget.style.background = '#2563eb' }}
                    onMouseLeave={e => { if (asignaturaSelec && grupoSelec && !agregado) e.currentTarget.style.background = '#1e3a5f' }}>
                    {agregado ? '✓ Agregada' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        {!mostrarTabla && (
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 2rem 1.5rem', flexShrink: 0, borderTop: '1px solid #f1f5f9' }}>
            {error && (
              <div style={{ flex: 1, padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: 0 }}>⚠️ {error}</p>
              </div>
            )}
            {!error && (
              <>
                <button onClick={onCerrar}
                  style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={!formularioValido}
                  style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: formularioValido ? '#1e3a5f' : '#e2e8f0', color: formularioValido ? 'white' : '#94a3b8', cursor: formularioValido ? 'pointer' : 'not-allowed' }}
                  onMouseEnter={e => { if (formularioValido) e.currentTarget.style.background = '#2563eb' }}
                  onMouseLeave={e => { if (formularioValido) e.currentTarget.style.background = '#1e3a5f' }}>
                  {docente ? 'Guardar cambios' : 'Agregar docente'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}