'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

const SEMESTRES = [1, 2, 3, 4, 5, 6]

type AlumnoFila = { id: string; matricula: string; nombre: string }

type Grupo = {
  id: string
  nombre: string
  semestre: number
  creadoEl: string
  totalAlumnos: number
}

const gruposIniciales: Grupo[] = [
  { id:'1',  nombre:'101', semestre:1, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'2',  nombre:'102', semestre:1, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'3',  nombre:'103', semestre:1, creadoEl:'13 Ago 2025', totalAlumnos: 0 },
  { id:'4',  nombre:'201', semestre:2, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'5',  nombre:'202', semestre:2, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'6',  nombre:'203', semestre:2, creadoEl:'14 Ago 2025', totalAlumnos: 0 },
  { id:'7',  nombre:'301', semestre:3, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'8',  nombre:'302', semestre:3, creadoEl:'13 Ago 2025', totalAlumnos: 0 },
  { id:'9',  nombre:'401', semestre:4, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'10', nombre:'501', semestre:5, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
  { id:'11', nombre:'502', semestre:5, creadoEl:'13 Ago 2025', totalAlumnos: 0 },
  { id:'12', nombre:'601', semestre:6, creadoEl:'12 Ago 2025', totalAlumnos: 0 },
]

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Botón agregar expandible ─────────────────────────────────────────────────
function AgregarGrupoBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <button onClick={onClick}
      onMouseEnter={() => { if (leaveT.current) clearTimeout(leaveT.current); enterT.current = setTimeout(() => setHov(true), 120) }}
      onMouseLeave={() => { if (enterT.current) clearTimeout(enterT.current); leaveT.current = setTimeout(() => setHov(false), 200) }}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: hov ? '0.5rem' : '0',
        height:'40px', width: hov ? 'auto' : '40px', minWidth: hov ? '160px' : '40px',
        padding: hov ? '0 1.25rem' : '0', borderRadius: hov ? '0.875rem' : '50%',
        background:'#1e3a5f', border:'none', cursor:'pointer',
        transition:'all 0.3s ease', overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
        boxShadow:'0 2px 8px rgba(30,58,95,0.2)',
      }}>
      <span style={{ fontSize:'1.25rem', fontWeight:300, color:'white', lineHeight:1, flexShrink:0 }}>+</span>
      {hov && <span style={{ fontSize:'0.875rem', fontWeight:600, color:'white' }}>Agregar grupo</span>}
    </button>
  )
}

// ─── Modal agregar grupo ──────────────────────────────────────────────────────
function GrupoModal({
  onGuardar,
  onCerrar,
}: {
  onGuardar: (data: Omit<Grupo, 'id' | 'creadoEl'>) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre]           = useState('')
  const [semestre, setSemestre]       = useState(1)
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }

  const backdropAnim = cerrando ? 'gBackdropOut 0.38s ease forwards' : 'gBackdropIn 0.25s ease'
  const modalAnim    = cerrando ? 'gSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'gSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)'
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
          <p style={{ fontSize:'0.875rem', color:'#475569', margin:'0 0 0.25rem', textAlign:'center' }}>Estás a punto de agregar</p>
          <p style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.25rem', textAlign:'center' }}>
            &ldquo;Grupo {nombre}&rdquo;
          </p>
          <p style={{ fontSize:'0.875rem', color:'#94a3b8', margin:'0 0 1.5rem', textAlign:'center' }}>al {semestre}° Semestre</p>
          <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
            <button onClick={() => setConfirmando(false)}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background='white')}>
              ← Editar
            </button>
            <button onClick={() => onGuardar({ nombre, semestre, totalAlumnos: 0 })}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
              Sí, agregar
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
          <button onClick={cerrar} style={{ color:'#94a3b8', fontSize:'1.25rem', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color='#475569')}
            onMouseLeave={e => (e.currentTarget.style.color='#94a3b8')}>✕</button>
        </div>

        <div style={{ padding:'0 1.75rem 1.75rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.375rem' }}>Nombre del grupo</label>
            <input type="text" placeholder="Ej. 101"
              value={nombre} onChange={e => setNombre(e.target.value.toUpperCase().slice(0, 10))}
              maxLength={10} autoFocus
              style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', textTransform:'uppercase' }}
              onFocus={e => (e.currentTarget.style.boxShadow='0 0 0 2px #93c5fd')}
              onBlur={e => (e.currentTarget.style.boxShadow='none')} />
            <p style={{ fontSize:'0.7rem', color: nombre.length >= 10 ? '#dc2626' : '#94a3b8', margin:'0.375rem 0 0', textAlign:'right' }}>{nombre.length}/10</p>
          </div>

          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.5rem' }}>Semestre</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.5rem' }}>
              {SEMESTRES.map(s => (
                <button key={s} onClick={() => setSemestre(s)}
                  style={{ padding:'0.625rem 0', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:700, border: semestre===s ? '2px solid #1e3a5f' : '1px solid #e2e8f0', background: semestre===s ? '#1e3a5f' : 'white', color: semestre===s ? 'white' : '#64748b', cursor:'pointer', transition:'all 0.15s', fontFamily:'Outfit, sans-serif' }}>
                  {s}°
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.25rem' }}>
            <button onClick={cerrar}
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background='white')}>
              Cancelar
            </button>
            <button onClick={() => { if (nombre.trim()) setConfirmando(true) }}
              disabled={!nombre.trim()}
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: nombre.trim() ? '#1e3a5f' : '#e2e8f0', color: nombre.trim() ? 'white' : '#94a3b8', cursor: nombre.trim() ? 'pointer' : 'not-allowed', transition:'all 0.15s' }}
              onMouseEnter={e => { if (nombre.trim()) e.currentTarget.style.background='#2563eb' }}
              onMouseLeave={e => { if (nombre.trim()) e.currentTarget.style.background='#1e3a5f' }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// ─── Botón editar expandible ──────────────────────────────────────────────────
function EditarGrupoBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveT.current) clearTimeout(leaveT.current)
    enterT.current = setTimeout(() => setHov(true), 180)
  }
  function handleLeave() {
    if (enterT.current) clearTimeout(enterT.current)
    leaveT.current = setTimeout(() => setHov(false), 280)
  }

  return (
    <button onClick={onClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: hov ? '0.4rem' : '0',
        height:'28px',
        width: hov ? 'auto' : '28px',
        minWidth: hov ? '100px' : '28px',
        padding: hov ? '0 0.75rem' : '0',
        borderRadius: hov ? '0.5rem' : '50%',
        background: hov ? '#eff6ff' : '#f1f5f9',
        border: hov ? '1px solid #2563eb' : '1px solid #e2e8f0',
        cursor:'pointer',
        transition:'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
      }}>
      <span style={{ fontSize:'0.7rem', fontWeight:700, color: hov ? '#2563eb' : '#64748b', flexShrink:0 }}>E</span>
      {hov && <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#2563eb' }}>Editar</span>}
    </button>
  )
}

// ─── Modal editar grupo ───────────────────────────────────────────────────────
function ModalEditarGrupo({ grupo, onGuardar, onCerrar }: {
  grupo: Grupo
  onGuardar: (id: string, nombre: string, semestre: number) => void
  onCerrar: () => void
}) {
  const [nombre,   setNombre]   = useState(grupo.nombre)
  const [semestre, setSemestre] = useState(grupo.semestre)
  const [cerrando, setCerrando] = useState(false)

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  function guardar() {
    if (!nombre.trim()) return
    onGuardar(grupo.id, nombre.trim(), semestre)
    cerrar()
  }

  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes egBackIn  { from{opacity:0} to{opacity:1} }
        @keyframes egBackOut { from{opacity:1} to{opacity:0} }
        @keyframes egIn  { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes egOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.93) translateY(12px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation: cerrando ? 'egBackOut 0.38s ease forwards' : 'egBackIn 0.25s ease' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', overflow:'hidden', animation: cerrando ? 'egOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'egIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
            <div>
              <h2 style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Editar grupo</h2>
              <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>Grupo {grupo.nombre}</p>
            </div>
            <button onClick={cerrar} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.85rem' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>
          <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <div>
              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Nombre del grupo</label>
              <input value={nombre} onChange={e=>setNombre(e.target.value)}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
            </div>
            <div>
              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Semestre</label>
              <select value={semestre} onChange={e=>setSemestre(Number(e.target.value))}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.875rem', outline:'none', background:'white', color:'#1e3a5f', boxSizing:'border-box' }}>
                {[1,2,3,4,5,6].map(s=><option key={s} value={s}>{s}° Semestre</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:'0.625rem', paddingTop:'0.25rem' }}>
              <button onClick={cerrar} style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>Cancelar</button>
              <button onClick={guardar} style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#2563eb')} onMouseLeave={e=>(e.currentTarget.style.background='#1e3a5f')}>Guardar cambios</button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Modal cargar alumnos por pegado ─────────────────────────────────────────
function ModalCargaAlumnos({ grupo, alumnosExistentes, onCargar, onCerrar }: {
  grupo: { nombre: string }
  alumnosExistentes: AlumnoFila[]
  onCargar: (grupoNombre: string, filas: AlumnoFila[]) => void
  onCerrar: () => void
}) {
  const modoEdicion = alumnosExistentes.length > 0
  const [texto, setTexto]   = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [cargado, setCargado]   = useState(false)

  // Edit mode: editable list of existing alumnos
  const [editList, setEditList] = useState<AlumnoFila[]>(alumnosExistentes.map(a => ({ ...a })))
  const [nuevaNombre, setNuevaNombre]     = useState('')
  const [nuevaMatricula, setNuevaMatricula] = useState('')

  function cerrar() { setCerrando(true); setTimeout(onCerrar, 380) }

  // Parse pasted text
  type Fila = { matricula: string; nombre: string }
  const filasPaste: Fila[] = texto.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const partes = l.split('\t')
      if (partes.length >= 2) return { matricula: partes[0].trim(), nombre: toTitleCase(partes.slice(1).join(' ').trim()) }
      return { matricula: '', nombre: toTitleCase(l) }
    })
  const tieneMatricula = filasPaste.some(f => f.matricula)
  const listo = modoEdicion ? editList.length > 0 : filasPaste.length > 0

  function cargarYCerrar() {
    let resultado: AlumnoFila[]
    if (modoEdicion) {
      resultado = editList
    } else {
      resultado = filasPaste.map((f, i) => ({ id: `f-${Date.now()}-${i}`, matricula: f.matricula, nombre: f.nombre }))
    }
    onCargar(grupo.nombre, resultado)
    setCargado(true)
    setTimeout(() => cerrar(), 1200)
  }

  function agregarNuevo() {
    if (!nuevaNombre.trim()) return
    setEditList(prev => [...prev, { id: `new-${Date.now()}`, matricula: nuevaMatricula.trim(), nombre: toTitleCase(nuevaNombre.trim()) }])
    setNuevaNombre(''); setNuevaMatricula('')
  }

  function editarAlumno(id: string, campo: 'nombre'|'matricula', val: string) {
    setEditList(prev => prev.map(a => a.id === id ? { ...a, [campo]: val } : a))
  }

  function eliminarAlumno(id: string) {
    setEditList(prev => prev.filter(a => a.id !== id))
  }

  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes cgBI{from{opacity:0}to{opacity:1}} @keyframes cgBO{from{opacity:1}to{opacity:0}}
        @keyframes cgI{from{opacity:0;transform:scale(0.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes cgO{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.9) translateY(16px)}}
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: cerrando?'cgBO 0.38s ease forwards':'cgBI 0.28s ease' }}/>
      <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.5rem', width:'900px', maxWidth:'calc(100vw - 2rem)', height:'520px', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', pointerEvents:'all', overflow:'hidden', animation: cerrando?'cgO 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards':'cgI 0.46s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            <div>
              <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>
                {modoEdicion ? `Editar alumnos — Grupo ${grupo.nombre}` : `Cargar alumnos — Grupo ${grupo.nombre}`}
              </h2>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.2rem 0 0' }}>
                {modoEdicion ? 'Edita nombres, matrículas o agrega alumnos nuevos' : 'Pega desde Excel — soporta matrícula + nombre en columnas separadas'}
              </p>
            </div>
            <button onClick={cerrar} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>

          {/* Body */}
          <div style={{ display:'grid', gridTemplateColumns:'5fr 7fr', flex:'1 1 0', minHeight:0, overflow:'hidden' }}>

            {/* Izquierda */}
            <div style={{ padding:'1.25rem 1.5rem', borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {modoEdicion ? (
                // Edit mode: form to add new alumno
                <>
                  <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Agregar alumno</p>
                  <input value={nuevaMatricula} onChange={e=>setNuevaMatricula(e.target.value)} placeholder="Matrícula (opcional)"
                    style={{ border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.82rem', outline:'none', color:'#1e3a5f' }}
                    onFocus={e=>(e.currentTarget.style.borderColor='#2563eb')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                  <input value={nuevaNombre} onChange={e=>setNuevaNombre(e.target.value)} placeholder="Nombre completo *"
                    style={{ border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.82rem', outline:'none', color:'#1e3a5f' }}
                    onFocus={e=>(e.currentTarget.style.borderColor='#2563eb')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}
                    onKeyDown={e=>{ if(e.key==='Enter') agregarNuevo() }}/>
                  <button onClick={agregarNuevo} disabled={!nuevaNombre.trim()}
                    style={{ padding:'0.5rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: nuevaNombre.trim()?'#1e3a5f':'#e2e8f0', color: nuevaNombre.trim()?'white':'#94a3b8', cursor: nuevaNombre.trim()?'pointer':'not-allowed', transition:'background 0.15s' }}
                    onMouseEnter={e=>{ if(nuevaNombre.trim()) e.currentTarget.style.background='#2563eb' }} onMouseLeave={e=>{ if(nuevaNombre.trim()) e.currentTarget.style.background='#1e3a5f' }}>
                    + Agregar alumno
                  </button>
                  <div style={{ marginTop:'0.5rem', padding:'0.75rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px solid #f1f5f9', fontSize:'0.72rem', color:'#64748b' }}>
                    <p style={{ margin:'0 0 0.25rem', fontWeight:600, color:'#475569' }}>Tip: también puedes pegar una lista nueva</p>
                    <p style={{ margin:0 }}>Los cambios actuales se reemplazarán con lo que pegues.</p>
                  </div>
                </>
              ) : (
                // Paste mode
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Área de pegado</p>
                    {texto && <button onClick={()=>setTexto('')} style={{ fontSize:'0.7rem', color:'#dc2626', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:600 }}>Limpiar</button>}
                  </div>
                  <textarea value={texto} onChange={e=>setTexto(e.target.value)}
                    placeholder={'Una columna (solo nombre):\nGarcía López Ana\nMartínez Ruiz Carlos\n\nDos columnas (matrícula + nombre):\n12345\tGarcía López Ana\n12346\tMartínez Ruiz Carlos'}
                    style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:'0.875rem', padding:'0.875rem', fontSize:'0.8rem', outline:'none', resize:'none', color:'#1e3a5f', lineHeight:1.7, fontFamily:'monospace', boxSizing:'border-box', transition:'border-color 0.15s' }}
                    onFocus={e=>(e.currentTarget.style.borderColor='#2563eb')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                  <p style={{ fontSize:'0.68rem', color:'#94a3b8', margin:0 }}>
                    En Excel: selecciona columna(s) → <strong>Ctrl+C</strong> → pega aquí <strong>Ctrl+V</strong>
                  </p>
                </>
              )}
            </div>

            {/* Derecha — vista previa / lista editable */}
            <div style={{ display:'flex', flexDirection:'column', minHeight:0 }}>
              <div style={{ padding:'1.25rem 1.5rem 0.625rem', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>
                  {modoEdicion ? 'Lista de alumnos' : 'Vista previa'}
                </p>
                <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'0.15rem 0.5rem', borderRadius:'9999px', background: listo?'#eff6ff':'#f1f5f9', color: listo?'#2563eb':'#94a3b8' }}>
                  {modoEdicion ? editList.length : filasPaste.length} alumno{(modoEdicion?editList.length:filasPaste.length)!==1?'s':''}
                </span>
              </div>

              {modoEdicion ? (
                // Editable list
                <div style={{ flex:'1 1 0', overflowY:'auto', minHeight:0 }}>
                  {editList.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'0.5rem', color:'#94a3b8' }}>
                      <p style={{ fontSize:'0.8rem', margin:0 }}>Sin alumnos — agrega uno desde la izquierda</p>
                    </div>
                  ) : editList.map((a) => (
                    <div key={a.id} style={{ display:'grid', gridTemplateColumns:'76px 1fr 28px', gap:'0.375rem', alignItems:'center', padding:'0.375rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                      <input value={a.matricula} onChange={e=>editarAlumno(a.id,'matricula',e.target.value)} placeholder="—"
                        style={{ border:'1px solid #e2e8f0', borderRadius:'0.375rem', padding:'0.25rem 0.375rem', fontSize:'0.72rem', outline:'none', color:'#475569', fontFamily:'monospace', textAlign:'center', width:'100%', boxSizing:'border-box' }}
                        onFocus={e=>(e.currentTarget.style.borderColor='#2563eb')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                      <input value={a.nombre} onChange={e=>editarAlumno(a.id,'nombre',e.target.value)}
                        style={{ border:'1px solid #e2e8f0', borderRadius:'0.375rem', padding:'0.25rem 0.5rem', fontSize:'0.8rem', outline:'none', color:'#1e3a5f', fontWeight:500, width:'100%', boxSizing:'border-box' }}
                        onFocus={e=>(e.currentTarget.style.borderColor='#2563eb')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                      <button onClick={()=>eliminarAlumno(a.id)}
                        style={{ width:'24px', height:'24px', borderRadius:'50%', background:'#fef2f2', border:'1px solid #fecaca', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', fontSize:'0.65rem', flexShrink:0 }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : filasPaste.length === 0 ? (
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', textAlign:'center', padding:'1.5rem' }}>
                  <svg width="32" height="32" fill="none" stroke="#e2e8f0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>Los alumnos aparecerán aquí</p>
                </div>
              ) : (
                <>
                  {tieneMatricula && (
                    <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 24px', gap:'0.5rem', padding:'0.25rem 1.5rem', background:'#f8fafc', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
                      <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Matrícula</span>
                      <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Nombre</span>
                    </div>
                  )}
                  <div style={{ flex:'1 1 0', overflowY:'auto', minHeight:0 }}>
                    {filasPaste.map((f, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns: tieneMatricula ? '80px 1fr 24px' : '1fr 24px', gap:'0.5rem', alignItems:'center', padding:'0.4rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                        {tieneMatricula && (
                          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#475569', fontFamily:'monospace', background:'#f1f5f9', padding:'0.15rem 0.375rem', borderRadius:'0.375rem', textAlign:'center' }}>{f.matricula}</span>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth:0 }}>
                          <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, color:'white', flexShrink:0 }}>{f.nombre.charAt(0)}</div>
                          <span style={{ fontSize:'0.78rem', color:'#1e3a5f', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.nombre}</span>
                        </div>
                        <span style={{ fontSize:'0.62rem', color:'#cbd5e1', textAlign:'right' }}>#{i+1}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'0.875rem 1.75rem', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>
              {modoEdicion
                ? `${editList.length} alumnos en el grupo ${grupo.nombre}`
                : listo ? `${filasPaste.length} alumnos${tieneMatricula?' con matrícula':''} listos para el grupo ${grupo.nombre}` : 'Pega los datos para continuar'}
            </p>
            <div style={{ display:'flex', gap:'0.625rem' }}>
              <button onClick={cerrar} style={{ padding:'0.5rem 1.125rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}>Cancelar</button>
              <button disabled={!listo} onClick={cargarYCerrar}
                style={{ padding:'0.5rem 1.375rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background: cargado?'#16a34a':listo?'#1e3a5f':'#e2e8f0', color: listo?'white':'#94a3b8', cursor: listo?'pointer':'not-allowed', transition:'background 0.3s' }}
                onMouseEnter={e=>{ if(listo&&!cargado) e.currentTarget.style.background='#2563eb' }} onMouseLeave={e=>{ if(listo&&!cargado) e.currentTarget.style.background='#1e3a5f' }}>
                {cargado ? '✓ Guardado' : modoEdicion ? `✓ Guardar cambios` : `✓ Cargar ${listo?filasPaste.length:''} alumnos`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Botón eliminar expandible ────────────────────────────────────────────────
function EliminarGrupoBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveT.current) clearTimeout(leaveT.current)
    enterT.current = setTimeout(() => setHov(true), 180)
  }
  function handleLeave() {
    if (enterT.current) clearTimeout(enterT.current)
    leaveT.current = setTimeout(() => setHov(false), 280)
  }

  return (
    <button onClick={onClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: hov ? '0.4rem' : '0',
        height:'28px',
        width: hov ? 'auto' : '28px',
        minWidth: hov ? '130px' : '28px',
        padding: hov ? '0 0.75rem' : '0',
        borderRadius: hov ? '0.5rem' : '50%',
        background: hov ? '#fee2e2' : '#fef2f2',
        border: hov ? '1px solid #dc2626' : '1px solid #fecaca',
        cursor:'pointer',
        transition:'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
      }}>
      <svg width="11" height="11" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
      </svg>
      {hov && <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#dc2626' }}>Eliminar grupo</span>}
    </button>
  )
}

export default function GruposPage() {
  const [grupos, setGrupos]                   = useState<Grupo[]>(gruposIniciales)
  const [modalAbierto, setModalAbierto]       = useState(false)
  const [eliminando, setEliminando]           = useState<Grupo | null>(null)
  const [elimCerrando, setElimCerrando]       = useState(false)
  const [editando, setEditando]               = useState<Grupo | null>(null)
  const [cargandoGrupo, setCargandoGrupo]     = useState<Grupo | null>(null)
  const [alumnosPorGrupo, setAlumnosPorGrupo] = useState<Record<string, AlumnoFila[]>>({})
  const [semestreFiltro, setSemestreFiltro]   = useState<number | 'todos'>('todos')
  const [busqueda, setBusqueda]               = useState('')
  const [agregado, setAgregado]               = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const [localBusqueda, setLocalBusqueda]     = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [semestresContraidos, setSemestresContraidos] = useState<Set<number>>(new Set())

  function toggleSemestre(s: number) {
    setSemestresContraidos(prev => {
      const next = new Set(prev)
      if (next.has(s)) { next.delete(s) } else { next.add(s) }
      return next
    })
  }



  function handleEditar(id: string, nombre: string, semestre: number) {
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, nombre, semestre } : g))
  }

  function handleCarga(grupoNombre: string, filas: AlumnoFila[]) {
    setAlumnosPorGrupo(prev => ({ ...prev, [grupoNombre]: filas }))
    setGrupos(prev => prev.map(g => g.nombre === grupoNombre ? { ...g, totalAlumnos: filas.length } : g))
  }

  function cerrarEliminar() {
    setElimCerrando(true)
    setTimeout(() => { setEliminando(null); setElimCerrando(false) }, 360)
  }

  function confirmarEliminar() {
    if (!eliminando) return
    setGrupos(prev => prev.filter(g => g.id !== eliminando.id))
    cerrarEliminar()
  }

  function handleGuardar(data: Omit<Grupo, 'id' | 'creadoEl'>) {
    const hoy = new Date()
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const creadoEl = `${hoy.getDate()} ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`
    setGrupos(prev => [...prev, { ...data, id: Date.now().toString(), creadoEl }])
    setModalAbierto(false)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2500)
  }

  const gruposFiltrados = grupos.filter(g => {
    const matchSem = semestreFiltro === 'todos' || g.semestre === semestreFiltro
    const matchBus = g.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchSem && matchBus
  })

  const porSemestre = SEMESTRES.map(s => ({
    semestre: s,
    items: gruposFiltrados.filter(g => g.semestre === s),
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes gruposPageIn {
          from { opacity:0; transform:translateX(18px) scale(0.985) }
          to   { opacity:1; transform:translateX(0) scale(1) }
        }
      `}</style>
      <Header titulo="Grupos" />

      <div className="px-4 pb-4 pt-3 flex flex-col"
        style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem', animation:'gruposPageIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Barra superior */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">

            {/* Buscador colapsable */}
            <div
              onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              onMouseLeave={() => { if (!localBusqueda) setSearchExpanded(false) }}
              style={{ display:'flex', alignItems:'center', height:'38px', width: searchExpanded ? '240px' : '38px', borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', transition:'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s', overflow:'hidden', cursor: searchExpanded ? 'text' : 'pointer', boxShadow: searchExpanded ? '0 0 0 2px #bfdbfe' : 'none', flexShrink:0 }}>
              <div style={{ width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input ref={searchInputRef} type="text" placeholder="Buscar grupo..."
                value={localBusqueda}
                onChange={e => { setLocalBusqueda(e.target.value); setBusqueda(e.target.value) }}
                onFocus={() => setSearchExpanded(true)}
                onBlur={() => { if (!localBusqueda) setSearchExpanded(false) }}
                style={{ border:'none', outline:'none', fontSize:'0.8rem', color:'#334155', background:'transparent', width:'calc(100% - 38px)', paddingRight:'0.75rem', opacity: searchExpanded ? 1 : 0, transition:'opacity 0.2s' }}
              />
              {localBusqueda && searchExpanded && (
                <button onClick={() => { setLocalBusqueda(''); setBusqueda('') }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', paddingRight:'0.5rem', fontSize:'1rem', lineHeight:1, flexShrink:0 }}>✕</button>
              )}
            </div>

            {/* Menú slide semestres */}
            <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px', minWidth:'420px' }}>
              {(() => {
                const opciones = ['todos', ...SEMESTRES.map(String)]
                const idx = opciones.indexOf(String(semestreFiltro))
                const total = opciones.length
                return (
                  <>
                    <div style={{ position:'absolute', top:'4px', bottom:'4px', width:`calc(${100/total}%)`, left:`calc(${idx*(100/total)}% + 4px)`, background:'white', borderRadius:'0.75rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                    <button onClick={() => setSemestreFiltro('todos')}
                      style={{ position:'relative', zIndex:1, flex:1, padding:'0.5rem 0', fontSize:'0.8rem', fontWeight: semestreFiltro==='todos' ? 600 : 500, color: semestreFiltro==='todos' ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.75rem', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                      Todos
                    </button>
                    {SEMESTRES.map(s => (
                      <button key={s} onClick={() => setSemestreFiltro(s)}
                        style={{ position:'relative', zIndex:1, flex:1, padding:'0.5rem 0', fontSize:'0.8rem', fontWeight: semestreFiltro===s ? 600 : 500, color: semestreFiltro===s ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.75rem', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                        {s}°
                      </button>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Total grupos */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', background:'white', borderRadius:'0.875rem', border:'1px solid #e2e8f0' }}>
              <p style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{grupos.length}</p>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>grupos registrados</p>
            </div>

            {/* Botón agregar */}
            {agregado ? (
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', height:'40px', padding:'0 1.25rem', borderRadius:'0.875rem', background:'#16a34a', color:'white', fontSize:'0.875rem', fontWeight:600 }}>
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Grupo agregado
              </div>
            ) : (
              <AgregarGrupoBtn onClick={() => setModalAbierto(true)} />
            )}
          </div>
        </div>

        {/* Grid por semestre */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {porSemestre.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
              <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>No se encontraron grupos</p>
            </div>
          ) : porSemestre.map(({ semestre, items }) => {
            const contraido = semestresContraidos.has(semestre)
            return (
              <div key={semestre}>
                {/* Header semestre */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom: contraido ? '0' : '0.75rem' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'0.5rem', background:'#1e3a5f', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, fontFamily:'Outfit, sans-serif', flexShrink:0 }}>
                    {semestre}
                  </div>
                  <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{semestre}° Semestre</p>
                  <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>
                    {items.length} grupo{items.length !== 1 ? 's' : ''}
                  </p>
                  <div style={{ flex:1, height:'1px', background:'#f1f5f9' }}/>
                  <button onClick={() => toggleSemestre(semestre)}
                    style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'none', border:'none', cursor:'pointer', padding:'0.2rem 0.5rem', borderRadius:'0.5rem', color:'#94a3b8', fontSize:'0.7rem', fontWeight:600, transition:'all 0.15s', flexShrink:0 }}
                    onMouseEnter={e => { e.currentTarget.style.color='#1e3a5f'; e.currentTarget.style.background='#f1f5f9' }}
                    onMouseLeave={e => { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='none' }}>
                    {contraido ? 'Expandir' : 'Contraer'}
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                      style={{ transform: contraido ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)', flexShrink:0 }}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Tabla grupos */}
                <div style={{ overflow:'hidden', maxHeight: contraido ? '0' : '2000px', opacity: contraido ? 0 : 1, transition:'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease' }}>
                  <div style={{ background:'white', borderRadius:'0.875rem', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid #f1f5f9', background:'#fafbfc' }}>
                          <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'35%' }}>Grupo</th>
                          <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'20%' }}>Fecha de creación</th>
                          <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'25%' }}>Cargar alumnos</th>
                          <th style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'20%' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(g => (
                          <tr key={g.id} style={{ borderBottom:'1px solid #f8fafc' }}
                            onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background='white')}>
                            <td style={{ padding:'0.75rem 1rem' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#eff6ff', border:'1.5px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:'#1e3a5f', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
                                  {g.nombre}
                                </div>
                                <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f' }}>Grupo {g.nombre}</span>
                              </div>
                            </td>
                            <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'#64748b' }}>{g.creadoEl}</td>
                            <td style={{ padding:'0.75rem 1rem', overflow:'visible' }}>
                              <button onClick={() => setCargandoGrupo(g)}
                                style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'28px', padding:'0 0.75rem', borderRadius:'9999px', border: g.totalAlumnos>0 ? '1px solid #16a34a' : '1px dashed #2563eb', background: g.totalAlumnos>0 ? '#f0fdf4' : '#eff6ff', cursor:'pointer', fontSize:'0.72rem', fontWeight:600, color: g.totalAlumnos>0 ? '#16a34a' : '#2563eb', transition:'all 0.15s', whiteSpace:'nowrap' }}
                                onMouseEnter={e=>{ e.currentTarget.style.filter='brightness(0.95)' }}
                                onMouseLeave={e=>{ e.currentTarget.style.filter='none' }}>
                                {g.totalAlumnos > 0
                                  ? <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>{g.totalAlumnos} alumnos</>
                                  : <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/></svg>Pegar lista</>
                                }
                              </button>
                            </td>
                            <td style={{ padding:'0.75rem 1rem', overflow:'visible', position:'relative' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                <EditarGrupoBtn onClick={() => setEditando(g)} />
                                <EliminarGrupoBtn onClick={() => setEliminando(g)} />
                              </div>
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
      </div>

      {/* Modal agregar */}
      {modalAbierto && (
        <GrupoModal onGuardar={handleGuardar} onCerrar={() => setModalAbierto(false)} />
      )}
      {editando && (
        <ModalEditarGrupo grupo={editando} onGuardar={handleEditar} onCerrar={() => setEditando(null)} />
      )}
      {cargandoGrupo && (
        <ModalCargaAlumnos grupo={cargandoGrupo} alumnosExistentes={alumnosPorGrupo[cargandoGrupo.nombre] ?? []} onCargar={handleCarga} onCerrar={() => setCargandoGrupo(null)} />
      )}

      {/* Modal eliminar */}
      {eliminando && typeof window !== 'undefined' && createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation: elimCerrando ? 'gBackdropOut 0.36s ease forwards' : 'gBackdropIn 0.25s ease' }}>
          <style>{`@keyframes gBackdropIn{from{opacity:0}to{opacity:1}} @keyframes gBackdropOut{from{opacity:1}to{opacity:0}} @keyframes gElimIn{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes gElimOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.92) translateY(12px)}}`}</style>
          <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'400px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation: elimCerrando ? 'gElimOut 0.36s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'gElimIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
              <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
              </svg>
            </div>
            <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem', textAlign:'center' }}>¿Eliminar grupo?</h3>
            <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.5rem', textAlign:'center' }}>&ldquo;Grupo {eliminando.nombre}&rdquo;</p>
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.75rem', padding:'0.75rem 1rem', marginBottom:'1.5rem', width:'100%' }}>
              <p style={{ fontSize:'0.8rem', color:'#dc2626', margin:0, textAlign:'center', lineHeight:1.5 }}>
                ⚠️ Esta acción borrará el grupo permanentemente y no podrás recuperarlo después.
              </p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
              <button onClick={cerrarEliminar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background='#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background='#2563eb')}>Cancelar</button>
              <button onClick={confirmarEliminar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background='#b91c1c')} onMouseLeave={e => (e.currentTarget.style.background='#dc2626')}>Sí, eliminar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}