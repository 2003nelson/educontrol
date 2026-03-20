'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

// ─── Types ────────────────────────────────────────────────────────────────────
type Semestre = {
  id: string
  numero: 1 | 2 | 3 | 4 | 5 | 6
  nombre: string
  inicio: string   // 'YYYY-MM-DD'
  fin: string      // 'YYYY-MM-DD'
  activo: boolean
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS_SEMANA = ['L','M','X','J','V','S','D']

const semestresIniciales: Semestre[] = [
  { id: '1', numero: 1, nombre: '1° Semestre', inicio: '2025-08-11', fin: '2025-12-19', activo: false },
  { id: '2', numero: 2, nombre: '2° Semestre', inicio: '2026-02-02', fin: '2026-07-10', activo: true  },
  { id: '3', numero: 3, nombre: '3° Semestre', inicio: '2026-08-10', fin: '2026-12-18', activo: false },
  { id: '4', numero: 4, nombre: '4° Semestre', inicio: '2027-02-01', fin: '2027-07-09', activo: false },
  { id: '5', numero: 5, nombre: '5° Semestre', inicio: '2027-08-09', fin: '2027-12-17', activo: false },
  { id: '6', numero: 6, nombre: '6° Semestre', inicio: '2028-02-07', fin: '2028-07-14', activo: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES[parseInt(m) - 1]} ${y}`
}

function diasEntreFechas(inicio: string, fin: string) {
  if (!inicio || !fin) return 0
  const d1 = new Date(inicio), d2 = new Date(fin)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({
  valor,
  onChange,
  rangeStart,
  rangeEnd,
}: {
  valor: string
  onChange: (d: string) => void
  rangeStart?: string
  rangeEnd?: string
}) {
  const hoy = new Date()
  const inicial = valor ? new Date(valor + 'T12:00:00') : hoy
  const [vista, setVista] = useState({ year: inicial.getFullYear(), month: inicial.getMonth() })

  const primerDia = new Date(vista.year, vista.month, 1)
  const diasMes   = new Date(vista.year, vista.month + 1, 0).getDate()
  // lunes = 0 … domingo = 6
  const offset    = (primerDia.getDay() + 6) % 7

  function prevMes() {
    setVista(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }
  function nextMes() {
    setVista(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  function toIso(day: number) {
    const m = String(vista.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${vista.year}-${m}-${d}`
  }

  function enRango(day: number) {
    if (!rangeStart || !rangeEnd) return false
    const iso = toIso(day)
    return iso >= rangeStart && iso <= rangeEnd
  }

  return (
    <div style={{ width: '260px', userSelect: 'none' }}>
      {/* Header mes/año */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button onClick={prevMes}
          style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: '0.875rem', color: '#475569' }}>
          ‹
        </button>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>
          {MESES[vista.month]} {vista.year}
        </p>
        <button onClick={nextMes}
          style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: '0.875rem', color: '#475569' }}>
          ›
        </button>
      </div>

      {/* Cabecera días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: diasMes }, (_, i) => i + 1).map(day => {
          const iso        = toIso(day)
          const seleccion  = valor === iso
          const enR        = enRango(day)
          const esHoy      = iso === hoy.toISOString().split('T')[0]
          return (
            <button
              key={day}
              onClick={() => onChange(iso)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: seleccion ? 700 : 400,
                background:  seleccion ? '#1e3a5f' : enR ? '#dbeafe' : 'transparent',
                color:       seleccion ? 'white' : enR ? '#1d4ed8' : esHoy ? '#3b82f6' : '#334155',
                outline:     esHoy && !seleccion ? '2px solid #3b82f6' : 'none',
                outlineOffset: '-2px',
              }}
              onMouseEnter={e => { if (!seleccion) e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { if (!seleccion) e.currentTarget.style.background = enR ? '#dbeafe' : 'transparent' }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modal editor de semestre ─────────────────────────────────────────────────
function ModalSemestre({
  semestre,
  onGuardar,
  onCerrar,
}: {
  semestre: Semestre
  onGuardar: (id: string, inicio: string, fin: string) => void
  onCerrar: () => void
}) {
  const [inicio, setInicio] = useState(semestre.inicio)
  const [fin, setFin]       = useState(semestre.fin)
  const [paso, setPaso]     = useState<'inicio' | 'fin'>('inicio')

  function guardar() {
    if (!inicio || !fin) return
    onGuardar(semestre.id, inicio, fin)
    onCerrar()
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '600px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>
              {semestre.nombre}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.125rem 0 0' }}>
              Define el inicio y fin del semestre
            </p>
          </div>
          <button onClick={onCerrar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem' }}>

          {/* Selector inicio / fin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '220px', flexShrink: 0 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['inicio', 'fin'] as const).map(p => (
                <button key={p} onClick={() => setPaso(p)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 600,
                    background: paso === p ? '#1e3a5f' : '#f1f5f9',
                    color:      paso === p ? 'white'   : '#64748b',
                  }}>
                  {p === 'inicio' ? 'Fecha inicio' : 'Fecha fin'}
                </button>
              ))}
            </div>

            {/* Resumen fechas */}
            <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid #f1f5f9' }}>
              <div style={{ marginBottom: '0.625rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
                  Inicio
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: inicio ? '#1e3a5f' : '#cbd5e1', margin: 0 }}>
                  {inicio ? formatFecha(inicio) : 'Sin definir'}
                </p>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
                  Fin
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: fin ? '#1e3a5f' : '#cbd5e1', margin: 0 }}>
                  {fin ? formatFecha(fin) : 'Sin definir'}
                </p>
              </div>
              {inicio && fin && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem', marginTop: '0.625rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    <span style={{ fontWeight: 600 }}>{diasEntreFechas(inicio, fin)}</span> días de semestre
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Calendario */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MiniCalendar
              valor={paso === 'inicio' ? inicio : fin}
              onChange={d => {
                if (paso === 'inicio') { setInicio(d); setPaso('fin') }
                else setFin(d)
              }}
              rangeStart={inicio}
              rangeEnd={fin}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onCerrar}
            style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={guardar}
            style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.75rem', border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
            Guardar fechas
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CicloPage() {
  const [semestres, setSemestres] = useState<Semestre[]>(semestresIniciales)
  const [editando, setEditando]   = useState<Semestre | null>(null)

  function guardarFechas(id: string, inicio: string, fin: string) {
    setSemestres(prev => prev.map(s => s.id === id ? { ...s, inicio, fin } : s))
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Ciclo Escolar" />

      <div className="p-6 space-y-4">

        <div>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Define las fechas de inicio y fin de cada semestre del ciclo escolar.
          </p>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
            El semestre activo se marca en azul. Haz clic en cualquier semestre para editar sus fechas.
          </p>
        </div>

        {/* Grid de semestres */}
        <div className="grid grid-cols-3 gap-4">
          {semestres.map(s => {
            const dias = diasEntreFechas(s.inicio, s.fin)
            return (
              <button
                key={s.id}
                onClick={() => setEditando(s)}
                className="bg-white rounded-2xl p-5 text-left transition-all hover:shadow-md"
                style={{
                  border:     s.activo ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: s.activo ? '#fafcff' : 'white',
                }}
                onMouseEnter={e => { if (!s.activo) e.currentTarget.style.borderColor = '#3b82f6' }}
                onMouseLeave={e => { if (!s.activo) e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                {/* Número y badge activo */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{
                      background: s.activo ? '#1e3a5f' : '#f1f5f9',
                      color:      s.activo ? 'white'   : '#64748b',
                      fontFamily: 'Outfit, sans-serif',
                    }}>
                    {s.numero}
                  </div>
                  {s.activo && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                      Activo
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold mb-3" style={{ color: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}>
                  {s.nombre}
                </h3>

                {/* Fechas */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Inicio</span>
                    <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                      {formatFecha(s.inicio)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Fin</span>
                    <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                      {formatFecha(s.fin)}
                    </span>
                  </div>
                </div>

                {/* Barra de duración */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Duración</span>
                    <span className="text-xs font-semibold" style={{ color: '#475569' }}>{dias} días</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width:      `${Math.min(100, (dias / 180) * 100)}%`,
                        background: s.activo ? '#3b82f6' : '#cbd5e1',
                      }} />
                  </div>
                </div>

                {/* Hint editar */}
                <p className="text-xs mt-3 text-center" style={{ color: '#3b82f6' }}>
                  Clic para editar fechas
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {editando && (
        <ModalSemestre
          semestre={editando}
          onGuardar={guardarFechas}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  )
}