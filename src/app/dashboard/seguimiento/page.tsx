'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import Header from '@/components/Header'

type Vista         = 'semestres' | 'grupos' | 'alumnos' | 'historial'
type FiltroPeriodo = 'semana' | 'bimestre' | 'semestre'
type GraficaTipo   = 'asistencia' | 'calificaciones'

type DatoBimestre = { numero: 1 | 2 | 3; promedio: number; asistencia: number; faltas: number }
type DatoSemana   = { semana: number; asistencia: number; faltas: number }
type Alumno       = { id: string; nombre: string; bimestres: DatoBimestre[]; semanas: DatoSemana[] }
type SliceData    = { label: string; value: number; color: string }

const MATERIAS = ['Matemáticas','Español','Historia','Física','Química','Inglés','Biología','Informática']

const semestresActivos = [
  { numero: 1, ciclo: 'Ago–Dic 2025', grupos: ['101','102','103'], imagen: '/img1v.png',   alumnos: 87 },
  { numero: 3, ciclo: 'Ago–Dic 2025', grupos: ['301','302','303'], imagen: '/img2.png',    alumnos: 82 },
  { numero: 5, ciclo: 'Ago–Dic 2025', grupos: ['501','502','503'], imagen: '/img3v2.png',  alumnos: 79 },
]

const semestresHistorial = [
  { numero: 1, ciclo: 'Ene–Jun 2025', grupos: ['101','102','103'], alumnos: 90, promedio: 83, asistencia: 91 },
  { numero: 2, ciclo: 'Ene–Jun 2025', grupos: ['201','202','203'], alumnos: 85, promedio: 80, asistencia: 89 },
  { numero: 3, ciclo: 'Ene–Jun 2025', grupos: ['301','302','303'], alumnos: 78, promedio: 85, asistencia: 93 },
  { numero: 4, ciclo: 'Ene–Jun 2025', grupos: ['401','402','403'], alumnos: 81, promedio: 79, asistencia: 88 },
  { numero: 5, ciclo: 'Ago–Dic 2024', grupos: ['501','502','503'], alumnos: 76, promedio: 77, asistencia: 86 },
  { numero: 6, ciclo: 'Ago–Dic 2024', grupos: ['601','602','603'], alumnos: 72, promedio: 82, asistencia: 90 },
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
function promedioColor(v: number)   { return v >= 70 ? '#16a34a' : '#dc2626' }
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
    },
    {paths:[],acc:0}
  ).paths
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {paths}
      <circle cx={cx} cy={cy} r={32} fill="white"/>
    </svg>
  )
}

function ArrowButton() {
  const [hovered,setHovered]=useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0"
      style={{ background:hovered?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.55)', boxShadow:hovered?'0 2px 10px rgba(0,0,0,0.12)':'none' }}>
      <svg width="18" height="18" fill="none" stroke="#1e3a5f" strokeWidth="2.5" viewBox="0 0 24 24"
        style={{ transform:hovered?'translateX(2px)':'translateX(0)', transition:'transform 0.2s' }}>
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ─── Botón historial expandible ───────────────────────────────────────────────
function HistorialBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHov(true)
  }
  function handleLeave() {
    timerRef.current = setTimeout(() => setHov(false), 120)
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: hov ? '0.5rem' : '0',
        height: '36px',
        width: hov ? 'auto' : '36px',
        minWidth: hov ? '180px' : '36px',
        padding: hov ? '0 1rem' : '0',
        borderRadius: hov ? '0.75rem' : '50%',
        background: '#1e3a5f', border: 'none', cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden', whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(30,58,95,0.2)',
      }}>
      <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      {hov && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Historial de semestres</span>}
    </button>
  )
}

export default function SeguimientoPage() {
  const [vista,setVista]                   = useState<Vista>('semestres')
  const [semestreActivo,setSemestreActivo] = useState<number|null>(null)
  const [grupoActivo,setGrupoActivo]       = useState<string|null>(null)
  const [filtroPeriodo,setFiltroPeriodo]   = useState<FiltroPeriodo>('bimestre')
  const [bimestreSelec,setBimestreSelec]   = useState<1|2|3>(1)
  const [semanaSelec,setSemanaSelec]       = useState<number>(1)
  const [graficaTipo,setGraficaTipo]       = useState<GraficaTipo>('calificaciones')
  const [busqueda,setBusqueda]             = useState('')
  const [materiaSelec,setMateriaSelec]     = useState<string|null>(null)

  const semestre = semestresData.find(s=>s.numero===semestreActivo)

  function seleccionarSemestre(num:number) { setSemestreActivo(num); setVista('grupos') }
  function seleccionarGrupo(g:string)      { setGrupoActivo(g); setVista('alumnos') }
  function volver() {
    if (vista==='alumnos')   { setVista('grupos');    setGrupoActivo(null) }
    if (vista==='grupos')    { setVista('semestres'); setSemestreActivo(null) }
    if (vista==='historial') { setVista('semestres') }
  }
  function cambiarFiltro(f:FiltroPeriodo) { setFiltroPeriodo(f); setBimestreSelec(1); setSemanaSelec(1) }
  function toggleMateria(m:string) { setMateriaSelec(prev=>prev===m?null:m) }

  const alumnosFiltrados = alumnosMock.filter(a=>a.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  type FilaTabla = { alumno:Alumno; promedio:number; asistencia:number; faltas:number }
  const filasActuales: FilaTabla[] = alumnosFiltrados.map(a => {
    if (filtroPeriodo==='bimestre') {
      const b=a.bimestres.find(b=>b.numero===bimestreSelec)!
      return { alumno:a, promedio:b.promedio, asistencia:b.asistencia, faltas:b.faltas }
    }
    if (filtroPeriodo==='semana') {
      const s=a.semanas.find(s=>s.semana===semanaSelec)!
      return { alumno:a, promedio:0, asistencia:s.asistencia, faltas:s.faltas }
    }
    return {
      alumno:a,
      promedio:   avg(a.bimestres.map(b=>b.promedio)),
      asistencia: avg(a.bimestres.map(b=>b.asistencia)),
      faltas:     a.bimestres.reduce((s,b)=>s+b.faltas,0),
    }
  })

  const slicesGrafica: SliceData[] = (() => {
    const valores = filasActuales.map(f=>graficaTipo==='calificaciones'?f.promedio:f.asistencia)
      .filter(v=>filtroPeriodo!=='semana'||graficaTipo==='asistencia'?true:v>0)
    if (graficaTipo==='calificaciones') return [
      { label:'Excelente (90-100)', value:valores.filter(v=>v>=90).length, color:'#16a34a' },
      { label:'Regular (70-89)',    value:valores.filter(v=>v>=70&&v<90).length, color:'#3b82f6' },
      { label:'Reprobado (<70)',    value:valores.filter(v=>v<70).length, color:'#dc2626' },
    ]
    return [
      { label:'Buena asistencia (≥80%)', value:valores.filter(v=>v>=80).length, color:'#16a34a' },
      { label:'En riesgo (<80%)',         value:valores.filter(v=>v<80).length,  color:'#dc2626' },
    ]
  })()

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Seguimiento Académico" />

      <div className="px-4 pb-4 pt-3 flex flex-col"
        style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem' }}>

        {/* ── VISTA: Semestres activos ── */}
        {vista==='semestres' && (
          <>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <p className="text-sm" style={{ color:'#64748b' }}>Semestres activos — Ciclo Ago–Dic 2025</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
                  3 semestres en curso
                </span>
              </div>
              <HistorialBtn onClick={() => setVista('historial')} />
            </div>

            {/* Cards semestres — altura reducida a la mitad */}
            <div className="grid grid-cols-3 gap-5">
              {semestresActivos.map(s => (
                <button key={s.numero} onClick={()=>seleccionarSemestre(s.numero)}
                  className="relative overflow-hidden rounded-2xl text-left flex flex-col"
                  style={{ background:'white', border:'1px solid #e2e8f0', transition:'all 0.2s ease', minHeight: '0' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,0.15)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                  <div style={{ position:'absolute', right:'-24px', bottom:'-24px', width:'160px', height:'160px', opacity:0.12, pointerEvents:'none' }}>
                    <Image src={s.imagen} alt="" fill style={{ objectFit:'contain' }}/>
                  </div>
                  <div style={{ position:'absolute', top:'1rem', right:'1rem', zIndex:2 }}>
                    <ArrowButton/>
                  </div>
                  <div className="relative flex flex-col p-5" style={{ minHeight: '200px' }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
                        style={{ background:'#eff6ff', color:'#2563eb', fontFamily:'Outfit, sans-serif' }}>
                        {s.numero}
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color:'#1e3a5f', fontFamily:'Outfit, sans-serif', margin:0 }}>
                          {s.numero}° Semestre
                        </h3>
                        <p className="text-xs" style={{ color:'#94a3b8', margin:'0.125rem 0 0' }}>{s.ciclo}</p>
                      </div>
                    </div>
                    <div className="flex gap-5 pt-4" style={{ borderTop:'1px solid #f1f5f9' }}>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color:'#94a3b8' }}>Grupos</p>
                        <p className="text-base font-bold" style={{ color:'#1e3a5f' }}>{s.grupos.length}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color:'#94a3b8' }}>Alumnos</p>
                        <p className="text-base font-bold" style={{ color:'#1e3a5f' }}>{s.alumnos}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color:'#94a3b8' }}>Estado</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>Activo</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA: Historial de semestres ── */}
        {vista==='historial' && (
          <>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={volver}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  style={{ background:'#f1f5f9', color:'#475569' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')}
                  onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>
                  ← Volver
                </button>
                <p className="text-sm font-semibold" style={{ color:'#1e3a5f' }}>Historial de semestres anteriores</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }}>
                {semestresHistorial.length} períodos registrados
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {semestresHistorial.map(s => (
                <div key={`${s.numero}-${s.ciclo}`}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                  style={{ border:'1px solid #e2e8f0' }}>
                  {/* Header card historial */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                        style={{ background:'#f1f5f9', color:'#475569', fontFamily:'Outfit, sans-serif' }}>
                        {s.numero}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color:'#1e3a5f', margin:0 }}>{s.numero}° Semestre</p>
                        <p className="text-xs" style={{ color:'#94a3b8', margin:'0.125rem 0 0' }}>{s.ciclo}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background:'#f1f5f9', color:'#94a3b8', border:'1px solid #e2e8f0' }}>
                      Concluido
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div style={{ background:'#f8fafc', borderRadius:'0.625rem', padding:'0.5rem', textAlign:'center' }}>
                      <p style={{ fontSize:'1.1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{s.alumnos}</p>
                      <p style={{ fontSize:'0.6rem', color:'#94a3b8', margin:0, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>Alumnos</p>
                    </div>
                    <div style={{ background:'#f0fdf4', borderRadius:'0.625rem', padding:'0.5rem', textAlign:'center' }}>
                      <p style={{ fontSize:'1.1rem', fontWeight:700, color:'#16a34a', margin:0, fontFamily:'Outfit, sans-serif' }}>{s.promedio}</p>
                      <p style={{ fontSize:'0.6rem', color:'#94a3b8', margin:0, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>Promedio</p>
                    </div>
                    <div style={{ background: s.asistencia >= 80 ? '#f0fdf4' : '#fef2f2', borderRadius:'0.625rem', padding:'0.5rem', textAlign:'center' }}>
                      <p style={{ fontSize:'1.1rem', fontWeight:700, color: s.asistencia >= 80 ? '#16a34a' : '#dc2626', margin:0, fontFamily:'Outfit, sans-serif' }}>{s.asistencia}%</p>
                      <p style={{ fontSize:'0.6rem', color:'#94a3b8', margin:0, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>Asistencia</p>
                    </div>
                  </div>

                  {/* Grupos */}
                  <div style={{ paddingTop:'0.75rem', borderTop:'1px solid #f1f5f9' }}>
                    <p style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', margin:'0 0 0.375rem' }}>Grupos</p>
                    <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                      {s.grupos.map(g => (
                        <span key={g} style={{ fontSize:'0.7rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:'0.375rem', background:'#f1f5f9', color:'#475569', fontFamily:'Outfit, sans-serif' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA: Grupos ── */}
        {vista==='grupos' && semestre && (
          <>
            <div className="flex items-center justify-between shrink-0">
              <p className="text-sm" style={{ color:'#64748b' }}>
                Grupos activos del {semestre.numero}° semestre — {semestre.ciclo}
              </p>
              <button onClick={volver}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ background:'#f1f5f9', color:'#475569' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')}
                onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>
                ← Volver
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {semestre.grupos.map(grupo => (
                <button key={grupo} onClick={()=>seleccionarGrupo(grupo)}
                  className="bg-white rounded-xl p-4 shadow-sm text-left transition-all"
                  style={{ border:'1px solid #e2e8f0' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(59,130,246,0.12)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background:'#1e3a5f', fontFamily:'Outfit, sans-serif' }}>
                      {grupo}
                    </div>
                    <svg width="14" height="14" fill="none" stroke="#3b82f6" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold mb-0.5" style={{ color:'#1e3a5f' }}>Grupo {grupo}</p>
                  <p className="text-xs" style={{ color:'#94a3b8' }}>{alumnosMock.length} alumnos</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA: Alumnos ── */}
        {vista==='alumnos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={volver}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  style={{ background:'#f1f5f9', color:'#475569' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')}
                  onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>
                  ← Volver
                </button>
                <p className="text-sm font-semibold" style={{ color:'#1e3a5f' }}>
                  Grupo {grupoActivo} — {semestreActivo}° Semestre
                </p>
              </div>
              {/* Filtro período — Apple slide con más espacio */}
              <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px', minWidth:'280px' }}>
                {(() => {
                  const opts = [{key:'semana',label:'Semana'},{key:'bimestre',label:'Parcial'},{key:'semestre',label:'Semestre'}]
                  const idx  = opts.findIndex(o => o.key === filtroPeriodo)
                  const total = opts.length
                  return (
                    <>
                      <div style={{ position:'absolute', top:'4px', bottom:'4px', width:`calc(${100/total}% - 2px)`, left:`calc(${idx*(100/total)}% + 4px)`, background:'white', borderRadius:'0.75rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                      {opts.map(({key,label}) => (
                        <button key={key} onClick={() => cambiarFiltro(key as FiltroPeriodo)}
                          style={{ position:'relative', zIndex:1, flex:1, padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight: filtroPeriodo===key ? 600 : 500, color: filtroPeriodo===key ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.75rem', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                          {label}
                        </button>
                      ))}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Sub-filtro Parcial */}
            {filtroPeriodo==='bimestre' && (
              <div className="flex items-center gap-3 shrink-0">
                <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8', whiteSpace:'nowrap' }}>Parcial</span>
                <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'0.875rem', padding:'3px', minWidth:'180px' }}>
                  {(() => {
                    const opts = [1,2]
                    const idx  = opts.indexOf(bimestreSelec)
                    return (
                      <>
                        <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 2px)`, left:`calc(${idx*50}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(b => (
                          <button key={b} onClick={() => setBimestreSelec(b as 1|2|3)}
                            style={{ position:'relative', zIndex:1, flex:1, padding:'0.375rem 0.875rem', fontSize:'0.775rem', fontWeight: bimestreSelec===b ? 600 : 500, color: bimestreSelec===b ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.625rem', transition:'color 0.2s', textAlign:'center', whiteSpace:'nowrap' }}>
                            Parcial {b}
                          </button>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Sub-filtro Semana — grid de píldoras */}
            {filtroPeriodo==='semana' && (
              <div className="flex items-center gap-3 shrink-0">
                <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8', whiteSpace:'nowrap' }}>Semana</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                  {Array.from({length:16},(_,i)=>i+1).map(s => (
                    <button key={s} onClick={()=>setSemanaSelec(s)}
                      style={{
                        width:'34px', height:'34px', borderRadius:'0.625rem', fontSize:'0.75rem',
                        fontWeight: semanaSelec===s ? 700 : 500,
                        background: semanaSelec===s ? '#1e3a5f' : 'white',
                        color:      semanaSelec===s ? 'white'   : '#64748b',
                        border:     semanaSelec===s ? '1.5px solid #1e3a5f' : '1px solid #e2e8f0',
                        cursor:'pointer',
                        transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: semanaSelec===s ? '0 2px 8px rgba(30,58,95,0.25)' : 'none',
                        transform: semanaSelec===s ? 'translateY(-1px)' : 'none',
                      }}
                      onMouseEnter={e => { if(semanaSelec!==s){ e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.color='#1e3a5f' }}}
                      onMouseLeave={e => { if(semanaSelec!==s){ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b' }}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro materias — estilo Apple creativo */}
            <div className="shrink-0">
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.625rem' }}>
                <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Asignatura</span>
                {materiaSelec && (
                  <>
                    <span style={{ fontSize:'0.7rem', color:'#cbd5e1' }}>·</span>
                    <button onClick={()=>setMateriaSelec(null)}
                      style={{ fontSize:'0.7rem', fontWeight:600, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      Todas
                    </button>
                  </>
                )}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {MATERIAS.map(m => {
                  const activa = materiaSelec === m
                  return (
                    <button key={m} onClick={() => toggleMateria(m)}
                      style={{
                        display:'flex', alignItems:'center', gap:'0.375rem',
                        padding:'0.375rem 0.875rem',
                        borderRadius:'9999px',
                        fontSize:'0.75rem', fontWeight: activa ? 600 : 400,
                        background: activa ? '#1e3a5f' : 'white',
                        color:      activa ? 'white'   : '#475569',
                        border:     activa ? '1.5px solid #1e3a5f' : '1px solid #e2e8f0',
                        cursor:'pointer',
                        opacity: materiaSelec && !activa ? 0.4 : 1,
                        transform: activa ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: activa ? '0 3px 10px rgba(30,58,95,0.22)' : '0 1px 2px rgba(0,0,0,0.04)',
                        transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      }}
                      onMouseEnter={e => { if(!activa){ e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.color='#1e3a5f'; e.currentTarget.style.transform='scale(1.03)' }}}
                      onMouseLeave={e => { if(!activa){ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569'; e.currentTarget.style.transform='scale(1)' }}}>
                      {activa && (
                        <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 shrink-0" style={{ border:'1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color:'#1e3a5f' }}>
                  Distribución del grupo
                  {filtroPeriodo==='bimestre'&&` — Bimestre ${bimestreSelec}`}
                  {filtroPeriodo==='semana'&&` — Semana ${semanaSelec}`}
                  {filtroPeriodo==='semestre'&&' — Semestre completo'}
                  {materiaSelec&&` · ${materiaSelec}`}
                </p>
                {/* Toggle Calificaciones/Asistencia — Apple slide */}
                <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px' }}>
                  {(() => {
                    const opts = [{key:'calificaciones',label:'Calificaciones'},{key:'asistencia',label:'Asistencia'}]
                    const idx  = opts.findIndex(o => o.key === graficaTipo)
                    return (
                      <>
                        <div style={{ position:'absolute', top:'4px', bottom:'4px', width:'50%', left:`calc(${idx*50}% + 4px)`, background:'white', borderRadius:'0.75rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(({key,label}) => (
                          <button key={key} onClick={()=>setGraficaTipo(key as GraficaTipo)}
                            style={{ position:'relative', zIndex:1, flex:1, padding:'0.5rem 1rem', fontSize:'0.75rem', fontWeight: graficaTipo===key ? 600 : 500, color: graficaTipo===key ? '#1e3a5f' : '#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.75rem', transition:'color 0.2s', whiteSpace:'nowrap' }}>
                            {label}
                          </button>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <DonutChart slices={slicesGrafica}/>
                <div className="space-y-2">
                  {slicesGrafica.map(s=>{
                    const total=slicesGrafica.reduce((a,b)=>a+b.value,0)
                    const pct=total>0?Math.round((s.value/total)*100):0
                    return (
                      <div key={s.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background:s.color }}/>
                        <span className="text-xs" style={{ color:'#475569' }}>{s.label}</span>
                        <span className="text-xs font-bold ml-1" style={{ color:s.color }}>{s.value} ({pct}%)</span>
                      </div>
                    )
                  })}
                  <p className="text-xs mt-2 pt-2" style={{ color:'#94a3b8', borderTop:'1px solid #f1f5f9' }}>
                    Total: {alumnosFiltrados.length} alumnos
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-3 shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input type="text" placeholder="Buscar alumno..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}/>
              </div>
            </div>

            {filtroPeriodo!=='semestre' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden shrink-0">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
                      {['#','Alumno','Promedio Cal.','Asistencia','Faltas','Acciones'].map(col=>{
                        if (col==='Promedio Cal.'&&filtroPeriodo==='semana') return null
                        return <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:'#94a3b8' }}>{col}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filasActuales.map((fila,i)=>(
                      <tr key={fila.alumno.id} style={{ borderBottom:'1px solid #f8fafc' }} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 text-xs" style={{ color:'#94a3b8' }}>{i+1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background:'#1e3a5f' }}>{fila.alumno.nombre.charAt(0)}</div>
                            <span className="text-sm font-medium" style={{ color:'#1e3a5f' }}>{fila.alumno.nombre}</span>
                          </div>
                        </td>
                        {filtroPeriodo==='bimestre' && <td className="px-5 py-3.5"><span className="text-sm font-bold" style={{ color:promedioColor(fila.promedio) }}>{fila.promedio}</span></td>}
                        <td className="px-5 py-3.5"><span className="text-sm font-bold" style={{ color:asistenciaColor(fila.asistencia) }}>{fila.asistencia}%</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm font-semibold" style={{ color:fila.faltas>=5?'#dc2626':'#475569' }}>{fila.faltas}</span></td>
                        <td className="px-5 py-3.5">
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition" style={{ background:'#eff6ff', color:'#2563eb' }}
                            onMouseEnter={e=>(e.currentTarget.style.background='#dbeafe')}
                            onMouseLeave={e=>(e.currentTarget.style.background='#eff6ff')}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t" style={{ borderColor:'#f1f5f9', background:'#fafafa' }}>
                  <p className="text-xs" style={{ color:'#94a3b8' }}>
                    {alumnosFiltrados.length} alumnos — {filtroPeriodo==='bimestre'?`Bimestre ${bimestreSelec}`:`Semana ${semanaSelec}`}
                    {materiaSelec&&` — ${materiaSelec}`}
                  </p>
                </div>
              </div>
            )}

            {filtroPeriodo==='semestre' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto shrink-0">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0 bg-white" style={{ color:'#94a3b8' }}>#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-8 bg-white" style={{ color:'#94a3b8', minWidth:180 }}>Alumno</th>
                      {[1,2,3].map(b=><th key={`cal-${b}`} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:'#1e293b', minWidth:80 }}>B{b} Cal.</th>)}
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:'#1e293b', minWidth:90 }}>Prom. Cal.</th>
                      {[1,2,3].map(b=><th key={`asis-${b}`} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:'#1e293b', minWidth:80 }}>B{b} Asis.</th>)}
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:'#1e293b', minWidth:100 }}>Prom. Asis.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map((alumno,i)=>{
                      const promCal=avg(alumno.bimestres.map(b=>b.promedio))
                      const promAsis=avg(alumno.bimestres.map(b=>b.asistencia))
                      return (
                        <tr key={alumno.id} style={{ borderBottom:'1px solid #f8fafc' }} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs sticky left-0 bg-white" style={{ color:'#94a3b8' }}>{i+1}</td>
                          <td className="px-4 py-3 sticky left-8 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background:'#1e3a5f' }}>{alumno.nombre.charAt(0)}</div>
                              <span className="text-sm font-medium" style={{ color:'#1e3a5f' }}>{alumno.nombre}</span>
                            </div>
                          </td>
                          {alumno.bimestres.map(b=><td key={`cal-${b.numero}`} className="px-4 py-3"><span className="text-sm font-bold" style={{ color:promedioColor(b.promedio) }}>{b.promedio}</span></td>)}
                          <td className="px-4 py-3"><span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background:promCal>=70?'#f0fdf4':'#fef2f2', color:promedioColor(promCal) }}>{promCal}</span></td>
                          {alumno.bimestres.map(b=><td key={`asis-${b.numero}`} className="px-4 py-3"><span className="text-sm font-bold" style={{ color:asistenciaColor(b.asistencia) }}>{b.asistencia}%</span></td>)}
                          <td className="px-4 py-3"><span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background:promAsis>=80?'#f0fdf4':'#fef2f2', color:asistenciaColor(promAsis) }}>{promAsis}%</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:'2px solid #e2e8f0', background:'#f8fafc' }}>
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold" style={{ color:'#1e3a5f' }}>Promedio del grupo</td>
                      {[1,2,3].map(b=>{ const vals=alumnosFiltrados.map(a=>a.bimestres.find(x=>x.numero===b)!.promedio); return <td key={`foot-cal-${b}`} className="px-4 py-3"><span className="text-xs font-bold" style={{ color:'#1e293b' }}>{avg(vals)}</span></td> })}
                      <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color:'#1e293b' }}>{avg(alumnosFiltrados.map(a=>avg(a.bimestres.map(b=>b.promedio))))}</span></td>
                      {[1,2,3].map(b=>{ const vals=alumnosFiltrados.map(a=>a.bimestres.find(x=>x.numero===b)!.asistencia); return <td key={`foot-asis-${b}`} className="px-4 py-3"><span className="text-xs font-bold" style={{ color:'#1e293b' }}>{avg(vals)}%</span></td> })}
                      <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color:'#1e293b' }}>{avg(alumnosFiltrados.map(a=>avg(a.bimestres.map(b=>b.asistencia))))}%</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}