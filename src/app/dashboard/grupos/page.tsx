'use client'
import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'
import { useGrupos, type EstudianteInput } from '@/hooks/useGrupos'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Grupo as GrupoType, ActualizarGrupo } from '@/hooks/useGrupos'
import BotonesAccionGrupo from '@/components/grupos/BotonesAccionGrupo'
import ModalEditarGrupo from '@/components/grupos/ModalEditarGrupo'
import ModalAsignarEstudiantes from '@/components/grupos/ModalAsignarEstudiantes'

// ═════════════════════════════════════════════════════════════════
// 🔒 CONFIGURACIÓN DE SEGURIDAD
// ═════════════════════════════════════════════════════════════════

const GRADOS_VALIDOS = [1, 2, 3, 4, 5, 6] as const
const TURNOS_VALIDOS = ['matutino', 'vespertino'] as const
const MAX_OPERACIONES_POR_MINUTO = 10

const rateLimiter = {
  operaciones: [] as number[],
  puedeOperar(): boolean {
    const ahora = Date.now()
    this.operaciones = this.operaciones.filter(t => ahora - t < 60000)
    if (this.operaciones.length >= MAX_OPERACIONES_POR_MINUTO) return false
    this.operaciones.push(ahora)
    return true
  }
}

// ═════════════════════════════════════════════════════════════════
// 🛡️ FUNCIONES DE VALIDACIÓN Y SANITIZACIÓN
// ═════════════════════════════════════════════════════════════════

function sanitizeNumero(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)
}

function validarGrado(grado: number): boolean {
  return GRADOS_VALIDOS.includes(grado as typeof GRADOS_VALIDOS[number])
}

function validarNumero(numero: string): boolean {
  return numero.length >= 1 && numero.length <= 5
}

function validarTurno(turno: string): turno is 'matutino' | 'vespertino' {
  return TURNOS_VALIDOS.includes(turno as typeof TURNOS_VALIDOS[number])
}

type Grupo = GrupoType & { creadoEl: string }

function formatFecha(dateString: string): string {
  try {
    const fecha = new Date(dateString)
    if (isNaN(fecha.getTime())) return 'Fecha inválida'
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
  } catch {
    return 'Fecha inválida'
  }
}

// ═════════════════════════════════════════════════════════════════
// 🔘 BOTÓN AGREGAR
// ═════════════════════════════════════════════════════════════════

function AgregarGrupoBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => { if (leaveT.current) clearTimeout(leaveT.current); enterT.current = setTimeout(() => setHov(true), 120) }}
      onMouseLeave={() => { if (enterT.current) clearTimeout(enterT.current); leaveT.current = setTimeout(() => setHov(false), 200) }}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: hov ? '0.5rem' : '0',
        height:'40px', width: hov ? 'auto' : '40px', minWidth: hov ? '160px' : '40px',
        padding: hov ? '0 1.25rem' : '0', borderRadius: hov ? '0.875rem' : '50%',
        background: disabled ? '#e2e8f0' : '#1e3a5f', 
        border:'none', 
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition:'all 0.3s ease', overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(30,58,95,0.2)',
        opacity: disabled ? 0.5 : 1,
      }}>
      <span style={{ fontSize:'1.25rem', fontWeight:300, color:'white', lineHeight:1, flexShrink:0 }}>+</span>
      {hov && <span style={{ fontSize:'0.875rem', fontWeight:600, color:'white' }}>Agregar grupo</span>}
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════
// 📝 MODAL AGREGAR GRUPO
// ═════════════════════════════════════════════════════════════════

function GrupoModal({
  onGuardar,
  onCerrar,
  guardando,
}: {
  onGuardar: (grado: number, numero: string, turno: 'matutino' | 'vespertino') => Promise<void>
  onCerrar: () => void
  guardando: boolean
}) {
  const [grado, setGrado] = useState(1)
  const [numero, setNumero] = useState('')
  const [turno, setTurno] = useState<'matutino' | 'vespertino'>('matutino')
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState('')

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }

  const numeroValido = numero !== '' && validarNumero(numero)

  async function handleConfirmar() {
    if (!rateLimiter.puedeOperar()) {
      setError('Demasiadas operaciones. Espera un momento.')
      return
    }

    if (!numeroValido) {
      setError('Número de grupo inválido (1-5 caracteres)')
      return
    }

    if (!validarGrado(grado) || !validarNumero(numero) || !validarTurno(turno)) {
      setError('Datos inválidos')
      return
    }

    try {
      await onGuardar(grado, numero.toUpperCase(), turno)
      cerrar()
    } catch (err) {
      setError('Error al guardar')
      console.error('Error:', err)
    }
  }

  const backdropAnim = cerrando ? 'gBackdropOut 0.38s ease forwards' : 'gBackdropIn 0.25s ease'
  const modalAnim = cerrando ? 'gSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'gSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)'
  const styles = `
    @keyframes gBackdropIn  { from{opacity:0} to{opacity:1} }
    @keyframes gBackdropOut { from{opacity:1} to{opacity:0} }
    @keyframes gSpringIn  { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes gSpringOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(12px)} }
  `

  if (confirmando) {
    return createPortal(
      <div onClick={cerrar} style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:backdropAnim }}>
        <style>{styles}</style>
        <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'400px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:modalAnim }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
            <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.75rem', textAlign:'center' }}>¿Confirmar nuevo grupo?</h3>
          <p style={{ fontSize:'0.875rem', color:'#475569', margin:'0 0 0.25rem', textAlign:'center' }}>Grado {grado} - Grupo {numero.toUpperCase()}</p>
          <p style={{ fontSize:'0.875rem', color:'#94a3b8', margin:'0 0 1.5rem', textAlign:'center' }}>Turno {turno}</p>
          
          {error && (
            <div style={{ width:'100%', padding:'0.75rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.5rem', marginBottom:'1rem' }}>
              <p style={{ fontSize:'0.8rem', color:'#dc2626', margin:0, textAlign:'center' }}>{error}</p>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
            <button onClick={() => setConfirmando(false)} disabled={guardando}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.5 : 1 }}>
              ← Editar
            </button>
            <button onClick={handleConfirmar} disabled={guardando}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: guardando ? '#94a3b8' : '#1e3a5f', color:'white', cursor: guardando ? 'not-allowed' : 'pointer' }}>
              {guardando ? 'Guardando...' : 'Sí, agregar'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div onClick={cerrar} style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:backdropAnim }}>
      <style>{styles}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden', animation:modalAnim }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem 1.75rem 1.25rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Nuevo Grupo</h2>
          <button onClick={cerrar} style={{ color:'#94a3b8', fontSize:'1.25rem', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'0 1.75rem 1.75rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          
          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.5rem' }}>Grado</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.5rem' }}>
              {GRADOS_VALIDOS.map(g => (
                <button key={g} onClick={() => setGrado(g)} type="button"
                  style={{ padding:'0.625rem 0', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:700, border: grado===g ? '2px solid #1e3a5f' : '1px solid #e2e8f0', background: grado===g ? '#1e3a5f' : 'white', color: grado===g ? 'white' : '#64748b', cursor:'pointer', transition:'all 0.15s' }}>
                  {g}°
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.375rem' }}>Número de grupo</label>
            <input type="text" placeholder="Ej: 101, 1A, 1B"
              value={numero}
              onChange={e => setNumero(sanitizeNumero(e.target.value))}
              maxLength={5}
              autoFocus
              style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', textTransform:'uppercase' }}
              onFocus={e => (e.currentTarget.style.boxShadow='0 0 0 2px #93c5fd')}
              onBlur={e => (e.currentTarget.style.boxShadow='none')} />
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.375rem 0 0' }}>Letras y números (1-5 caracteres)</p>
          </div>

          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.5rem' }}>Turno</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
              {TURNOS_VALIDOS.map(t => (
                <button key={t} onClick={() => setTurno(t)} type="button"
                  style={{ padding:'0.75rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:600, border: turno===t ? '2px solid #1e3a5f' : '1px solid #e2e8f0', background: turno===t ? '#1e3a5f' : 'white', color: turno===t ? 'white' : '#64748b', cursor:'pointer', textTransform:'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.25rem' }}>
            <button onClick={cerrar} type="button"
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}>
              Cancelar
            </button>
            <button onClick={() => { if (numeroValido) setConfirmando(true) }} type="button"
              disabled={!numeroValido}
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: numeroValido ? '#1e3a5f' : '#e2e8f0', color: numeroValido ? 'white' : '#94a3b8', cursor: numeroValido ? 'pointer' : 'not-allowed' }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═════════════════════════════════════════════════════════════════
// 📄 PÁGINA PRINCIPAL
// ═════════════════════════════════════════════════════════════════

export default function GruposPage() {
  const { isDirector, isSuperAdmin, plantelId, loading: authLoading } = useAuth()
  const {
    grupos: gruposData,
    loading,
    error,
    agregarGrupo,
    actualizarGrupo,
    eliminarGrupo,
    guardarEstudiantes,
  } = useGrupos()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [eliminando, setEliminando] = useState<Grupo | null>(null)
  const [editando, setEditando] = useState<Grupo | null>(null)
  const [asignandoEstudiantes, setAsignandoEstudiantes] = useState<Grupo | null>(null)
  const [gradoFiltro, setGradoFiltro] = useState<number | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [agregado, setAgregado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [gradosContraidos, setGradosContraidos] = useState<Set<number>>(new Set())

  const handleGuardar = useCallback(async (grado: number, numero: string, turno: 'matutino' | 'vespertino') => {
    if (!rateLimiter.puedeOperar()) {
      alert('⚠️ Demasiadas operaciones. Espera un momento.')
      return
    }

    try {
      setGuardando(true)
      const exito = await agregarGrupo({ grado, numero, turno, ciclo_escolar: '2025-2026', docente_id: null })
      
      if (exito) {
        setModalAbierto(false)
        setAgregado(true)
        setTimeout(() => setAgregado(false), 2500)
      } else {
        alert('❌ Error al crear el grupo')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error al guardar')
    } finally {
      setGuardando(false)
    }
  }, [agregarGrupo])

  const handleEditar = useCallback(async (id: string, cambios: ActualizarGrupo) => {
    try {
      setGuardando(true)
      const exito = await actualizarGrupo(id, cambios)
      if (exito) {
        setEditando(null)
      } else {
        alert('❌ Error al editar el grupo')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error al guardar cambios')
    } finally {
      setGuardando(false)
    }
  }, [actualizarGrupo])

  const confirmarEliminar = useCallback(async () => {
    if (!eliminando || !rateLimiter.puedeOperar()) return

    try {
      const exito = await eliminarGrupo(eliminando.id)
      if (exito) {
        setEliminando(null)
      } else {
        alert('❌ Error al eliminar el grupo')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error al eliminar')
    }
  }, [eliminando, eliminarGrupo])

  const handleAsignarEstudiantes = useCallback(async (estudiantesData: EstudianteInput[]) => {
    try {
      const exito = await guardarEstudiantes(estudiantesData)
      if (exito) {
        setAsignandoEstudiantes(null)
        console.log('✅ Estudiantes guardados exitosamente')
      } else {
        alert('❌ Error al guardar estudiantes')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error al guardar')
    }
  }, [guardarEstudiantes])

  if (authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <p style={{ color:'#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  if (!isDirector && !isSuperAdmin) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:'1rem' }}>
        <p style={{ fontSize:'1.5rem', color:'#dc2626', fontWeight:700 }}>⚠️ Acceso Denegado</p>
        <p style={{ color:'#64748b' }}>No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  const grupos: Grupo[] = gruposData.map(g => ({
    ...g,
    creadoEl: formatFecha(g.created_at)
  }))

  function toggleGrado(g: number) {
    setGradosContraidos(prev => {
      const next = new Set(prev)
      if (next.has(g)) { next.delete(g) } else { next.add(g) }
      return next
    })
  }

  const gruposFiltrados = grupos.filter(g => {
    const matchGrado = gradoFiltro === 'todos' || g.grado === gradoFiltro
    const matchBus = `${g.grado}${g.numero}`.toLowerCase().includes(busqueda.toLowerCase())
    return matchGrado && matchBus
  })

  const porGrado = GRADOS_VALIDOS.map(g => ({
    grado: g,
    items: gruposFiltrados.filter(gr => gr.grado === g),
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Grupos" />

      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem' }}>

        {error && (
          <div style={{ padding:'1rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.75rem', color:'#dc2626', fontSize:'0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ padding:'2rem', textAlign:'center', color:'#94a3b8' }}>Cargando grupos...</div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <input type="text" placeholder="Buscar grupo..."
                  value={busqueda}
                  onChange={e => setBusqueda(sanitizeNumero(e.target.value))}
                  style={{ padding:'0.625rem 1rem', borderRadius:'0.75rem', border:'1px solid #e2e8f0', fontSize:'0.875rem', width:'200px' }}
                />

                <div style={{ display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px' }}>
                  <button onClick={() => setGradoFiltro('todos')}
                    style={{ padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight: gradoFiltro==='todos' ? 600 : 500, color: gradoFiltro==='todos' ? '#1e3a5f' : '#64748b', background: gradoFiltro==='todos' ? 'white' : 'transparent', border:'none', borderRadius:'0.75rem', cursor:'pointer' }}>
                    Todos
                  </button>
                  {GRADOS_VALIDOS.map(g => (
                    <button key={g} onClick={() => setGradoFiltro(g)}
                      style={{ padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight: gradoFiltro===g ? 600 : 500, color: gradoFiltro===g ? '#1e3a5f' : '#64748b', background: gradoFiltro===g ? 'white' : 'transparent', border:'none', borderRadius:'0.75rem', cursor:'pointer' }}>
                      {g}°
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ padding:'0.5rem 1rem', background:'white', borderRadius:'0.875rem', border:'1px solid #e2e8f0' }}>
                  <span style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f' }}>{grupos.length}</span>
                  <span style={{ fontSize:'0.75rem', color:'#94a3b8', marginLeft:'0.5rem' }}>grupos</span>
                </div>

                {agregado ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0 1.25rem', height:'40px', borderRadius:'0.875rem', background:'#16a34a', color:'white', fontSize:'0.875rem', fontWeight:600 }}>
                    ✓ Grupo agregado
                  </div>
                ) : (
                  <AgregarGrupoBtn onClick={() => setModalAbierto(true)} disabled={loading} />
                )}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
              {porGrado.length === 0 ? (
                <div style={{ padding:'3rem', textAlign:'center', background:'white', borderRadius:'1rem', border:'1px solid #e2e8f0' }}>
                  <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>No se encontraron grupos</p>
                </div>
              ) : porGrado.map(({ grado, items }) => {
                const contraido = gradosContraidos.has(grado)
                return (
                  <div key={grado}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom: contraido ? 0 : '0.75rem' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'0.5rem', background:'#1e3a5f', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700 }}>
                        {grado}
                      </div>
                      <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{grado}° Grado</p>
                      <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{items.length} grupo{items.length !== 1 ? 's' : ''}</p>
                      <div style={{ flex:1, height:'1px', background:'#f1f5f9' }}/>
                      <button onClick={() => toggleGrado(grado)}
                        style={{ padding:'0.2rem 0.5rem', borderRadius:'0.5rem', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'0.7rem', fontWeight:600 }}>
                        {contraido ? 'Expandir' : 'Contraer'}
                      </button>
                    </div>

                    <div style={{ overflow:'hidden', maxHeight: contraido ? 0 : '2000px', opacity: contraido ? 0 : 1, transition:'all 0.3s' }}>
                      <div style={{ background:'white', borderRadius:'0.875rem', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom:'1px solid #f1f5f9', background:'#fafbfc' }}>
                              <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Grupo</th>
                              <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Turno</th>
                              <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Alumnos</th>
                              <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Creado</th>
                              <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map(g => (
                              <tr key={g.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                                <td style={{ padding:'0.75rem 1rem' }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#eff6ff', border:'1.5px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:'#1e3a5f' }}>
                                      {g.numero}
                                    </div>
                                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f' }}>{g.grado}° - Grupo {g.numero}</span>
                                  </div>
                                </td>
                                <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'#64748b', textTransform:'capitalize' }}>{g.turno}</td>
                                <td style={{ padding:'0.75rem 1rem' }}>
                                  <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.375rem 0.75rem', background: g.total_estudiantes ? '#eff6ff' : '#f1f5f9', borderRadius:'0.5rem' }}>
                                    <span style={{ fontSize:'0.875rem', fontWeight:700, color: g.total_estudiantes ? '#1e3a5f' : '#94a3b8' }}>
                                      {g.total_estudiantes || 0}
                                    </span>
                                    <span style={{ fontSize:'0.7rem', color: g.total_estudiantes ? '#64748b' : '#94a3b8' }}>
                                      alumno{g.total_estudiantes !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'#64748b' }}>{g.creadoEl}</td>
                                <td style={{ padding:'0.75rem 1rem' }}>
                                  <BotonesAccionGrupo
                                    onAsignarEstudiantes={() => setAsignandoEstudiantes(g)}
                                    onEditar={() => setEditando(g)}
                                    onEliminar={() => setEliminando(g)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      {modalAbierto && (
        <GrupoModal onGuardar={handleGuardar} onCerrar={() => setModalAbierto(false)} guardando={guardando} />
      )}

      {editando && (
        <ModalEditarGrupo
          grupo={editando}
          onGuardar={handleEditar}
          onCerrar={() => setEditando(null)}
          guardando={guardando}
        />
      )}

      {asignandoEstudiantes && plantelId && (
        <ModalAsignarEstudiantes
          grupo={asignandoEstudiantes}
          plantelId={plantelId}
          onCerrar={() => setAsignandoEstudiantes(null)}
          onGuardar={handleAsignarEstudiantes}
        />
      )}

      {eliminando && typeof window !== 'undefined' && createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)' }}>
          <div style={{ background:'white', borderRadius:'1rem', width:'400px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
              <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
              </svg>
            </div>
            <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem' }}>¿Eliminar grupo?</h3>
            <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.5rem' }}>{eliminando.grado}° - Grupo {eliminando.numero}</p>
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.75rem', padding:'0.75rem 1rem', marginBottom:'1.5rem', width:'100%' }}>
              <p style={{ fontSize:'0.8rem', color:'#dc2626', margin:0, textAlign:'center' }}>
                ⚠️ Esta acción es permanente y no se puede deshacer
              </p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
              <button onClick={() => setEliminando(null)} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmarEliminar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}