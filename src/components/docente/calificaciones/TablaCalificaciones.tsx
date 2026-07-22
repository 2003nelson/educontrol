// src/components/docente/calificaciones/TablaCalificaciones.tsx
'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { Trabajo, Alumno } from './types'

function colorNota(v: number | null) { return v === null ? '#94a3b8' : v >= 60 ? '#16a34a' : '#dc2626' }
function bgNota(v: number | null)    { return v === null ? '#f8fafc' : v >= 60 ? '#f0fdf4' : '#fef2f2' }

// `notas` guarda el puntaje (0-100) que el docente capturó para ese rubro,
// NO los puntos absolutos. Para el total se convierte a puntos: (valor/100) * peso
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

// Cuántas columnas de rubro se ven a la vez antes de necesitar scroll/flechas
const COL_RUBRO_WIDTH = 110

// ── Celda editable ────────────────────────────────────────────────────────────
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
    // Solo dígitos, sin decimales, sin signos
    let limpio = raw.replace(/[^0-9]/g, '')
    // Evitar ceros a la izquierda tipo "0100" -> "100", pero permitir "0" solo
    if (limpio.length > 1) limpio = limpio.replace(/^0+/, '') || '0'
    // Tope absoluto 0-100 (escala universal, no depende del peso del rubro)
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

// ── Tabla principal ────────────────────────────────────────────────────────────
export default function TablaCalificaciones({ alumnos, trabajos, notas, onNotaChange }: {
  alumnos: Alumno[]
  trabajos: Trabajo[]
  notas: Map<string, number | null>
  onNotaChange: (trabajoId: string, alumnoId: string, calif: number | null) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [scrollX, setScrollX] = useState(0)
  const [maxScrollX, setMaxScrollX] = useState(1) // 1 por defecto para no bloquear el botón derecho al inicio

  const key = (alumnoIdx: number, trabajoIdx: number) => `${alumnoIdx}:${trabajoIdx}`

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollX(el.scrollLeft)
    setMaxScrollX(el.scrollWidth - el.clientWidth)
  }, [])

  // Calcular maxScrollX al montar y cuando cambie el contenido/tamaño
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Calcular inmediatamente
    updateScrollState()
    // Y también cuando el layout cambie (ej. al cargar datos)
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
    else if (dir === 'right') c = Math.min(trabajos.length - 1, c + 1)
    requestAnimationFrame(() => focusCell(r, c))
  }

  const sumaPesos = trabajos.reduce((s, t) => s + t.peso, 0)

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {/* Barra superior con flechas de navegación de rubros */}
      {trabajos.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
            {trabajos.length} {trabajos.length === 1 ? 'rubro' : 'rubros'} · {sumaPesos}% · captura 0-100 por rubro
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {/* Flecha izquierda */}
            {(() => {
              const disabled = scrollX <= 0
              return (
                <button
                  onClick={() => scrollBy(-COL_RUBRO_WIDTH * 2)}
                  disabled={disabled}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${disabled ? '#d1d5db' : '#111827'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#111827', transition: 'border-color 0.15s, color 0.15s', opacity: disabled ? 0.45 : 1 }}
                  aria-label="Ver rubros anteriores"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )
            })()}
            {/* Flecha derecha */}
            {(() => {
              const disabled = maxScrollX <= 0 || scrollX >= maxScrollX - 2
              return (
                <button
                  onClick={() => scrollBy(COL_RUBRO_WIDTH * 2)}
                  disabled={disabled}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${disabled ? '#d1d5db' : '#111827'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#111827', transition: 'border-color 0.15s, color 0.15s', opacity: disabled ? 0.45 : 1 }}
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
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: 380 + trabajos.length * COL_RUBRO_WIDTH + 70 }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 190 }} />
            <col style={{ width: 90 }} />
            {trabajos.map(t => <col key={t.id} style={{ width: COL_RUBRO_WIDTH }} />)}
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: '1.5px solid #e2e8f0' }}>#</th>
              <th style={{ position: 'sticky', left: 40, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.75rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>Alumno</th>
              <th style={{ position: 'sticky', left: 230, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.5rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderRight: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>Matrícula</th>
              {trabajos.map(t => (
                <th key={t.id} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc', padding: '0.55rem 0.375rem', fontSize: '0.66rem', fontWeight: 700, color: '#475569', textAlign: 'center', borderLeft: '1px solid #eef1f6', borderBottom: '1.5px solid #e2e8f0' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.nombre}>{t.nombre}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>vale {t.peso}%</div>
                </th>
              ))}
              <th style={{ position: 'sticky', right: 0, top: 0, zIndex: 3, background: '#f8fafc', padding: '0.7rem 0.375rem', fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((al, ai) => {
              const notaFinal = calcNota(trabajos, al.id, notas)
              const par = ai % 2 === 1
              return (
                <tr key={al.id} style={{ background: par ? '#fcfdfe' : 'white' }}
                  onMouseEnter={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = '#f0f7ff' }}
                  onMouseLeave={e => { for (const c of e.currentTarget.children) (c as HTMLElement).style.background = par ? '#fcfdfe' : 'white' }}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.375rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>{ai + 1}</td>
                  <td style={{ position: 'sticky', left: 40, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }} title={al.nombre_completo}>
                    {al.nombre_completo}
                  </td>
                  <td style={{ position: 'sticky', left: 230, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.5rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, borderRight: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>{al.matricula}</td>
                  {trabajos.map((t, ti) => {
                    const valor = notas.get(`${t.id}:${al.id}`) ?? null
                    const esAsistencia = !!t.es_asistencia

                    if (esAsistencia) {
                      // Celda de solo lectura — calculada del módulo de asistencia
                      const aprobado = valor !== null && valor >= 60
                      return (
                        <td key={t.id} style={{ padding: 3, borderLeft: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6', boxSizing: 'border-box', background: '#f8faff' }}
                          title="Calculado automáticamente desde el módulo de asistencia">
                          <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
                              color: valor === null ? '#cbd5e1' : (aprobado ? '#16a34a' : '#dc2626'),
                              background: valor === null ? 'transparent' : (aprobado ? '#f0fdf4' : '#fef2f2'),
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
                  <td style={{ position: 'sticky', right: 0, zIndex: 1, background: par ? '#fcfdfe' : 'white', padding: '0.5rem 0.375rem', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderBottom: '1px solid #eef1f6', transition: 'background 0.1s' }}>
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