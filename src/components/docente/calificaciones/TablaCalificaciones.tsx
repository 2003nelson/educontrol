// src/components/docente/calificaciones/TablaCalificaciones.tsx
'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { Trabajo, Alumno } from './types'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 60 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)    { return v === null ? '#f8fafc' : v >= 60 ? '#f0fdf4' : '#fef2f2' }

function calcNota(trabajos: Trabajo[], alumnoId: string, notas: Map<string, number | null>): number | null {
  if (trabajos.length === 0) return null
  const suma = trabajos.reduce((s, t) => s + t.peso, 0)
  if (suma === 0) return null
  const total = trabajos.reduce((s, t) => {
    const calif = notas.get(`${t.id}:${alumnoId}`) ?? 0
    const califClamp = Math.max(0, Math.min(100, calif))
    return s + (califClamp / 100) * t.peso
  }, 0)
  return Math.round(total * 10) / 10
}

const COL_RUBRO_WIDTH = 110

function CeldaNota({
  valor, onGuardar, onNavegar, cellRef,
}: {
  valor: number | null
  onGuardar: (pts: number | null) => void
  onNavegar: (dir: 'up' | 'down' | 'left' | 'right' | 'enter') => void
  cellRef: (el: HTMLInputElement | null) => void
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(valor === null ? '' : String(valor))

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
    if (e.key === 'Enter') { e.preventDefault(); confirmar(); onNavegar('down') }
    else if (e.key === 'Tab') { e.preventDefault(); confirmar(); onNavegar(e.shiftKey ? 'left' : 'right') }
    else if (e.key === 'Escape') { setEditando(false); setTexto(valor === null ? '' : String(valor)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); confirmar(); onNavegar('up') }
    else if (e.key === 'ArrowDown') { e.preventDefault(); confirmar(); onNavegar('down') }
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
      onClick={empezarEdicion}
      onDoubleClick={empezarEdicion}
      style={{
        width: '100%', height: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', boxSizing: 'border-box',
      }}
    >
      {editando ? (
        <input
          ref={cellRef}
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
  )
}

export default function TablaCalificaciones({
  alumnos,
  trabajos,
  notas,
  observacionesAlumnos,
  onNotaChange,
  onGuardarObservacionAlumno,
}: {
  alumnos: Alumno[]
  trabajos: Trabajo[]
  notas: Map<string, number | null>
  observacionesAlumnos: Map<string, string>
  onNotaChange: (trabajoId: string, alumnoId: string, calif: number | null) => void
  onGuardarObservacionAlumno: (alumnoId: string, texto: string) => Promise<void>
}) {
  const [editandoObsId, setEditandoObsId] = useState<string | null>(null)
  const [textoObsTemp, setTextoObsTemp] = useState<string>('')
  const [guardandoObsId, setGuardandoObsId] = useState<string | null>(null)

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
  }, [updateScrollState, trabajos, alumnos])

  function scrollBy(delta: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(updateScrollState, 250)
  }

  function focusCell(alumnoIdx: number, trabajoIdx: number) {
    const el = cellRefs.current.get(key(alumnoIdx, trabajoIdx))
    if (el) el.focus()
  }

  function handleNavegar(alumnoIdx: number, trabajoIdx: number, dir: 'up' | 'down' | 'left' | 'right' | 'enter') {
    let r = alumnoIdx
    let c = trabajoIdx
    if (dir === 'up') r = Math.max(0, r - 1)
    else if (dir === 'down' || dir === 'enter') r = Math.min(alumnos.length - 1, r + 1)
    else if (dir === 'left') c = Math.max(0, c - 1)
    else if (dir === 'right') c = Math.min(trabajosOrdenados.length - 1, c + 1)
    requestAnimationFrame(() => focusCell(r, c))
  }

  const sumaPesos = trabajosOrdenados.reduce((s, t) => s + t.peso, 0)

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {trabajosOrdenados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
            {trabajosOrdenados.length} {trabajosOrdenados.length === 1 ? 'rubro' : 'rubros'} · {sumaPesos}% · captura 0-100 por rubro
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {(() => {
              const disabled = scrollX <= 0
              return (
                <button
                  onClick={() => scrollBy(-COL_RUBRO_WIDTH * 2)}
                  disabled={disabled}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${disabled ? '#d1d5db' : '#111827'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#111827', opacity: disabled ? 0.45 : 1 }}
                  aria-label="Ver rubros anteriores"
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
                  aria-label="Ver más rubros"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              )
            })()}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }} ref={scrollRef} onScroll={updateScrollState}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: 660 + trabajosOrdenados.length * COL_RUBRO_WIDTH + 72 }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 280 }} />
            {trabajosOrdenados.map(t => <col key={t.id} style={{ width: COL_RUBRO_WIDTH }} />)}
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1.5px solid #e2e8f0' }}>#</th>
              <th style={{ position: 'sticky', left: 40, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.75rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>Alumno</th>
              <th style={{ position: 'sticky', left: 280, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.5rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>Matrícula</th>
              
              {/* TÍTULO DE OBSERVACIONES UNIFICADO CON EL COLOR NEUTRO DE LAS DEMÁS FILAS */}
              <th style={{ position: 'sticky', left: 380, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.75rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', borderRight: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>Observaciones</th>

              {trabajosOrdenados.map(t => (
                <th key={t.id} style={{ position: 'sticky', top: 0, zIndex: 2, background: t.es_asistencia ? '#d1d5db' : '#f8fafc', padding: '0.55rem 0.375rem', fontSize: '0.66rem', fontWeight: 700, color: t.es_asistencia ? '#374151' : '#475569', textAlign: 'center', borderLeft: t.es_asistencia ? '1px solid #9ca3af' : '1px solid #eef1f6', borderBottom: '1.5px solid #e2e8f0' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.nombre}>{t.nombre}</div>
                  <div style={{ fontSize: '0.6rem', color: t.es_asistencia ? '#6b7280' : '#94a3b8', fontWeight: 600, marginTop: 2 }}>vale {t.peso}%</div>
                </th>
              ))}
              <th style={{ position: 'sticky', right: 0, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((al, ai) => {
              const notaFinal = calcNota(trabajosOrdenados, al.id, notas)
              const par = ai % 2 === 1
              const obsActual = observacionesAlumnos.get(al.id) ?? ''
              const tieneObs = obsActual.trim().length > 0
              const estaEditando = editandoObsId === al.id

              return (
                <tr key={al.id} style={{ background: par ? '#fcfdfe' : 'white' }}
                  onMouseEnter={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = '#f0f7ff' }}
                  onMouseLeave={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = par ? '#fcfdfe' : 'white' }}>
                  
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.375rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', borderBottom: '1px solid #eef1f6' }}>{ai + 1}</td>
                  
                  <td style={{ position: 'sticky', left: 40, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #eef1f6', width: 240, maxWidth: 240 }} title={al.nombre_completo}>
                    {al.nombre_completo}
                  </td>
                  
                  <td style={{ position: 'sticky', left: 280, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.5rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, borderBottom: '1px solid #eef1f6' }}>{al.matricula}</td>

                  {/* COLUMNA OBSERVACIONES */}
                  <td style={{
                    position: 'sticky', left: 380, zIndex: 1,
                    background: tieneObs && !estaEditando ? '#fefce8' : (par ? '#fcfdfe' : 'white'),
                    borderLeft: tieneObs && !estaEditando ? '3px solid #facc15' : 'none',
                    borderRight: '1.5px solid #e2e8f0',
                    borderBottom: '1px solid #eef1f6',
                    padding: '0.5rem 0.75rem',
                    boxSizing: 'border-box',
                    verticalAlign: 'middle',
                    width: 280,
                    maxWidth: 280
                  }}>
                    {estaEditando ? (
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
                              Volver
                            </button>
                            <button
                              onClick={() => void handleGuardarObs(al.id)}
                              disabled={guardandoObsId === al.id}
                              style={{ background: '#007aff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,122,255,0.2)' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#0062cc'}
                              onMouseLeave={e => e.currentTarget.style.background = '#007aff'}
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
                          style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170, cursor: 'pointer' }}
                        >
                          Ver observación
                        </span>
                        <button
                          onClick={() => void handleEliminarObs(al.id)}
                          disabled={guardandoObsId === al.id}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
                          title="Borrar observación"
                        >
                          {guardandoObsId === al.id ? '...' : 'Borrar'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleIniciarEdicionObs(al.id)}
                        style={{
                          background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8,
                          padding: '0.35rem 0.5rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 600,
                          cursor: 'pointer', width: '100%', textAlign: 'center', transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#007aff'; e.currentTarget.style.color = '#007aff'; e.currentTarget.style.background = '#f0f7ff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f8fafc' }}
                      >
                        + Observación
                      </button>
                    )}
                  </td>

                  {trabajosOrdenados.map((t, ti) => {
                    const valor = notas.get(`${t.id}:${al.id}`) ?? null
                    const esAsistencia = !!t.es_asistencia

                    if (esAsistencia) {
                      const aprobado = valor !== null && valor >= 60
                      return (
                        <td key={t.id} style={{ padding: 3, borderLeft: '1px solid #d1d5db', borderBottom: '1px solid #eef1f6', boxSizing: 'border-box', background: '#e5e7eb' }}
                          title="Calculado automáticamente desde el módulo de asistencia">
                          <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
                              color: valor === null ? '#9ca3af' : (aprobado ? '#16a34a' : '#dc2626'),
                              background: valor === null ? 'transparent' : (aprobado ? '#dcfce7' : '#fee2e2'),
                              padding: '4px 0',
                            }}>
                              {valor === null ? '—' : valor}
                              <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#93c5fd', marginTop: 1, letterSpacing: '0.02em' }}>AUTO</span>
                            </div>
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={t.id} style={{ padding: 3, borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6', boxSizing: 'border-box' }}>
                        <CeldaNota
                          valor={valor}
                          onGuardar={calif => onNotaChange(t.id, al.id, calif)}
                          onNavegar={dir => handleNavegar(ai, ti, dir)}
                          cellRef={el => {
                            if (el) cellRefs.current.set(key(ai, ti), el)
                            else cellRefs.current.delete(key(ai, ti))
                          }}
                        />
                      </td>
                    )
                  })}

                  <td style={{ position: 'sticky', right: 0, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.375rem', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6' }}>
                    <span style={{ display: 'inline-flex', minWidth: 40, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: colorNota(notaFinal), background: bgNota(notaFinal), padding: '0 6px' }}>
                      {notaFinal ?? '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}