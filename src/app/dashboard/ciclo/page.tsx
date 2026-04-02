'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['L','M','X','J','V','S','D']

type Paso = 0 | 1 | 2 | 3 | 4 | 5  // 0=inicio 1=vac_ini 2=vac_fin 3=cierre 4=festivos 5=resumen
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

// ─── Mini calendario ──────────────────────────────────────────────────────────
function MiniCalendario({
  seleccionado, inicio, vacIni, vacFin, cierre, festivos, onChange, soloEntre,
}: {
  seleccionado: string; inicio: string; vacIni: string; vacFin: string
  cierre: string; festivos: string[]; onChange: (iso: string) => void; soloEntre?: boolean
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
          const fuera  = soloEntre && inicio && cierre && (iso < inicio || iso > cierre)
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
  onCrear: (data: { inicio: string; vacIni: string; vacFin: string; cierre: string; festivos: string[] }) => void
  onCerrar: () => void
}) {
  const [paso, setPaso]         = useState<Paso>(0)
  const [dir, setDir]           = useState<Dir>('adelante')
  const [animating, setAnimating] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  const [inicio,   setInicio]   = useState('')
  const [vacIni,   setVacIni]   = useState('')
  const [vacFin,   setVacFin]   = useState('')
  const [cierre,   setCierre]   = useState('')
  const [festivos, setFestivos] = useState<string[]>([])

  function cerrar() {
    setCerrando(true)
    setTimeout(() => onCerrar(), 380)
  }

  function irPaso(nuevo: Paso, d: Dir) {
    setDir(d)
    setAnimating(true)
    setTimeout(() => { setPaso(nuevo); setAnimating(false) }, 220)
  }

  function toggleFestivo(iso: string) {
    if (!inicio || !cierre || iso < inicio || iso > cierre) return
    setFestivos(prev => prev.includes(iso) ? prev.filter(f => f !== iso) : [...prev, iso])
  }

  const diasTotales = diasEntre(inicio, cierre)
  const diasVac     = vacIni && vacFin ? diasEntre(vacIni, vacFin) : 0
  const diasFest    = festivos.filter(f => inicio && cierre && f >= inicio && f <= cierre).length
  const diasEfect   = Math.max(0, diasTotales - diasVac - diasFest)

  const pasos: { titulo: string; sub: string }[] = [
    { titulo:'¿Cuándo inicia el ciclo?', sub:'Selecciona la fecha de inicio en el calendario' },
    { titulo:'¿Inicio de vacaciones?',   sub:'Selecciona el primer día de vacaciones' },
    { titulo:'¿Fin de vacaciones?',      sub:'Selecciona el último día de vacaciones' },
    { titulo:'¿Cuándo cierra el ciclo?', sub:'Selecciona la fecha de cierre del semestre' },
    { titulo:'Días festivos o inhábiles', sub:'Selecciona los días no laborables dentro del ciclo' },
    { titulo:'Resumen del ciclo',        sub:'Todo listo para activar el período escolar' },
  ]

  const valorActual = [inicio, vacIni, vacFin, cierre, '', ''][paso]
  const calendarioActivo = paso < 5

  function onCalChange(iso: string) {
    if (paso === 0) setInicio(iso)
    else if (paso === 1) setVacIni(iso)
    else if (paso === 2) setVacFin(iso)
    else if (paso === 3) setCierre(iso)
    else if (paso === 4) toggleFestivo(iso)
  }

  const puedeAvanzar = [
    !!inicio, !!vacIni, !!vacFin, !!cierre, true, true
  ][paso]

  const slideIn  = dir === 'adelante' ? 'translateX(20px)' : 'translateX(-20px)'
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
      {/* Backdrop */}
      <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation: cerrando ? 'wizBackOut 0.38s ease forwards' : 'wizBackdrop 0.28s ease' }}/>

      {/* Modal */}
      <div style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{
          background:'white', borderRadius:'1.5rem',
          boxShadow:'0 32px 80px rgba(0,0,0,0.22)',
          width:'820px', maxWidth:'calc(100vw - 2rem)',
          maxHeight:'90vh', display:'flex', flexDirection:'column',
          overflow:'hidden', pointerEvents:'all',
          animation: cerrando ? 'wizSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'wizSpringIn 0.46s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header modal */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              {/* Steps */}
              <div style={{ display:'flex', gap:'0.375rem' }}>
                {[0,1,2,3,4,5].map(n => (
                  <div key={n} style={{ height:'6px', borderRadius:'9999px', background: paso > n ? '#16a34a' : paso === n ? '#2563eb' : '#e2e8f0', width: paso === n ? '24px' : '8px', transition:'all 0.3s ease' }}/>
                ))}
              </div>
              <p style={{ fontSize:'0.75rem', fontWeight:500, color:'#94a3b8', margin:0 }}>
                {paso < 5 ? `Paso ${paso + 1} de 5` : 'Listo para activar'}
              </p>
            </div>
            <button onClick={cerrar}
              style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontWeight:700, fontSize:'0.9rem', transition:'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}>✕</button>
          </div>

          {/* Body */}
          <div style={{ display:'grid', gridTemplateColumns: calendarioActivo ? '1fr 1fr' : '1fr', height:'480px', overflow:'hidden' }}>

            {/* Izquierda — preguntas */}
            <div style={{ padding:'2rem', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight: calendarioActivo ? '1px solid #f1f5f9' : 'none', minHeight:0, overflowY:'auto' }}>
              <div style={{ ...contentStyle, overflowY:'auto', flex:1 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.5rem' }}>
                  {paso < 5 ? `Paso ${paso + 1}` : 'Resumen'}
                </p>
                <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem', fontFamily:'Outfit, sans-serif' }}>
                  {pasos[paso].titulo}
                </h2>
                <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:'0 0 1.5rem' }}>{pasos[paso].sub}</p>

                {/* Fecha seleccionada para pasos 0-3 */}
                {paso < 4 && valorActual && (
                  <div style={{ padding:'1rem', borderRadius:'1rem', background:'#eff6ff', border:'1px solid #bfdbfe', marginBottom:'1.25rem' }}>
                    <p style={{ fontSize:'0.65rem', color:'#64748b', margin:'0 0 0.25rem', fontWeight:600, textTransform:'uppercase' }}>Fecha seleccionada</p>
                    <p style={{ fontSize:'1.25rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{formatFecha(valorActual)}</p>
                  </div>
                )}

                {/* Paso 4 — festivos */}
                {paso === 4 && (
                  <div style={{ marginBottom:'1.25rem' }}>
                    {festivos.length === 0 ? (
                      <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px dashed #e2e8f0', textAlign:'center' }}>
                        <p style={{ fontSize:'0.8125rem', color:'#94a3b8', margin:0 }}>Ningún día marcado aún</p>
                      </div>
                    ) : (
                      <div style={{ maxHeight:'9rem', overflowY:'auto', paddingRight:'0.25rem' }}>
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
                    <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.75rem 0 0' }}>
                      Solo puedes marcar días entre {formatFecha(inicio)} y {formatFecha(cierre)}
                    </p>
                  </div>
                )}

                {/* Paso 5 — Resumen círculos */}
                {paso === 5 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start' }}>
                      <CircleStat value={diasEfect}  label="Días efectivos"  color="#2563eb" bg="#eff6ff" />
                      <CircleStat value={diasVac}    label="Días vacaciones" color="#d97706" bg="#fffbeb" />
                      <CircleStat value={diasFest}   label="Días festivos"   color="#be185d" bg="#fce7f3" />
                      <CircleStat value={formatFecha(cierre)} label="Fin de ciclo" color="#dc2626" bg="#fef2f2" />
                    </div>
                    <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.775rem', color:'#475569' }}>
                        <span style={{ color:'#94a3b8' }}>Inicio:</span>  <span style={{ fontWeight:600, color:'#1e3a5f' }}>{formatFecha(inicio)}</span>
                        <span style={{ color:'#94a3b8' }}>Vacaciones:</span> <span style={{ fontWeight:600, color:'#d97706' }}>{vacIni ? `${formatFecha(vacIni)} → ${formatFecha(vacFin)}` : 'Sin vacaciones'}</span>
                        <span style={{ color:'#94a3b8' }}>Cierre:</span>  <span style={{ fontWeight:600, color:'#dc2626' }}>{formatFecha(cierre)}</span>
                        <span style={{ color:'#94a3b8' }}>Festivos:</span> <span style={{ fontWeight:600, color:'#be185d' }}>{diasFest} día{diasFest !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones navegación */}
              <div style={{ display:'flex', gap:'0.75rem', paddingTop:'1.5rem', flexShrink:0 }}>
                {paso > 0 && (
                  <button onClick={() => irPaso((paso - 1) as Paso, 'atras')}
                    style={{ padding:'0.625rem 1.25rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', background:'white', color:'#64748b', cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    ← Regresar
                  </button>
                )}
                {paso < 4 && (
                  <button onClick={() => { if (puedeAvanzar) irPaso((paso + 1) as Paso, 'adelante') }}
                    disabled={!puedeAvanzar}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background: puedeAvanzar ? '#1e3a5f' : '#e2e8f0', color: puedeAvanzar ? 'white' : '#94a3b8', cursor: puedeAvanzar ? 'pointer' : 'not-allowed', transition:'background 0.2s' }}
                    onMouseEnter={e => { if (puedeAvanzar) e.currentTarget.style.background = '#2563eb' }}
                    onMouseLeave={e => { if (puedeAvanzar) e.currentTarget.style.background = '#1e3a5f' }}>
                    Continuar →
                  </button>
                )}
                {paso === 4 && (
                  <button onClick={() => irPaso(5, 'adelante')}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#1e3a5f', color:'white', cursor:'pointer', transition:'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
                    Ver resumen →
                  </button>
                )}
                {paso === 5 && (
                  <button onClick={() => { onCrear({ inicio, vacIni, vacFin, cierre, festivos }) }}
                    style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#16a34a', color:'white', cursor:'pointer', transition:'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#15803d')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#16a34a')}>
                    ✓ Activar ciclo escolar
                  </button>
                )}
              </div>
            </div>

            {/* Derecha — calendario */}
            {calendarioActivo && (
              <div style={{ padding:'2rem', background:'#fafbfc', display:'flex', flexDirection:'column', overflowY:'auto', maxHeight:'520px' }}>
                <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1.25rem', flexShrink:0 }}>
                  {paso === 0 ? 'Selecciona la fecha de inicio' :
                   paso === 1 ? 'Selecciona inicio de vacaciones' :
                   paso === 2 ? 'Selecciona fin de vacaciones' :
                   paso === 3 ? 'Selecciona la fecha de cierre' :
                   'Selecciona días festivos'}
                </p>
                <div style={{ transform:'scale(1.05)', transformOrigin:'top center', flexShrink:0 }}>
                  <MiniCalendario
                    seleccionado={valorActual}
                    inicio={inicio} vacIni={vacIni} vacFin={vacFin} cierre={cierre} festivos={festivos}
                    onChange={onCalChange}
                    soloEntre={paso === 4}
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
        <p style={{ fontSize:'0.8125rem', color:'#64748b', margin:'0 0 1.5rem', textAlign:'center', lineHeight:1.6 }}>
          Se eliminarán todas las fechas configuradas y tendrás que crear un nuevo ciclo desde cero.
        </p>
        <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>Cancelar</button>
          <button onClick={onAceptar} style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')} onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>Sí, eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

export default function CicloPage() {
  const [wizardAbierto, setWizardAbierto] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [borrando, setBorrando]           = useState(false)
  const [borrado, setBorrado]             = useState(false)
  const [exitoVisible, setExitoVisible]   = useState(false)
  const [exitoSaliendo, setExitoSaliendo] = useState(false)
  const [periodo, setPeriodo] = useState<{ inicio: string; vacIni: string; vacFin: string; cierre: string; festivos: string[] } | null>(null)

  function crearCiclo(data: { inicio: string; vacIni: string; vacFin: string; cierre: string; festivos: string[] }) {
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
                <EliminarCicloBtn borrando={borrando} onClick={() => !borrando && setModalEliminar(true)} />
              )}
            </div>

            {/* Card resumen con círculos */}
            <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1.75rem' }}>Resumen del período</p>
              <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start' }}>
                <CircleStat value={diasEfect}             label="Días efectivos"  color="#2563eb" bg="#eff6ff" />
                <CircleStat value={diasVac}               label="Días vacaciones" color="#d97706" bg="#fffbeb" />
                <CircleStat value={diasFest}              label="Días festivos"   color="#be185d" bg="#fce7f3" />
                <CircleStat value={formatFecha(periodo.cierre)} label="Fin de ciclo"   color="#dc2626" bg="#fef2f2" />
              </div>
            </div>

            {/* Calendario de vista */}
            <div style={{ background:'white', borderRadius:'1.25rem', padding:'1.5rem', border:'1px solid #e2e8f0', maxWidth:'340px' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 1rem' }}>Vista del calendario</p>
              <MiniCalendario
                seleccionado={periodo.inicio}
                inicio={periodo.inicio} vacIni={periodo.vacIni}
                vacFin={periodo.vacFin} cierre={periodo.cierre}
                festivos={periodo.festivos}
                onChange={() => {}}
              />
            </div>
          </div>
        )}
      </div>

      {wizardAbierto && <WizardModal onCrear={crearCiclo} onCerrar={() => setWizardAbierto(false)} />}
      {modalEliminar && <ModalEliminar onAceptar={eliminarCiclo} onCancelar={() => setModalEliminar(false)} />}
    </div>
  )
}