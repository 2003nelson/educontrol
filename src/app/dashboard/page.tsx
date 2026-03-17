'use client'
import { useState, useRef, useEffect } from 'react'
import Header from '@/components/Header'

// ─── Types ────────────────────────────────────────────────────────────────────
type TipoFiltro   = 'semana' | 'mes' | 'grupo' | null
type TipoInforme  = 'escuela' | 'grupo' | 'bimestre'

const SEMANAS = Array.from({ length: 16 }, (_, i) => ({ key: `semana-${i+1}`, label: `Semana ${i + 1}` }))
const MESES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  .map((m, i) => ({ key: `mes-${i+1}`, label: m }))
const GRUPOS  = [
  '101','102','103','201','202','203',
  '301','302','303','401','402','403',
  '501','502','503','601','602','603',
].map(g => ({ key: g, label: `Grupo ${g}` }))

const OPCION_GENERAL = { key: 'general', label: 'General — Toda la institución' }

const stats = [
  { label: 'POBLACIÓN',       value: '840',  suffix: 'alumnos', color: 'text-gray-800'  },
  { label: 'PROMEDIO GRAL',   value: '8.7',  suffix: '',        color: 'text-blue-600'  },
  { label: 'ASISTENCIA MEDIA',value: '89.7', suffix: '%',       color: 'text-green-500' },
]

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({
  opciones, seleccionado, onSeleccionar, onCerrar,
}: {
  opciones: { key: string; label: string }[]
  seleccionado: string
  onSeleccionar: (key: string) => void
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCerrar()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onCerrar])

  return (
    <div ref={ref}
      className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
      style={{ border: '1px solid #e2e8f0', minWidth: '220px', maxHeight: '280px', overflowY: 'auto' }}>
      {[OPCION_GENERAL, ...opciones].map(op => {
        const activo = seleccionado === op.key
        return (
          <button key={op.key}
            onClick={() => { onSeleccionar(op.key); onCerrar() }}
            className="w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2"
            style={{
              background:   activo ? '#eff6ff' : 'white',
              color:        activo ? '#2563eb' : '#475569',
              fontWeight:   activo ? 600 : 400,
              borderBottom: '1px solid #f8fafc',
            }}
            onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'white' }}
          >
            {activo && (
              <svg width="12" height="12" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className={activo ? '' : 'ml-5'}>{op.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Modal Descargar Informe ──────────────────────────────────────────────────
function ModalInforme({ onCerrar }: { onCerrar: () => void }) {
  const [tipo, setTipo]           = useState<TipoInforme>('escuela')
  const [grupoInf, setGrupoInf]   = useState('')
  const [semestreInf, setSemestreInf] = useState('')
  const [bimestreInf, setBimestreInf] = useState('')
  const [contenido, setContenido] = useState({ calificaciones: true, asistencia: true })

  const opciones: { key: TipoInforme; titulo: string; desc: string; icono: string }[] = [
    { key: 'escuela',  titulo: 'Escuela completa', desc: 'Reporte general de toda la institución', icono: '🏫' },
    { key: 'grupo',    titulo: 'Por grupo',         desc: 'Reporte de un grupo específico',         icono: '👥' },
    { key: 'bimestre', titulo: 'Por bimestre',      desc: 'Reporte de un bimestre en particular',   icono: '📅' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b" style={{ borderColor: '#f1f5f9' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>Descargar Informe</h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Selecciona el tipo y alcance del informe</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Tipo de informe */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Tipo de informe</p>
            <div className="grid grid-cols-3 gap-3">
              {opciones.map(op => (
                <button
                  key={op.key}
                  onClick={() => setTipo(op.key)}
                  className="rounded-xl p-4 text-left transition-all"
                  style={{
                    border:     tipo === op.key ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: tipo === op.key ? '#eff6ff' : 'white',
                  }}
                >
                  <span className="text-2xl mb-2 block">{op.icono}</span>
                  <p className="text-sm font-semibold" style={{ color: tipo === op.key ? '#2563eb' : '#1e3a5f' }}>
                    {op.titulo}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{op.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Campos según tipo */}
          {tipo === 'grupo' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#475569' }}>Grupo</label>
                <select
                  value={grupoInf}
                  onChange={e => setGrupoInf(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">Selecciona un grupo</option>
                  {GRUPOS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#475569' }}>Semestre</label>
                <select
                  value={semestreInf}
                  onChange={e => setSemestreInf(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">Todos los semestres</option>
                  {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}° Semestre</option>)}
                </select>
              </div>
            </div>
          )}

          {tipo === 'bimestre' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#475569' }}>Bimestre</label>
                <select
                  value={bimestreInf}
                  onChange={e => setBimestreInf(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">Selecciona bimestre</option>
                  <option value="1">Bimestre 1</option>
                  <option value="2">Bimestre 2</option>
                  <option value="3">Bimestre 3</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#475569' }}>Grupo</label>
                <select
                  value={grupoInf}
                  onChange={e => setGrupoInf(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">Todos los grupos</option>
                  {GRUPOS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#475569' }}>Semestre</label>
                <select
                  value={semestreInf}
                  onChange={e => setSemestreInf(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">Todos</option>
                  {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}° Semestre</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Contenido del informe */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Contenido del informe</p>
            <div className="flex gap-4">
              {[
                { key: 'calificaciones', label: 'Calificaciones', desc: 'Promedio por bimestre y final' },
                { key: 'asistencia',     label: 'Asistencia',     desc: 'Porcentaje y faltas por alumno' },
              ].map(op => {
                const activo = contenido[op.key as keyof typeof contenido]
                return (
                  <button
                    key={op.key}
                    onClick={() => setContenido(prev => ({ ...prev, [op.key]: !prev[op.key as keyof typeof prev] }))}
                    className="flex items-center gap-3 flex-1 rounded-xl p-4 text-left transition-all"
                    style={{
                      border:     activo ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: activo ? '#eff6ff' : 'white',
                    }}
                  >
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition"
                      style={{ background: activo ? '#2563eb' : '#e2e8f0' }}>
                      {activo && (
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: activo ? '#2563eb' : '#1e3a5f' }}>
                        {op.label}
                      </p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{op.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
              Resumen del informe
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              <span className="font-semibold" style={{ color: '#1e3a5f' }}>Tipo: </span>
              {tipo === 'escuela' ? 'Escuela completa' : tipo === 'grupo' ? `Grupo${grupoInf ? ` ${grupoInf}` : ' (todos)'}` : `Bimestre${bimestreInf ? ` ${bimestreInf}` : ' (todos)'}`}
            </p>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              <span className="font-semibold" style={{ color: '#1e3a5f' }}>Incluye: </span>
              {[contenido.calificaciones && 'Calificaciones', contenido.asistencia && 'Asistencia'].filter(Boolean).join(' + ') || 'Nada seleccionado'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border transition"
              style={{ borderColor: '#e2e8f0', color: '#64748b' }}
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center gap-2"
              style={{ background: '#1e3a5f' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
            >
              ↓ Descargar PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [vistaGrafica, setVistaGrafica]   = useState<'calificaciones' | 'asistencias'>('calificaciones')
  const [filtroAbierto, setFiltroAbierto] = useState<TipoFiltro>(null)
  const [semanaSelec, setSemanaSelec]     = useState('general')
  const [mesSelec, setMesSelec]           = useState('general')
  const [grupoSelec, setGrupoSelec]       = useState('general')
  const [modalInforme, setModalInforme]   = useState(false)

  function labelSeleccion(tipo: TipoFiltro) {
    if (tipo === 'semana') return semanaSelec === 'general' ? 'Semana' : SEMANAS.find(s => s.key === semanaSelec)?.label ?? 'Semana'
    if (tipo === 'mes')    return mesSelec    === 'general' ? 'Mes'    : MESES.find(m => m.key === mesSelec)?.label ?? 'Mes'
    if (tipo === 'grupo')  return grupoSelec  === 'general' ? 'Grupo'  : `Grupo ${grupoSelec}`
    return ''
  }

  function filtroActivo(tipo: TipoFiltro) {
    if (tipo === 'semana') return semanaSelec !== 'general'
    if (tipo === 'mes')    return mesSelec    !== 'general'
    if (tipo === 'grupo')  return grupoSelec  !== 'general'
    return false
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Centro Estadístico" />

      <div className="flex gap-4 p-4 flex-1">

        {/* ── Panel principal ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Promedio General</h2>
              <p className="text-sm text-gray-400 mt-1">
                {grupoSelec === 'general' ? 'Institución Completa' : `Grupo ${grupoSelec}`}
                {mesSelec    !== 'general' && ` — ${MESES.find(m => m.key === mesSelec)?.label}`}
                {semanaSelec !== 'general' && ` — ${SEMANAS.find(s => s.key === semanaSelec)?.label}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVistaGrafica('asistencias')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                style={{
                  background: vistaGrafica === 'asistencias' ? '#eff6ff' : 'white',
                  color:      vistaGrafica === 'asistencias' ? '#2563eb' : '#6b7280',
                  border:     '1px solid #e2e8f0',
                }}
              >
                Asistencias
              </button>
              <button
                onClick={() => setVistaGrafica('calificaciones')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                style={{
                  background: vistaGrafica === 'calificaciones' ? '#eff6ff' : 'white',
                  color:      vistaGrafica === 'calificaciones' ? '#2563eb' : '#6b7280',
                  border:     '1px solid #e2e8f0',
                }}
              >
                Calificaciones
              </button>
              <button
                onClick={() => setModalInforme(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition"
                style={{ background: '#1e3a5f' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
              >
                ↓ Descargar Informe
              </button>
            </div>
          </div>

          {/* Gráfica SVG */}
          <div className="relative h-52 mb-6">
            <svg viewBox="0 0 600 180" className="w-full h-full">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0,1,2,3,4].map(i => (
                <line key={i} x1="40" y1={20 + i * 32} x2="580" y2={20 + i * 32}
                  stroke="#F3F4F6" strokeWidth="1" />
              ))}
              <path d="M80,140 L160,120 L240,100 L320,60 L400,55 L480,70 L560,80 L560,160 L80,160 Z"
                fill="url(#grad)" />
              <polyline points="80,140 160,120 240,100 320,60 400,55 480,70 560,80"
                fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {([[80,140],[160,120],[240,100],[320,60],[400,55],[480,70],[560,80]] as [number,number][]).map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
              ))}
              {['Ene','Feb','Mar','Abr','May','Jun','Jul'].map((m, i) => (
                <text key={m} x={80 + i * 80} y="175" textAnchor="middle" fill="#9CA3AF" fontSize="11">{m}</text>
              ))}
            </svg>
          </div>

          {/* Métricas + filtros */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Promedio Actual</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">8.7</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setFiltroAbierto(filtroAbierto === 'semana' ? null : 'semana')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition"
                  style={{
                    border:     '1px solid #e2e8f0',
                    background: filtroActivo('semana') ? '#eff6ff' : 'white',
                    color:      filtroActivo('semana') ? '#2563eb' : '#4b5563',
                  }}
                >
                  ▼ {labelSeleccion('semana')}
                </button>
                {filtroAbierto === 'semana' && (
                  <FilterDropdown opciones={SEMANAS} seleccionado={semanaSelec}
                    onSeleccionar={setSemanaSelec} onCerrar={() => setFiltroAbierto(null)} />
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setFiltroAbierto(filtroAbierto === 'mes' ? null : 'mes')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition"
                  style={{
                    border:     '1px solid #e2e8f0',
                    background: filtroActivo('mes') ? '#eff6ff' : 'white',
                    color:      filtroActivo('mes') ? '#2563eb' : '#4b5563',
                  }}
                >
                  ▼ {labelSeleccion('mes')}
                </button>
                {filtroAbierto === 'mes' && (
                  <FilterDropdown opciones={MESES} seleccionado={mesSelec}
                    onSeleccionar={setMesSelec} onCerrar={() => setFiltroAbierto(null)} />
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setFiltroAbierto(filtroAbierto === 'grupo' ? null : 'grupo')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition text-white"
                  style={{ background: filtroActivo('grupo') ? '#2563eb' : '#1e3a5f' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                  onMouseLeave={e => (e.currentTarget.style.background = filtroActivo('grupo') ? '#2563eb' : '#1e3a5f')}
                >
                  ▼ {labelSeleccion('grupo')}
                </button>
                {filtroAbierto === 'grupo' && (
                  <FilterDropdown opciones={GRUPOS} seleccionado={grupoSelec}
                    onSeleccionar={setGrupoSelec} onCerrar={() => setFiltroAbierto(null)} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="w-72 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-blue-500">ℹ️</span>
            <h3 className="font-semibold text-gray-700">Información Institucional</h3>
          </div>
          <div className="space-y-5">
            {stats.map(s => (
              <div key={s.label} className="border-b border-gray-100 pb-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.suffix}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2">
            <p className="text-xs text-gray-400">
              Sincronizado: <span className="text-green-500 font-medium">Justo ahora</span>
            </p>
          </div>
        </div>

      </div>

      {/* Modal informe */}
      {modalInforme && <ModalInforme onCerrar={() => setModalInforme(false)} />}

    </div>
  )
}