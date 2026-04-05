'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

type Vista         = 'semestres' | 'grupos' | 'alumnos'
type FiltroPeriodo = 'semana' | 'bimestre' | 'semestre'
type GraficaTipo   = 'asistencia' | 'calificaciones'
type Direccion     = 'adelante' | 'atras'

type DatoBimestre = { numero: 1|2|3; promedio: number; asistencia: number; faltas: number }
type DatoSemana   = { semana: number; asistencia: number; faltas: number }
type Alumno       = { id: string; nombre: string; bimestres: DatoBimestre[]; semanas: DatoSemana[] }
type SliceData    = { label: string; value: number; color: string }

const MATERIAS = ['Matemáticas','Español','Historia','Física','Química','Inglés','Biología','Informática']

const semestresActivos = [
  { numero: 1, ciclo: 'Ago–Dic 2025', grupos: ['101','102','103'], alumnos: 87 },
  { numero: 3, ciclo: 'Ago–Dic 2025', grupos: ['301','302','303'], alumnos: 82 },
  { numero: 5, ciclo: 'Ago–Dic 2025', grupos: ['501','502','503'], alumnos: 79 },
]

const semestresData = [
  { numero: 1, ciclo: 'Ago–Dic', grupos: ['101','102','103'] },
  { numero: 3, ciclo: 'Ago–Dic', grupos: ['301','302','303'] },
  { numero: 5, ciclo: 'Ago–Dic', grupos: ['501','502','503'] },
]

const alumnosMock: Alumno[] = [
  { id:'1', nombre:'García López, Ana',
    bimestres:[{numero:1,promedio:92,asistencia:95,faltas:2},{numero:2,promedio:88,asistencia:90,faltas:4},{numero:3,promedio:94,asistencia:98,faltas:1}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:i%4===0?80:100,faltas:i%4===0?1:0})) },
  { id:'2', nombre:'Martínez Ruiz, Carlos',
    bimestres:[{numero:1,promedio:78,asistencia:72,faltas:8},{numero:2,promedio:75,asistencia:70,faltas:9},{numero:3,promedio:80,asistencia:75,faltas:7}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:i%2===0?60:80,faltas:i%2===0?2:1})) },
  { id:'3', nombre:'Pérez Torres, Diana',
    bimestres:[{numero:1,promedio:85,asistencia:88,faltas:3},{numero:2,promedio:82,asistencia:85,faltas:4},{numero:3,promedio:87,asistencia:92,faltas:3}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:i%5===0?80:100,faltas:i%5===0?1:0})) },
  { id:'4', nombre:'López Sánchez, Eduardo',
    bimestres:[{numero:1,promedio:96,asistencia:100,faltas:0},{numero:2,promedio:94,asistencia:98,faltas:1},{numero:3,promedio:97,asistencia:100,faltas:0}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:100,faltas:0})) },
  { id:'5', nombre:'Hernández Cruz, Fernanda',
    bimestres:[{numero:1,promedio:71,asistencia:80,faltas:6},{numero:2,promedio:68,asistencia:75,faltas:7},{numero:3,promedio:73,asistencia:82,faltas:5}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:i%3===0?60:80,faltas:i%3===0?2:1})) },
  { id:'6', nombre:'Ramírez Vega, Gabriel',
    bimestres:[{numero:1,promedio:60,asistencia:65,faltas:10},{numero:2,promedio:58,asistencia:62,faltas:11},{numero:3,promedio:62,asistencia:68,faltas:9}],
    semanas: Array.from({length:16},(_,i)=>({semana:i+1,asistencia:60,faltas:2})) },
]

function avg(nums: number[]) {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a,b)=>a+b,0)/nums.length)
}
function promedioColor(v: number)   { return v >= 60 ? '#16a34a' : '#dc2626' }
function asistenciaColor(v: number) { return v >= 80 ? '#16a34a' : '#dc2626' }

function polarToCartesian(cx:number,cy:number,r:number,deg:number) {
  const rad = (deg-90)*(Math.PI/180)
  return { x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad) }
}
function buildSlicePath(cx:number,cy:number,r:number,start:number,end:number) {
  if (end-start>=360) end=start+359.99
  const s=polarToCartesian(cx,cy,r,start), e=polarToCartesian(cx,cy,r,end)
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${end-start>180?1:0} 1 ${e.x},${e.y} Z`
}
function DonutChart({ slices }: { slices: SliceData[] }) {
  const total = slices.reduce((s,d)=>s+d.value,0)
  if (total===0) return null
  const cx=70,cy=70,r=58
  const paths = slices.reduce<{paths:React.ReactNode[];acc:number}>(
    ({paths,acc},s,i)=>{
      const angle=(s.value/total)*360
      return { paths:[...paths,<path key={i} d={buildSlicePath(cx,cy,r,acc,acc+angle)} fill={s.color}/>], acc:acc+angle }
    }, {paths:[],acc:0}
  ).paths
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {paths}
      <circle cx={cx} cy={cy} r={32} fill="white"/>
    </svg>
  )
}

function useViewTransition() {
  const [visible, setVisible]     = useState(true)
  const [animating, setAnimating] = useState(false)
  function transicionar(fn: () => void, dir: Direccion = 'adelante') {
    setAnimating(true)
    setVisible(false)
    setTimeout(() => { fn(); setVisible(true); setAnimating(false) }, 260)
    return dir
  }
  return { visible, animating, transicionar }
}

function VolverBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0', color:'#94a3b8', fontSize:'0.8rem', fontWeight:500, transition:'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color='#1e3a5f')}
      onMouseLeave={e => (e.currentTarget.style.color='#94a3b8')}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Volver
    </button>
  )
}

// ─── Datos reprobados ─────────────────────────────────────────────────────────
const reprobadosMock = [
  { id:'r1', nombre:'Ramírez Vega, Gabriel',       grupo:'101', semestre:1, materias:[
    {materia:'Matemáticas I',promedio:58},
    {materia:'Historia I',promedio:45},
    {materia:'Español I',promedio:52},
    {materia:'Física I',promedio:47},
    {materia:'Química I',promedio:55},
    {materia:'Inglés I',promedio:49},
    {materia:'Biología I',promedio:43},
    {materia:'Informática',promedio:51},
  ]},
  { id:'r2', nombre:'Martínez Ruiz, Carlos',        grupo:'102', semestre:1, materias:[{materia:'Español I',promedio:55}] },
  { id:'r3', nombre:'Hernández Cruz, Fernanda',     grupo:'301', semestre:3, materias:[{materia:'Química I',promedio:52},{materia:'Física I',promedio:48},{materia:'Inglés III',promedio:57}] },
  { id:'r4', nombre:'Torres Jiménez, Roberto',      grupo:'301', semestre:3, materias:[{materia:'Física I',promedio:48}] },
  { id:'r5', nombre:'Gómez Sánchez, Patricia',      grupo:'501', semestre:5, materias:[{materia:'Inglés V',promedio:57},{materia:'Biología II',promedio:53}] },
  { id:'r6', nombre:'Flores Méndez, Andrés',        grupo:'102', semestre:1, materias:[{materia:'Historia I',promedio:45}] },
  { id:'r7', nombre:'Castillo Ríos, Daniela',       grupo:'502', semestre:5, materias:[{materia:'Biología II',promedio:53}] },
  { id:'r8', nombre:'Morales López, Jesús',         grupo:'303', semestre:3, materias:[{materia:'Matemáticas III',promedio:50},{materia:'Historia Universal',promedio:47}] },
]

// ─── Modal editar calificación ────────────────────────────────────────────────
function ModalEditarCalif({
  alumno,
  aprobadas,
  onCerrar,
  onAprobar,
}: {
  alumno: typeof reprobadosMock[0]
  aprobadas: Set<string>
  onCerrar: () => void
  onAprobar: (materia: string) => void
}) {
  const pendientes = alumno.materias.filter(m => !aprobadas.has(m.materia))

  const [materiaIdx, setMateriaIdx]     = useState(0)
  const [califSelec, setCalifSelec]     = useState(pendientes[0]?.promedio ?? 0)
  const [paso, setPaso]                 = useState<'editar'|'confirmar'|'siguiente'>('editar')
  const [pasoCerrando, setPasoCerrando] = useState(false)
  const [cerrando, setCerrando]         = useState(false)
  const [ultimaAprobada, setUltimaAprobada] = useState<string>('')

  const materiaActual = pendientes[materiaIdx]
  const siguientePendiente = pendientes[materiaIdx + 1]

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }

  function irConfirmar() {
    setPasoCerrando(true)
    setTimeout(() => { setPaso('confirmar'); setPasoCerrando(false) }, 220)
  }
  function volverEditar() {
    setPasoCerrando(true)
    setTimeout(() => { setPaso('editar'); setPasoCerrando(false) }, 220)
  }
  function guardar() {
    setUltimaAprobada(materiaActual.materia)
    onAprobar(materiaActual.materia)
    if (siguientePendiente) {
      setPasoCerrando(true)
      setTimeout(() => {
        setMateriaIdx(i => i + 1)
        setCalifSelec(siguientePendiente.promedio)
        setPaso('siguiente')
        setPasoCerrando(false)
      }, 220)
    } else {
      cerrar()
    }
  }
  function irASiguiente() {
    setPasoCerrando(true)
    setTimeout(() => { setPaso('editar'); setPasoCerrando(false) }, 220)
  }
  function marcarPendiente() { cerrar() }

  const backdropAnim = cerrando ? 'rBackdropOut 0.38s ease forwards' : 'rBackdropIn 0.25s ease'
  const modalAnim    = cerrando ? 'rSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'rSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)'
  const colorCalif   = califSelec >= 60 ? '#16a34a' : '#dc2626'
  const bgCalif      = califSelec >= 60 ? '#f0fdf4' : '#fef2f2'

  const pasoStyle: React.CSSProperties = {
    opacity:   pasoCerrando ? 0 : 1,
    transform: pasoCerrando
      ? (paso === 'confirmar' ? 'translateX(-16px) scale(0.97)' : 'translateX(16px) scale(0.97)')
      : 'translateX(0) scale(1)',
    transition: pasoCerrando
      ? 'opacity 0.18s ease, transform 0.18s ease'
      : 'opacity 0.32s cubic-bezier(0.34,1.56,0.64,1), transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
  }

  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes rBackdropIn  { from{opacity:0} to{opacity:1} }
        @keyframes rBackdropOut { from{opacity:1} to{opacity:0} }
        @keyframes rSpringIn  { from{opacity:0;transform:scale(0.92) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes rSpringOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(14px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:backdropAnim }}/>
      <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', pointerEvents:'all', animation:modalAnim }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#dc2626', flexShrink:0 }}>{alumno.nombre.charAt(0)}</div>
              <div>
                <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{alumno.nombre}</p>
                <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>
                  {pendientes.length} materia{pendientes.length!==1?'s':''} pendiente{pendientes.length!==1?'s':''}
                  {materiaIdx > 0 && <span style={{ color:'#16a34a', marginLeft:'0.4rem' }}>· {materiaIdx} aprobada{materiaIdx!==1?'s':''}</span>}
                </p>
              </div>
            </div>
            <button onClick={cerrar} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontWeight:700, fontSize:'0.85rem' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>

          {/* Progress dots */}
          {pendientes.length > 1 && (
            <div style={{ display:'flex', gap:'0.3rem', padding:'0.625rem 1.5rem', borderBottom:'1px solid #f1f5f9', alignItems:'center' }}>
              {pendientes.map((m, i) => (
                <div key={i} style={{ flex:1, height:'3px', borderRadius:'9999px', background: i < materiaIdx ? '#16a34a' : i === materiaIdx ? '#2563eb' : '#e2e8f0', transition:'background 0.3s' }}/>
              ))}
              <span style={{ fontSize:'0.65rem', color:'#94a3b8', marginLeft:'0.5rem', flexShrink:0 }}>{materiaIdx+1}/{pendientes.length}</span>
            </div>
          )}

          {/* Body */}
          <div style={{ padding:'1.5rem', ...pasoStyle }}>

            {/* Paso: siguiente materia */}
            {paso === 'siguiente' ? (
              <>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.875rem', marginBottom:'1.5rem' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#f0fdf4', border:'2.5px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#16a34a', margin:'0 0 0.25rem' }}>✓ {ultimaAprobada}</p>
                    <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.25rem' }}>Queda otra materia pendiente</p>
                    <p style={{ fontSize:'0.8rem', color:'#64748b', margin:0 }}>¿Deseas revisar también <strong>{siguientePendiente?.materia ?? materiaActual.materia}</strong>?</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={marcarPendiente}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                    Dejar pendiente
                  </button>
                  <button onClick={irASiguiente}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#1d4ed8')} onMouseLeave={e=>(e.currentTarget.style.background='#2563eb')}>
                    Revisar →
                  </button>
                </div>
              </>
            ) : paso === 'editar' ? (
              <>
                <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.25rem', textAlign:'center' }}>¿Deseas aprobar a</p>
                <p style={{ fontSize:'1rem', fontWeight:700, color:'#2563eb', margin:'0 0 0.25rem', textAlign:'center' }}>&ldquo;{alumno.nombre.split(',')[0]}&rdquo;</p>
                <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0 0 1.25rem', textAlign:'center' }}>en <strong style={{ color:'#475569' }}>{materiaActual?.materia}</strong>?</p>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
                  <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:bgCalif, border:`3px solid ${colorCalif}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                    <span style={{ fontSize:'1.5rem', fontWeight:800, color:colorCalif, fontFamily:'Outfit,sans-serif' }}>{califSelec}</span>
                  </div>
                  <p style={{ fontSize:'0.7rem', fontWeight:600, color:colorCalif, margin:0 }}>{califSelec>=60?'✓ Calificación aprobatoria':'✗ Calificación reprobatoria'}</p>
                </div>
                <div style={{ marginBottom:'1.5rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:500 }}>0</span>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:500 }}>50</span>
                    <span style={{ fontSize:'0.7rem', color:'#16a34a', fontWeight:600 }}>60 mín.</span>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:500 }}>100</span>
                  </div>
                  <input type="range" min={0} max={100} value={califSelec} onChange={e=>setCalifSelec(Number(e.target.value))} style={{ width:'100%', accentColor:colorCalif, cursor:'pointer', height:'6px' }}/>
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={cerrar} style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>Cancelar</button>
                  <button onClick={irConfirmar} style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:califSelec>=60?'#16a34a':'#1e3a5f', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=califSelec>=60?'#15803d':'#2563eb'}} onMouseLeave={e=>{e.currentTarget.style.background=califSelec>=60?'#16a34a':'#1e3a5f'}}>
                    {califSelec>=60?'Aprobar →':'Guardar →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.875rem', marginBottom:'1.5rem' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:bgCalif, border:`2.5px solid ${colorCalif}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'1.25rem', fontWeight:800, color:colorCalif, fontFamily:'Outfit,sans-serif' }}>{califSelec}</span>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem' }}>¿Estás seguro?</p>
                    <p style={{ fontSize:'0.8125rem', color:'#475569', margin:'0 0 0.25rem' }}>Asignarás la calificación <span style={{ fontWeight:700, color:colorCalif }}>{califSelec}</span> a</p>
                    <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.25rem' }}>&ldquo;{alumno.nombre}&rdquo;</p>
                    <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>en {materiaActual?.materia}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={volverEditar} style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>← Editar</button>
                  <button onClick={guardar} style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:califSelec>=60?'#16a34a':'#1e3a5f', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=califSelec>=60?'#15803d':'#2563eb'}} onMouseLeave={e=>{e.currentTarget.style.background=califSelec>=60?'#16a34a':'#1e3a5f'}}>Sí, guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Tabla reprobados ─────────────────────────────────────────────────────────
function ReprobadosTable() {
  const [busqueda, setBusqueda]             = useState('')
  const [searchExp, setSearchExp]           = useState(false)
  const [alumnoEditando, setAlumnoEditando] = useState<typeof reprobadosMock[0] | null>(null)
  const [filtroParcial, setFiltroParcial]   = useState<'p1'|'p2'|'semestre'>('semestre')
  const [aprobadas, setAprobadas]           = useState<Record<string, Set<string>>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  function getAprobadas(id: string) { return aprobadas[id] ?? new Set<string>() }
  function onAprobar(alumnoId: string, materia: string) {
    setAprobadas(prev => {
      const next = new Set(prev[alumnoId] ?? [])
      next.add(materia)
      return { ...prev, [alumnoId]: next }
    })
  }

  const filtrados = reprobadosMock.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.grupo.includes(busqueda) ||
    a.materias.some(m => m.materia.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div style={{ background:'white', borderRadius:'1.25rem', border:'1px solid #e2e8f0', overflow:'hidden', animation:'cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) 0.25s both' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>
          <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Alumnos en riesgo de reprobar</p>
          {/* Slide menú parcial */}
          <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'9999px', padding:'3px' }}>
            {(()=>{
              const opts = [{key:'p1',label:'Parcial 1'},{key:'p2',label:'Parcial 2'},{key:'semestre',label:'Semestre'}]
              const idx  = opts.findIndex(o=>o.key===filtroParcial)
              return (
                <>
                  <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(${100/3}% - 2px)`, left:`calc(${idx*(100/3)}% + 3px)`, background:'white', borderRadius:'9999px', boxShadow:'0 1px 4px rgba(0,0,0,0.12)', transition:'left 0.25s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                  {opts.map(({key,label})=>(
                    <button key={key} onClick={()=>setFiltroParcial(key as typeof filtroParcial)}
                      style={{ position:'relative', zIndex:1, padding:'0.25rem 0.75rem', fontSize:'0.7rem', fontWeight:filtroParcial===key?600:500, color:filtroParcial===key?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'9999px', transition:'color 0.2s', whiteSpace:'nowrap' }}>
                      {label}
                    </button>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
        <div onMouseEnter={()=>{ setSearchExp(true); setTimeout(()=>inputRef.current?.focus(),50) }} onMouseLeave={()=>{ if(!busqueda) setSearchExp(false) }}
          style={{ display:'flex', alignItems:'center', height:'34px', width:searchExp?'220px':'34px', borderRadius:'0.75rem', border:'1px solid #e2e8f0', background:'#f8fafc', transition:'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s', overflow:'hidden', cursor:searchExp?'text':'pointer', boxShadow:searchExp?'0 0 0 2px #bfdbfe':'none', flexShrink:0 }}>
          <div style={{ width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <input ref={inputRef} type="text" placeholder="Buscar alumno o grupo..." value={busqueda}
            onChange={e=>setBusqueda(e.target.value)} onFocus={()=>setSearchExp(true)} onBlur={()=>{ if(!busqueda) setSearchExp(false) }}
            style={{ border:'none', outline:'none', fontSize:'0.775rem', color:'#334155', background:'transparent', width:'calc(100% - 34px)', paddingRight:'0.5rem', opacity:searchExp?1:0, transition:'opacity 0.2s' }}/>
          {busqueda && searchExp && <button onClick={()=>setBusqueda('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', paddingRight:'0.375rem', fontSize:'0.875rem', lineHeight:1, flexShrink:0 }}>✕</button>}
        </div>
      </div>
      <div style={{ maxHeight:'calc(6 * 52px + 42px)', overflowY:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'white', zIndex:1 }}>
              {['#','Alumno','Grupo','Materias reprobadas','Asig.','Acciones'].map(col=>(
                <th key={col} style={{ textAlign:'left', padding:'0.625rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length===0 ? (
              <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', fontSize:'0.8125rem', color:'#94a3b8' }}>No se encontraron alumnos</td></tr>
            ) : filtrados.map((a,i)=>{
              const ap = getAprobadas(a.id)
              const pendientes = a.materias.filter(m => !ap.has(m.materia))
              if (pendientes.length === 0) return null
              return (
              <tr key={a.id} style={{ borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#fff5f5')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                <td style={{ padding:'0.75rem 1rem', fontSize:'0.75rem', color:'#94a3b8' }}>{i+1}</td>
                <td style={{ padding:'0.75rem 1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'#dc2626', flexShrink:0 }}>{a.nombre.charAt(0)}</div>
                    <span style={{ fontSize:'0.8rem', fontWeight:500, color:'#1e3a5f' }}>{a.nombre}</span>
                  </div>
                </td>
                <td style={{ padding:'0.75rem 1rem' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'0.375rem', background:'#f1f5f9', color:'#475569', fontFamily:'Outfit,sans-serif' }}>{a.grupo}</span>
                </td>
                <td style={{ padding:'0.75rem 1rem', maxWidth:'240px' }}>
                  <div style={{ display:'flex', gap:'0.3rem', overflowX:'auto', paddingBottom:'2px', scrollbarWidth:'none' }}>
                    {pendientes.map((m,idx)=>(
                      <span key={idx} style={{ fontSize:'0.68rem', fontWeight:600, padding:'0.15rem 0.5rem', borderRadius:'9999px', background:'#fff5f5', color:'#dc2626', border:'1px solid #fecaca', whiteSpace:'nowrap', flexShrink:0 }}>
                        {m.materia} · {m.promedio}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding:'0.75rem 1rem', textAlign:'center' }}>
                  <span style={{ fontSize:'0.875rem', fontWeight:800, color:'#dc2626', fontFamily:'Outfit,sans-serif' }}>{pendientes.length}</span>
                </td>
                <td style={{ padding:'0.75rem 1rem' }}>
                  <button onClick={()=>setAlumnoEditando(a)}
                    style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#eff6ff', border:'1px solid #bfdbfe', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#dbeafe';e.currentTarget.style.borderColor='#2563eb'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#eff6ff';e.currentTarget.style.borderColor='#bfdbfe'}}>
                    <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#2563eb', fontFamily:'Outfit,sans-serif' }}>E</span>
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {alumnoEditando && (
        <ModalEditarCalif
          alumno={alumnoEditando}
          aprobadas={getAprobadas(alumnoEditando.id)}
          onCerrar={()=>setAlumnoEditando(null)}
          onAprobar={(materia)=>onAprobar(alumnoEditando.id, materia)}
        />
      )}
    </div>
  )
}

// ─── Modal confirmar cambio de estado semestre ────────────────────────────────
function ModalEstadoSemestre({
  semestre,
  activando,
  onConfirmar,
  onCerrar,
}: {
  semestre: number
  activando: boolean
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [cerrando, setCerrando] = useState(false)

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  function confirmar() { setCerrando(true); setTimeout(() => { onConfirmar(); onCerrar() }, 380) }

  const backdropAnim = cerrando ? 'msBackOut 0.38s ease forwards' : 'msBackIn 0.25s ease'
  const modalAnim    = cerrando ? 'msSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'msSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)'

  return createPortal(
    <>
      <style>{`
        @keyframes msBackIn   { from{opacity:0} to{opacity:1} }
        @keyframes msBackOut  { from{opacity:1} to{opacity:0} }
        @keyframes msSpringIn  { from{opacity:0;transform:scale(0.92) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes msSpringOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(14px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:backdropAnim }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'1.25rem', width:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', animation:modalAnim }}>

          {/* Header */}
          <div style={{ background: activando ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'1.5rem', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={cerrar} style={{ position:'absolute', top:'1rem', right:'1rem', width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'white', fontWeight:700, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {activando
                ? <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/></svg>
                : <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636" strokeLinecap="round"/></svg>
              }
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'1rem', fontWeight:700, color:'white', margin:0 }}>
                {activando ? 'Activar' : 'Desactivar'} {semestre}° Semestre
              </p>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.75)', margin:'0.25rem 0 0' }}>
                {activando ? 'Reactivar acceso a docentes' : 'Restringir acceso a docentes'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:'1.5rem' }}>
            <div style={{ background: activando ? '#f0fdf4' : '#fef2f2', border:`1px solid ${activando?'#bbf7d0':'#fecaca'}`, borderRadius:'0.875rem', padding:'1rem 1.25rem', marginBottom:'1.5rem' }}>
              <p style={{ fontSize:'0.875rem', color: activando ? '#15803d' : '#dc2626', margin:0, lineHeight:1.6, fontWeight:500 }}>
                {activando
                  ? '✓ Al activar este semestre los docentes asignados podrán volver a subir y editar calificaciones y asistencias desde su módulo.'
                  : '⚠️ Al desactivar este semestre los docentes no podrán registrar ni editar calificaciones ni asistencias hasta que se reactive.'
                }
              </p>
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={cerrar}
                style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                Cancelar
              </button>
              <button onClick={confirmar}
                style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background: activando ? '#16a34a' : '#dc2626', color:'white', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=activando?'#15803d':'#b91c1c'}}
                onMouseLeave={e=>{e.currentTarget.style.background=activando?'#16a34a':'#dc2626'}}>
                Sí, {activando ? 'activar' : 'desactivar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

function SemestreCard({ s, i, onClick }: { s: typeof semestresActivos[0]; i: number; onClick: () => void }) {
  const [activo, setActivo]   = useState(true)
  const [modal, setModal]     = useState(false)
  const [pendiente, setPendiente] = useState<boolean | null>(null)

  function handleSwitch(e: React.MouseEvent) {
    e.stopPropagation()
    setPendiente(!activo)
    setModal(true)
  }
  function confirmar() { if (pendiente !== null) setActivo(pendiente) }
  function cerrarModal() { setPendiente(null); setModal(false) }
  return (
    <>
    <button onClick={onClick}
      style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'1.25rem', textAlign:'left', cursor:'pointer', padding:0, overflow:'hidden', transition:'all 0.22s ease', animation:`cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ${i*0.07}s both` }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(59,130,246,0.12)' }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'0.75rem', background:'rgba(255,255,255,0.88)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.125rem', fontWeight:800, color:'#1e3a5f', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>{s.numero}</div>
          <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'white', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.numero}° Semestre</p>
        </div>
        <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ padding:'1rem 1.5rem', display:'flex', gap:'1.5rem', alignItems:'center' }}>
        <div>
          <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Grupos</p>
          <p style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.grupos.length}</p>
        </div>
        <div style={{ width:'1px', alignSelf:'stretch', background:'#f1f5f9' }}/>
        <div>
          <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Alumnos</p>
          <p style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.alumnos}</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem' }}>
          <div
            onClick={handleSwitch}
            style={{ width:'44px', height:'24px', borderRadius:'9999px', background: activo ? '#16a34a' : '#dc2626', position:'relative', cursor:'pointer', transition:'background 0.25s ease', flexShrink:0, boxShadow: activo ? '0 0 8px rgba(22,163,74,0.35)' : '0 0 8px rgba(220,38,38,0.25)' }}>
            <div style={{ position:'absolute', top:'3px', left: activo ? '23px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.25s cubic-bezier(0.4,0,0.2,1)' }}/>
          </div>
          <span style={{ fontSize:'0.6rem', fontWeight:600, color: activo ? '#16a34a' : '#dc2626', transition:'color 0.25s' }}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </button>

    {modal && pendiente !== null && (
      <ModalEstadoSemestre
        semestre={s.numero}
        activando={pendiente}
        onConfirmar={confirmar}
        onCerrar={cerrarModal}
      />
    )}
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SeguimientoPage() {
  const [vista,setVista]               = useState<Vista>('semestres')
  const [semestreActivo,setSemestreActivo] = useState<number|null>(null)
  const [grupoActivo,setGrupoActivo]   = useState<string|null>(null)
  const [filtroPeriodo,setFiltroPeriodo] = useState<FiltroPeriodo>('bimestre')
  const [bimestreSelec,setBimestreSelec] = useState<1|2|3>(1)
  const [semanaSelec,setSemanaSelec]   = useState<number>(1)
  const [semanaDir,setSemanaDir]       = useState<'izq'|'der'>('der')
  const [semanaVis,setSemanaVis]       = useState(true)
  const [graficaTipo,setGraficaTipo]   = useState<GraficaTipo>('calificaciones')
  const [busqueda,setBusqueda]         = useState('')
  const [materiaSelec,setMateriaSelec] = useState<string|null>(null)
  const [dir,setDir]                   = useState<Direccion>('adelante')
  const { visible, transicionar }      = useViewTransition()

  const semestre = semestresData.find(s=>s.numero===semestreActivo)

  function navegarA(nuevaVista: Vista, d: Direccion, fn?: () => void) {
    setDir(d)
    transicionar(()=>{ fn?.(); setVista(nuevaVista) }, d)
  }
  function seleccionarSemestre(num:number) { navegarA('grupos','adelante',()=>setSemestreActivo(num)) }
  function seleccionarGrupo(g:string)      { navegarA('alumnos','adelante',()=>setGrupoActivo(g)) }
  function volver() {
    if (vista==='alumnos') navegarA('grupos','atras',()=>setGrupoActivo(null))
    if (vista==='grupos')  navegarA('semestres','atras',()=>setSemestreActivo(null))
  }
  function cambiarFiltro(f:FiltroPeriodo) {
    setFiltroPeriodo(f); setBimestreSelec(1); setSemanaSelec(1)
    if (f==='semana') setGraficaTipo('asistencia')
  }
  function cambiarSemana(s: number) {
    if (s === semanaSelec) return
    setSemanaDir(s > semanaSelec ? 'der' : 'izq')
    setSemanaVis(false)
    setTimeout(() => { setSemanaSelec(s); setSemanaVis(true) }, 200)
  }
  function toggleMateria(m:string) { setMateriaSelec(prev=>prev===m?null:m) }

  const alumnosFiltrados = alumnosMock.filter(a=>a.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  type FilaTabla = { alumno:Alumno; promedio:number; asistencia:number; faltas:number }
  const filasActuales: FilaTabla[] = alumnosFiltrados.map(a=>{
    if (filtroPeriodo==='bimestre') {
      const b=a.bimestres.find(b=>b.numero===bimestreSelec)!
      return { alumno:a, promedio:b.promedio, asistencia:b.asistencia, faltas:b.faltas }
    }
    if (filtroPeriodo==='semana') {
      const s=a.semanas.find(s=>s.semana===semanaSelec)!
      return { alumno:a, promedio:0, asistencia:s.asistencia, faltas:s.faltas }
    }
    return { alumno:a, promedio:avg(a.bimestres.map(b=>b.promedio)), asistencia:avg(a.bimestres.map(b=>b.asistencia)), faltas:a.bimestres.reduce((s,b)=>s+b.faltas,0) }
  })

  const slicesGrafica: SliceData[] = (()=>{
    const vals=filasActuales.map(f=>graficaTipo==='calificaciones'?f.promedio:f.asistencia)
    if (graficaTipo==='calificaciones') return [
      { label:'Excelente (90-100)', value:vals.filter(v=>v>=90).length, color:'#16a34a' },
      { label:'Regular (70-89)',    value:vals.filter(v=>v>=70&&v<90).length, color:'#3b82f6' },
      { label:'Reprobado (<70)',    value:vals.filter(v=>v<70).length, color:'#dc2626' },
    ]
    return [
      { label:'Buena asistencia (≥80%)', value:vals.filter(v=>v>=80).length, color:'#16a34a' },
      { label:'En riesgo (<80%)',         value:vals.filter(v=>v<80).length,  color:'#dc2626' },
    ]
  })()

  const slideIn = dir==='adelante' ? 'translateX(18px)' : 'translateX(-18px)'
  const containerStyle: React.CSSProperties = {
    opacity:   visible?1:0,
    transform: visible?'translateX(0) scale(1)':`${slideIn} scale(0.985)`,
    transition: visible
      ? 'opacity 0.38s cubic-bezier(0.34,1.56,0.64,1), transform 0.38s cubic-bezier(0.34,1.56,0.64,1)'
      : 'opacity 0.22s ease, transform 0.22s ease',
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes semanaSlideIn  { from{opacity:0;transform:translateX(var(--sd,18px)) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
      `}</style>
      <Header titulo="Seguimiento Académico"/>
      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem' }}>
        <div style={containerStyle}>

          {/* ── VISTA: Semestres ── */}
          {vista==='semestres' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <p style={{ fontSize:'0.875rem', color:'#64748b', margin:0 }}>Ciclo Ago–Dic 2025</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }}>
                {semestresActivos.map((s,i)=>(
                  <SemestreCard key={s.numero} s={s} i={i} onClick={()=>seleccionarSemestre(s.numero)}/>
                ))}
              </div>
              <ReprobadosTable/>
            </div>
          )}

          {/* ── VISTA: Grupos ── */}
          {vista==='grupos' && semestre && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <VolverBtn onClick={volver}/>
                <div style={{ width:'1px', height:'14px', background:'#e2e8f0' }}/>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>{semestre.numero}° Semestre</p>
                <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{semestre.ciclo}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
                {semestre.grupos.map((grupo,i)=>(
                  <button key={grupo} onClick={()=>seleccionarGrupo(grupo)}
                    style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'1rem', padding:'1.5rem', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.22s ease', animation:`cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ${i*0.06}s both` }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,0.1)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                      <div style={{ width:'48px', height:'48px', borderRadius:'0.875rem', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'white', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>{grupo}</div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Grupo {grupo}</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.2rem 0 0' }}>{alumnosMock.length} alumnos</p>
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="#93c5fd" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── VISTA: Alumnos ── */}
          {vista==='alumnos' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <VolverBtn onClick={volver}/>
                  <div style={{ width:'1px', height:'14px', background:'#e2e8f0' }}/>
                  <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>Grupo {grupoActivo}</p>
                  <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{semestreActivo}° Semestre</span>
                </div>
                <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px', minWidth:'280px' }}>
                  {(()=>{
                    const opts=[{key:'semana',label:'Semana'},{key:'bimestre',label:'Parcial'},{key:'semestre',label:'Semestre'}]
                    const idx=opts.findIndex(o=>o.key===filtroPeriodo)
                    return (
                      <>
                        <div style={{ position:'absolute', top:'4px', bottom:'4px', width:`calc(${100/3}% - 2px)`, left:`calc(${idx*(100/3)}% + 4px)`, background:'white', borderRadius:'0.75rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(({key,label})=>(
                          <button key={key} onClick={()=>cambiarFiltro(key as FiltroPeriodo)}
                            style={{ position:'relative', zIndex:1, flex:1, padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight:filtroPeriodo===key?600:500, color:filtroPeriodo===key?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.75rem', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                            {label}
                          </button>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>

              {filtroPeriodo==='bimestre' && graficaTipo==='calificaciones' && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8' }}>Parcial</span>
                  <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'0.875rem', padding:'3px', minWidth:'180px' }}>
                    {(()=>{ const opts=[1,2]; const idx=opts.indexOf(bimestreSelec); return (
                      <>
                        <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 2px)`, left:`calc(${idx*50}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(b=>(<button key={b} onClick={()=>setBimestreSelec(b as 1|2|3)} style={{ position:'relative', zIndex:1, flex:1, padding:'0.375rem 0.875rem', fontSize:'0.775rem', fontWeight:bimestreSelec===b?600:500, color:bimestreSelec===b?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.625rem', transition:'color 0.2s', textAlign:'center' }}>Parcial {b}</button>))}
                      </>
                    )})()}
                  </div>
                </div>
              )}

              {(filtroPeriodo==='semana' || (filtroPeriodo==='bimestre' && graficaTipo==='asistencia')) && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8', flexShrink:0 }}>Semana</span>
                  <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(16, 34px)', gap:'0.25rem', background:'#f1f5f9', borderRadius:'0.875rem', padding:'4px' }}>
                    {/* Pill deslizante */}
                    <div style={{
                      position:'absolute',
                      top:'4px', bottom:'4px',
                      width:'34px',
                      left:`calc(${(semanaSelec-1)} * (34px + 4px) + 4px)`,
                      background:'#1e3a5f',
                      borderRadius:'0.5rem',
                      boxShadow:'0 2px 8px rgba(30,58,95,0.3)',
                      transition:'left 0.32s cubic-bezier(0.4,0,0.2,1)',
                      pointerEvents:'none',
                    }}/>
                    {Array.from({length:16},(_,i)=>i+1).map(s=>(
                      <button key={s} onClick={()=>cambiarSemana(s)}
                        style={{ position:'relative', zIndex:1, width:'34px', height:'34px', borderRadius:'0.5rem', fontSize:'0.75rem', fontWeight:semanaSelec===s?700:500, background:'transparent', color:semanaSelec===s?'white':'#64748b', border:'none', cursor:'pointer', transition:'color 0.22s ease', textAlign:'center' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Asignatura</span>
                  {materiaSelec && <button onClick={()=>setMateriaSelec(null)} style={{ fontSize:'0.65rem', fontWeight:600, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0 }}>· Todas</button>}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                  {MATERIAS.map(m=>{ const activa=materiaSelec===m; return (
                    <button key={m} onClick={()=>toggleMateria(m)}
                      style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.3rem 0.75rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:activa?600:400, background:activa?'#1e3a5f':'white', color:activa?'white':'#475569', border:activa?'1.5px solid #1e3a5f':'1px solid #e2e8f0', cursor:'pointer', opacity:materiaSelec&&!activa?0.4:1, transform:activa?'scale(1.04)':'scale(1)', boxShadow:activa?'0 3px 10px rgba(30,58,95,0.2)':'none', transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)' }}
                      onMouseEnter={e=>{if(!activa){e.currentTarget.style.borderColor='#1e3a5f';e.currentTarget.style.color='#1e3a5f'}}}
                      onMouseLeave={e=>{if(!activa){e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#475569'}}}>
                      {activa && <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {m}
                    </button>
                  )})}
                </div>
              </div>

              <div
                key={`${semanaSelec}-${bimestreSelec}`}
                style={{
                  display:'flex', flexDirection:'column', gap:'0.875rem',
                  opacity: semanaVis ? 1 : 0,
                  transform: semanaVis ? 'translateX(0) scale(1)' : `translateX(${semanaDir==='der'?'16px':'-16px'}) scale(0.985)`,
                  transition: semanaVis
                    ? 'opacity 0.32s cubic-bezier(0.4,0,0.2,1), transform 0.32s cubic-bezier(0.4,0,0.2,1)'
                    : 'opacity 0.16s ease, transform 0.16s ease',
                }}>

              <div style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', border:'1px solid #f1f5f9' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                  <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                    Distribución del grupo
                    {filtroPeriodo==='bimestre' && graficaTipo==='calificaciones' && ` · Parcial ${bimestreSelec}`}
                    {filtroPeriodo==='semana' && ` · Semana ${semanaSelec}`}
                    {filtroPeriodo==='bimestre' && graficaTipo==='asistencia' && ` · Semana ${semanaSelec}`}
                    {filtroPeriodo==='semestre' && ' — Semestre completo'}
                    {materiaSelec && ` · ${materiaSelec}`}
                  </p>
                  <div style={{ position:'relative', display:'flex', background:filtroPeriodo==='semana'?'#f8fafc':'#f1f5f9', borderRadius:'1rem', padding:'3px' }}>
                    {(()=>{ const opts=[{key:'calificaciones',label:'Calificaciones'},{key:'asistencia',label:'Asistencia'}]; const idx=opts.findIndex(o=>o.key===graficaTipo); return (
                      <>
                        <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 2px)`, left:`calc(${idx*50}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 6px rgba(0,0,0,0.1)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(({key,label})=>{ const disabled=filtroPeriodo==='semana'&&key==='calificaciones'; return (
                          <button key={key} onClick={()=>{ if(!disabled) setGraficaTipo(key as GraficaTipo) }}
                            style={{ position:'relative', zIndex:1, flex:1, padding:'0.4rem 0.875rem', fontSize:'0.75rem', fontWeight:graficaTipo===key?600:500, color:disabled?'#d1d5db':graficaTipo===key?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor:disabled?'not-allowed':'pointer', borderRadius:'0.625rem', transition:'color 0.2s', whiteSpace:'nowrap', opacity:disabled?0.5:1 }}>
                            {label}
                          </button>
                        )})}
                      </>
                    )})()}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
                  <DonutChart slices={slicesGrafica}/>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {slicesGrafica.map(s=>{ const total=slicesGrafica.reduce((a,b)=>a+b.value,0); const pct=total>0?Math.round((s.value/total)*100):0; return (
                      <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.75rem', color:'#475569' }}>{s.label}</span>
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:s.color, marginLeft:'0.25rem' }}>{s.value} ({pct}%)</span>
                      </div>
                    )})}
                    <p style={{ fontSize:'0.7rem', color:'#cbd5e1', margin:'0.25rem 0 0', paddingTop:'0.5rem', borderTop:'1px solid #f1f5f9' }}>{alumnosFiltrados.length} alumnos en total</p>
                  </div>
                </div>
              </div>

              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)' }}>
                  <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input type="text" placeholder="Buscar alumno..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                  style={{ paddingLeft:'2.25rem', paddingRight:'1rem', paddingTop:'0.5rem', paddingBottom:'0.5rem', fontSize:'0.8125rem', borderRadius:'0.875rem', width:'100%', boxSizing:'border-box', background:'white', border:'1px solid #e2e8f0', outline:'none', color:'#334155' }}
                  onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')} onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
              </div>

              {filtroPeriodo!=='semestre' && (
                <div style={{ background:'white', borderRadius:'1rem', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                  <div style={{ maxHeight:'calc(6 * 56px + 44px)', overflowY:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'white', zIndex:1 }}>
                          {['#','Alumno',...(filtroPeriodo==='bimestre'?['Promedio']:[]),'Asistencia','Faltas'].map(col=>(
                            <th key={col} style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filasActuales.map((fila,i)=>(
                          <tr key={fila.alumno.id} style={{ borderBottom:'1px solid #f8fafc' }}
                            onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                            <td style={{ padding:'0.875rem 1.25rem', fontSize:'0.75rem', color:'#94a3b8' }}>{i+1}</td>
                            <td style={{ padding:'0.875rem 1.25rem' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color:'white', flexShrink:0 }}>{fila.alumno.nombre.charAt(0)}</div>
                                <span style={{ fontSize:'0.8125rem', fontWeight:500, color:'#1e3a5f' }}>{fila.alumno.nombre}</span>
                              </div>
                            </td>
                            {filtroPeriodo==='bimestre' && <td style={{ padding:'0.875rem 1.25rem' }}><span style={{ fontSize:'0.875rem', fontWeight:700, color:promedioColor(fila.promedio) }}>{fila.promedio}</span></td>}
                            <td style={{ padding:'0.875rem 1.25rem' }}><span style={{ fontSize:'0.875rem', fontWeight:700, color:asistenciaColor(fila.asistencia) }}>{fila.asistencia}%</span></td>
                            <td style={{ padding:'0.875rem 1.25rem' }}><span style={{ fontSize:'0.875rem', fontWeight:600, color:fila.faltas>=5?'#dc2626':'#475569' }}>{fila.faltas}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'0.625rem 1.25rem', borderTop:'1px solid #f1f5f9', background:'#fafafa' }}>
                    <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>{alumnosFiltrados.length} alumnos{materiaSelec?` · ${materiaSelec}`:''}</p>
                  </div>
                </div>
              )}

              {filtroPeriodo==='semestre' && (
                <div style={{ background:'white', borderRadius:'1rem', overflow:'auto', border:'1px solid #f1f5f9' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', position:'sticky', left:0, background:'white' }}>#</th>
                        <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', position:'sticky', left:32, background:'white', minWidth:180 }}>Alumno</th>
                        {[1,2,3].map(b=><th key={`cal-${b}`} style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.08em', minWidth:80 }}>P{b} Cal.</th>)}
                        <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.08em', minWidth:90 }}>Prom.</th>
                        {[1,2,3].map(b=><th key={`asis-${b}`} style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.08em', minWidth:80 }}>P{b} Asis.</th>)}
                        <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.08em', minWidth:100 }}>Prom. Asis.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map((alumno,i)=>{ const promCal=avg(alumno.bimestres.map(b=>b.promedio)); const promAsis=avg(alumno.bimestres.map(b=>b.asistencia)); return (
                        <tr key={alumno.id} style={{ borderBottom:'1px solid #f8fafc' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                          <td style={{ padding:'0.75rem 1rem', fontSize:'0.75rem', color:'#94a3b8', position:'sticky', left:0, background:'white' }}>{i+1}</td>
                          <td style={{ padding:'0.75rem 1rem', position:'sticky', left:32, background:'white' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                              <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'white', flexShrink:0 }}>{alumno.nombre.charAt(0)}</div>
                              <span style={{ fontSize:'0.8rem', fontWeight:500, color:'#1e3a5f' }}>{alumno.nombre}</span>
                            </div>
                          </td>
                          {alumno.bimestres.map(b=><td key={`cal-${b.numero}`} style={{ padding:'0.75rem 1rem' }}><span style={{ fontSize:'0.875rem', fontWeight:700, color:promedioColor(b.promedio) }}>{b.promedio}</span></td>)}
                          <td style={{ padding:'0.75rem 1rem' }}><span style={{ fontSize:'0.8rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'0.5rem', background:promCal>=70?'#f0fdf4':'#fef2f2', color:promedioColor(promCal) }}>{promCal}</span></td>
                          {alumno.bimestres.map(b=><td key={`asis-${b.numero}`} style={{ padding:'0.75rem 1rem' }}><span style={{ fontSize:'0.875rem', fontWeight:700, color:asistenciaColor(b.asistencia) }}>{b.asistencia}%</span></td>)}
                          <td style={{ padding:'0.75rem 1rem' }}><span style={{ fontSize:'0.8rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'0.5rem', background:promAsis>=80?'#f0fdf4':'#fef2f2', color:asistenciaColor(promAsis) }}>{promAsis}%</span></td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              )}
            </div>{/* end semana animation wrapper */}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}