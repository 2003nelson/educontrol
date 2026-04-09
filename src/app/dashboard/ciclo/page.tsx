'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['L','M','X','J','V','S','D']

type Dir  = 'adelante' | 'atras'

function formatFecha(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES[parseInt(m) - 1].slice(0,3)} ${y}`
}
function diasEntre(a: string, b: string) {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1)
}

const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function formatFechaLarga(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)} de ${MESES_LARGO[parseInt(m)-1]} de ${y}`
}

// ─── Mini calendario ──────────────────────────────────────────────────────────
function MiniCalendario({
  seleccionado, inicio, cierre, festivos, onChange, minDate, maxDate, ocupadas,
}: {
  seleccionado: string; inicio: string; cierre: string
  festivos: string[]; onChange: (iso: string) => void
  minDate?: string; maxDate?: string; ocupadas?: string[]
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
    if (ocupadas?.includes(iso)) return 'cierre'
    if (inicio && cierre && iso >= inicio && iso <= cierre) return 'activo'
    return 'normal'
  }

  return (
    <div>
      {/* Nav mes */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem' }}>
        <button onClick={() => setVista(v => ({ month: v.month===0?11:v.month-1, year: v.month===0?v.year-1:v.year }))}
          style={{ width:'30px', height:'30px', borderRadius:'50%', border:'none', background:'#f1f5f9', cursor:'pointer', color:'#475569', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', fontFamily:'Outfit, sans-serif', margin:0 }}>
          {MESES[vista.month]} {vista.year}
        </p>
        <button onClick={() => setVista(v => ({ month: v.month===11?0:v.month+1, year: v.month===11?v.year+1:v.year }))}
          style={{ width:'30px', height:'30px', borderRadius:'50%', border:'none', background:'#f1f5f9', cursor:'pointer', color:'#475569', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>
      {/* Días semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
        {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'0.6rem', fontWeight:600, color:'#94a3b8', padding:'2px 0' }}>{d}</div>)}
      </div>
      {/* Días */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
        {Array.from({length:offset}).map((_,i) => <div key={`e-${i}`}/>)}
        {Array.from({length:diasMes},(_,i) => i+1).map(day => {
          const iso    = toIso(day)
          const estado = estadoDia(iso)
          const esSel  = iso === seleccionado
          const fuera  = (minDate && iso < minDate) || (maxDate && iso > maxDate) || (ocupadas?.includes(iso))
          const cols: Record<string, {bg:string;color:string}> = {
            inicio:     { bg:'#1e3a5f',  color:'white'   },
            cierre:     { bg:'#dc2626',  color:'white'   },
            vacaciones: { bg:'#fef9c3',  color:'#854d0e' },
            festivo:    { bg:'#fce7f3',  color:'#be185d' },
            activo:     { bg:'#dbeafe',  color:'#1d4ed8' },
            normal:     { bg:'transparent', color:'#334155' },
          }
          const col = cols[estado]
          return (
            <button key={day} onClick={() => !fuera && onChange(iso)}
              style={{ width:'100%', aspectRatio:'1', borderRadius:'50%', border: esSel ? '2px solid #3b82f6' : 'none', cursor: fuera ? 'default' : 'pointer', fontSize:'0.72rem', fontWeight: estado !== 'normal' ? 700 : 400, background: col.bg, color: fuera ? '#d1d5db' : col.color, transition:'all 0.1s', opacity: fuera ? 0.35 : 1 }}
              onMouseEnter={e => { if (!fuera && estado==='normal') e.currentTarget.style.background='#f1f5f9' }}
              onMouseLeave={e => { if (!fuera && estado==='normal') e.currentTarget.style.background='transparent' }}>
              {day}
            </button>
          )
        })}
      </div>
      {/* Leyenda */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.875rem', paddingTop:'0.75rem', borderTop:'1px solid #f1f5f9' }}>
        {[
          { color:'#1e3a5f', label:'Inicio' },
          { color:'#dbeafe', label:'Activos' },
          { color:'#fef9c3', label:'Vacaciones' },
          { color:'#f9a8d4', label:'Festivos' },
          { color:'#dc2626', label:'Cierre' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:l.color }}/>
            <span style={{ fontSize:'0.6rem', color:'#94a3b8' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Botón crear ciclo expandible ─────────────────────────────────────────────
function CrearCicloBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov]   = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <button onClick={onClick}
      onMouseEnter={() => { if (leaveT.current) clearTimeout(leaveT.current); enterT.current = setTimeout(() => setHov(true), 120) }}
      onMouseLeave={() => { if (enterT.current) clearTimeout(enterT.current); leaveT.current = setTimeout(() => setHov(false), 200) }}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: hov ? '0.5rem' : '0',
        height:'44px', width: hov ? 'auto' : '44px', minWidth: hov ? '170px' : '44px',
        padding: hov ? '0 1.25rem' : '0',
        borderRadius: hov ? '1rem' : '50%',
        background:'transparent', border:'1.5px solid #2563eb',
        cursor:'pointer', transition:'all 0.32s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
      }}>
      <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      {hov && <>
        <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#2563eb' }}>Crear ciclo</span>
        <svg width="13" height="13" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </>}
    </button>
  )
}

// ─── Círculo stat ─────────────────────────────────────────────────────────────
function CircleStat({ value, label, color, bg }: { value: number|string; label: string; color: string; bg: string }) {
  const isDate = typeof value === 'string' && value.includes(' ')
  // For dates like "15 Dic 2025" split into parts
  const parts = isDate ? (value as string).split(' ') : null

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:bg, border:`2.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, flexDirection:'column', gap:'1px' }}>
        {isDate && parts ? (
          <>
            <span style={{ fontSize:'0.8rem', fontWeight:800, color, fontFamily:'Outfit, sans-serif', lineHeight:1 }}>{parts[0]}</span>
            <span style={{ fontSize:'0.6rem', fontWeight:700, color, fontFamily:'Outfit, sans-serif', lineHeight:1 }}>{parts[1]}</span>
            <span style={{ fontSize:'0.55rem', fontWeight:600, color, opacity:0.75, lineHeight:1 }}>{parts[2]}</span>
          </>
        ) : (
          <span style={{ fontSize:'1.25rem', fontWeight:800, color, fontFamily:'Outfit, sans-serif' }}>{value}</span>
        )}
      </div>
      <span style={{ fontSize:'0.68rem', fontWeight:600, color:'#64748b', textAlign:'center', maxWidth:'72px', lineHeight:1.3 }}>{label}</span>
    </div>
  )
}

// ─── Wizard Modal ─────────────────────────────────────────────────────────────
function WizardModal({
  onCrear,
  onCerrar,
}: {
  onCrear: (data: { inicio: string; cierre: string; vacIni: string; vacFin: string; parcial1: string; parcial2: string; festivos: string[] }) => void
  onCerrar: () => void
}) {
  type PasoW = 0|1|2|3|4|5|6|7
  const [paso, setPaso]           = useState<PasoW>(0)
  const [dir, setDir]             = useState<Dir>('adelante')
  const [animating, setAnimating] = useState(false)
  const [cerrando, setCerrando]   = useState(false)

  const [inicio,   setInicio]   = useState('')
  const [cierre,   setCierre]   = useState('')
  const [vacIni,   setVacIni]   = useState('')
  const [vacFin,   setVacFin]   = useState('')
  const [parcial1, setParcial1] = useState('')
  const [parcial2, setParcial2] = useState('')
  const [festivos, setFestivos] = useState<string[]>([])

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  function irPaso(nuevo: PasoW, d: Dir) {
    setDir(d); setAnimating(true)
    setTimeout(() => { setPaso(nuevo); setAnimating(false) }, 220)
  }
  function nextDay(iso: string) {
    const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0,10)
  }
  function prevDay(iso: string) {
    const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0,10)
  }
  function toggleFestivo(iso: string) {
    if (!inicio || !cierre || iso < inicio || iso > cierre) return
    if ([inicio, cierre, vacIni, vacFin, parcial1, parcial2].includes(iso)) return
    setFestivos(prev => prev.includes(iso) ? prev.filter(f => f !== iso) : [...prev, iso])
  }

  const diasTotales = diasEntre(inicio, cierre)
  const diasVac     = vacIni && vacFin ? diasEntre(vacIni, vacFin) : 0
  const diasFest    = festivos.filter(f => f >= inicio && f <= cierre).length
  const diasEfect   = Math.max(0, diasTotales - diasVac - diasFest)

  const pasos = [
    { titulo:'¿Cuándo inicia el ciclo?',        sub:'Selecciona la fecha de inicio del semestre' },
    { titulo:'¿Cuándo cierra el semestre?',      sub:'Selecciona la fecha de cierre del semestre' },
    { titulo:'¿Inicio de vacaciones?',                sub:'Primer día de vacaciones dentro del ciclo' },
    { titulo:'¿Fin de vacaciones?',                   sub:'Último día de vacaciones' },
    { titulo:'¿Cuándo cierra el 1er parcial?',   sub:'Debe estar entre el inicio y el cierre' },
    { titulo:'¿Cuándo cierra el 2do parcial?',   sub:'Después del 1er parcial y antes del cierre' },
    { titulo:'Días festivos o inhábiles',         sub:'Selecciona los días no laborables dentro del ciclo' },
    { titulo:'Resumen del ciclo',                         sub:'Todo listo para activar el período escolar' },
  ]

  const ocupadas = [inicio, cierre, vacIni, vacFin, parcial1, parcial2].filter(Boolean)

  const calConfig: Record<number, { seleccionado: string; minDate?: string; maxDate?: string }> = {
    0: { seleccionado: inicio },
    1: { seleccionado: cierre,   minDate: inicio   ? nextDay(inicio)   : undefined },
    2: { seleccionado: vacIni,   minDate: inicio   ? nextDay(inicio)   : undefined, maxDate: cierre ? prevDay(cierre) : undefined },
    3: { seleccionado: vacFin,   minDate: vacIni   ? nextDay(vacIni)   : undefined, maxDate: cierre ? prevDay(cierre) : undefined },
    4: { seleccionado: parcial1, minDate: inicio   ? nextDay(inicio)   : undefined, maxDate: cierre ? prevDay(cierre) : undefined },
    5: { seleccionado: parcial2, minDate: parcial1 ? nextDay(parcial1) : undefined, maxDate: cierre ? prevDay(cierre) : undefined },
    6: { seleccionado: '' },
  }

  const valorActual      = calConfig[paso]?.seleccionado ?? ''
  const calendarioActivo = paso < 7

  function onCalChange(iso: string) {
    if (ocupadas.includes(iso) && !festivos.includes(iso)) return
    if (paso === 0) { setInicio(iso); setCierre(''); setVacIni(''); setVacFin(''); setParcial1(''); setParcial2('') }
    else if (paso === 1) { setCierre(iso); setVacIni(''); setVacFin(''); setParcial1(''); setParcial2('') }
    else if (paso === 2) { setVacIni(iso); setVacFin('') }
    else if (paso === 3) setVacFin(iso)
    else if (paso === 4) { setParcial1(iso); setParcial2('') }
    else if (paso === 5) setParcial2(iso)
    else if (paso === 6) toggleFestivo(iso)
  }

  const puedeAvanzar = [!!inicio, !!cierre, !!vacIni, !!vacFin, !!parcial1, !!parcial2, true, true][paso]
  const TOTAL_PASOS = 7

  const slideIn = dir === 'adelante' ? 'translateX(20px)' : 'translateX(-20px)'
  const contentStyle: React.CSSProperties = {
    opacity: animating ? 0 : 1,
    transform: animating ? `${slideIn} scale(0.97)` : 'translateX(0) scale(1)',
    transition: animating
      ? 'opacity 0.18s ease, transform 0.18s ease'
      : 'opacity 0.32s cubic-bezier(0.34,1.56,0.64,1), transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      <style>{`
        @keyframes wizBackdrop { from { opacity:0 } to { opacity:1 } }
        @keyframes wizBackOut  { from { opacity:1 } to { opacity:0 } }
        @keyframes wizSpringIn  { from { opacity:0; transform:scale(0.9) translateY(16px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes wizSpringOut { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.9) translateY(16px) } }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: cerrando ? 'wizBackOut 0.38s ease forwards' : 'wizBackdrop 0.28s ease' }}/>
      <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{ background:'white', borderRadius:'1.5rem', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', width:'820px', maxWidth:'calc(100vw - 2rem)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', pointerEvents:'all', animation: cerrando ? 'wizSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'wizSpringIn 0.46s cubic-bezier(0.34,1.56,0.64,1)' }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ display:'flex', gap:'0.3rem' }}>
                {Array.from({length:TOTAL_PASOS},(_,n) => (
                  <div key={n} style={{ height:'6px', borderRadius:'9999px', background: paso > n ? '#16a34a' : paso === n ? '#2563eb' : '#e2e8f0', width: paso === n ? '22px' : '7px', transition:'all 0.3s ease' }}/>
                ))}
              </div>
              <p style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8', margin:0 }}>
                {paso < TOTAL_PASOS ? `Paso ${paso + 1} de ${TOTAL_PASOS}` : 'Listo para activar'}
              </p>
            </div>
            <button onClick={cerrar} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontWeight:700, fontSize:'0.9rem' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: calendarioActivo ? '1fr 1fr' : '1fr', height:'480px', overflow:'hidden' }}>
            <div style={{ padding:'2rem', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight: calendarioActivo ? '1px solid #f1f5f9' : 'none', minHeight:0, overflowY:'auto' }}>
              <div style={{ ...contentStyle, overflowY:'auto', flex:1 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.5rem' }}>{paso < 7 ? `Paso ${paso + 1}` : 'Resumen'}</p>
                <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem', fontFamily:'Outfit, sans-serif' }}>{pasos[paso].titulo}</h2>
                <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:'0 0 1.5rem' }}>{pasos[paso].sub}</p>

                {paso < 6 && valorActual && (
                  <div style={{ padding:'1rem', borderRadius:'1rem', background:'#eff6ff', border:'1px solid #bfdbfe', marginBottom:'1.25rem' }}>
                    <p style={{ fontSize:'0.65rem', color:'#64748b', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase' }}>Fecha seleccionada</p>
                    <p style={{ fontSize:'1.25rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{formatFecha(valorActual)}</p>
                  </div>
                )}

                {paso >= 1 && paso < 6 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginBottom:'1rem' }}>
                    {inicio   && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}><span style={{ color:'#94a3b8' }}>Inicio:</span><span style={{ fontWeight:600, color:'#1e3a5f' }}>{formatFecha(inicio)}</span></div>}
                    {cierre   && paso > 1 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}><span style={{ color:'#94a3b8' }}>Cierre:</span><span style={{ fontWeight:600, color:'#dc2626' }}>{formatFecha(cierre)}</span></div>}
                    {vacIni   && paso > 2 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}><span style={{ color:'#94a3b8' }}>Vac. inicio:</span><span style={{ fontWeight:600, color:'#d97706' }}>{formatFecha(vacIni)}</span></div>}
                    {vacFin   && paso > 3 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}><span style={{ color:'#94a3b8' }}>Vac. fin:</span><span style={{ fontWeight:600, color:'#d97706' }}>{formatFecha(vacFin)}</span></div>}
                    {parcial1 && paso > 4 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}><span style={{ color:'#94a3b8' }}>Parcial 1:</span><span style={{ fontWeight:600, color:'#2563eb' }}>{formatFecha(parcial1)}</span></div>}
                  </div>
                )}

                {paso === 6 && (
                  <div style={{ marginBottom:'1.25rem' }}>
                    {festivos.length === 0 ? (
                      <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px dashed #e2e8f0', textAlign:'center' }}>
                        <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:0 }}>Ningún día marcado aún</p>
                      </div>
                    ) : (
                      <div style={{ maxHeight:'9rem', overflowY:'auto' }}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                          {festivos.sort().map(f => (
                            <span key={f} style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', fontWeight:600, padding:'0.25rem 0.625rem', borderRadius:'0.5rem', background:'#fce7f3', color:'#be185d', border:'1px solid #f9a8d4' }}>
                              {formatFecha(f)}
                              <button onClick={() => toggleFestivo(f)} style={{ background:'none', border:'none', cursor:'pointer', color:'#be185d', fontSize:'0.65rem', padding:0, lineHeight:1 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.75rem 0 0' }}>Días entre {formatFecha(inicio)} y {formatFecha(cierre)}</p>
                  </div>
                )}

                {paso === 7 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                      <CircleStat value={diasEfect}             label="Días efectivos"   color="#2563eb" bg="#eff6ff" />
                      <CircleStat value={diasVac}               label="Días vacaciones"  color="#d97706" bg="#fffbeb" />
                      <CircleStat value={formatFecha(parcial1)} label="Cierre Parcial 1" color="#2563eb" bg="#eff6ff" />
                      <CircleStat value={formatFecha(parcial2)} label="Cierre Parcial 2" color="#7c3aed" bg="#f5f3ff" />
                      <CircleStat value={formatFecha(cierre)}   label="Fin de ciclo"     color="#dc2626" bg="#fef2f2" />
                    </div>
                    <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.775rem' }}>
                        <span style={{ color:'#94a3b8' }}>Inicio:</span>      <span style={{ fontWeight:600, color:'#1e3a5f' }}>{formatFecha(inicio)}</span>
                        <span style={{ color:'#94a3b8' }}>Vacaciones:</span>  <span style={{ fontWeight:600, color:'#d97706' }}>{formatFecha(vacIni)} → {formatFecha(vacFin)}</span>
                        <span style={{ color:'#94a3b8' }}>Parcial 1:</span>   <span style={{ fontWeight:600, color:'#2563eb' }}>{formatFecha(parcial1)}</span>
                        <span style={{ color:'#94a3b8' }}>Parcial 2:</span>   <span style={{ fontWeight:600, color:'#7c3aed' }}>{formatFecha(parcial2)}</span>
                        <span style={{ color:'#94a3b8' }}>Cierre:</span>      <span style={{ fontWeight:600, color:'#dc2626' }}>{formatFecha(cierre)}</span>
                        <span style={{ color:'#94a3b8' }}>Festivos:</span>    <span style={{ fontWeight:600, color:'#be185d' }}>{diasFest} día{diasFest!==1?'s':''}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:'0.75rem', paddingTop:'1.5rem', flexShrink:0 }}>
                {paso > 0 && (
                  <button onClick={() => irPaso((paso - 1) as PasoW, 'atras')}
                    style={{ padding:'0.625rem 1.25rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', color:'#64748b', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                    ← Regresar
                  </button>
                )}
                {paso < 6 && (
                  <button onClick={() => { if (puedeAvanzar) irPaso((paso + 1) as PasoW, 'adelante') }} disabled={!puedeAvanzar}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background: puedeAvanzar ? '#1e3a5f' : '#e2e8f0', color: puedeAvanzar ? 'white' : '#94a3b8', cursor: puedeAvanzar ? 'pointer' : 'not-allowed', transition:'background 0.2s' }}
                    onMouseEnter={e=>{ if(puedeAvanzar) e.currentTarget.style.background='#2563eb' }} onMouseLeave={e=>{ if(puedeAvanzar) e.currentTarget.style.background='#1e3a5f' }}>
                    Continuar →
                  </button>
                )}
                {paso === 6 && (
                  <button onClick={() => irPaso(7, 'adelante')}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#2563eb')} onMouseLeave={e=>(e.currentTarget.style.background='#1e3a5f')}>
                    Ver resumen →
                  </button>
                )}
                {paso === 7 && (
                  <button onClick={() => onCrear({ inicio, cierre, vacIni, vacFin, parcial1, parcial2, festivos })}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#16a34a', color:'white', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#15803d')} onMouseLeave={e=>(e.currentTarget.style.background='#16a34a')}>
                    ✓ Activar ciclo escolar
                  </button>
                )}
              </div>
            </div>

            {calendarioActivo && (
              <div style={{ padding:'2rem', background:'#fafbfc', display:'flex', flexDirection:'column', overflowY:'auto', maxHeight:'520px' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1.25rem', flexShrink:0 }}>
                  {['Selecciona la fecha de inicio','Selecciona la fecha de cierre','Selecciona inicio de vacaciones','Selecciona fin de vacaciones','Selecciona cierre del 1er parcial','Selecciona cierre del 2do parcial','Selecciona días festivos'][paso]}
                </p>
                <div style={{ transform:'scale(1.05)', transformOrigin:'top center', flexShrink:0 }}>
                  <MiniCalendario
                    seleccionado={valorActual}
                    inicio={inicio} cierre={cierre} festivos={festivos}
                    onChange={onCalChange}
                    minDate={calConfig[paso]?.minDate}
                    maxDate={calConfig[paso]?.maxDate}
                    ocupadas={paso > 0 ? ocupadas.filter(d => d !== valorActual) : []}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────
// ─── Modal confirmar eliminar ─────────────────────────────────────────────────
function ModalEliminar({ onAceptar, onCancelar }: { onAceptar: () => void; onCancelar: () => void }) {
  if (typeof window === 'undefined') return null
  return createPortal(
    <div onClick={onCancelar} style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:'elimBack 0.25s ease' }}>
      <style>{`@keyframes elimBack { from { opacity:0 } to { opacity:1 } } @keyframes elimIn { from { opacity:0; transform:scale(0.92) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'400px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'elimIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
          <svg width="24" height="24" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </div>
        <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.5rem', textAlign:'center' }}>¿Eliminar ciclo escolar?</h3>
        <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:'0 0 1.5rem', textAlign:'center' }}>Esta acción no se puede deshacer.</p>
        <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#1d4ed8')} onMouseLeave={e=>(e.currentTarget.style.background='#2563eb')}>Cancelar</button>
          <button onClick={onAceptar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#b91c1c')} onMouseLeave={e=>(e.currentTarget.style.background='#dc2626')}>Sí, eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Botón eliminar expandible ────────────────────────────────────────────────
function EliminarCicloBtn({ borrando, onClick }: { borrando: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (leaveT.current) clearTimeout(leaveT.current)
    enterT.current = setTimeout(() => setHov(true), 150)
  }
  function handleLeave() {
    if (enterT.current) clearTimeout(enterT.current)
    leaveT.current = setTimeout(() => setHov(false), 220)
  }

  const expandido = hov || borrando

  return (
    <>
      <style>{`
        @keyframes trashBounce {
          0%   { transform: translateY(0) rotate(0deg) }
          15%  { transform: translateY(-6px) rotate(-8deg) }
          30%  { transform: translateY(0) rotate(6deg) }
          45%  { transform: translateY(-4px) rotate(-5deg) }
          60%  { transform: translateY(0) rotate(3deg) }
          75%  { transform: translateY(-2px) rotate(-2deg) }
          100% { transform: translateY(0) rotate(0deg) }
        }
        @keyframes borradoIn {
          from { opacity:0; transform:scale(0.85) }
          to   { opacity:1; transform:scale(1) }
        }
      `}</style>
      <button
        onClick={onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        disabled={borrando}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          gap: expandido ? '0.5rem' : '0',
          height:'36px',
          width: expandido ? 'auto' : '36px',
          minWidth: expandido ? '145px' : '36px',
          padding: expandido ? '0 1rem' : '0',
          borderRadius: expandido ? '0.75rem' : '50%',
          background: expandido ? '#fef2f2' : 'transparent',
          border: expandido ? '1px solid #fecaca' : '1.5px solid #fca5a5',
          color: '#dc2626',
          cursor: borrando ? 'not-allowed' : 'pointer',
          transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
          overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
        }}
        >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ animation: borrando ? 'trashBounce 0.55s ease-in-out infinite' : 'none', flexShrink:0 }}>
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        {expandido && (
          <span style={{ fontSize:'0.8rem', fontWeight:600 }}>
            {borrando ? 'Borrando...' : 'Eliminar ciclo'}
          </span>
        )}
      </button>
    </>
  )
}

// ─── Wizard Editar ciclo ──────────────────────────────────────────────────────
function WizardEditar({
  periodoActual,
  onGuardar,
  onCerrar,
}: {
  periodoActual: { inicio: string; cierre: string; vacIni: string; vacFin: string; parcial1: string; parcial2: string; festivos: string[] }
  onGuardar: (data: typeof periodoActual) => void
  onCerrar: () => void
}) {
  type Campo = 'inicio'|'cierre'|'vacIni'|'vacFin'|'parcial1'|'parcial2'
  const [campoActivo, setCampoActivo] = useState<Campo|null>(null)
  const [cerrando, setCerrando]       = useState(false)

  const [inicio,   setInicio]   = useState(periodoActual.inicio)
  const [cierre,   setCierre]   = useState(periodoActual.cierre)
  const [vacIni,   setVacIni]   = useState(periodoActual.vacIni)
  const [vacFin,   setVacFin]   = useState(periodoActual.vacFin)
  const [parcial1, setParcial1] = useState(periodoActual.parcial1)
  const [parcial2, setParcial2] = useState(periodoActual.parcial2)

  function cerrar() { setCerrando(true); setTimeout(() => onCerrar(), 380) }
  function guardar() {
    onGuardar({ inicio, cierre, vacIni, vacFin, parcial1, parcial2, festivos: periodoActual.festivos })
    cerrar()
  }

  const campos: { key: Campo; label: string; valor: string; color: string; setter: (v:string)=>void }[] = [
    { key:'inicio',   label:'Inicio del ciclo',    valor:inicio,   color:'#1e3a5f', setter:setInicio   },
    { key:'cierre',   label:'Cierre del semestre',  valor:cierre,   color:'#dc2626', setter:setCierre   },
    { key:'vacIni',   label:'Inicio de vacaciones', valor:vacIni,   color:'#d97706', setter:setVacIni   },
    { key:'vacFin',   label:'Fin de vacaciones',    valor:vacFin,   color:'#d97706', setter:setVacFin   },
    { key:'parcial1', label:'Cierre Parcial 1',     valor:parcial1, color:'#2563eb', setter:setParcial1 },
    { key:'parcial2', label:'Cierre Parcial 2',     valor:parcial2, color:'#7c3aed', setter:setParcial2 },
  ]

  function nd(iso: string) { const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) }
  function pd(iso: string) { const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }

  // Range rules per campo: minDate / maxDate
  const rangeRules: Record<Campo, { minDate?: string; maxDate?: string }> = {
    inicio:   { maxDate: [cierre,vacIni,vacFin,parcial1,parcial2].filter(Boolean).sort()[0] ? pd([cierre,vacIni,vacFin,parcial1,parcial2].filter(Boolean).sort()[0]) : undefined },
    cierre:   { minDate: [inicio,vacIni,vacFin,parcial1,parcial2].filter(Boolean).sort().at(-1) ? nd([inicio,vacIni,vacFin,parcial1,parcial2].filter(Boolean).sort().at(-1)!) : undefined },
    vacIni:   { minDate: inicio ? nd(inicio) : undefined, maxDate: vacFin ? pd(vacFin) : cierre ? pd(cierre) : undefined },
    vacFin:   { minDate: vacIni ? nd(vacIni) : inicio ? nd(inicio) : undefined, maxDate: cierre ? pd(cierre) : undefined },
    parcial1: { minDate: inicio ? nd(inicio) : undefined, maxDate: parcial2 ? pd(parcial2) : cierre ? pd(cierre) : undefined },
    parcial2: { minDate: parcial1 ? nd(parcial1) : inicio ? nd(inicio) : undefined, maxDate: cierre ? pd(cierre) : undefined },
  }

  const campoSelec = campoActivo ? campos.find(c=>c.key===campoActivo) : null
  const rango      = campoActivo ? rangeRules[campoActivo] : {}

  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes weBackIn  { from{opacity:0} to{opacity:1} }
        @keyframes weBackOut { from{opacity:1} to{opacity:0} }
        @keyframes weIn  { from{opacity:0;transform:scale(0.9) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes weOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.9) translateY(16px)} }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: cerrando ? 'weBackOut 0.38s ease forwards' : 'weBackIn 0.28s ease' }}/>
      <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{ background:'white', borderRadius:'1.5rem', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', width:'820px', maxWidth:'calc(100vw - 2rem)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', pointerEvents:'all', animation: cerrando ? 'weOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'weIn 0.46s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            <div>
              <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>Editar ciclo escolar</h2>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>Selecciona una fecha para editarla</p>
            </div>
            <button onClick={cerrar} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.9rem' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.background='#f1f5f9')}>✕</button>
          </div>

          {/* Body */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:'480px', overflow:'hidden' }}>

            {/* Izquierda — tabla de fechas */}
            <div style={{ borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Header fijo */}
              <div style={{ padding:'1.75rem 1.75rem 0.75rem', flexShrink:0 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Fechas del ciclo</p>
              </div>
              {/* Lista scrolleable */}
              <div style={{ flex:'1 1 0', overflowY:'auto', padding:'0 1.75rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {campos.map(c => (
                  <button key={c.key} onClick={() => setCampoActivo(c.key)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderRadius:'0.875rem', border: campoActivo===c.key ? `2px solid ${c.color}` : '1px solid #f1f5f9', background: campoActivo===c.key ? 'white' : '#fafbfc', cursor:'pointer', transition:'all 0.18s', textAlign:'left', boxShadow: campoActivo===c.key ? `0 2px 12px ${c.color}22` : 'none', flexShrink:0 }}
                    onMouseEnter={e=>{ if(campoActivo!==c.key) e.currentTarget.style.background='white' }}
                    onMouseLeave={e=>{ if(campoActivo!==c.key) e.currentTarget.style.background='#fafbfc' }}>
                    <div>
                      <p style={{ fontSize:'0.7rem', fontWeight:600, color:'#94a3b8', margin:'0 0 0.2rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</p>
                      <p style={{ fontSize:'0.9375rem', fontWeight:700, color: campoActivo===c.key ? c.color : '#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>{formatFecha(c.valor)}</p>
                    </div>
                    {campoActivo===c.key
                      ? <svg width="16" height="16" fill="none" stroke={c.color} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" strokeLinecap="round"/></svg>
                      : <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    }
                  </button>
                ))}
              </div>
              {/* Botones siempre visibles */}
              <div style={{ padding:'1rem 1.75rem 1.75rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'0.625rem', flexShrink:0 }}>
                <button onClick={cerrar} style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', color:'#64748b', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>Cancelar</button>
                <button onClick={guardar} style={{ flex:1, padding:'0.625rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#16a34a', color:'white', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#15803d')} onMouseLeave={e=>(e.currentTarget.style.background='#16a34a')}>✓ Guardar cambios</button>
              </div>
            </div>

            {/* Derecha — calendario */}
            <div style={{ padding:'1.75rem', background:'#fafbfc', display:'flex', flexDirection:'column', overflowY:'auto' }}>
              {!campoActivo ? (
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem', textAlign:'center' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'1rem', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#475569', margin:0 }}>Selecciona una fecha</p>
                  <p style={{ fontSize:'0.775rem', color:'#94a3b8', margin:0 }}>Haz clic en una fecha de la lista para editarla</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1.25rem', flexShrink:0 }}>
                    Editando: {campoSelec?.label}
                  </p>
                  <div style={{ transform:'scale(1.05)', transformOrigin:'top center', flexShrink:0 }}>
                    <MiniCalendario
                      seleccionado={campoSelec?.valor ?? ''}
                      inicio={inicio} cierre={cierre} festivos={periodoActual.festivos}
                      onChange={(iso) => { campoSelec?.setter(iso) }}
                      minDate={rango?.minDate}
                      maxDate={rango?.maxDate}
                      ocupadas={campos.filter(c=>c.key!==campoActivo).map(c=>c.valor).filter(Boolean)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CicloPage() {
  const [wizardAbierto, setWizardAbierto] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [editandoCiclo, setEditandoCiclo] = useState(false)
  const [borrando, setBorrando]           = useState(false)
  const [borrado, setBorrado]             = useState(false)
  const [exitoVisible, setExitoVisible]   = useState(false)
  const [exitoSaliendo, setExitoSaliendo] = useState(false)
  const [periodo, setPeriodo] = useState<{ inicio: string; cierre: string; vacIni: string; vacFin: string; parcial1: string; parcial2: string; festivos: string[] } | null>(null)

  function crearCiclo(data: { inicio: string; cierre: string; vacIni: string; vacFin: string; parcial1: string; parcial2: string; festivos: string[] }) {
    setWizardAbierto(false)
    // Pequeño delay para que el modal cierre primero con spring
    setTimeout(() => {
      setExitoVisible(true)
      // Después de 2s inicia salida
      setTimeout(() => {
        setExitoSaliendo(true)
        setTimeout(() => {
          setExitoVisible(false)
          setExitoSaliendo(false)
          setPeriodo(data)
        }, 420)
      }, 2000)
    }, 420)
  }

  function eliminarCiclo() {
    setModalEliminar(false)
    setBorrando(true)
    setTimeout(() => { setBorrando(false); setBorrado(true) }, 1400)
    setTimeout(() => { setPeriodo(null); setBorrado(false) }, 2200)
  }

  function handleGuardarEdicion(data: NonNullable<typeof periodo>) {
    setPeriodo(prev => prev ? { ...prev, ...data } : prev)
    setEditandoCiclo(false)
  }

  const diasTotales = periodo ? diasEntre(periodo.inicio, periodo.cierre) : 0
  const diasVac     = periodo?.vacIni && periodo?.vacFin ? diasEntre(periodo.vacIni, periodo.vacFin) : 0
  const diasFest    = periodo ? periodo.festivos.filter(f => f >= periodo.inicio && f <= periodo.cierre).length : 0
  const diasEfect   = Math.max(0, diasTotales - diasVac - diasFest)

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Ciclo Escolar" />

      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', gap:'1.25rem' }}>



        {/* ── Sin periodo activo ── */}
        {!periodo && !exitoVisible && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.25rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'1rem', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem' }}>No hay ciclo escolar activo</p>
              <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:0 }}>Crea un nuevo ciclo para comenzar a gestionar fechas</p>
            </div>
            <CrearCicloBtn onClick={() => setWizardAbierto(true)} />
          </div>
        )}

        {/* ── Mensaje éxito ── */}
        {exitoVisible && !periodo && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <style>{`
              @keyframes exitoIn  { from { opacity:0; transform:scale(0.88) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
              @keyframes exitoOut { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.92) translateY(-16px) } }
            `}</style>
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem',
              animation: exitoSaliendo
                ? 'exitoOut 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards'
                : 'exitoIn 0.46s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {/* Ícono check animado */}
              <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#f0fdf4', border:'2.5px solid #22c55e', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(34,197,94,0.2)' }}>
                <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem', fontFamily:'Outfit, sans-serif' }}>
                  ¡Ciclo creado con éxito!
                </p>
                <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:0 }}>
                  El período escolar ha sido configurado correctamente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Con periodo activo ── */}
        {periodo && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', animation:'cicloIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <style>{`@keyframes cicloIn { from { opacity:0; transform:translateY(12px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#16a34a' }}/>
                <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Ciclo escolar activo</p>
                <span style={{ fontSize:'0.7rem', fontWeight:600, padding:'0.2rem 0.625rem', borderRadius:'9999px', background:'#fce7f3', color:'#be185d', border:'1px solid #f9a8d4' }}>
                  {formatFecha(periodo.inicio)} → {formatFecha(periodo.cierre)}
                </span>
              </div>
              {/* Botón eliminar con animación */}
              <style>{`
                @keyframes trashBounce {
                  0%   { transform: translateY(0) rotate(0deg) }
                  15%  { transform: translateY(-6px) rotate(-8deg) }
                  30%  { transform: translateY(0) rotate(6deg) }
                  45%  { transform: translateY(-4px) rotate(-5deg) }
                  60%  { transform: translateY(0) rotate(3deg) }
                  75%  { transform: translateY(-2px) rotate(-2deg) }
                  100% { transform: translateY(0) rotate(0deg) }
                }
                @keyframes borradoIn {
                  from { opacity:0; transform:scale(0.85) }
                  to   { opacity:1; transform:scale(1) }
                }
              `}</style>
              {borrado ? (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:'0.75rem', fontSize:'0.8rem', fontWeight:600, animation:'borradoIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ciclo borrado
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  {/* Botón editar */}
                  <button onClick={() => setEditandoCiclo(true)}
                    style={{ width:'36px', height:'36px', borderRadius:'50%', background:'white', border:'2px solid #2563eb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='#eff6ff' }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='white' }}>
                    <svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <EliminarCicloBtn borrando={borrando} onClick={() => !borrando && setModalEliminar(true)} />
                </div>
              )}
            </div>

            {/* Card resumen con círculos */}
            <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1.75rem' }}>Resumen del período</p>
              <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start' }}>
                <CircleStat value={formatFecha(periodo.inicio)}    label="Inicio ciclo"      color="#475569" bg="#f8fafc" />
                <CircleStat value={diasEfect}                      label="Días efectivos"   color="#2563eb" bg="#eff6ff" />
                <CircleStat value={diasVac}                        label="Días vacaciones"  color="#d97706" bg="#fffbeb" />
                <CircleStat value={formatFecha(periodo.parcial1)}  label="Cierre Parcial 1" color="#2563eb" bg="#eff6ff" />
                <CircleStat value={formatFecha(periodo.parcial2)}  label="Cierre Parcial 2" color="#7c3aed" bg="#f5f3ff" />
                <CircleStat value={diasFest}                       label="Días festivos"    color="#be185d" bg="#fce7f3" />
                <CircleStat value={formatFecha(periodo.cierre)}    label="Fin de ciclo"     color="#dc2626" bg="#fef2f2" />
              </div>
            </div>

            {/* Fila inferior: calendario + resumen de fechas */}
            <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'1.25rem', alignItems:'start' }}>

              {/* Calendario de vista */}
              <div style={{ background:'white', borderRadius:'1.25rem', padding:'1.5rem', border:'1px solid #e2e8f0' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1rem' }}>Vista del calendario</p>
                <MiniCalendario
                  seleccionado={periodo.inicio}
                  inicio={periodo.inicio} cierre={periodo.cierre}
                  festivos={periodo.festivos}
                  ocupadas={[periodo.parcial1, periodo.parcial2]}
                  onChange={() => {}}
                />
              </div>

              {/* Resumen de fechas */}
              <div style={{ background:'white', borderRadius:'1.25rem', border:'1px solid #e2e8f0', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                {/* Header */}
                <div style={{ background:'linear-gradient(135deg,#64748b,#94a3b8)', padding:'1.25rem 1.5rem' }}>
                  <p style={{ fontSize:'0.65rem', fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.25rem' }}>Fechas del período</p>
                  <p style={{ fontSize:'0.9rem', fontWeight:700, color:'white', margin:0 }}>Ciclo {formatFecha(periodo.inicio).split(' ').at(-1)} – {formatFecha(periodo.cierre).split(' ').at(-1)}</p>
                </div>
                {/* Filas */}
                <div style={{ flex:1, padding:'0.5rem 0' }}>
                  {[
                    { label:'Inicio del ciclo',    valor:formatFechaLarga(periodo.inicio),   color:'#475569', accent:'#f8fafc' },
                    { label:'Inicio vacaciones',   valor:formatFechaLarga(periodo.vacIni),   color:'#d97706', accent:'#fffbeb' },
                    { label:'Fin de vacaciones',   valor:formatFechaLarga(periodo.vacFin),   color:'#d97706', accent:'#fffbeb' },
                    { label:'Cierre Parcial 1',   valor:formatFechaLarga(periodo.parcial1), color:'#2563eb', accent:'#eff6ff' },
                    { label:'Cierre Parcial 2',   valor:formatFechaLarga(periodo.parcial2), color:'#7c3aed', accent:'#f5f3ff' },
                    { label:'Días festivos',       valor:`${diasFest} día${diasFest!==1?'s':''} no laborable${diasFest!==1?'s':''}`, color:'#be185d', accent:'#fce7f3' },
                    { label:'Fin del ciclo',       valor:formatFechaLarga(periodo.cierre),   color:'#dc2626', accent:'#fef2f2' },
                  ].map((f, i, arr) => (
                    <div key={f.label} style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.75rem 1.5rem', borderBottom: i < arr.length-1 ? '1px solid #f8fafc' : 'none', background:'white', transition:'background 0.12s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background=f.accent)}
                      onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:f.color, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.15rem' }}>{f.label}</p>
                        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>{f.valor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {wizardAbierto && <WizardModal onCrear={crearCiclo} onCerrar={() => setWizardAbierto(false)} />}
      {modalEliminar && <ModalEliminar onAceptar={eliminarCiclo} onCancelar={() => setModalEliminar(false)} />}
      {editandoCiclo && periodo && (
        <WizardEditar periodoActual={periodo} onGuardar={handleGuardarEdicion} onCerrar={() => setEditandoCiclo(false)} />
      )}
    </div>
  )
}