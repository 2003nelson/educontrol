'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Alumno = {
  id: string
  nombre: string
  grupo: string
  semestre: number
  curp: string
  fechaNac: string
  tutor: string
  telefono: string
}

// ─── Datos mock ───────────────────────────────────────────────────────────────
const alumnosMock: Alumno[] = [
  { id:'1', nombre:'GARCÍA LÓPEZ ANA',         grupo:'101', semestre:1, curp:'GALA050312MCRRN00', fechaNac:'2005-03-12', tutor:'María López',    telefono:'938-123-4567' },
  { id:'2', nombre:'MARTÍNEZ RUIZ CARLOS',      grupo:'101', semestre:1, curp:'MARC040718HCSRR01', fechaNac:'2004-07-18', tutor:'Jorge Martínez', telefono:'938-234-5678' },
  { id:'3', nombre:'PÉREZ TORRES DIANA',        grupo:'301', semestre:3, curp:'PETD030920MCSRR02', fechaNac:'2003-09-20', tutor:'Ana Torres',     telefono:'938-345-6789' },
  { id:'4', nombre:'LÓPEZ SÁNCHEZ EDUARDO',     grupo:'301', semestre:3, curp:'LOSE020615HCSPD03', fechaNac:'2002-06-15', tutor:'Sofía Sánchez',  telefono:'938-456-7890' },
  { id:'5', nombre:'HERNÁNDEZ CRUZ FERNANDA',   grupo:'501', semestre:5, curp:'HECF010428MCRRN04', fechaNac:'2001-04-28', tutor:'Luis Cruz',      telefono:'938-567-8901' },
  { id:'6', nombre:'RAMÍREZ VEGA GABRIEL',      grupo:'501', semestre:5, curp:'RAVG021110HCSMB05', fechaNac:'2002-11-10', tutor:'Rosa Vega',      telefono:'938-678-9012' },
  { id:'7', nombre:'MORALES SILVA HECTOR',      grupo:'201', semestre:2, curp:'MOSH030205HCSMR06', fechaNac:'2003-02-05', tutor:'Carmen Silva',   telefono:'938-789-0123' },
  { id:'8', nombre:'JIMÉNEZ RÍOS ISABEL',       grupo:'401', semestre:4, curp:'JIRIS040830MCSSB07', fechaNac:'2004-08-30', tutor:'Pedro Ríos',     telefono:'938-890-1234' },
]

// ─── Modal alumno detalle ─────────────────────────────────────────────────────
function ModalAlumno({ alumno, onCerrar }: { alumno: Alumno; onCerrar: () => void }) {
  const [cerrando, setCerrando] = useState(false)
  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes saBackIn  { from{opacity:0} to{opacity:1} }
        @keyframes saBackOut { from{opacity:1} to{opacity:0} }
        @keyframes saIn  { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes saOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.93) translateY(12px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation: cerrando ? 'saBackOut 0.38s ease forwards' : 'saBackIn 0.25s ease' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', overflow:'hidden', animation: cerrando ? 'saOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'saIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#475569,#64748b)', padding:'1.25rem 1.5rem', position:'relative' }}>
            <button onClick={cerrar} style={{ position:'absolute', top:'1rem', right:'1rem', width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'white', fontWeight:700, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'0.75rem', background:'rgba(255,255,255,0.92)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:800, color:'#475569', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
                {alumno.semestre}
              </div>
              <div>
                <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'white', margin:0, fontFamily:'Outfit,sans-serif' }}>{alumno.nombre}</p>
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.25rem' }}>
                  <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.2)', color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>Grupo {alumno.grupo}</span>
                  <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.2)', color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>{alumno.semestre}° Semestre</span>
                </div>
              </div>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {[
              { label:'CURP',             value: alumno.curp },
              { label:'Fecha de nac.',    value: alumno.fechaNac },
              { label:'Tutor / Padre',    value: alumno.tutor },
              { label:'Teléfono',         value: alumno.telefono },
            ].map(f => (
              <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid #f8fafc' }}>
                <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</span>
                <span style={{ fontSize:'0.825rem', fontWeight:500, color:'#1e3a5f' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Modal nuevo alumno ───────────────────────────────────────────────────────
function ModalNuevoAlumno({ onGuardar, onCerrar }: { onGuardar: (a: Omit<Alumno,'id'>) => void; onCerrar: () => void }) {
  const [cerrando, setCerrando] = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [grupo,    setGrupo]    = useState('')
  const [semestre, setSemestre] = useState(1)
  const [curp,     setCurp]     = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [tutor,    setTutor]    = useState('')
  const [telefono, setTelefono] = useState('')

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  function guardar() {
    if (!nombre.trim() || !grupo.trim()) return
    onGuardar({ nombre: nombre.toUpperCase(), grupo, semestre, curp, fechaNac, tutor, telefono })
    cerrar()
  }

  const listo = nombre.trim() && grupo.trim()
  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      <style>{`
        @keyframes naBackIn  { from{opacity:0} to{opacity:1} }
        @keyframes naBackOut { from{opacity:1} to{opacity:0} }
        @keyframes naIn  { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes naOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.93) translateY(12px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation: cerrando ? 'naBackOut 0.38s ease forwards' : 'naBackIn 0.25s ease' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', overflow:'hidden', animation: cerrando ? 'naOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'naIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.125rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
            <div>
              <h2 style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Registrar nuevo alumno</h2>
              <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>Nombre y grupo son obligatorios</p>
            </div>
            <button onClick={cerrar} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.85rem' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>
          {/* Body */}
          <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {/* Nombre */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Nombre completo *</label>
                <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Apellido Apellido Nombre"
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
              {/* Grupo */}
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Grupo *</label>
                <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="101"
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
              {/* Semestre */}
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Semestre</label>
                <select value={semestre} onChange={e=>setSemestre(Number(e.target.value))}
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', background:'white', color:'#1e3a5f', boxSizing:'border-box' }}>
                  {[1,2,3,4,5,6].map(s=><option key={s} value={s}>{s}° Semestre</option>)}
                </select>
              </div>
              {/* CURP */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>CURP</label>
                <input value={curp} onChange={e=>setCurp(e.target.value.toUpperCase())} placeholder="XXXX000000XXXXXX00"
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f', fontFamily:'monospace' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
              {/* Fecha nac */}
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Fecha de nacimiento</label>
                <input type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)}
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
              {/* Tutor */}
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Tutor / Padre</label>
                <input value={tutor} onChange={e=>setTutor(e.target.value)} placeholder="Nombre del tutor"
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
              {/* Teléfono */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.35rem' }}>Teléfono</label>
                <input value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="938-000-0000"
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', color:'#1e3a5f' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>
            </div>
            {/* Botones */}
            <div style={{ display:'flex', gap:'0.625rem', paddingTop:'0.25rem' }}>
              <button onClick={cerrar} style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>Cancelar</button>
              <button onClick={guardar} disabled={!listo}
                style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: listo?'#1e3a5f':'#e2e8f0', color: listo?'white':'#94a3b8', cursor: listo?'pointer':'not-allowed', transition:'background 0.15s' }}
                onMouseEnter={e=>{ if(listo) e.currentTarget.style.background='#2563eb' }} onMouseLeave={e=>{ if(listo) e.currentTarget.style.background='#1e3a5f' }}>
                Registrar alumno
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Vista = 'grupos' | 'alumnos'

const GRUPOS_MOCK = [
  { id:'1',  nombre:'101', semestre:1, totalAlumnos:28 },
  { id:'2',  nombre:'102', semestre:1, totalAlumnos:30 },
  { id:'3',  nombre:'103', semestre:1, totalAlumnos:27 },
  { id:'4',  nombre:'201', semestre:2, totalAlumnos:29 },
  { id:'5',  nombre:'202', semestre:2, totalAlumnos:31 },
  { id:'6',  nombre:'203', semestre:2, totalAlumnos:26 },
  { id:'7',  nombre:'301', semestre:3, totalAlumnos:28 },
  { id:'8',  nombre:'302', semestre:3, totalAlumnos:27 },
  { id:'9',  nombre:'401', semestre:4, totalAlumnos:25 },
  { id:'10', nombre:'501', semestre:5, totalAlumnos:24 },
  { id:'11', nombre:'502', semestre:5, totalAlumnos:26 },
  { id:'12', nombre:'601', semestre:6, totalAlumnos:22 },
]

export default function ServiciosPage() {
  const [alumnos, setAlumnos]               = useState<Alumno[]>(alumnosMock)
  const [vista, setVista]                   = useState<Vista>('grupos')
  const [grupoActivo, setGrupoActivo]       = useState<string|null>(null)
  const [busqueda, setBusqueda]             = useState('')
  const [searchExp, setSearchExp]           = useState(false)
  const [alumnoDetalle, setAlumnoDetalle]   = useState<Alumno|null>(null)
  const [modalNuevo, setModalNuevo]         = useState(false)
  const [importando, setImportando]         = useState(false)
  const [importado, setImportado]           = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const gruposFiltrados = GRUPOS_MOCK.filter(g =>
    g.nombre.includes(busqueda) || String(g.semestre).includes(busqueda)
  )
  const alumnosDelGrupo = alumnos.filter(a =>
    a.grupo === grupoActivo &&
    (a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.curp.toLowerCase().includes(busqueda.toLowerCase()))
  )

  function entrarGrupo(nombre: string) { setGrupoActivo(nombre); setBusqueda(''); setVista('alumnos') }
  function volverGrupos() { setGrupoActivo(null); setBusqueda(''); setVista('grupos') }
  function handleGuardar(data: Omit<Alumno,'id'>) {
    setAlumnos(prev => [...prev, { ...data, id: Date.now().toString() }])
  }
  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setImportando(true)
    setTimeout(() => { setImportando(false); setImportado(true); setTimeout(() => setImportado(false), 2500) }, 1600)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes seIn   { from{opacity:0;transform:translateX(18px) scale(0.985)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
      <Header titulo="Servicios Escolares"/>

      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem' }}>

        {/* Barra de acciones */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {vista === 'alumnos' && (
              <button onClick={volverGrupos}
                style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'36px', padding:'0 0.875rem', borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:'0.8rem', fontWeight:500, color:'#64748b', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#1e3a5f'}}
                onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.borderColor='#e2e8f0'}}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Grupos
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              <p style={{ fontSize:'0.8rem', fontWeight: vista==='grupos'?700:500, color: vista==='grupos'?'#1e3a5f':'#94a3b8', margin:0 }}>Grupos</p>
              {vista === 'alumnos' && (
                <><span style={{ color:'#e2e8f0' }}>›</span>
                <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Grupo {grupoActivo}</p></>
              )}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            {/* Buscador */}
            <div ref={searchRef}
              style={{ display:'flex', alignItems:'center', height:'36px', borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', transition:'width 0.32s cubic-bezier(0.4,0,0.2,1)', width: searchExp ? '240px' : '36px', cursor: searchExp?'text':'pointer', overflow:'hidden', flexShrink:0 }}
              onClick={() => { if (!searchExp) { setSearchExp(true); setTimeout(() => (searchRef.current?.querySelector('input') as HTMLInputElement)?.focus(), 50) } }}
              onMouseLeave={() => { if (!busqueda) setSearchExp(false) }}>
              <div style={{ width:'36px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <input type="text" placeholder={vista==='grupos'?'Buscar grupo...':'Buscar alumno...'} value={busqueda}
                onChange={e=>setBusqueda(e.target.value)}
                onFocus={()=>setSearchExp(true)} onBlur={()=>{ if(!busqueda) setSearchExp(false) }}
                style={{ border:'none', outline:'none', fontSize:'0.8rem', color:'#334155', background:'transparent', width:'100%', opacity: searchExp?1:0, transition:'opacity 0.2s' }}/>
              {busqueda && searchExp && (
                <button onClick={e=>{ e.stopPropagation(); setBusqueda('') }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'0 0.4rem', fontSize:'1rem', lineHeight:1, flexShrink:0 }}>✕</button>
              )}
            </div>

            {/* Importar */}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportar} style={{ display:'none' }}/>
            <button onClick={() => fileRef.current?.click()} disabled={importando}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem', height:'36px', padding:'0 1rem', borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', cursor: importando?'default':'pointer', fontSize:'0.78rem', fontWeight:600, color: importado?'#16a34a':importando?'#94a3b8':'#475569', transition:'all 0.2s' }}
              onMouseEnter={e=>{ if(!importando&&!importado) e.currentTarget.style.background='#f8fafc' }}
              onMouseLeave={e=>{ if(!importando&&!importado) e.currentTarget.style.background='white' }}>
              {importado ? <><svg width="13" height="13" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>Importada</> :
               importando ? <><div style={{ width:'13px', height:'13px', border:'2px solid #e2e8f0', borderTopColor:'#94a3b8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>Importando...</> :
               <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h5" strokeLinecap="round"/></svg>Importar Excel</>}
            </button>

            {vista === 'alumnos' && (
              <button onClick={() => setModalNuevo(true)}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', height:'36px', padding:'0 1.125rem', borderRadius:'0.875rem', border:'none', background:'#1e3a5f', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, color:'white', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#2563eb')} onMouseLeave={e=>(e.currentTarget.style.background='#1e3a5f')}>
                <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo alumno
              </button>
            )}
          </div>
        </div>

        {/* Vista de Grupos */}
        {vista === 'grupos' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', animation:'seIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {gruposFiltrados.length === 0 ? (
              <div style={{ gridColumn:'1/-1', background:'white', borderRadius:'1rem', padding:'2.5rem', textAlign:'center', border:'1px solid #e2e8f0' }}>
                <p style={{ color:'#94a3b8', fontSize:'0.875rem', margin:0 }}>No se encontraron grupos</p>
              </div>
            ) : gruposFiltrados.map((g,i) => (
              <button key={g.id} onClick={() => entrarGrupo(g.nombre)}
                style={{ background:'white', borderRadius:'1rem', border:'1px solid #e2e8f0', padding:0, cursor:'pointer', textAlign:'left', overflow:'hidden', transition:'all 0.2s', animation:`cardIn 0.38s cubic-bezier(0.34,1.56,0.64,1) ${i*0.04}s both` }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,0.1)' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ background:'linear-gradient(135deg,#64748b,#94a3b8)', padding:'1rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'0.625rem', background:'rgba(255,255,255,0.92)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:800, color:'#475569', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>{g.nombre}</div>
                    <p style={{ fontSize:'0.875rem', fontWeight:700, color:'white', margin:0 }}>Grupo {g.nombre}</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ padding:'0.875rem 1.25rem', display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.2rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Semestre</p>
                    <p style={{ fontSize:'1rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{g.semestre}°</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.2rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Alumnos</p>
                    <p style={{ fontSize:'1rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{g.totalAlumnos}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Vista Alumnos */}
        {vista === 'alumnos' && (
          <div style={{ animation:'seIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ background:'white', borderRadius:'1rem', border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                <thead>
                  <tr style={{ background:'#fafbfc', borderBottom:'1px solid #f1f5f9' }}>
                    <th style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'38%' }}>Alumno</th>
                    <th style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'30%' }}>CURP</th>
                    <th style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'20%' }}>Fecha Nac.</th>
                    <th style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', width:'12%' }}>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosDelGrupo.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding:'2.5rem', textAlign:'center', fontSize:'0.8125rem', color:'#94a3b8' }}>No hay alumnos en este grupo</td></tr>
                  ) : alumnosDelGrupo.map(a => (
                    <tr key={a.id} style={{ borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                      onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                          <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color:'white', flexShrink:0 }}>{a.nombre.charAt(0)}</div>
                          <span style={{ fontSize:'0.825rem', fontWeight:500, color:'#1e3a5f' }}>{a.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', fontSize:'0.75rem', color:'#64748b', fontFamily:'monospace' }}>{a.curp || '—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem', fontSize:'0.8rem', color:'#64748b' }}>{a.fechaNac || '—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <button onClick={() => setAlumnoDetalle(a)}
                          style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#eff6ff', border:'1px solid #bfdbfe', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background='#dbeafe'; e.currentTarget.style.borderColor='#2563eb' }}
                          onMouseLeave={e=>{ e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#bfdbfe' }}>
                          <svg width="11" height="11" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding:'0.625rem 1.25rem', borderTop:'1px solid #f1f5f9', background:'#fafafa', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>{alumnosDelGrupo.length} alumno{alumnosDelGrupo.length!==1?'s':''} · Grupo {grupoActivo}</p>
                <p style={{ fontSize:'0.7rem', margin:0 }}>Served by <span style={{ color:'#2563eb', fontWeight:600 }}>Dinoti</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {alumnoDetalle && <ModalAlumno alumno={alumnoDetalle} onCerrar={() => setAlumnoDetalle(null)}/>}
      {modalNuevo    && <ModalNuevoAlumno onGuardar={handleGuardar} onCerrar={() => setModalNuevo(false)}/>}
    </div>
  )
}