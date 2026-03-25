'use client'
import { useState } from 'react'
import Header from '@/components/Header'

// ─── Types ────────────────────────────────────────────────────────────────────
type EstadoAsistencia = 'P' | 'A' | 'J' | null

type Alumno = {
  id: string
  nombre: string
  estado: EstadoAsistencia
}

type Aula = {
  id: string
  grupo: string
  semestre: number
  materia: string
  horario: string
  alumnos: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const aulasMock: Aula[] = [
  { id: '1', grupo: '101', semestre: 1, materia: 'Matemáticas',  horario: '7:00 – 8:00',   alumnos: 32 },
  { id: '2', grupo: '301', semestre: 3, materia: 'Matemáticas',  horario: '8:00 – 9:00',   alumnos: 29 },
  { id: '3', grupo: '102', semestre: 1, materia: 'Cálculo',      horario: '10:00 – 11:00', alumnos: 31 },
]

const alumnosMock: Alumno[] = [
  { id: '1',  nombre: 'Acosta Ramírez, Luis',        estado: null },
  { id: '2',  nombre: 'Alvarado Torres, Sofía',      estado: null },
  { id: '3',  nombre: 'Bautista Cruz, Miguel',       estado: null },
  { id: '4',  nombre: 'Cabrera López, Ana',          estado: null },
  { id: '5',  nombre: 'Domínguez Pérez, Carlos',     estado: null },
  { id: '6',  nombre: 'Estrada Vega, Paola',         estado: null },
  { id: '7',  nombre: 'Flores Hernández, Diego',     estado: null },
  { id: '8',  nombre: 'García Méndez, Valentina',    estado: null },
  { id: '9',  nombre: 'Guzmán Sánchez, Roberto',     estado: null },
  { id: '10', nombre: 'Herrera Jiménez, Fernanda',   estado: null },
  { id: '11', nombre: 'Ibáñez Morales, Andrés',      estado: null },
  { id: '12', nombre: 'Juárez Ríos, Camila',         estado: null },
]

const ESTADO_CONFIG = {
  P: { label: 'Presente',    bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', bgActivo: '#16a34a' },
  A: { label: 'Ausente',     bg: '#fef2f2', color: '#dc2626', border: '#fecaca', bgActivo: '#dc2626' },
  J: { label: 'Justificado', bg: '#fffbeb', color: '#d97706', border: '#fde68a', bgActivo: '#d97706' },
}

function formatFechaHoy() {
  const hoy = new Date()
  return hoy.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── Componente fila alumno ───────────────────────────────────────────────────
function FilaAlumno({
  alumno,
  index,
  onCambiarEstado,
}: {
  alumno: Alumno
  index: number
  onCambiarEstado: (id: string, estado: EstadoAsistencia) => void
}) {
  return (
    <tr
      style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
      className="hover:bg-slate-50"
    >
      {/* # */}
      <td className="px-5 py-3 text-xs" style={{ color: '#94a3b8', width: '48px' }}>
        {index + 1}
      </td>

      {/* Nombre */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: '#1e3a5f' }}
          >
            {alumno.nombre.charAt(0)}
          </div>
          <span className="text-sm font-medium" style={{ color: '#1e3a5f' }}>
            {alumno.nombre}
          </span>
        </div>
      </td>

      {/* Botones P / A / J */}
      <td className="px-5 py-3">
        <div className="flex gap-2">
          {(['P', 'A', 'J'] as EstadoAsistencia[]).map(e => {
            const cfg     = ESTADO_CONFIG[e!]
            const activo  = alumno.estado === e
            return (
              <button
                key={e}
                onClick={() => onCambiarEstado(alumno.id, activo ? null : e)}
                className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: activo ? cfg.bgActivo : cfg.bg,
                  color:      activo ? 'white'      : cfg.color,
                  border:     `1px solid ${activo ? cfg.bgActivo : cfg.border}`,
                  transform:  activo ? 'scale(1.08)' : 'scale(1)',
                  boxShadow:  activo ? `0 3px 10px ${cfg.bgActivo}40` : 'none',
                }}
                onMouseEnter={e => {
                  if (!activo) {
                    e.currentTarget.style.background = cfg.bgActivo
                    e.currentTarget.style.color      = 'white'
                    e.currentTarget.style.transform  = 'scale(1.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (!activo) {
                    e.currentTarget.style.background = cfg.bg
                    e.currentTarget.style.color      = cfg.color
                    e.currentTarget.style.transform  = 'scale(1)'
                  }
                }}
                title={cfg.label}
              >
                {e}
              </button>
            )
          })}
        </div>
      </td>

      {/* Badge estado actual */}
      <td className="px-5 py-3">
        {alumno.estado ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: ESTADO_CONFIG[alumno.estado].bg,
              color:      ESTADO_CONFIG[alumno.estado].color,
              border:     `1px solid ${ESTADO_CONFIG[alumno.estado].border}`,
            }}
          >
            {ESTADO_CONFIG[alumno.estado].label}
          </span>
        ) : (
          <span className="text-xs" style={{ color: '#cbd5e1' }}>Sin registrar</span>
        )}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DocenteAsistenciaPage() {
  const [vista, setVista]           = useState<'aulas' | 'asistencia'>('aulas')
  const [aulaActiva, setAulaActiva] = useState<Aula | null>(null)
  const [alumnos, setAlumnos]       = useState<Alumno[]>(alumnosMock)
  const [guardado, setGuardado]     = useState(false)
  const [busqueda, setBusqueda]     = useState('')

  const alumnosFiltrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const registrados = alumnos.filter(a => a.estado !== null).length
  const presentes   = alumnos.filter(a => a.estado === 'P').length
  const ausentes    = alumnos.filter(a => a.estado === 'A').length
  const justificados = alumnos.filter(a => a.estado === 'J').length
  const total       = alumnos.length
  const progreso    = Math.round((registrados / total) * 100)

  function cambiarEstado(id: string, estado: EstadoAsistencia) {
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, estado } : a))
  }

  function marcarTodos(estado: EstadoAsistencia) {
    setAlumnos(prev => prev.map(a => ({ ...a, estado })))
  }

  function entrarAula(aula: Aula) {
    setAulaActiva(aula)
    setAlumnos(alumnosMock.map(a => ({ ...a, estado: null })))
    setVista('asistencia')
    setGuardado(false)
    setBusqueda('')
  }

  function guardarAsistencia() {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  function volver() {
    setVista('aulas')
    setAulaActiva(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Mi Panel" />

      <div className="p-4 space-y-4">

        {/* ── VISTA 1: Mis aulas ── */}
        {vista === 'aulas' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
                  Mis aulas asignadas
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {formatFechaHoy()}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                {aulasMock.length} aulas activas
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {aulasMock.map(aula => (
                <div
                  key={aula.id}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                  style={{ border: '1px solid #e2e8f0' }}
                >
                  {/* Header aula */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}
                        >
                          {aula.grupo}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#eff6ff', color: '#2563eb' }}>
                          {aula.semestre}° Sem
                        </span>
                      </div>
                    </div>
                    {/* Icono materia */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#f8fafc' }}>
                      <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-base font-bold mb-1" style={{ color: '#1e3a5f' }}>
                    {aula.materia}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
                    Grupo {aula.grupo} · {aula.alumnos} alumnos
                  </p>

                  {/* Horario */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                      {aula.horario}
                    </span>
                  </div>

                  {/* Botón tomar asistencia */}
                  <button
                    onClick={() => entrarAula(aula)}
                    className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition"
                    style={{ background: '#1e3a5f' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
                  >
                    Tomar asistencia
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA 2: Tomar asistencia ── */}
        {vista === 'asistencia' && aulaActiva && (
          <div className="space-y-3">

            {/* Barra superior */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={volver}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}>
                  ← Volver
                </button>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>
                    {aulaActiva.materia} — Grupo {aulaActiva.grupo}
                  </p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    {formatFechaHoy()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Marcar todos */}
                <span className="text-xs font-medium mr-1" style={{ color: '#94a3b8' }}>Marcar todos:</span>
                {(['P', 'A', 'J'] as EstadoAsistencia[]).map(e => {
                  const cfg = ESTADO_CONFIG[e!]
                  return (
                    <button key={e}
                      onClick={() => marcarTodos(e)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      onMouseEnter={e2 => { e2.currentTarget.style.background = cfg.bgActivo; e2.currentTarget.style.color = 'white' }}
                      onMouseLeave={e2 => { e2.currentTarget.style.background = cfg.bg; e2.currentTarget.style.color = cfg.color }}>
                      {e} — {cfg.label}
                    </button>
                  )
                })}

                {/* Guardar */}
                <button
                  onClick={guardarAsistencia}
                  className="text-sm font-semibold text-white px-4 py-1.5 rounded-xl transition ml-1"
                  style={{ background: guardado ? '#16a34a' : '#1e3a5f' }}
                  onMouseEnter={e => { if (!guardado) e.currentTarget.style.background = '#2563eb' }}
                  onMouseLeave={e => { if (!guardado) e.currentTarget.style.background = '#1e3a5f' }}>
                  {guardado ? '✓ Guardado' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Registrados',  value: `${registrados}/${total}`, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Presentes',    value: presentes,                 color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Ausentes',     value: ausentes,                  color: '#dc2626', bg: '#fef2f2' },
                { label: 'Justificados', value: justificados,              color: '#d97706', bg: '#fffbeb' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center"
                  style={{ border: '1px solid #f1f5f9' }}>
                  <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Outfit, sans-serif' }}>
                    {s.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Barra de progreso */}
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium" style={{ color: '#64748b' }}>Progreso de captura</p>
                <p className="text-xs font-bold" style={{ color: '#1e3a5f' }}>{progreso}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${progreso}%`,
                    background: progreso === 100 ? '#16a34a' : '#3b82f6',
                  }}
                />
              </div>
            </div>

            {/* Buscador */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                style={{ border: '1px solid #e2e8f0' }}
              />
            </div>

            {/* Tabla de asistencia */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider w-12"
                      style={{ color: '#94a3b8' }}>#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#94a3b8' }}>Alumno</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#94a3b8' }}>Asistencia</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#94a3b8' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((alumno, i) => (
                    <FilaAlumno
                      key={alumno.id}
                      alumno={alumno}
                      index={i}
                      onCambiarEstado={cambiarEstado}
                    />
                  ))}
                </tbody>
              </table>

              {/* Footer tabla */}
              <div className="px-5 py-3 border-t flex items-center justify-between"
                style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  {alumnosFiltrados.length} alumnos · {registrados} registrados
                </p>
                <div className="flex gap-3">
                  {(['P', 'A', 'J'] as EstadoAsistencia[]).map(e => {
                    const cfg = ESTADO_CONFIG[e!]
                    const cnt = alumnos.filter(a => a.estado === e).length
                    return (
                      <span key={e} className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: cfg.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.bgActivo }} />
                        {cnt} {cfg.label.toLowerCase()}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}