'use client'
import { useState, useRef,} from 'react'
import Header from '@/components/Header'

type Vista         = 'semestres' | 'grupos' | 'alumnos' | 'historial'
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

// ─── Hook de transición de vista ─────────────────────────────────────────────
function useViewTransition() {
  const [visible, setVisible]     = useState(true)
  const [animating, setAnimating] = useState(false)

  function transicionar(fn: () => void, dir: Direccion = 'adelante') {
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      fn()
      setVisible(true)
      setAnimating(false)
    }, 260)
    return dir
  }

  return { visible, animating, transicionar }
}

// ─── Botón periodos concluidos ────────────────────────────────────────────────
function HistorialBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    enterTimer.current = setTimeout(() => setHov(true), 150)
  }
  function handleLeave() {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setHov(false), 220)
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
        minWidth: hov ? '200px' : '36px',
        padding: hov ? '0 1rem 0 0.875rem' : '0',
        borderRadius: hov ? '0.75rem' : '50%',
        background: 'transparent',
        border: '1.5px solid #2563eb',
        cursor: 'pointer',
        transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
      {/* Icono almanaque */}
      <svg width="15" height="15" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink:0, marginLeft: hov ? '0' : '0' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {hov && (
        <>
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#2563eb' }}>
            Periodos concluidos
          </span>
          <svg width="13" height="13" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </>
      )}
    </button>
  )
}

// ─── Botón volver minimalista ─────────────────────────────────────────────────
function VolverBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0', color:'#94a3b8', fontSize:'0.8rem', fontWeight:500, transition:'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#1e3a5f')}
      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Volver
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
  const [dir,setDir]                       = useState<Direccion>('adelante')
  const { visible, transicionar }          = useViewTransition()

  const semestre = semestresData.find(s=>s.numero===semestreActivo)

  function navegarA(nuevaVista: Vista, d: Direccion, fn?: () => void) {
    setDir(d)
    transicionar(() => { fn?.(); setVista(nuevaVista) }, d)
  }

  function seleccionarSemestre(num:number) { navegarA('grupos','adelante',()=>setSemestreActivo(num)) }
  function seleccionarGrupo(g:string)      { navegarA('alumnos','adelante',()=>setGrupoActivo(g)) }
  function volver() {
    if (vista==='alumnos')   navegarA('grupos','atras',()=>setGrupoActivo(null))
    if (vista==='grupos')    navegarA('semestres','atras',()=>setSemestreActivo(null))
    if (vista==='historial') navegarA('semestres','atras')
  }
  function irHistorial()   { navegarA('historial','adelante') }
  function cambiarFiltro(f:FiltroPeriodo) {
    setFiltroPeriodo(f)
    setBimestreSelec(1)
    setSemanaSelec(1)
    // Semana solo permite asistencia
    if (f === 'semana') setGraficaTipo('asistencia')
  }
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

  // Animación de entrada/salida por dirección
  const slideIn  = dir === 'adelante'
    ? 'translateX(18px)'
    : 'translateX(-18px)'

  const containerStyle: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateX(0) scale(1)' : `${slideIn} scale(0.985)`,
    transition: visible
      ? 'opacity 0.38s cubic-bezier(0.34,1.56,0.64,1), transform 0.38s cubic-bezier(0.34,1.56,0.64,1)'
      : 'opacity 0.22s ease, transform 0.22s ease',
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(10px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
      `}</style>
      <Header titulo="Seguimiento Académico" />

      <div className="px-4 pb-4 pt-3 flex flex-col"
        style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1rem' }}>

        <div style={containerStyle}>

        {/* ── VISTA: Semestres activos ── */}
        {vista==='semestres' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <p style={{ fontSize:'0.875rem', color:'#64748b', margin:0 }}>Ciclo Ago–Dic 2025</p>
                <span style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
                  3 en curso
                </span>
              </div>
              <HistorialBtn onClick={irHistorial} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }}>
              {semestresActivos.map((s, i) => (
                <button key={s.numero} onClick={() => seleccionarSemestre(s.numero)}
                  style={{
                    background:'white', border:'1px solid #e2e8f0', borderRadius:'1.25rem',
                    textAlign:'left', cursor:'pointer', padding:0, overflow:'hidden',
                    transition:'all 0.22s ease',
                    animation: `cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ${i*0.07}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(59,130,246,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>

                  {/* Top strip */}
                  <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'0.75rem', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.125rem', fontWeight:800, color:'white', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
                        {s.numero}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'white', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.numero}° Semestre</p>
                        <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', margin:'0.125rem 0 0' }}>{s.ciclo}</p>
                      </div>
                    </div>
                    <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Stats */}
                  <div style={{ padding:'1rem 1.5rem', display:'flex', gap:'1.5rem' }}>
                    <div>
                      <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Grupos</p>
                      <p style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.grupos.length}</p>
                    </div>
                    <div style={{ width:'1px', background:'#f1f5f9' }}/>
                    <div>
                      <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Alumnos</p>
                      <p style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{s.alumnos}</p>
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', alignItems:'center' }}>
                      <span style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.2rem 0.625rem', borderRadius:'9999px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>Activo</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── VISTA: Historial ── */}
        {vista==='historial' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <VolverBtn onClick={volver}/>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>Historial de semestres</p>
              </div>
              <span style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }}>
                {semestresHistorial.length} períodos
              </span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
              {semestresHistorial.map((s, i) => (
                <div key={`${s.numero}-${s.ciclo}`}
                  style={{
                    background:'white', borderRadius:'1rem', padding:'1.25rem',
                    border:'1px solid #e2e8f0',
                    animation:`cardIn 0.38s cubic-bezier(0.34,1.56,0.64,1) ${i*0.05}s both`,
                  }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'0.625rem', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:700, color:'#475569', fontFamily:'Outfit,sans-serif' }}>
                        {s.numero}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{s.numero}° Semestre</p>
                        <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.1rem 0 0' }}>{s.ciclo}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:'0.65rem', fontWeight:600, padding:'0.15rem 0.5rem', borderRadius:'9999px', background:'#f1f5f9', color:'#94a3b8' }}>Concluido</span>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem', marginBottom:'0.875rem' }}>
                    {[
                      { label:'Alumnos', value: String(s.alumnos), color:'#1e3a5f', bg:'#f8fafc' },
                      { label:'Promedio', value: String(s.promedio), color:'#16a34a', bg:'#f0fdf4' },
                      { label:'Asistencia', value: `${s.asistencia}%`, color: s.asistencia>=80?'#16a34a':'#dc2626', bg: s.asistencia>=80?'#f0fdf4':'#fef2f2' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background:stat.bg, borderRadius:'0.5rem', padding:'0.5rem', textAlign:'center' }}>
                        <p style={{ fontSize:'1rem', fontWeight:700, color:stat.color, margin:0, fontFamily:'Outfit,sans-serif' }}>{stat.value}</p>
                        <p style={{ fontSize:'0.6rem', color:'#94a3b8', margin:0, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ paddingTop:'0.75rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                    {s.grupos.map(g => (
                      <span key={g} style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.15rem 0.5rem', borderRadius:'0.375rem', background:'#f1f5f9', color:'#475569' }}>{g}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VISTA: Grupos ── */}
        {vista==='grupos' && semestre && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <VolverBtn onClick={volver}/>
              <div style={{ width:'1px', height:'14px', background:'#e2e8f0' }}/>
              <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                {semestre.numero}° Semestre
              </p>
              <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{semestre.ciclo}</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
              {semestre.grupos.map((grupo, i) => (
                <button key={grupo} onClick={() => seleccionarGrupo(grupo)}
                  style={{
                    background:'white', border:'1px solid #e2e8f0', borderRadius:'1rem',
                    padding:'1.5rem', textAlign:'left', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    transition:'all 0.22s ease',
                    animation:`cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ${i*0.06}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'0.875rem', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'white', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
                      {grupo}
                    </div>
                    <div>
                      <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Grupo {grupo}</p>
                      <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.2rem 0 0' }}>{alumnosMock.length} alumnos</p>
                    </div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="#93c5fd" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── VISTA: Alumnos ── */}
        {vista==='alumnos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <VolverBtn onClick={volver}/>
                <div style={{ width:'1px', height:'14px', background:'#e2e8f0' }}/>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                  Grupo {grupoActivo}
                </p>
                <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{semestreActivo}° Semestre</span>
              </div>

              {/* Filtro período */}
              <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'1rem', padding:'4px', minWidth:'280px' }}>
                {(() => {
                  const opts = [{key:'semana',label:'Semana'},{key:'bimestre',label:'Parcial'},{key:'semestre',label:'Semestre'}]
                  const idx  = opts.findIndex(o=>o.key===filtroPeriodo)
                  return (
                    <>
                      <div style={{ position:'absolute', top:'4px', bottom:'4px', width:`calc(${100/3}% - 2px)`, left:`calc(${idx*(100/3)}% + 4px)`, background:'white', borderRadius:'0.75rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                      {opts.map(({key,label}) => (
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

            {/* Sub-filtro Parcial — solo cuando filtroPeriodo==='bimestre' Y graficaTipo==='calificaciones' */}
            {filtroPeriodo==='bimestre' && graficaTipo==='calificaciones' && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8' }}>Parcial</span>
                <div style={{ position:'relative', display:'flex', background:'#f1f5f9', borderRadius:'0.875rem', padding:'3px', minWidth:'180px' }}>
                  {(() => {
                    const opts=[1,2]; const idx=opts.indexOf(bimestreSelec)
                    return (
                      <>
                        <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 2px)`, left:`calc(${idx*50}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 6px rgba(0,0,0,0.13)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(b=>(
                          <button key={b} onClick={()=>setBimestreSelec(b as 1|2|3)}
                            style={{ position:'relative', zIndex:1, flex:1, padding:'0.375rem 0.875rem', fontSize:'0.775rem', fontWeight:bimestreSelec===b?600:500, color:bimestreSelec===b?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor:'pointer', borderRadius:'0.625rem', transition:'color 0.2s', textAlign:'center' }}>
                            Parcial {b}
                          </button>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Selector semanas — visible en: Semana / Parcial+Asistencia */}
            {(filtroPeriodo==='semana' || (filtroPeriodo==='bimestre' && graficaTipo==='asistencia')) && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8' }}>Semana</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                  {Array.from({length:16},(_,i)=>i+1).map(s=>(
                    <button key={s} onClick={()=>setSemanaSelec(s)}
                      style={{ width:'34px', height:'34px', borderRadius:'0.625rem', fontSize:'0.75rem', fontWeight:semanaSelec===s?700:500, background:semanaSelec===s?'#1e3a5f':'white', color:semanaSelec===s?'white':'#64748b', border:semanaSelec===s?'1.5px solid #1e3a5f':'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)', boxShadow:semanaSelec===s?'0 2px 8px rgba(30,58,95,0.25)':'none', transform:semanaSelec===s?'translateY(-1px)':'none' }}
                      onMouseEnter={e=>{if(semanaSelec!==s){e.currentTarget.style.borderColor='#1e3a5f';e.currentTarget.style.color='#1e3a5f'}}}
                      onMouseLeave={e=>{if(semanaSelec!==s){e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b'}}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro asignatura */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Asignatura</span>
                {materiaSelec && (
                  <button onClick={()=>setMateriaSelec(null)} style={{ fontSize:'0.65rem', fontWeight:600, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0 }}>· Todas</button>
                )}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                {MATERIAS.map(m=>{
                  const activa=materiaSelec===m
                  return (
                    <button key={m} onClick={()=>toggleMateria(m)}
                      style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.3rem 0.75rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:activa?600:400, background:activa?'#1e3a5f':'white', color:activa?'white':'#475569', border:activa?'1.5px solid #1e3a5f':'1px solid #e2e8f0', cursor:'pointer', opacity:materiaSelec&&!activa?0.4:1, transform:activa?'scale(1.04)':'scale(1)', boxShadow:activa?'0 3px 10px rgba(30,58,95,0.2)':'none', transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)' }}
                      onMouseEnter={e=>{if(!activa){e.currentTarget.style.borderColor='#1e3a5f';e.currentTarget.style.color='#1e3a5f'}}}
                      onMouseLeave={e=>{if(!activa){e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#475569'}}}>
                      {activa && <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gráfica */}
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

                {/* Toggle Calificaciones/Asistencia — calificaciones deshabilitado en modo Semana */}
                <div style={{ position:'relative', display:'flex', background: filtroPeriodo==='semana' ? '#f8fafc' : '#f1f5f9', borderRadius:'1rem', padding:'3px' }}>
                  {(() => {
                    const opts=[{key:'calificaciones',label:'Calificaciones'},{key:'asistencia',label:'Asistencia'}]
                    const idx=opts.findIndex(o=>o.key===graficaTipo)
                    return (
                      <>
                        <div style={{ position:'absolute', top:'3px', bottom:'3px', width:`calc(50% - 2px)`, left:`calc(${idx*50}% + 3px)`, background:'white', borderRadius:'0.625rem', boxShadow:'0 1px 6px rgba(0,0,0,0.1)', transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)', pointerEvents:'none' }}/>
                        {opts.map(({key,label})=>{
                          const disabled = filtroPeriodo==='semana' && key==='calificaciones'
                          return (
                            <button key={key}
                              onClick={()=>{ if(!disabled) setGraficaTipo(key as GraficaTipo) }}
                              title={disabled ? 'No disponible al filtrar por semana' : undefined}
                              style={{ position:'relative', zIndex:1, flex:1, padding:'0.4rem 0.875rem', fontSize:'0.75rem', fontWeight:graficaTipo===key?600:500, color: disabled ? '#d1d5db' : graficaTipo===key?'#1e3a5f':'#64748b', background:'transparent', border:'none', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius:'0.625rem', transition:'color 0.2s', whiteSpace:'nowrap', opacity: disabled ? 0.5 : 1 }}>
                              {label}
                            </button>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
                <DonutChart slices={slicesGrafica}/>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {slicesGrafica.map(s=>{
                    const total=slicesGrafica.reduce((a,b)=>a+b.value,0)
                    const pct=total>0?Math.round((s.value/total)*100):0
                    return (
                      <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.75rem', color:'#475569' }}>{s.label}</span>
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:s.color, marginLeft:'0.25rem' }}>{s.value} ({pct}%)</span>
                      </div>
                    )
                  })}
                  <p style={{ fontSize:'0.7rem', color:'#cbd5e1', margin:'0.25rem 0 0', paddingTop:'0.5rem', borderTop:'1px solid #f1f5f9' }}>
                    {alumnosFiltrados.length} alumnos en total
                  </p>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)' }}>
                <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input type="text" placeholder="Buscar alumno..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                style={{ paddingLeft:'2.25rem', paddingRight:'1rem', paddingTop:'0.5rem', paddingBottom:'0.5rem', fontSize:'0.8125rem', borderRadius:'0.875rem', width:'100%', boxSizing:'border-box', background:'white', border:'1px solid #e2e8f0', outline:'none', color:'#334155' }}
                onFocus={e=>(e.currentTarget.style.boxShadow='0 0 0 2px #bfdbfe')}
                onBlur={e=>(e.currentTarget.style.boxShadow='none')}/>
            </div>

            {/* Tabla parcial/semana */}
            {filtroPeriodo!=='semestre' && (
              <div style={{ background:'white', borderRadius:'1rem', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                <div style={{ maxHeight:'calc(6 * 56px + 44px)', overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'white', zIndex:1 }}>
                      {['#','Alumno', ...(filtroPeriodo==='bimestre'?['Promedio']:[]),'Asistencia','Faltas'].map(col=>(
                        <th key={col} style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasActuales.map((fila,i)=>(
                      <tr key={fila.alumno.id} style={{ borderBottom:'1px solid #f8fafc' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                        onMouseLeave={e=>(e.currentTarget.style.background='white')}>
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
                  <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:0 }}>
                    {alumnosFiltrados.length} alumnos{materiaSelec?` · ${materiaSelec}`:''}
                  </p>
                </div>
              </div>
            )}

            {/* Tabla semestre completo */}
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
                    {alumnosFiltrados.map((alumno,i)=>{
                      const promCal=avg(alumno.bimestres.map(b=>b.promedio))
                      const promAsis=avg(alumno.bimestres.map(b=>b.asistencia))
                      return (
                        <tr key={alumno.id} style={{ borderBottom:'1px solid #f8fafc' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                          onMouseLeave={e=>(e.currentTarget.style.background='white')}>
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        </div>
      </div>
    </div>
  )
}