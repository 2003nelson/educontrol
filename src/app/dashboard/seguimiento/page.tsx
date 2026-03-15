'use client'
import { useState } from 'react'
import Header from '@/components/Header'

// ─── Types ────────────────────────────────────────────────────────────────────
type Vista         = 'semestres' | 'grupos' | 'alumnos'
type FiltroPeriodo = 'semana' | 'bimestre' | 'semestre'
type GraficaTipo   = 'asistencia' | 'calificaciones'

type DatoBimestre = {
  numero: 1 | 2 | 3
  promedio: number
  asistencia: number   // porcentaje 0-100
  faltas: number
}

type DatoSemana = {
  semana: number
  asistencia: number   // porcentaje 0-100
  faltas: number
}

type Alumno = {
  id: string
  nombre: string
  bimestres: DatoBimestre[]
  semanas: DatoSemana[]
}

type SliceData = { label: string; value: number; color: string }

// ─── Pie Chart Helper ─────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildSlicePath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 360) end = start + 359.99
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x},${e.y} Z`
}

function DonutChart({ slices }: { slices: SliceData[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const cx = 70, cy = 70, r = 58

  const paths = slices.reduce<{ paths: React.ReactNode[]; acc: number }>(
    ({ paths, acc }, s, i) => {
      const angle = (s.value / total) * 360
      return {
        paths: [...paths, <path key={i} d={buildSlicePath(cx, cy, r, acc, acc + angle)} fill={s.color} />],
        acc: acc + angle,
      }
    },
    { paths: [], acc: 0 }
  ).paths

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {paths}
      <circle cx={cx} cy={cy} r={32} fill="white" />
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const semestresData = [
  { numero: 1, ciclo: 'Ago–Dic', grupos: ['101', '102', '103'] },
  { numero: 2, ciclo: 'Feb–Jul', grupos: ['201', '202', '203'] },
  { numero: 3, ciclo: 'Ago–Dic', grupos: ['301', '302', '303'] },
  { numero: 4, ciclo: 'Feb–Jul', grupos: ['401', '402', '403'] },
  { numero: 5, ciclo: 'Ago–Dic', grupos: ['501', '502', '503'] },
  { numero: 6, ciclo: 'Feb–Jul', grupos: ['601', '602', '603'] },
]

const alumnosMock: Alumno[] = [
  {
    id: '1', nombre: 'García López, Ana',
    bimestres: [
      { numero: 1, promedio: 92, asistencia: 95, faltas: 2 },
      { numero: 2, promedio: 88, asistencia: 90, faltas: 4 },
      { numero: 3, promedio: 94, asistencia: 98, faltas: 1 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: i % 4 === 0 ? 80 : 100, faltas: i % 4 === 0 ? 1 : 0,
    })),
  },
  {
    id: '2', nombre: 'Martínez Ruiz, Carlos',
    bimestres: [
      { numero: 1, promedio: 78, asistencia: 72, faltas: 8 },
      { numero: 2, promedio: 75, asistencia: 70, faltas: 9 },
      { numero: 3, promedio: 80, asistencia: 75, faltas: 7 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: i % 2 === 0 ? 60 : 80, faltas: i % 2 === 0 ? 2 : 1,
    })),
  },
  {
    id: '3', nombre: 'Pérez Torres, Diana',
    bimestres: [
      { numero: 1, promedio: 85, asistencia: 88, faltas: 3 },
      { numero: 2, promedio: 82, asistencia: 85, faltas: 4 },
      { numero: 3, promedio: 87, asistencia: 92, faltas: 3 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: i % 5 === 0 ? 80 : 100, faltas: i % 5 === 0 ? 1 : 0,
    })),
  },
  {
    id: '4', nombre: 'López Sánchez, Eduardo',
    bimestres: [
      { numero: 1, promedio: 96, asistencia: 100, faltas: 0 },
      { numero: 2, promedio: 94, asistencia: 98, faltas: 1 },
      { numero: 3, promedio: 97, asistencia: 100, faltas: 0 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: 100, faltas: 0,
    })),
  },
  {
    id: '5', nombre: 'Hernández Cruz, Fernanda',
    bimestres: [
      { numero: 1, promedio: 71, asistencia: 80, faltas: 6 },
      { numero: 2, promedio: 68, asistencia: 75, faltas: 7 },
      { numero: 3, promedio: 73, asistencia: 82, faltas: 5 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: i % 3 === 0 ? 60 : 80, faltas: i % 3 === 0 ? 2 : 1,
    })),
  },
  {
    id: '6', nombre: 'Ramírez Vega, Gabriel',
    bimestres: [
      { numero: 1, promedio: 60, asistencia: 65, faltas: 10 },
      { numero: 2, promedio: 58, asistencia: 62, faltas: 11 },
      { numero: 3, promedio: 62, asistencia: 68, faltas: 9 },
    ],
    semanas: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1, asistencia: 60, faltas: 2,
    })),
  },
]

// ─── Utility ──────────────────────────────────────────────────────────────────
function avg(nums: number[]) {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function promedioColor(v: number) { return v >= 70 ? '#16a34a' : '#dc2626' }
function asistenciaColor(v: number) { return v >= 80 ? '#16a34a' : '#dc2626' }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeguimientoPage() {
  const [vista, setVista]                         = useState<Vista>('semestres')
  const [semestreActivo, setSemestreActivo]       = useState<number | null>(null)
  const [grupoActivo, setGrupoActivo]             = useState<string | null>(null)
  const [filtroPeriodo, setFiltroPeriodo]         = useState<FiltroPeriodo>('bimestre')
  const [bimestreSelec, setBimestreSelec]         = useState<1 | 2 | 3>(1)
  const [semanaSelec, setSemanaSelec]             = useState<number>(1)
  const [graficaTipo, setGraficaTipo]             = useState<GraficaTipo>('calificaciones')
  const [busqueda, setBusqueda]                   = useState('')

  const semestre = semestresData.find(s => s.numero === semestreActivo)

  function seleccionarSemestre(num: number) { setSemestreActivo(num); setVista('grupos') }
  function seleccionarGrupo(g: string)      { setGrupoActivo(g);      setVista('alumnos') }
  function volver() {
    if (vista === 'alumnos') { setVista('grupos');    setGrupoActivo(null) }
    if (vista === 'grupos')  { setVista('semestres'); setSemestreActivo(null) }
  }
  function cambiarFiltro(f: FiltroPeriodo) {
    setFiltroPeriodo(f)
    setBimestreSelec(1)
    setSemanaSelec(1)
  }

  // Alumnos filtrados por búsqueda
  const alumnosFiltrados = alumnosMock.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ─── Datos para tabla según filtro activo ──────────────────────────────────
  type FilaTabla = {
    alumno: Alumno
    promedio: number
    asistencia: number
    faltas: number
  }

  const filasActuales: FilaTabla[] = alumnosFiltrados.map(a => {
    if (filtroPeriodo === 'bimestre') {
      const b = a.bimestres.find(b => b.numero === bimestreSelec)!
      return { alumno: a, promedio: b.promedio, asistencia: b.asistencia, faltas: b.faltas }
    }
    if (filtroPeriodo === 'semana') {
      const s = a.semanas.find(s => s.semana === semanaSelec)!
      return { alumno: a, promedio: 0, asistencia: s.asistencia, faltas: s.faltas }
    }
    // semestre — promedio general
    const promCal  = avg(a.bimestres.map(b => b.promedio))
    const promAsis = avg(a.bimestres.map(b => b.asistencia))
    const totalFal = a.bimestres.reduce((s, b) => s + b.faltas, 0)
    return { alumno: a, promedio: promCal, asistencia: promAsis, faltas: totalFal }
  })

  // ─── Datos para gráfica ────────────────────────────────────────────────────
  const slicesGrafica: SliceData[] = (() => {
    const valores = filasActuales.map(f =>
      graficaTipo === 'calificaciones' ? f.promedio : f.asistencia
    ).filter(v => filtroPeriodo !== 'semana' || graficaTipo === 'asistencia' ? true : v > 0)

    if (graficaTipo === 'calificaciones') {
      const excelente = valores.filter(v => v >= 90).length
      const regular   = valores.filter(v => v >= 70 && v < 90).length
      const reprobado = valores.filter(v => v < 70).length
      return [
        { label: 'Excelente (90-100)', value: excelente, color: '#16a34a' },
        { label: 'Regular (70-89)',    value: regular,   color: '#3b82f6' },
        { label: 'Reprobado (<70)',    value: reprobado, color: '#dc2626' },
      ]
    } else {
      const buena   = valores.filter(v => v >= 80).length
      const riesgo  = valores.filter(v => v < 80).length
      return [
        { label: 'Buena asistencia (≥80%)', value: buena,  color: '#16a34a' },
        { label: 'En riesgo (<80%)',         value: riesgo, color: '#dc2626' },
      ]
    }
  })()

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Seguimiento Académico" />

      <div className="p-4 space-y-4">

        {/* ── VISTA 1: Semestres ── */}
        {vista === 'semestres' && (
          <>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Selecciona un semestre para ver sus grupos activos
            </p>
            <div className="grid grid-cols-3 gap-4">
              {semestresData.map(s => (
                <button key={s.numero} onClick={() => seleccionarSemestre(s.numero)}
                  className="bg-white rounded-2xl p-6 shadow-sm text-left hover:shadow-md transition-all"
                  style={{ border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl font-bold"
                    style={{ background: '#eff6ff', color: '#2563eb', fontFamily: 'Outfit, sans-serif' }}>
                    {s.numero}
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}>
                    {s.numero}° Semestre
                  </h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{s.ciclo}</p>
                  <p className="text-xs mt-2 font-medium" style={{ color: '#64748b' }}>
                    {s.grupos.length} grupos activos
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA 2: Grupos ── */}
        {vista === 'grupos' && semestre && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#64748b' }}>
                Grupos activos del {semestre.numero}° semestre — {semestre.ciclo}
              </p>
              <button onClick={volver}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ background: '#f1f5f9', color: '#475569' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}>
                ← Volver
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {semestre.grupos.map(grupo => (
                <button key={grupo} onClick={() => seleccionarGrupo(grupo)}
                  className="bg-white rounded-2xl p-6 shadow-sm text-left hover:shadow-md transition-all"
                  style={{ border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-sm font-bold"
                    style={{ background: '#1e3a5f', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                    {grupo}
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: '#1e3a5f' }}>Grupo {grupo}</h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{alumnosMock.length} alumnos</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA 3: Alumnos ── */}
        {vista === 'alumnos' && (
          <div className="space-y-3">

            {/* Fila superior: Volver + título + filtros de periodo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={volver}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}>
                  ← Volver
                </button>
                <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
                  Grupo {grupoActivo} — {semestreActivo}° Semestre
                </p>
              </div>

              {/* Selector de periodo */}
              <div className="flex gap-1.5 bg-white rounded-xl p-1 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                {([
                  { key: 'semana',    label: 'Semana'   },
                  { key: 'bimestre',  label: 'Bimestre' },
                  { key: 'semestre',  label: 'Semestre' },
                ] as { key: FiltroPeriodo; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => cambiarFiltro(key)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                    style={{
                      background: filtroPeriodo === key ? '#1e3a5f' : 'transparent',
                      color:      filtroPeriodo === key ? '#fff'    : '#64748b',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-selector: Bimestre */}
            {filtroPeriodo === 'bimestre' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Bimestre:</span>
                <div className="flex gap-1.5">
                  {([1, 2, 3] as const).map(b => (
                    <button key={b} onClick={() => setBimestreSelec(b)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                      style={{
                        background: bimestreSelec === b ? '#3b82f6' : '#f1f5f9',
                        color:      bimestreSelec === b ? '#fff'    : '#64748b',
                      }}>
                      Bimestre {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-selector: Semana */}
            {filtroPeriodo === 'semana' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Semana:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(s => (
                    <button key={s} onClick={() => setSemanaSelec(s)}
                      className="w-8 h-8 text-xs font-semibold rounded-lg transition"
                      style={{
                        background: semanaSelec === s ? '#3b82f6' : '#f1f5f9',
                        color:      semanaSelec === s ? '#fff'    : '#64748b',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gráfica de pastel + toggle */}
            <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
                  Distribución del grupo
                  {filtroPeriodo === 'bimestre' && ` — Bimestre ${bimestreSelec}`}
                  {filtroPeriodo === 'semana'   && ` — Semana ${semanaSelec}`}
                  {filtroPeriodo === 'semestre' && ' — Semestre completo'}
                </p>
                {/* Toggle asistencia / calificaciones */}
                <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
                  {([
                    { key: 'calificaciones', label: 'Calificaciones' },
                    { key: 'asistencia',     label: 'Asistencia'     },
                  ] as { key: GraficaTipo; label: string }[]).map(({ key, label }) => (
                    <button key={key}
                      onClick={() => setGraficaTipo(key)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                      style={{
                        background: graficaTipo === key ? '#1e3a5f' : 'transparent',
                        color:      graficaTipo === key ? '#fff'    : '#64748b',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-8">
                <DonutChart slices={slicesGrafica} />
                {/* Leyenda */}
                <div className="space-y-2">
                  {slicesGrafica.map(s => {
                    const total = slicesGrafica.reduce((a, b) => a + b.value, 0)
                    const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0
                    return (
                      <div key={s.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-xs" style={{ color: '#475569' }}>{s.label}</span>
                        <span className="text-xs font-bold ml-1" style={{ color: s.color }}>
                          {s.value} ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                  <p className="text-xs mt-2 pt-2" style={{ color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                    Total: {alumnosFiltrados.length} alumnos
                  </p>
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-2xl shadow-sm p-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input type="text" placeholder="Buscar alumno..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
              </div>
            </div>

            {/* ── Tabla Bimestre / Semana ── */}
            {filtroPeriodo !== 'semestre' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {['#', 'Alumno', 'Promedio Cal.', 'Asistencia', 'Faltas', 'Acciones'].map(col => {
                        if (col === 'Promedio Cal.' && filtroPeriodo === 'semana') return null
                        return (
                          <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: '#94a3b8' }}>
                            {col}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filasActuales.map((fila, i) => (
                      <tr key={fila.alumno.id}
                        style={{ borderBottom: '1px solid #f8fafc' }}
                        className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: '#1e3a5f' }}>
                              {fila.alumno.nombre.charAt(0)}
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#1e3a5f' }}>
                              {fila.alumno.nombre}
                            </span>
                          </div>
                        </td>
                        {filtroPeriodo === 'bimestre' && (
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold" style={{ color: promedioColor(fila.promedio) }}>
                              {fila.promedio}
                            </span>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold" style={{ color: asistenciaColor(fila.asistencia) }}>
                            {fila.asistencia}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold" style={{ color: fila.faltas >= 5 ? '#dc2626' : '#475569' }}>
                            {fila.faltas}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                            style={{ background: '#eff6ff', color: '#2563eb' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    {alumnosFiltrados.length} alumnos —{' '}
                    {filtroPeriodo === 'bimestre' ? `Bimestre ${bimestreSelec}` : `Semana ${semanaSelec}`}
                  </p>
                </div>
              </div>
            )}

            {/* ── Tabla Semestre (vista resumen) ── */}
            {filtroPeriodo === 'semestre' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0 bg-white"
                        style={{ color: '#94a3b8' }}>#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-8 bg-white"
                        style={{ color: '#94a3b8', minWidth: 180 }}>Alumno</th>
                      {/* Calificaciones */}
                      {[1, 2, 3].map(b => (
                        <th key={`cal-${b}`} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#3b82f6', minWidth: 80 }}>B{b} Cal.</th>
                      ))}
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#1e3a5f', minWidth: 90 }}>Prom. Cal.</th>
                      {/* Asistencia */}
                      {[1, 2, 3].map(b => (
                        <th key={`asis-${b}`} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#16a34a', minWidth: 80 }}>B{b} Asis.</th>
                      ))}
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#1e3a5f', minWidth: 100 }}>Prom. Asis.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map((alumno, i) => {
                      const promCal  = avg(alumno.bimestres.map(b => b.promedio))
                      const promAsis = avg(alumno.bimestres.map(b => b.asistencia))
                      return (
                        <tr key={alumno.id}
                          style={{ borderBottom: '1px solid #f8fafc' }}
                          className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs sticky left-0 bg-white" style={{ color: '#94a3b8' }}>{i + 1}</td>
                          <td className="px-4 py-3 sticky left-8 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: '#1e3a5f' }}>
                                {alumno.nombre.charAt(0)}
                              </div>
                              <span className="text-sm font-medium" style={{ color: '#1e3a5f' }}>{alumno.nombre}</span>
                            </div>
                          </td>
                          {/* Calificaciones por bimestre */}
                          {alumno.bimestres.map(b => (
                            <td key={`cal-${b.numero}`} className="px-4 py-3">
                              <span className="text-sm font-bold" style={{ color: promedioColor(b.promedio) }}>
                                {b.promedio}
                              </span>
                            </td>
                          ))}
                          {/* Promedio calificaciones */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold px-2 py-0.5 rounded-lg"
                              style={{
                                background: promCal >= 70 ? '#f0fdf4' : '#fef2f2',
                                color:      promedioColor(promCal),
                              }}>
                              {promCal}
                            </span>
                          </td>
                          {/* Asistencia por bimestre */}
                          {alumno.bimestres.map(b => (
                            <td key={`asis-${b.numero}`} className="px-4 py-3">
                              <span className="text-sm font-bold" style={{ color: asistenciaColor(b.asistencia) }}>
                                {b.asistencia}%
                              </span>
                            </td>
                          ))}
                          {/* Promedio asistencia */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold px-2 py-0.5 rounded-lg"
                              style={{
                                background: promAsis >= 80 ? '#f0fdf4' : '#fef2f2',
                                color:      asistenciaColor(promAsis),
                              }}>
                              {promAsis}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Pie de tabla con promedios generales del grupo */}
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold" style={{ color: '#1e3a5f' }}>
                        Promedio del grupo
                      </td>
                      {[1, 2, 3].map(b => {
                        const vals = alumnosFiltrados.map(a => a.bimestres.find(x => x.numero === b)!.promedio)
                        return (
                          <td key={`foot-cal-${b}`} className="px-4 py-3">
                            <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>{avg(vals)}</span>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold" style={{ color: '#1e3a5f' }}>
                          {avg(alumnosFiltrados.map(a => avg(a.bimestres.map(b => b.promedio))))}
                        </span>
                      </td>
                      {[1, 2, 3].map(b => {
                        const vals = alumnosFiltrados.map(a => a.bimestres.find(x => x.numero === b)!.asistencia)
                        return (
                          <td key={`foot-asis-${b}`} className="px-4 py-3">
                            <span className="text-xs font-bold" style={{ color: '#16a34a' }}>{avg(vals)}%</span>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold" style={{ color: '#1e3a5f' }}>
                          {avg(alumnosFiltrados.map(a => avg(a.bimestres.map(b => b.asistencia))))}%
                        </span>
                      </td>
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