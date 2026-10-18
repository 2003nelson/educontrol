// src/components/docente/calificaciones/TablaCalificaciones.tsx
'use client'
import { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import type { Trabajo, Alumno } from './types'
import FilaAsistenciaDetalle from './FilaAsistenciaDetalle'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 60 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)    { return v === null ? '#f8fafc' : v >= 60 ? '#f0fdf4' : '#fef2f2' }

function calcNota(trabajos: Trabajo[], alumnoId: string, notas: Map<string, number | null>): number | null {
  if (trabajos.length === 0) return null
  
  const trabajosValidos = trabajos.filter(t => {
    const calif = notas.get(`${t.id}:${alumnoId}`)
    return t.peso > 0 && calif !== null && calif !== undefined
  })

  if (trabajosValidos.length === 0) return null

  const sumaPesosValidos = trabajosValidos.reduce((s, t) => s + t.peso, 0)
  if (sumaPesosValidos === 0) return null

  const total = trabajosValidos.reduce((s, t) => {
    const calif = notas.get(`${t.id}:${alumnoId}`) ?? 0
    const califClamp = Math.max(0, Math.min(100, calif))
    return s + (califClamp / 100) * t.peso
  }, 0)

  const notaFinalPonderada = (total / sumaPesosValidos) * 100
  return Math.round(notaFinalPonderada * 10) / 10
}

const COL_RUBRO_WIDTH = 110

// ── Skeleton row para carga inicial ─────────────────────────────────────
function SkeletonTablaRow({ idx, obsContraido, numRubros = 3 }: { idx: number; obsContraido: boolean; numRubros?: number }) {
  const par = idx % 2 === 1
  const obsWidth = obsContraido ? 88 : 280
  return (
    <tr style={{ background: par ? '#fcfdfe' : 'white' }}>
      <td className="sticky-col-0" style={{ background: par ? '#fcfdfe' : 'white', padding: '0.75rem 0.375rem', textAlign: 'center', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ width: 16, height: 12, borderRadius: 4, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.2s infinite' }} />
      </td>
      <td className="sticky-col-40" style={{ background: par ? '#fcfdfe' : 'white', padding: '0.75rem 0.75rem', borderBottom: '1px solid #eef1f6', width: 240 }}>
        <div style={{ width: '80%', height: 13, borderRadius: 4, background: '#e5e7eb', animation: 'shimmer 1.2s infinite' }} />
      </td>
      <td className="sticky-col-mat" style={{ background: par ? '#fcfdfe' : 'white', padding: '0.75rem 0.5rem', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ width: 70, height: 11, borderRadius: 4, background: '#e5e7eb', animation: 'shimmer 1.2s infinite' }} />
      </td>
      <td className="sticky-col-obs" style={{ background: par ? '#fcfdfe' : 'white', padding: '0.75rem 0.75rem', borderBottom: '1px solid #eef1f6', width: obsWidth }}>
        <div style={{ width: '60%', height: 26, borderRadius: 8, background: '#e5e7eb', animation: 'shimmer 1.4s infinite' }} />
      </td>
      {Array.from({ length: Math.max(numRubros, 3) }).map((_, i) => (
        <td key={i} style={{ padding: '0.75rem 0.375rem', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.2s infinite' }} />
        </td>
      ))}
      <td className="col-final-cell" style={{ padding: '0.75rem 0.375rem', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6' }}>
        <div style={{ width: 36, height: 26, borderRadius: 7, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.2s infinite' }} />
      </td>
    </tr>
  )
}

function CeldaNota({
  valor, onGuardar, onNavegar, cellRef, esAsistencia = false, onToggleAsistencia, estaAbiertoAsistencia = false
}: {
  valor: number | null
  onGuardar: (pts: number | null) => void
  onNavegar: (dir: 'up' | 'down' | 'left' | 'right' | 'enter') => void
  cellRef: (el: HTMLInputElement | null) => void
  esAsistencia?: boolean
  onToggleAsistencia?: () => void
  estaAbiertoAsistencia?: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(valor === null ? '' : String(valor))
  const inputRef = useRef<HTMLInputElement | null>(null)

  function empezarEdicion() {
    setTexto(valor === null ? '' : String(valor))
    setEditando(true)
  }

  function confirmar() {
    setEditando(false)
    const limpio = texto.trim()
    if (limpio === '') { onGuardar(null); return }
    let n = parseInt(limpio, 10)
    if (isNaN(n)) { onGuardar(valor); return }
    n = Math.max(0, Math.min(100, n))
    onGuardar(n)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    let limpio = raw.replace(/[^0-9]/g, '')
    if (limpio.length > 1) limpio = limpio.replace(/^0+/, '') || '0'
    if (limpio !== '') {
      let n = parseInt(limpio, 10)
      if (n > 100) n = 100
      limpio = String(n)
    }
    setTexto(limpio)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmar()
      inputRef.current?.blur()
    }
    else if (e.key === 'Tab') { e.preventDefault(); confirmar(); onNavegar(e.shiftKey ? 'left' : 'right') }
    else if (e.key === 'Escape') { setEditando(false); setTexto(valor === null ? '' : String(valor)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); confirmar(); onNavegar('up') }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      confirmar()
      inputRef.current?.blur()
    }
    else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget
      if (input.selectionStart === 0) { e.preventDefault(); confirmar(); onNavegar('left') }
    }
    else if (e.key === 'ArrowRight') {
      const input = e.currentTarget
      if (input.selectionStart === input.value.length) { e.preventDefault(); confirmar(); onNavegar('right') }
    }
  }

  const aprobado = valor !== null && valor >= 60

  return (
    <div
      style={{
        width: '100%', height: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', boxSizing: 'border-box'
      }}
    >
      <div onClick={empezarEdicion} onDoubleClick={empezarEdicion} style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {editando ? (
          <input
            ref={el => {
              inputRef.current = el
              cellRef(el)
            }}
            type="text"
            inputMode="numeric"
            autoFocus
            value={texto}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={confirmar}
            onFocus={e => e.currentTarget.select()}
            style={{
              width: '100%', height: '100%', textAlign: 'center', border: '2px solid #2563eb', borderRadius: 6,
              fontSize: '0.8rem', fontWeight: 700, color: '#1e3a5f', outline: 'none', background: '#eff6ff',
              padding: '4px 2px', boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            ref={el => cellRef(el as unknown as HTMLInputElement)}
            tabIndex={0}
            onFocus={empezarEdicion}
            title={valor === null ? undefined : `${valor}/100`}
            style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.15,
              color: valor === null ? '#cbd5e1' : (aprobado ? '#16a34a' : '#dc2626'),
              background: valor === null ? 'transparent' : (aprobado ? '#f0fdf4' : '#fef2f2'),
              border: '1.5px solid transparent', outline: 'none', boxSizing: 'border-box',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
          >
            {valor === null ? '—' : valor}
          </div>
        )}
      </div>

      {esAsistencia && onToggleAsistencia && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onToggleAsistencia()
          }}
          title="Ver desglose de asistencia"
          style={{
            position: 'absolute',
            bottom: 2,
            fontSize: '0.58rem',
            fontWeight: 600,
            color: estaAbiertoAsistencia ? '#2563eb' : '#475569',
            cursor: 'pointer',
            userSelect: 'none',
            letterSpacing: '0.02em',
            transition: 'color 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#1e293b'
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = estaAbiertoAsistencia ? '#2563eb' : '#475569'
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{estaAbiertoAsistencia ? 'ocultar' : 'ver'}</span>
        </span>
      )}
    </div>
  )
}

export default function TablaCalificaciones({
  alumnos,
  trabajos,
  notas,
  observacionesAlumnos,
  onNotaChange,
  onGuardarObservacionAlumno,
  loading = false,
  loadingAlumnos = false,
  loadingNotas = false,
  grupoId = '',
  asignaturaId = '',
  periodo = '1',
}: {
  alumnos: Alumno[]
  trabajos: Trabajo[]
  notas: Map<string, number | null>
  observacionesAlumnos: Map<string, string>
  onNotaChange: (trabajoId: string, alumnoId: string, calif: number | null) => void
  onGuardarObservacionAlumno: (alumnoId: string, texto: string) => Promise<void>
  loading?: boolean
  loadingAlumnos?: boolean
  loadingNotas?: boolean
  grupoId?: string
  asignaturaId?: string
  periodo?: string
}) {
  const [busqueda, setBusqueda] = useState('')
  const [editandoObsId, setEditandoObsId] = useState<string | null>(null)
  const [textoObsTemp, setTextoObsTemp] = useState<string>('')
  const [guardandoObsId, setGuardandoObsId] = useState<string | null>(null)
  const [obsContraido, setObsContraido] = useState<boolean>(false)
  const [asistenciaAbiertaAlumnoId, setAsistenciaAbiertaAlumnoId] = useState<string | null>(null)

  const esCargaGlobal = loading || loadingAlumnos
  const esCargaNotas = loadingNotas

  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alumnos
    const query = busqueda.toLowerCase().trim()
    return alumnos.filter(al => {
      const raw = (al as unknown) as Record<string, unknown>
      const nombreCompleto =
        (typeof raw.nombre_completo === 'string' && raw.nombre_completo) ||
        (typeof raw.nombreCompleto === 'string' && raw.nombreCompleto) ||
        [raw.apellido_paterno, raw.apellido_materno, raw.nombre].filter(Boolean).join(' ') ||
        [raw.apellidos, raw.nombre].filter(Boolean).join(' ') ||
        ''
      const matricula = (typeof raw.matricula === 'string' && raw.matricula) || ''

      return nombreCompleto.toLowerCase().includes(query) || matricula.toLowerCase().includes(query)
    })
  }, [alumnos, busqueda])

  const handleIniciarEdicionObs = (alumnoId: string) => {
    setEditandoObsId(alumnoId)
    setTextoObsTemp(observacionesAlumnos.get(alumnoId) ?? '')
  }

  const handleGuardarObs = async (alumnoId: string) => {
    setGuardandoObsId(alumnoId)
    await onGuardarObservacionAlumno(alumnoId, textoObsTemp)
    setGuardandoObsId(null)
    setEditandoObsId(null)
  }

  const handleEliminarObs = async (alumnoId: string) => {
    setGuardandoObsId(alumnoId)
    await onGuardarObservacionAlumno(alumnoId, '')
    setGuardandoObsId(null)
    if (editandoObsId === alumnoId) setEditandoObsId(null)
  }

  const trabajosOrdenados = [...trabajos].sort((a, b) => {
    if (a.es_asistencia && !b.es_asistencia) return -1
    if (!a.es_asistencia && b.es_asistencia) return 1
    return a.orden - b.orden
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [scrollX, setScrollX] = useState(0)
  const [maxScrollX, setMaxScrollX] = useState(1)

  const key = (alumnoIdx: number, trabajoIdx: number) => `${alumnoIdx}:${trabajoIdx}`

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollX(el.scrollLeft)
    setMaxScrollX(el.scrollWidth - el.clientWidth)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    const ro = new ResizeObserver(() => updateScrollState())
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateScrollState, trabajos, alumnosFiltrados, obsContraido])

  function scrollBy(delta: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(updateScrollState, 250)
  }

  function focusCell(alumnoIdx: number, trabajoIdx: number) {
    const el = cellRefs.current.get(key(alumnoIdx, trabajoIdx))
    if (!el) return
    el.focus()

    const container = scrollRef.current
    if (!container) return

    const cellRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const stickyLeftWidth = 40 + 240 + 100 + (obsContraido ? 88 : 280)

    if (cellRect.left < containerRect.left + stickyLeftWidth + 15) {
      const offset = (containerRect.left + stickyLeftWidth + 15) - cellRect.left
      container.scrollBy({ left: -offset, behavior: 'smooth' })
    } else if (cellRect.right > containerRect.right - 20) {
      const offset = cellRect.right - (containerRect.right - 20)
      container.scrollBy({ left: offset, behavior: 'smooth' })
    }

    setTimeout(updateScrollState, 250)
  }

  function handleNavegar(alumnoIdx: number, trabajoIdx: number, dir: 'up' | 'down' | 'left' | 'right' | 'enter') {
    let r = alumnoIdx
    let c = trabajoIdx
    if (dir === 'up') r = Math.max(0, r - 1)
    else if (dir === 'down' || dir === 'enter') r = Math.min(alumnosFiltrados.length - 1, r + 1)
    else if (dir === 'left') c = Math.max(0, c - 1)
    else if (dir === 'right') c = Math.min(trabajosOrdenados.length - 1, c + 1)
    requestAnimationFrame(() => focusCell(r, c))
  }

  const handleHeaderClick = (e: React.MouseEvent<HTMLTableHeaderCellElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return
    const th = e.currentTarget
    const container = scrollRef.current
    if (!container) return
    const left = th.offsetLeft
    container.scrollTo({
      left: Math.max(0, left - 40),
      behavior: 'smooth'
    })
    setTimeout(updateScrollState, 250)
  }

  const matLeft = 280
  const obsLeft = matLeft + 100
  const totalColumnas = trabajosOrdenados.length + 5

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1 }
          50%  { opacity: 0.45 }
          100% { opacity: 1 }
        }

        .sticky-col-0, .sticky-col-40, .sticky-col-mat, .sticky-col-obs, .col-final-head, .col-final-cell {
          position: relative;
          z-index: 1;
        }

        @media (min-width: 768px) {
          .sticky-col-0 {
            position: sticky !important;
            left: 0;
            z-index: 4 !important;
          }
          .sticky-col-40 {
            position: sticky !important;
            left: 40px;
            z-index: 4 !important;
          }
          .sticky-col-mat {
            position: sticky !important;
            left: ${matLeft}px;
            z-index: 4 !important;
          }
          ${!obsContraido ? `
          .sticky-col-obs {
            position: sticky !important;
            left: ${obsLeft}px;
            z-index: 4 !important;
          }
          ` : `
          .sticky-col-obs {
            position: relative !important;
            z-index: 1 !important;
          }
          `}
          .col-final-head, .col-final-cell {
            position: sticky !important;
            right: 0;
            z-index: 4 !important;
          }
        }
      `}</style>

      {/* Barra Superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.28rem 0.55rem', flex: 1, maxWidth: 280 }}>
          <svg width="13" height="13" fill="none" stroke="#64748b" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: '#1e3a5f', width: '100%', fontWeight: 500 }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {!esCargaGlobal && trabajosOrdenados.length > 0 && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
              {alumnosFiltrados.length} alumnos · trabajos {trabajosOrdenados.length}
            </span>
          )}
          {!esCargaGlobal && trabajosOrdenados.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {(() => {
                const disabled = scrollX <= 0
                return (
                  <button
                    onClick={() => scrollBy(-COL_RUBRO_WIDTH * 2)}
                    disabled={disabled}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${disabled ? '#d1d5db' : '#111827'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#111827', opacity: disabled ? 0.45 : 1 }}
                    aria-label="Rubros anteriores"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                )
              })()}
              {(() => {
                const disabled = maxScrollX <= 0 || scrollX >= maxScrollX - 2
                return (
                  <button
                    onClick={() => scrollBy(COL_RUBRO_WIDTH * 2)}
                    disabled={disabled}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${disabled ? '#d1d5db' : '#111827'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#111827', opacity: disabled ? 0.45 : 1 }}
                    aria-label="Más rubros"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                )
              })()}
              {asistenciaAbiertaAlumnoId && (
                <button
                  onClick={() => setAsistenciaAbiertaAlumnoId(null)}
                  title="Cerrar desglose de asistencia"
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white', color: '#111827' }}
                  aria-label="Cerrar desglose de asistencia"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }} ref={scrollRef} onScroll={updateScrollState}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: (obsLeft + (obsContraido ? 88 : 280) + 72) + (esCargaGlobal ? 3 : trabajosOrdenados.length) * COL_RUBRO_WIDTH }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: obsContraido ? 88 : 280 }} />
            {esCargaGlobal && trabajosOrdenados.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => <col key={i} style={{ width: COL_RUBRO_WIDTH }} />)
            ) : (
              trabajosOrdenados.map(t => <col key={t.id} style={{ width: COL_RUBRO_WIDTH }} />)
            )}
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sticky-col-0" style={{ top: 0, zIndex: 5, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1.5px solid #e2e8f0' }}>#</th>
              <th className="sticky-col-40" style={{ top: 0, zIndex: 5, background: '#f8fafc', padding: '0.7rem 0.75rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>Alumno</th>
              <th className="sticky-col-mat" style={{ top: 0, zIndex: 5, background: '#f8fafc', padding: '0.7rem 0.5rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>Matrícula</th>
              
              <th className="sticky-col-obs" style={{ top: 0, zIndex: 5, background: '#f8fafc', padding: obsContraido ? '0.5rem 0.25rem' : '0.5rem 0.5rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderRight: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                {obsContraido ? (
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button
                      onClick={() => setObsContraido(false)}
                      title="Expandir observaciones"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: '#2563eb', padding: '2px 4px', fontSize: '0.63rem', fontWeight: 700 }}
                    >
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      <span>Expandir</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Observaciones</span>
                    <button
                      onClick={() => setObsContraido(true)}
                      title="Contraer observaciones"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, color: '#64748b', padding: '2px 4px', fontSize: '0.65rem', fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                      <span>Contraer</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  </div>
                )}
              </th>

              {esCargaGlobal && trabajosOrdenados.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <th key={i} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc', padding: '0.55rem 0.375rem', fontSize: '0.66rem', fontWeight: 700, color: '#475569', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1.5px solid #e2e8f0' }}>
                    <div style={{ width: 50, height: 11, borderRadius: 4, background: '#e5e7eb', margin: '0 auto 4px', animation: 'shimmer 1.2s infinite' }} />
                    <div style={{ width: 30, height: 9, borderRadius: 4, background: '#e5e7eb', margin: '0 auto', animation: 'shimmer 1.2s infinite' }} />
                  </th>
                ))
              ) : (
                trabajosOrdenados.map(t => (
                  <th
                    key={t.id}
                    onClick={handleHeaderClick}
                    title={`${t.nombre} (Clic para centrar en móvil)`}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: '#f8fafc',
                      padding: '0.55rem 0.375rem',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: '#475569',
                      textAlign: 'center',
                      borderLeft: '1px solid #eef1f6',
                      borderBottom: '1.5px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nombre}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>vale {t.peso}%</div>
                  </th>
                ))
              )}
              
              <th className="col-final-head" style={{ top: 0, zIndex: 5, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {esCargaGlobal && alumnos.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonTablaRow key={i} idx={i} obsContraido={obsContraido} numRubros={3} />)
            ) : alumnosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} style={{ textAlign: 'center', padding: '2.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {busqueda ? `No se encontraron alumnos que coincidan con "${busqueda}"` : 'Sin alumnos registrados'}
                </td>
              </tr>
            ) : (
              alumnosFiltrados.map((al, ai) => {
                const notaFinal = esCargaNotas ? null : calcNota(trabajosOrdenados, al.id, notas)
                const par = ai % 2 === 1
                const obsActual = observacionesAlumnos.get(al.id) ?? ''
                const tieneObs = obsActual.trim().length > 0
                const estaEditando = editandoObsId === al.id
                const asistenciaAbierta = asistenciaAbiertaAlumnoId === al.id
                const rowBg = par ? '#fcfdfe' : 'white'

                const trabajoAsistencia = trabajosOrdenados.find(t => t.es_asistencia)

                return (
                  <Fragment key={al.id}>
                    <tr style={{ background: rowBg }}
                      onMouseEnter={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = '#f0f7ff' }}
                      onMouseLeave={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = rowBg }}>
                      
                      <td className="sticky-col-0" style={{ background: rowBg, padding: '0.5rem 0.375rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', borderBottom: '1px solid #eef1f6' }}>{ai + 1}</td>
                      
                      <td className="sticky-col-40" style={{ background: rowBg, padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #eef1f6', width: 240, maxWidth: 240 }} title={al.nombre_completo}>
                        {al.nombre_completo}
                      </td>
                      
                      <td className="sticky-col-mat" style={{ background: rowBg, padding: '0.5rem 0.5rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, borderBottom: '1px solid #eef1f6' }}>{al.matricula}</td>

                      {/* CELDA OBSERVACIONES (DISEÑO ORIGINAL RESTAURADO) */}
                      <td className="sticky-col-obs" style={{
                        background: !obsContraido && tieneObs && !estaEditando ? '#fefce8' : rowBg,
                        borderLeft: !obsContraido && tieneObs && !estaEditando ? '3px solid #facc15' : 'none',
                        borderRight: '1.5px solid #e2e8f0',
                        borderBottom: '1px solid #eef1f6',
                        padding: obsContraido ? '0.5rem 0.2rem' : '0.5rem 0.75rem',
                        boxSizing: 'border-box',
                        verticalAlign: 'middle',
                        width: obsContraido ? 88 : 280,
                        maxWidth: obsContraido ? 88 : 280,
                        textAlign: 'center'
                      }}>
                        {obsContraido ? (
                          <span title={tieneObs ? obsActual : 'Sin observación'} style={{ fontSize: '0.75rem', color: tieneObs ? '#ca8a04' : '#cbd5e1', fontWeight: 700 }}>
                            {tieneObs ? '•' : '—'}
                          </span>
                        ) : estaEditando ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                            <textarea
                              value={textoObsTemp}
                              onChange={(e) => {
                                if (e.target.value.length <= 100) setTextoObsTemp(e.target.value)
                              }}
                              placeholder="Obs (máx. 100)..."
                              rows={3}
                              autoFocus
                              style={{
                                width: '100%', resize: 'none', padding: '6px 8px', borderRadius: 8,
                                border: '1.5px solid #007aff', fontSize: '0.75rem', outline: 'none', background: '#fff',
                                boxShadow: '0 2px 8px rgba(0,122,255,0.15)', fontFamily: 'inherit', boxSizing: 'border-box'
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ fontSize: '0.62rem', color: textoObsTemp.length > 90 ? '#ef4444' : '#8e8e93', fontWeight: 500 }}>
                                {textoObsTemp.length}/100
                              </span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => setEditandoObsId(null)}
                                  style={{ background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: '#3a3a3c', fontWeight: 600, padding: '4px 10px', borderRadius: 6, transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#e5e5ea'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#f2f2f7'}
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleGuardarObs(al.id)}
                                  disabled={guardandoObsId === al.id}
                                  style={{ background: '#007aff', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: '#fff', fontWeight: 600, padding: '4px 12px', borderRadius: 6, opacity: guardandoObsId === al.id ? 0.6 : 1, transition: 'background 0.15s' }}
                                  onMouseEnter={e => { if (guardandoObsId !== al.id) e.currentTarget.style.background = '#0062cc' }}
                                  onMouseLeave={e => { if (guardandoObsId !== al.id) e.currentTarget.style.background = '#007aff' }}
                                >
                                  {guardandoObsId === al.id ? 'Guardando...' : 'Guardar'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : tieneObs ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%' }}>
                            <span
                              onClick={() => handleIniciarEdicionObs(al.id)}
                              title={obsActual}
                              style={{
                                fontSize: '0.76rem',
                                color: '#9a6700',
                                fontWeight: 600,
                                textAlign: 'left',
                                flex: 1,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Ver observación
                            </span>
                            <button
                              onClick={() => handleEliminarObs(al.id)}
                              title="Borrar observación"
                              style={{
                                background: 'white',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '3px 10px',
                                borderRadius: 6,
                                flexShrink: 0
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                              onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                              Borrar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <button
                              onClick={() => handleIniciarEdicionObs(al.id)}
                              title="Agregar observación"
                              style={{
                                background: 'white',
                                border: '1px dashed #cbd5e1',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                padding: '5px 0',
                                width: '100%',
                                borderRadius: 8,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#94a3b8'
                                e.currentTarget.style.color = '#1e293b'
                                e.currentTarget.style.background = '#f8fafc'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#cbd5e1'
                                e.currentTarget.style.color = '#64748b'
                                e.currentTarget.style.background = 'white'
                              }}
                            >
                              + Agregar
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Celdas de Notas o Asistencia */}
                      {trabajosOrdenados.map((t, ti) => {
                        const val = notas.get(`${t.id}:${al.id}`) ?? null
                        return (
                          <td key={t.id} style={{ padding: '0.35rem 0.375rem', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6', background: rowBg }}>
                            <CeldaNota
                              valor={val}
                              onGuardar={pts => onNotaChange(t.id, al.id, pts)}
                              onNavegar={dir => handleNavegar(ai, ti, dir)}
                              cellRef={el => {
                                if (el) cellRefs.current.set(key(ai, ti), el)
                                else cellRefs.current.delete(key(ai, ti))
                              }}
                              esAsistencia={t.es_asistencia}
                              onToggleAsistencia={() => {
                                setAsistenciaAbiertaAlumnoId(prev => prev === al.id ? null : al.id)
                              }}
                              estaAbiertoAsistencia={asistenciaAbierta}
                            />
                          </td>
                        )
                      })}

                      {/* Nota Final */}
                      <td className="col-final-cell" style={{ background: rowBg, padding: '0.35rem 0.375rem', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6' }}>
                        <div style={{ width: '100%', height: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: bgNota(notaFinal), color: colorNota(notaFinal), border: `1px solid ${notaFinal !== null && notaFinal >= 60 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 7, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', minWidth: 32 }}>
                            {notaFinal === null ? '—' : notaFinal}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida de Asistencia Detallada */}
                    {asistenciaAbierta && trabajoAsistencia && (
                      <tr>
                        <FilaAsistenciaDetalle
                          alumnoId={al.id}
                          grupoId={grupoId}
                          asignaturaId={asignaturaId}
                          periodo={periodo}
                          colSpan={totalColumnas}
                          onCerrar={() => setAsistenciaAbiertaAlumnoId(null)}
                        />
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}