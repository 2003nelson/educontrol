'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS_SEMANA = ['L','M','X','J','V','S','D']

type Paso = 0 | 1 | 2 | 3 | 4 | 5  // 0=tipo periodo 1=inicio 2=vacaciones 3=cierre 4=festivos 5=resumen
type TipoPeriodo = 'bimestre' | 'semestre' | 'trimestre' | 'cuatrimestre' | 'anual' | 'otro' | null
type Vista = 'wizard' | 'activo'

function formatFecha(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES_CORTO[parseInt(m) - 1]} ${y}`
}

function diasEntre(a: string, b: string) {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1)
}

// ─── Mini calendario ──────────────────────────────────────────────────────────
function MiniCalendario({
  seleccionado,
  inicio,
  vacIni,
  vacFin,
  cierre,
  festivos,
  onChange,
  rangoInicio,
  rangoFin,
}: {
  seleccionado: string
  inicio: string
  vacIni: string
  vacFin: string
  cierre: string
  festivos: string[]
  onChange: (iso: string) => void
  rangoInicio?: string
  rangoFin?: string
}) {
  const hoy = new Date()
  const ref = seleccionado ? new Date(seleccionado + 'T12:00:00') : hoy
  const [vista, setVista] = useState({ year: ref.getFullYear(), month: ref.getMonth() })

  const primerDia = new Date(vista.year, vista.month, 1)
  const diasMes   = new Date(vista.year, vista.month + 1, 0).getDate()
  const offset    = (primerDia.getDay() + 6) % 7

  function toIso(day: number) {
    return `${vista.year}-${String(vista.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function estadoDia(iso: string) {
    if (iso === inicio) return 'inicio'
    if (iso === cierre) return 'cierre'
    if (festivos.includes(iso)) return 'festivo'
    if (vacIni && vacFin && iso >= vacIni && iso <= vacFin) return 'vacaciones'
    if (inicio && cierre && iso >= inicio && iso <= cierre) return 'activo'
    return 'normal'
  }

  const cols: Record<string, {bg:string;color:string}> = {
    inicio:     { bg: '#1e3a5f', color: 'white'   },
    cierre:     { bg: '#dc2626', color: 'white'   },
    vacaciones: { bg: '#fef9c3', color: '#854d0e' },
    festivo:    { bg: '#fee2e2', color: '#dc2626' },
    activo:     { bg: '#dbeafe', color: '#1d4ed8' },
    normal:     { bg: 'transparent', color: '#334155' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setVista(v => ({ month: v.month===0?11:v.month-1, year: v.month===0?v.year-1:v.year }))}
          style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'#f1f5f9', cursor:'pointer', color:'#475569', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', fontFamily:'Outfit, sans-serif' }}>
          {MESES[vista.month]} {vista.year}
        </p>
        <button onClick={() => setVista(v => ({ month: v.month===11?0:v.month+1, year: v.month===11?v.year+1:v.year }))}
          style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'#f1f5f9', cursor:'pointer', color:'#475569', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
        {Array.from({length:offset}).map((_,i)=><div key={`e-${i}`}/>)}
        {Array.from({length:diasMes},(_,i)=>i+1).map(day => {
          const iso    = toIso(day)
          const estado = estadoDia(iso)
          const col    = cols[estado]
          const esSel  = iso === seleccionado
          const enRango = rangoInicio && rangoFin && iso >= rangoInicio && iso <= rangoFin
          return (
            <button key={day} onClick={() => onChange(iso)}
              style={{
                width:'100%', aspectRatio:'1', borderRadius:'50%',
                border: esSel ? '2px solid #3b82f6' : enRango ? '1.5px solid #93c5fd' : 'none',
                cursor:'pointer', fontSize:'0.72rem',
                fontWeight: estado !== 'normal' ? 700 : 400,
                background: col.bg, color: col.color,
                transition:'all 0.1s',
              }}
              onMouseEnter={e => { if (estado==='normal') e.currentTarget.style.background='#f1f5f9' }}
              onMouseLeave={e => { if (estado==='normal') e.currentTarget.style.background='transparent' }}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modal confirmar activar ──────────────────────────────────────────────────
function ModalConfirmar({ onAceptar, onCancelar }: { onAceptar: () => void; onCancelar: () => void }) {
  if (typeof window === 'undefined') return null
  return createPortal(
    <div onClick={onCancelar} style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:'1rem', width:'420px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)', padding:'2rem',
        display:'flex', flexDirection:'column', alignItems:'center',
      }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
          <svg width="26" height="26" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.5rem', textAlign:'center' }}>
          ¿Habilitar este período?
        </h3>
        <p style={{ fontSize:'0.875rem', color:'#475569', margin:'0 0 1.5rem', textAlign:'center', lineHeight:'1.5' }}>
          Al habilitar, los docentes y alumnos tendrán acceso al sistema con estas fechas. ¿Deseas continuar?
        </p>
        <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
          <button onClick={onCancelar}
            style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={onAceptar}
            style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
            Sí, habilitar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Modal confirmar eliminar ─────────────────────────────────────────────────
function ModalEliminar({ onAceptar, onCancelar }: { onAceptar: () => void; onCancelar: () => void }) {
  if (typeof window === 'undefined') return null
  return createPortal(
    <div onClick={onCancelar} style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:'1rem', width:'420px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)', padding:'2rem',
        display:'flex', flexDirection:'column', alignItems:'center',
      }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
          <svg width="26" height="26" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.5rem', textAlign:'center' }}>
          ¿Eliminar período actual?
        </h3>
        <p style={{ fontSize:'0.875rem', color:'#475569', margin:'0 0 1.5rem', textAlign:'center', lineHeight:'1.5' }}>
          Se eliminarán todas las fechas configuradas y tendrás que crear un nuevo período desde cero.
        </p>
        <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
          <button onClick={onCancelar}
            style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background='#1d4ed8')}
            onMouseLeave={e => (e.currentTarget.style.background='#2563eb')}>
            Cancelar
          </button>
          <button onClick={onAceptar}
            style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background='#b91c1c')}
            onMouseLeave={e => (e.currentTarget.style.background='#dc2626')}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CicloPage() {
  const [vista, setVista]           = useState<Vista>('wizard')
  const [paso, setPaso]             = useState<Paso>(0)
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>(null)
  const [inicio, setInicio]     = useState('')
  const [vacIni, setVacIni]     = useState('')
  const [vacFin, setVacFin]     = useState('')
  const [cierre, setCierre]     = useState('')
  const [festivos, setFestivos] = useState<string[]>([])
  const [modalHabilitar, setModalHabilitar] = useState(false)
  const [modalEliminar, setModalEliminar]   = useState(false)

  // Datos del período activo (guardados al habilitar)
  const [periodoActivo, setPeriodoActivo] = useState({
    inicio: '', vacIni: '', vacFin: '', cierre: '', festivos: [] as string[]
  })

  function toggleFestivo(iso: string) {
    setFestivos(prev => prev.includes(iso) ? prev.filter(f => f !== iso) : [...prev, iso])
  }

  function habilitar() {
    setPeriodoActivo({ inicio, vacIni, vacFin, cierre, festivos })
    setVista('activo')
    setModalHabilitar(false)
  }

  function eliminarPeriodo() {
    setInicio(''); setVacIni(''); setVacFin(''); setCierre(''); setFestivos([])
    setTipoPeriodo(null)
    setPaso(0)
    setVista('wizard')
    setModalEliminar(false)
  }

  const diasTotales = diasEntre(inicio, cierre)
  const diasVac     = vacIni && vacFin ? diasEntre(vacIni, vacFin) : 0
  const diasFest    = festivos.filter(f => f >= inicio && f <= cierre).length
  const diasClase   = Math.max(0, diasTotales - diasVac - diasFest)

  const pasosConfig = [
    { num: 0, label: 'Tipo de período',       valor: tipoPeriodo ? (tipoPeriodo === 'bimestre' ? 'Bimestre' : tipoPeriodo === 'trimestre' ? 'Trimestre' : tipoPeriodo === 'cuatrimestre' ? 'Cuatrimestre' : tipoPeriodo === 'semestre' ? 'Semestre' : tipoPeriodo === 'anual' ? 'Anual' : 'Personalizado') : '', icono: '✦' },
    { num: 1, label: 'Fecha de inicio',        valor: inicio,                                                                                                  icono: '📅' },
    { num: 2, label: 'Período de vacaciones',  valor: vacIni && vacFin ? `${formatFecha(vacIni)} → ${formatFecha(vacFin)}` : '',                               icono: '🏖' },
    { num: 3, label: 'Fecha de cierre',        valor: cierre,                                                                                                  icono: '🔒' },
    { num: 4, label: 'Días festivos',          valor: festivos.length > 0 ? `${festivos.length} día(s)` : '',                                                  icono: '🎉' },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Ciclo Escolar" />

      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1.25rem' }}>

        {/* ── VISTA WIZARD ── */}
        {vista === 'wizard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold" style={{ color:'#1e3a5f' }}>Configurar nuevo período escolar</p>
                <p className="text-xs mt-0.5" style={{ color:'#94a3b8' }}>Sigue los pasos para definir las fechas del semestre</p>
              </div>
              {/* Progreso */}
              <div className="flex items-center gap-1.5">
                {[0,1,2,3,4,5].map(n => (
                  <div key={n} style={{
                    width: paso >= n ? '28px' : '8px',
                    height: '8px', borderRadius:'9999px',
                    background: paso > n ? '#16a34a' : paso === n ? '#2563eb' : '#e2e8f0',
                    transition: 'all 0.3s',
                  }}/>
                ))}
              </div>
            </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'1.25rem', flex:'1 1 0', minHeight:0 }}>

              {/* Columna izquierda — pasos */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem', overflowY:'auto', minHeight:0 }}>

                {/* Paso 0 — Tipo de período */}
                {paso === 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#2563eb', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>✦</div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>¿Qué tipo de períodos usa tu institución?</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>Determina cómo se organizan calificaciones y asistencias</p>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', marginBottom:'1rem' }}>
                      {([
                        { key:'bimestre', label:'Bimestre', desc:'Períodos de ~2 meses', niveles:'Primaria · Secundaria',     color:'#3b82f6' },
                        { key:'semestre', label:'Semestre', desc:'Períodos de ~6 meses', niveles:'Bachillerato · Universidad', color:'#1e3a5f' },
                      ] as { key: TipoPeriodo; label: string; desc: string; niveles: string; color: string }[]).map(op => {
                        const selec = tipoPeriodo === op.key
                        return (
                          <button key={op.key as string}
                            onClick={() => setTipoPeriodo(op.key)}
                            style={{
                              padding:'1rem', borderRadius:'0.875rem', textAlign:'left', cursor:'pointer',
                              border:     selec ? `2px solid ${op.color}` : '1px solid #e2e8f0',
                              background: selec ? `${op.color}12` : 'white',
                              transition:'all 0.18s', outline:'none',
                            }}
                            onMouseEnter={e => { if (!selec) { e.currentTarget.style.borderColor=op.color; e.currentTarget.style.background=`${op.color}08`; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 4px 14px ${op.color}22` } }}
                            onMouseLeave={e => { if (!selec) { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' } }}>
                            <p style={{ fontSize:'1rem', fontWeight:700, color:selec?op.color:'#1e3a5f', margin:'0 0 0.25rem', fontFamily:'Outfit, sans-serif' }}>{op.label}</p>
                            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0 0 0.5rem' }}>{op.desc}</p>
                            <span style={{ fontSize:'0.6rem', fontWeight:600, padding:'0.15rem 0.5rem', borderRadius:'9999px', background:selec?`${op.color}18`:'#f1f5f9', color:selec?op.color:'#94a3b8' }}>
                              {op.niveles}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {tipoPeriodo && (
                      <button onClick={() => setPaso(1)}
                        style={{ width:'100%', padding:'0.75rem', background:'#1e3a5f', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                        onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
                        onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
                        Continuar con {tipoPeriodo === 'bimestre' ? 'Bimestres' : tipoPeriodo === 'trimestre' ? 'Trimestres' : tipoPeriodo === 'cuatrimestre' ? 'Cuatrimestres' : tipoPeriodo === 'semestre' ? 'Semestres' : tipoPeriodo === 'anual' ? 'Período Anual' : 'Configuración Personalizada'} →
                      </button>
                    )}
                  </div>
                )}

                {/* Paso 1 — Fecha de inicio */}
                {paso === 1 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1e3a5f', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, fontFamily:'Outfit, sans-serif', flexShrink:0 }}>1</div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>¿Cuándo inicia el semestre?</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>Selecciona la fecha de inicio en el almanaque</p>
                      </div>
                      <button onClick={() => setPaso(0)}
                        style={{ fontSize:'0.75rem', fontWeight:600, padding:'0.375rem 0.75rem', borderRadius:'0.5rem', background:'#f1f5f9', color:'#475569', border:'none', cursor:'pointer', flexShrink:0 }}
                        onMouseEnter={e => (e.currentTarget.style.background='#e2e8f0')}
                        onMouseLeave={e => (e.currentTarget.style.background='#f1f5f9')}>
                        ← Cambiar tipo
                      </button>
                    </div>
                    {inicio ? (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem', borderRadius:'0.875rem', background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                        <div>
                          <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0 0 0.25rem' }}>Fecha de inicio seleccionada</p>
                          <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{formatFecha(inicio)}</p>
                        </div>
                        <button onClick={() => setPaso(2)}
                          style={{ padding:'0.625rem 1.25rem', background:'#1e3a5f', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                          onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
                          onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
                          Continuar →
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px dashed #e2e8f0', textAlign:'center' }}>
                        <p style={{ fontSize:'0.875rem', color:'#94a3b8', margin:0 }}>Selecciona una fecha en el almanaque →</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 2 — Vacaciones */}
                {paso === 2 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#d97706', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, fontFamily:'Outfit, sans-serif', flexShrink:0 }}>2</div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>¿Cuándo son las vacaciones?</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>
                          {!vacIni ? 'Selecciona el inicio de vacaciones' : !vacFin ? 'Ahora selecciona el fin de vacaciones' : 'Período de vacaciones definido'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
                      {[
                        { label:'Inicio vacaciones', valor: vacIni, activo: !vacIni },
                        { label:'Fin vacaciones',    valor: vacFin, activo: !!vacIni && !vacFin },
                      ].map(f => (
                        <div key={f.label} style={{ padding:'0.875rem', borderRadius:'0.875rem', background: f.activo ? '#fffbeb' : f.valor ? '#fef9c3' : '#f8fafc', border: f.activo ? '1.5px dashed #d97706' : f.valor ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
                          <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase' }}>{f.label}</p>
                          <p style={{ fontSize:'0.9375rem', fontWeight:700, color: f.valor ? '#854d0e' : '#cbd5e1', margin:0, fontFamily:'Outfit, sans-serif' }}>
                            {f.valor ? formatFecha(f.valor) : f.activo ? 'Selecciona →' : '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {vacIni && vacFin && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <p style={{ fontSize:'0.75rem', color:'#64748b', margin:0 }}>
                          {diasEntre(vacIni, vacFin)} días de vacaciones
                        </p>
                        <button onClick={() => setPaso(3)}
                          style={{ padding:'0.625rem 1.25rem', background:'#1e3a5f', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                          onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
                          onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
                          Continuar →
                        </button>
                      </div>
                    )}

                    <button onClick={() => { setVacIni(''); setVacFin(''); setPaso(3) }}
                      style={{ marginTop:'0.5rem', fontSize:'0.75rem', color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                      Omitir vacaciones
                    </button>
                  </div>
                )}

                {/* Paso 3 — Fecha de cierre */}
                {paso === 3 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#dc2626', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, fontFamily:'Outfit, sans-serif', flexShrink:0 }}>3</div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>¿Cuándo cierra el semestre?</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>Selecciona la fecha de cierre en el almanaque</p>
                      </div>
                    </div>
                    {cierre ? (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem', borderRadius:'0.875rem', background:'#fef2f2', border:'1px solid #fecaca' }}>
                        <div>
                          <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0 0 0.25rem' }}>Fecha de cierre seleccionada</p>
                          <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#dc2626', margin:0, fontFamily:'Outfit, sans-serif' }}>{formatFecha(cierre)}</p>
                        </div>
                        <button onClick={() => setPaso(4)}
                          style={{ padding:'0.625rem 1.25rem', background:'#1e3a5f', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                          onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
                          onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
                          Continuar →
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px dashed #e2e8f0', textAlign:'center' }}>
                        <p style={{ fontSize:'0.875rem', color:'#94a3b8', margin:0 }}>Selecciona una fecha en el almanaque →</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 4 — Días festivos */}
                {paso === 4 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#8b5cf6', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, fontFamily:'Outfit, sans-serif', flexShrink:0 }}>4</div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Días festivos o inhábiles</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>Clic en un día del almanaque para marcarlo como festivo</p>
                      </div>
                    </div>

                    {festivos.length > 0 ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>
                        {festivos.sort().map(f => (
                          <span key={f} style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', fontWeight:600, padding:'0.3rem 0.625rem', borderRadius:'0.5rem', background:'#fee2e2', color:'#dc2626', border:'1px solid #fecaca' }}>
                            {formatFecha(f)}
                            <button onClick={() => toggleFestivo(f)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', lineHeight:1, padding:0, fontSize:'0.7rem' }}>✕</button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px dashed #e2e8f0', marginBottom:'1rem', textAlign:'center' }}>
                        <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:0 }}>Ningún día festivo marcado todavía</p>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      <button onClick={() => setPaso(5)}
                        style={{ flex:1, padding:'0.625rem', background:'#1e3a5f', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                        onMouseEnter={e => (e.currentTarget.style.background='#2563eb')}
                        onMouseLeave={e => (e.currentTarget.style.background='#1e3a5f')}>
                        Ver resumen →
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 5 — Resumen */}
                {paso === 5 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#16a34a', color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Resumen del período</p>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>Revisa la configuración antes de habilitar</p>
                      </div>
                    </div>

                    {/* Fechas resumen */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
                      {[
                        { label:'Inicio del semestre', valor: formatFecha(inicio), color:'#1e3a5f', bg:'#eff6ff' },
                        { label:'Inicio vacaciones',   valor: formatFecha(vacIni), color:'#d97706', bg:'#fffbeb' },
                        { label:'Fin vacaciones',      valor: formatFecha(vacFin), color:'#d97706', bg:'#fffbeb' },
                        { label:'Cierre del semestre', valor: formatFecha(cierre), color:'#dc2626', bg:'#fef2f2' },
                      ].map(item => (
                        <div key={item.label} style={{ padding:'0.875rem', borderRadius:'0.875rem', background:item.bg }}>
                          <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase' }}>{item.label}</p>
                          <p style={{ fontSize:'0.9375rem', fontWeight:700, color:item.color, margin:0, fontFamily:'Outfit, sans-serif' }}>{item.valor}</p>
                        </div>
                      ))}
                    </div>

                    {/* Estadísticas */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
                      <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'#eff6ff', textAlign:'center' }}>
                        <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{diasTotales}</p>
                        <p style={{ fontSize:'0.7rem', color:'#64748b', margin:'0.25rem 0 0' }}>Días totales</p>
                      </div>
                      <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'#f0fdf4', textAlign:'center' }}>
                        <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#16a34a', margin:0, fontFamily:'Outfit, sans-serif' }}>{diasClase}</p>
                        <p style={{ fontSize:'0.7rem', color:'#64748b', margin:'0.25rem 0 0' }}>Días de clase</p>
                      </div>
                      <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'#fef2f2', textAlign:'center' }}>
                        <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#dc2626', margin:0, fontFamily:'Outfit, sans-serif' }}>{diasFest}</p>
                        <p style={{ fontSize:'0.7rem', color:'#64748b', margin:'0.25rem 0 0' }}>Días festivos</p>
                      </div>
                    </div>

                    {festivos.length > 0 && (
                      <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px solid #f1f5f9', marginBottom:'1.25rem' }}>
                        <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0 0 0.5rem', fontWeight:600, textTransform:'uppercase' }}>Días festivos/inhábiles</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                          {festivos.sort().map(f => (
                            <span key={f} style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.2rem 0.5rem', borderRadius:'0.375rem', background:'#fee2e2', color:'#dc2626' }}>
                              {formatFecha(f)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      <button onClick={() => setPaso(4)}
                        style={{ padding:'0.625rem 1rem', background:'#f1f5f9', color:'#475569', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500 }}>
                        ← Editar
                      </button>
                      <button onClick={() => setModalHabilitar(true)}
                        style={{ flex:1, padding:'0.625rem', background:'#16a34a', color:'white', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                        onMouseEnter={e => (e.currentTarget.style.background='#15803d')}
                        onMouseLeave={e => (e.currentTarget.style.background='#16a34a')}>
                        ✓ Crear período
                      </button>
                    </div>
                  </div>
                )}

                {/* Barra de pasos completados */}
                <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {pasosConfig.map(p => (
                      <div key={p.num} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                          width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                          background: paso > p.num ? '#16a34a' : paso === p.num ? '#1e3a5f' : '#f1f5f9',
                          color:      paso > p.num ? 'white'   : paso === p.num ? 'white'   : '#94a3b8',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.75rem', fontWeight:700,
                        }}>
                          {paso > p.num ? '✓' : p.num}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:'0.8125rem', fontWeight: paso === p.num ? 600 : 400, color: paso === p.num ? '#1e3a5f' : '#64748b', margin:0 }}>{p.label}</p>
                        </div>
                        {p.valor && (
                          <span style={{ fontSize:'0.7rem', color:'#16a34a', fontWeight:600 }}>{p.valor}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna derecha — almanaque */}
              <div style={{ position:'sticky', top:'1rem', height:'fit-content' }}>
                <div className="bg-white rounded-2xl shadow-sm" style={{ border:'1px solid #e2e8f0', padding:'1.5rem' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 1.25rem' }}>
                    {paso === 0 ? 'Tipo de período' : paso === 1 ? 'Selecciona inicio' : paso === 2 ? (!vacIni ? 'Selecciona inicio vacaciones' : 'Selecciona fin vacaciones') : paso === 3 ? 'Selecciona cierre' : paso === 4 ? 'Marca días festivos' : 'Vista previa'}
                  </p>
                  <div style={{ transform:'scale(1.08)', transformOrigin:'top center' }}>
                  <MiniCalendario
                    seleccionado={paso===1?inicio:paso===2?(!vacIni?vacIni:vacFin):paso===3?cierre:paso===4?'':inicio}
                    inicio={inicio} vacIni={vacIni} vacFin={vacFin} cierre={cierre} festivos={festivos}
                    onChange={iso => {
                      if (paso === 1) { setInicio(iso) }
                      else if (paso === 2) { if (!vacIni) setVacIni(iso); else if (!vacFin) setVacFin(iso) }
                      else if (paso === 3) { setCierre(iso) }
                      else if (paso === 4) { toggleFestivo(iso) }
                    }}
                  />
                  </div>
                  {/* Leyenda */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.625rem', marginTop:'1rem', paddingTop:'0.75rem', borderTop:'1px solid #f1f5f9' }}>
                    {[
                      { color:'#1e3a5f', label:'Inicio' },
                      { color:'#dbeafe', label:'Días activos', text:'#1d4ed8' },
                      { color:'#fef9c3', label:'Vacaciones',   text:'#854d0e' },
                      { color:'#fee2e2', label:'Festivos',     text:'#dc2626' },
                      { color:'#dc2626', label:'Cierre' },
                    ].map(l => (
                      <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:l.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.65rem', color:'#64748b' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── VISTA ACTIVO ── */}
        {vista === 'activo' && (
          <>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#16a34a' }}/>
                <div>
                  <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Período escolar activo</p>
                  <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.125rem 0 0' }}>
                    {formatFecha(periodoActivo.inicio)} → {formatFecha(periodoActivo.cierre)}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalEliminar(true)}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'0.75rem', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}
                onMouseEnter={e => { e.currentTarget.style.background='#fee2e2' }}
                onMouseLeave={e => { e.currentTarget.style.background='#fef2f2' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Eliminar período
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.25rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                {/* Fechas */}
                <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 1rem' }}>Fechas del semestre</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    {[
                      { label:'Inicio del semestre', valor: periodoActivo.inicio, color:'#1e3a5f', bg:'#eff6ff' },
                      { label:'Inicio vacaciones',   valor: periodoActivo.vacIni, color:'#d97706', bg:'#fffbeb' },
                      { label:'Fin vacaciones',      valor: periodoActivo.vacFin, color:'#d97706', bg:'#fffbeb' },
                      { label:'Cierre del semestre', valor: periodoActivo.cierre, color:'#dc2626', bg:'#fef2f2' },
                    ].map(item => (
                      <div key={item.label} style={{ padding:'1rem', borderRadius:'0.875rem', background:item.bg }}>
                        <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase' }}>{item.label}</p>
                        <p style={{ fontSize:'1rem', fontWeight:700, color:item.color, margin:0, fontFamily:'Outfit, sans-serif' }}>{item.valor ? formatFecha(item.valor) : '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-2xl shadow-sm" style={{ border:'1px solid #e2e8f0', padding:'1rem 1.25rem' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.75rem' }}>Resumen del período</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.625rem' }}>
                    <div style={{ padding:'0.625rem', borderRadius:'0.875rem', background:'#eff6ff', textAlign:'center' }}>
                      <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{diasEntre(periodoActivo.inicio, periodoActivo.cierre)}</p>
                      <p style={{ fontSize:'0.65rem', color:'#64748b', margin:'0.125rem 0 0' }}>Días totales</p>
                    </div>
                    <div style={{ padding:'0.625rem', borderRadius:'0.875rem', background:'#f0fdf4', textAlign:'center' }}>
                      <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#16a34a', margin:0, fontFamily:'Outfit, sans-serif' }}>
                        {Math.max(0, diasEntre(periodoActivo.inicio, periodoActivo.cierre) - (periodoActivo.vacIni && periodoActivo.vacFin ? diasEntre(periodoActivo.vacIni, periodoActivo.vacFin) : 0) - periodoActivo.festivos.length)}
                      </p>
                      <p style={{ fontSize:'0.65rem', color:'#64748b', margin:'0.125rem 0 0' }}>Días de clase</p>
                    </div>
                    <div style={{ padding:'0.625rem', borderRadius:'0.875rem', background:'#fef2f2', textAlign:'center' }}>
                      <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#dc2626', margin:0, fontFamily:'Outfit, sans-serif' }}>{periodoActivo.festivos.length}</p>
                      <p style={{ fontSize:'0.65rem', color:'#64748b', margin:'0.125rem 0 0' }}>Días festivos</p>
                    </div>
                  </div>
                </div>

                {/* Festivos */}
                {periodoActivo.festivos.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                    <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.75rem' }}>Días festivos/inhábiles</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                      {periodoActivo.festivos.sort().map(f => (
                        <span key={f} style={{ fontSize:'0.75rem', fontWeight:600, padding:'0.3rem 0.75rem', borderRadius:'0.5rem', background:'#fee2e2', color:'#dc2626', border:'1px solid #fecaca' }}>
                          {formatFecha(f)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Almanaque activo */}
              <div style={{ position:'sticky', top:'1rem', height:'fit-content' }}>
                <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border:'1px solid #e2e8f0' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 1rem' }}>Vista del período</p>
                  <MiniCalendario
                    seleccionado={periodoActivo.inicio}
                    inicio={periodoActivo.inicio} vacIni={periodoActivo.vacIni}
                    vacFin={periodoActivo.vacFin} cierre={periodoActivo.cierre}
                    festivos={periodoActivo.festivos}
                    onChange={() => {}}
                  />
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.625rem', marginTop:'1rem', paddingTop:'0.75rem', borderTop:'1px solid #f1f5f9' }}>
                    {[
                      { color:'#1e3a5f', label:'Inicio' },
                      { color:'#dbeafe', label:'Días activos' },
                      { color:'#fef9c3', label:'Vacaciones' },
                      { color:'#fee2e2', label:'Festivos' },
                      { color:'#dc2626', label:'Cierre' },
                    ].map(l => (
                      <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:l.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.65rem', color:'#64748b' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {modalHabilitar && <ModalConfirmar onAceptar={habilitar} onCancelar={() => setModalHabilitar(false)} />}
      {modalEliminar  && <ModalEliminar  onAceptar={eliminarPeriodo} onCancelar={() => setModalEliminar(false)} />}
    </div>
  )
}