'use client'
import { useState, useRef } from 'react'
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
          width: '420px', maxHeight: '88vh', padding: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto',
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
          <div style={{ width: '100%', background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '220px', overflowY: 'auto' }}>
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
      animation: 'mSpringBackdrop 0.3s ease',
    }}>
      <style>{`
        @keyframes mSpringBackdrop { from { opacity:0 } to { opacity:1 } }
        @keyframes mSpringModal { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '480px', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        animation: 'mSpringModal 0.42s cubic-bezier(0.34,1.56,0.64,1)',
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

// ─── Botón agregar docente con debounce ──────────────────────────────────────
function AgregarDocenteBtn({ agregado, onClick }: { agregado: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    enterTimer.current = setTimeout(() => setHov(true), 120)
  }
  function handleLeave() {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setHov(false), 200)
  }

  const expandido = hov && !agregado

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: expandido ? '0.5rem' : '0',
        height: '40px',
        width: agregado ? 'auto' : expandido ? 'auto' : '40px',
        minWidth: agregado ? '160px' : expandido ? '110px' : '40px',
        padding: expandido || agregado ? '0 1.25rem' : '0',
        borderRadius: expandido || agregado ? '0.75rem' : '9999px',
        background: agregado ? '#16a34a' : expandido ? '#2563eb' : '#1e3a5f',
        border: 'none', cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden', whiteSpace: 'nowrap',
        flexShrink: 0, color: 'white',
      }}>
      {agregado
        ? <><svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg> Docente agregado</>
        : <><span style={{ fontSize: '1.25rem', lineHeight: 1, fontWeight: 300, flexShrink: 0 }}>+</span>
           {expandido && <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Agregar</span>}</>
      }
    </button>
  )
}

export default function DocentesPage() {
  const [docentes, setDocentes]                 = useState<Docente[]>(docentesIniciales)
  const [busqueda, setBusqueda]                 = useState('')
  const [modalAbierto, setModalAbierto]         = useState(false)
  const [docenteEditando, setDocenteEditando]   = useState<Docente | null>(null)
  const [docenteLimpiarMaterias, setDocenteLimpiarMaterias] = useState<Docente | null>(null)
  const [docenteAEliminar, setDocenteAEliminar] = useState<Docente | null>(null)

  const [docenteAgregado, setDocenteAgregado] = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [docenteCredencial, setDocenteCredencial] = useState<Docente | null>(null)
  const [verPassword, setVerPassword]             = useState(false)

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
      setDocenteAgregado(true)
      setTimeout(() => setDocenteAgregado(false), 2500)
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
      <style>{`
        @keyframes docentesPageIn {
          from { opacity:0; transform:translateX(18px) scale(0.985); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
      `}</style>
      <div className="p-6 flex flex-col" style={{ flex: 1, minHeight: 0, gap: '1rem', animation:'docentesPageIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Barra de acciones */}
        <div className="flex items-center justify-between">
          {/* Buscador — colapsable estilo Apple */}
          <div
            onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
            onMouseLeave={() => { if (!busqueda) setSearchExpanded(false) }}
            style={{
              display:'flex', alignItems:'center',
              height:'38px',
              width: searchExpanded ? '300px' : '38px',
              borderRadius:'0.875rem',
              border:'1px solid #e2e8f0',
              background:'white',
              transition:'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s',
              overflow:'hidden',
              cursor: searchExpanded ? 'text' : 'pointer',
              boxShadow: searchExpanded ? '0 0 0 2px #bfdbfe' : 'none',
              flexShrink: 0,
            }}>
            <div style={{ width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre, materia o grupo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => { if (!busqueda) setSearchExpanded(false) }}
              style={{ border:'none', outline:'none', fontSize:'0.8125rem', color:'#334155', background:'transparent', width:'calc(100% - 38px)', paddingRight:'0.75rem', opacity: searchExpanded ? 1 : 0, transition:'opacity 0.2s' }}
            />
            {busqueda && searchExpanded && (
              <button onClick={() => setBusqueda('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', paddingRight:'0.5rem', fontSize:'1rem', lineHeight:1, flexShrink:0 }}>✕</button>
            )}
          </div>

          {/* Leyenda + botón */}
          <div className="flex items-center gap-4">
            {/* Leyenda de acciones */}
            <div className="flex items-center gap-3">
              {[
                { letra: 'E', label: 'Editar',          bg: '#eff6ff', color: '#2563eb' },
                { letra: 'M', label: 'Materias',        bg: '#fffbeb', color: '#d97706' },
                { letra: 'X', label: 'Eliminar docente',bg: '#fef2f2', color: '#dc2626' },
              ].map(l => (
                <div key={l.letra} className="flex items-center gap-1.5">
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: l.bg, color: l.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {l.letra}
                  </div>
                  <span className="text-xs" style={{ color: '#64748b' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Separador */}
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

            {/* Botón agregar — círculo con debounce anti-parpadeo */}
            <AgregarDocenteBtn
              agregado={docenteAgregado}
              onClick={() => { setDocenteEditando(null); setModalAbierto(true) }}
            />
          </div>
        </div>

        {/* Tabla rediseñada */}
        <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Cabecera */}
          <div className="grid px-6 py-3" style={{
            gridTemplateColumns: '2.5fr 2fr 2fr 1fr',
            borderBottom: '1px solid #f1f5f9',
          }}>
            {['Docente', 'Asignaturas', 'Correo', 'Acciones'].map(col => (
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
              const ini = docente.nombre
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
                      style={{ background: `linear-gradient(135deg, ${getColor(docente.nombre).from}, ${getColor(docente.nombre).to})`, fontFamily: 'Outfit, sans-serif' }}>
                      {ini}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>{docente.nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        {docente.asignaciones.length} grupo{docente.asignaciones.length !== 1 ? 's' : ''} asignado{docente.asignaciones.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Columna asignaturas — pills con scroll */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', maxHeight:'7rem', overflowY:'auto', paddingRight:'1rem', marginRight:'0.5rem', alignContent:'flex-start' }}>
                    {docente.asignaciones.map((a, i) => (
                      <span key={i}
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          fontSize: '0.72rem', fontWeight: 600,
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          background: '#f1f5f9',
                          color: '#1e3a5f',
                          border: '1px solid #e2e8f0',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.01em',
                          cursor: 'default',
                          transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#d1fae5'
                          e.currentTarget.style.borderColor = '#6ee7b7'
                          e.currentTarget.style.color = '#065f46'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f1f5f9'
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.color = '#1e3a5f'
                        }}>
                        {a.materia}<span style={{ color:'#94a3b8', margin:'0 0.15rem' }}>·</span>{a.grupo}
                      </span>
                    ))}
                  </div>

                  {/* Columna correo */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <button
                      onClick={() => { setDocenteCredencial(docente); setVerPassword(false) }}
                      title="Ver credenciales"
                      style={{ background:'none', border:'none', cursor:'pointer', padding:'3px', display:'flex', alignItems:'center', flexShrink:0, color:'#cbd5e1', transition:'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <span className="text-xs" style={{ color: '#64748b' }}>{docente.email}</span>
                  </div>

                  {/* Columna acciones */}
                  <div className="flex gap-2 items-center">
                    {[
                      { letra: 'E', label: 'Editar',   bg: '#eff6ff', color: '#2563eb', hoverBg: '#dbeafe', action: () => handleEditar(docente) },
                      { letra: 'M', label: 'Materias', bg: '#fffbeb', color: '#d97706', hoverBg: '#fef3c7', action: () => setDocenteLimpiarMaterias(docente) },
                      { letra: 'X', label: 'Eliminar', bg: '#fef2f2', color: '#dc2626', hoverBg: '#fee2e2', action: () => setDocenteAEliminar(docente) },
                    ].map(btn => (
                      <button key={btn.letra}
                        onClick={btn.action}
                        title={btn.label}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: btn.bg, color: btn.color,
                          border: `1px solid ${btn.hoverBg}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                          flexShrink: 0, transition: 'all 0.15s',
                          fontFamily: 'Outfit, sans-serif',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = btn.hoverBg; e.currentTarget.style.transform = 'scale(1.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = btn.bg; e.currentTarget.style.transform = 'scale(1)' }}>
                        {btn.letra}
                      </button>
                    ))}
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

      {/* Modal credenciales */}
      {docenteCredencial && typeof window !== 'undefined' && createPortal(
        <div onClick={() => setDocenteCredencial(null)}
          style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:'credBackdropIn 0.3s ease' }}>
          <style>{`
            @keyframes credBackdropIn { from { opacity:0 } to { opacity:1 } }
            @keyframes credModalIn {
              from { opacity:0; transform:scale(0.92) translateY(12px); }
              to   { opacity:1; transform:scale(1) translateY(0); }
            }
          `}</style>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'1rem', width:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden', animation:'credModalIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'white', flexShrink:0, fontFamily:'Outfit, sans-serif' }}>
                  {docenteCredencial.nombre.split(' ').filter(w=>w.length>0).slice(0,2).map(w=>w[0]).join('')}
                </div>
                <div>
                  <p style={{ fontSize:'0.875rem', fontWeight:700, color:'white', margin:0 }}>{docenteCredencial.nombre}</p>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', margin:'0.125rem 0 0' }}>Credenciales de acceso</p>
                </div>
              </div>
              <button onClick={() => setDocenteCredencial(null)}
                style={{ background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', width:'28px', height:'28px', borderRadius:'50%', color:'white', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Correo */}
              <div style={{ background:'#f8fafc', borderRadius:'0.75rem', padding:'0.875rem 1rem', border:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>Correo electrónico</p>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f' }}>{docenteCredencial.email}</span>
                </div>
              </div>

              {/* Contraseña */}
              <div style={{ background:'#f8fafc', borderRadius:'0.75rem', padding:'0.875rem 1rem', border:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.375rem' }}>Contraseña</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', letterSpacing: verPassword ? '0.01em' : '0.15em', fontFamily: verPassword ? 'inherit' : 'monospace' }}>
                      {verPassword ? 'Educontrol123' : '••••••••••••'}
                    </span>
                  </div>
                  <button onClick={() => setVerPassword(p => !p)}
                    title={verPassword ? 'Ocultar' : 'Mostrar'}
                    style={{ background:'none', border:'none', cursor:'pointer', color: verPassword ? '#2563eb' : '#94a3b8', display:'flex', alignItems:'center', padding:'4px', borderRadius:'0.375rem', transition:'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {verPassword ? (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button onClick={() => setDocenteCredencial(null)}
                style={{ width:'100%', padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {docenteAEliminar && typeof window !== 'undefined' && createPortal(
        <div onClick={() => setDocenteAEliminar(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation:'xBackdrop 0.3s ease' }}>
          <style>{`
            @keyframes xBackdrop { from { opacity:0 } to { opacity:1 } }
            @keyframes xSpring  { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
          `}</style>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8" style={{ animation:'xSpring 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
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