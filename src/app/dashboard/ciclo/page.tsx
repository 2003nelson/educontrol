'use client'
import { useState } from 'react'
import Header from '@/components/Header'

const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS_SEMANA = ['L','M','X','J','V','S','D']

type CampoActivo = 'inicio' | 'vacaciones_inicio' | 'vacaciones_fin' | 'cierre' | null

type Semestre = {
  id: string
  numero: number
  nombre: string
  habilitado: boolean
  completado: boolean
}

const semestresIniciales: Semestre[] = [
  { id: '1', numero: 1, nombre: '1° Semestre', habilitado: false, completado: true  },
  { id: '2', numero: 2, nombre: '2° Semestre', habilitado: true,  completado: false },
  { id: '3', numero: 3, nombre: '3° Semestre', habilitado: false, completado: false },
  { id: '4', numero: 4, nombre: '4° Semestre', habilitado: false, completado: false },
  { id: '5', numero: 5, nombre: '5° Semestre', habilitado: false, completado: false },
  { id: '6', numero: 6, nombre: '6° Semestre', habilitado: false, completado: false },
]

function formatFecha(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES_CORTO[parseInt(m) - 1]} ${y}`
}

function diasEntre(a: string, b: string) {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

// ─── Calendario inline ────────────────────────────────────────────────────────
function Calendario({
  campoActivo,
  inicio,
  vacIni,
  vacFin,
  cierre,
  onChange,
}: {
  campoActivo: CampoActivo
  inicio: string
  vacIni: string
  vacFin: string
  cierre: string
  onChange: (iso: string) => void
}) {
  const hoy = new Date()
  const ref  = campoActivo === 'inicio'             ? inicio
             : campoActivo === 'vacaciones_inicio'  ? vacIni
             : campoActivo === 'vacaciones_fin'     ? vacFin
             : campoActivo === 'cierre'             ? cierre
             : ''
  const refDate = ref ? new Date(ref + 'T12:00:00') : hoy
  const [vista, setVista] = useState({ year: refDate.getFullYear(), month: refDate.getMonth() })

  const primerDia = new Date(vista.year, vista.month, 1)
  const diasMes   = new Date(vista.year, vista.month + 1, 0).getDate()
  const offset    = (primerDia.getDay() + 6) % 7

  function prevMes() {
    setVista(v => ({
      month: v.month === 0 ? 11 : v.month - 1,
      year:  v.month === 0 ? v.year - 1 : v.year,
    }))
  }
  function nextMes() {
    setVista(v => ({
      month: v.month === 11 ? 0 : v.month + 1,
      year:  v.month === 11 ? v.year + 1 : v.year,
    }))
  }
  function toIso(day: number) {
    return `${vista.year}-${String(vista.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function estadoDia(iso: string) {
    if (iso === inicio)  return 'inicio'
    if (iso === cierre)  return 'cierre'
    if (vacIni && vacFin && iso >= vacIni && iso <= vacFin) return 'vacaciones'
    if (inicio && cierre && iso > inicio && iso < cierre && !(vacIni && vacFin && iso >= vacIni && iso <= vacFin)) return 'activo'
    return 'normal'
  }

  const coloresDia: Record<string, { bg: string; color: string; outline?: string }> = {
    inicio:     { bg: '#1e3a5f', color: 'white' },
    cierre:     { bg: '#dc2626', color: 'white' },
    vacaciones: { bg: '#fef9c3', color: '#854d0e' },
    activo:     { bg: '#dbeafe', color: '#1d4ed8' },
    normal:     { bg: 'transparent', color: '#334155' },
  }

  const labelCampo = campoActivo === 'inicio'            ? 'Selecciona fecha de inicio'
                   : campoActivo === 'vacaciones_inicio' ? 'Selecciona inicio de vacaciones'
                   : campoActivo === 'vacaciones_fin'    ? 'Selecciona fin de vacaciones'
                   : campoActivo === 'cierre'            ? 'Selecciona fecha de cierre'
                   : 'Selecciona un campo para editar'

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>

      {/* Indicador campo activo */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="w-2 h-2 rounded-full"
          style={{ background: campoActivo ? '#3b82f6' : '#cbd5e1' }} />
        <p className="text-xs font-medium" style={{ color: campoActivo ? '#1e3a5f' : '#94a3b8' }}>
          {labelCampo}
        </p>
      </div>

      {/* Nav mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMes}
          className="w-8 h-8 rounded-full flex items-center justify-center transition"
          style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#475569', fontSize: '1rem' }}>
          ‹
        </button>
        <p className="text-sm font-bold" style={{ color: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}>
          {MESES[vista.month]} {vista.year}
        </p>
        <button onClick={nextMes}
          className="w-8 h-8 rounded-full flex items-center justify-center transition"
          style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#475569', fontSize: '1rem' }}>
          ›
        </button>
      </div>

      {/* Días semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: diasMes }, (_, i) => i + 1).map(day => {
          const iso    = toIso(day)
          const estado = estadoDia(iso)
          const esHoy  = iso === hoy.toISOString().split('T')[0]
          const col    = coloresDia[estado]
          const seleccionado = iso === ref

          return (
            <button key={day} onClick={() => campoActivo && onChange(iso)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                border: seleccionado ? '2px solid #3b82f6' : esHoy ? '1.5px solid #93c5fd' : 'none',
                cursor: campoActivo ? 'pointer' : 'default',
                fontSize: '0.75rem', fontWeight: estado !== 'normal' ? 700 : 400,
                background: col.bg, color: col.color,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (campoActivo && estado === 'normal') e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { if (estado === 'normal') e.currentTarget.style.background = 'transparent' }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
        {[
          { color: '#1e3a5f', label: 'Inicio' },
          { color: '#dbeafe', label: 'Días activos', text: '#1d4ed8' },
          { color: '#fef9c3', label: 'Vacaciones', text: '#854d0e' },
          { color: '#dc2626', label: 'Cierre' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CicloPage() {
  const [inicio,  setInicio]  = useState('2026-02-02')
  const [vacIni,  setVacIni]  = useState('2026-04-06')
  const [vacFin,  setVacFin]  = useState('2026-04-10')
  const [cierre,  setCierre]  = useState('2026-07-10')
  const [campo,   setCampo]   = useState<CampoActivo>(null)
  const [guardado, setGuardado] = useState(false)
  const [semestres, setSemestres] = useState<Semestre[]>(semestresIniciales)

  function handleCalendario(iso: string) {
    if (campo === 'inicio')            { setInicio(iso);  setCampo('vacaciones_inicio') }
    else if (campo === 'vacaciones_inicio') { setVacIni(iso); setCampo('vacaciones_fin') }
    else if (campo === 'vacaciones_fin')    { setVacFin(iso); setCampo('cierre') }
    else if (campo === 'cierre')       { setCierre(iso);  setCampo(null) }
  }

  function toggleSemestre(id: string) {
    setSemestres(prev => prev.map(s =>
      s.id === id ? { ...s, habilitado: !s.habilitado } : s
    ))
  }

  function guardar() {
    setGuardado(true)
    setCampo(null)
    setTimeout(() => setGuardado(false), 2500)
  }

  const diasClase = diasEntre(inicio, cierre) - diasEntre(vacIni, vacFin) - 1
  const diasVac   = diasEntre(vacIni, vacFin) + 1

  const campos: { key: CampoActivo; label: string; valor: string; color: string }[] = [
    { key: 'inicio',            label: 'Fecha de inicio',           valor: inicio, color: '#1e3a5f' },
    { key: 'vacaciones_inicio', label: 'Inicio de vacaciones',      valor: vacIni, color: '#d97706' },
    { key: 'vacaciones_fin',    label: 'Fin de vacaciones',         valor: vacFin, color: '#d97706' },
    { key: 'cierre',            label: 'Fecha de cierre',           valor: cierre, color: '#dc2626' },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Ciclo Escolar" />

      <div className="p-6 space-y-5">

        {/* Título sección */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
              Configuración del período escolar
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Selecciona un campo y elige la fecha en el almanaque
            </p>
          </div>
          <button
            onClick={guardar}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition"
            style={{ background: guardado ? '#16a34a' : '#1e3a5f' }}
            onMouseEnter={e => { if (!guardado) e.currentTarget.style.background = '#2563eb' }}
            onMouseLeave={e => { if (!guardado) e.currentTarget.style.background = '#1e3a5f' }}
          >
            {guardado ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>

          {/* Columna izquierda */}
          <div className="space-y-4">

            {/* Campos de fecha */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
                Fechas del semestre
              </p>
              <div className="grid grid-cols-2 gap-3">
                {campos.map(c => {
                  const activo = campo === c.key
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCampo(activo ? null : c.key)}
                      className="rounded-xl p-4 text-left transition-all"
                      style={{
                        border:     activo ? `2px solid ${c.color}` : '1px solid #e2e8f0',
                        background: activo ? '#f8faff' : 'white',
                      }}
                      onMouseEnter={e => { if (!activo) e.currentTarget.style.borderColor = '#3b82f6' }}
                      onMouseLeave={e => { if (!activo) e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <p className="text-xs font-medium" style={{ color: '#64748b' }}>{c.label}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: c.valor ? '#1e3a5f' : '#cbd5e1' }}>
                        {c.valor ? formatFecha(c.valor) : 'Sin definir'}
                      </p>
                      {activo && (
                        <p className="text-xs mt-1" style={{ color: c.color }}>
                          Selecciona en el almanaque →
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
                Resumen del período
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl p-3 text-center" style={{ background: '#eff6ff' }}>
                  <p className="text-2xl font-bold" style={{ color: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}>
                    {diasEntre(inicio, cierre)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Días totales</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: '#f0fdf4' }}>
                  <p className="text-2xl font-bold" style={{ color: '#16a34a', fontFamily: 'Outfit, sans-serif' }}>
                    {Math.max(0, diasClase)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Días de clase</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: '#fffbeb' }}>
                  <p className="text-2xl font-bold" style={{ color: '#d97706', fontFamily: 'Outfit, sans-serif' }}>
                    {Math.max(0, diasVac)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Días de vacaciones</p>
                </div>
              </div>
            </div>

            {/* Habilitación de semestres */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                    Acceso por semestre
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#cbd5e1' }}>
                    Habilita el acceso de docentes y alumnos por semestre
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {semestres.map(s => (
                  <div
                    key={s.id}
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{
                      border:     s.habilitado ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      background: s.completado ? '#f8fafc' : s.habilitado ? '#f0fdf4' : 'white',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{
                          background: s.completado ? '#e2e8f0' : s.habilitado ? '#1e3a5f' : '#f1f5f9',
                          color:      s.completado ? '#94a3b8'  : s.habilitado ? 'white'    : '#64748b',
                          fontFamily: 'Outfit, sans-serif',
                        }}>
                        {s.numero}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>{s.nombre}</p>
                        <p className="text-xs" style={{ color: s.completado ? '#94a3b8' : s.habilitado ? '#16a34a' : '#94a3b8' }}>
                          {s.completado ? 'Completado' : s.habilitado ? 'Activo' : 'Cerrado'}
                        </p>
                      </div>
                    </div>

                    {/* Toggle */}
                    {!s.completado && (
                      <button
                        onClick={() => toggleSemestre(s.id)}
                        className="relative inline-flex items-center rounded-full transition-all duration-300 shrink-0"
                        style={{
                          width:      '36px',
                          height:     '20px',
                          background: s.habilitado ? '#16a34a' : '#d1d5db',
                          border:     'none',
                          cursor:     'pointer',
                        }}
                      >
                        <span
                          className="inline-block rounded-full bg-white shadow-sm transition-all duration-300"
                          style={{
                            width:     '14px',
                            height:    '14px',
                            transform: s.habilitado ? 'translateX(18px)' : 'translateX(3px)',
                          }}
                        />
                      </button>
                    )}

                    {s.completado && (
                      <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha — Almanaque */}
          <div className="sticky top-4">
            <Calendario
              campoActivo={campo}
              inicio={inicio}
              vacIni={vacIni}
              vacFin={vacFin}
              cierre={cierre}
              onChange={handleCalendario}
            />

            {/* Flujo guía */}
            {campo && (
              <div className="bg-white rounded-2xl p-4 mt-3 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Flujo de configuración</p>
                <div className="space-y-1.5">
                  {campos.map((c, i) => (
                    <div key={c.key} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: campo === c.key ? c.color : c.valor ? '#f0fdf4' : '#f1f5f9',
                          color:      campo === c.key ? 'white'  : c.valor ? '#16a34a'  : '#94a3b8',
                        }}>
                        {c.valor && campo !== c.key ? '✓' : i + 1}
                      </div>
                      <p className="text-xs" style={{ color: campo === c.key ? '#1e3a5f' : '#94a3b8', fontWeight: campo === c.key ? 600 : 400 }}>
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}