'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { AlumnoDetalle, Calificacion } from './useAlumnoSearch'

type Props = {
  alumno: AlumnoDetalle
  onCerrar: () => void
}

type ParcialKey = 'p1' | 'p2' | 'p3' | 'final' | 'general'

const TABS: { key: ParcialKey; label: string }[] = [
  { key: 'general', label: 'General'   },
  { key: 'p1',      label: '1er Parc.' },
  { key: 'p2',      label: '2do Parc.' },
  { key: 'p3',      label: '3er Parc.' },
  { key: 'final',   label: 'Final'     },
]

function getVal(cal: Calificacion, tab: ParcialKey): number | null {
  if (tab === 'p1')      return cal.parcial_1
  if (tab === 'p2')      return cal.parcial_2
  if (tab === 'p3')      return cal.parcial_3
  if (tab === 'final')   return cal.final
  if (tab === 'general') return cal.promedio_asignatura
  return null
}

function colorNota(v: number | null) {
  if (v === null) return '#94a3b8'
  return v >= 70 ? '#16a34a' : '#dc2626'
}
function bgNota(v: number | null) {
  if (v === null) return '#f8fafc'
  return v >= 70 ? '#f0fdf4' : '#fef2f2'
}
function borderNota(v: number | null) {
  if (v === null) return '#e2e8f0'
  return v >= 70 ? '#bbf7d0' : '#fecaca'
}
function etiqueta(v: number | null) {
  if (v === null) return 'Sin datos'
  if (v >= 90) return 'Excelente'
  if (v >= 70) return 'Aprobado'
  return 'Reprobado'
}

// Calcula promedio de una tab sobre todas las asignaturas
function promedioTab(cals: Calificacion[], tab: ParcialKey): number | null {
  const vals = cals.map(c => getVal(c, tab)).filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
}

export default function AlumnoCard({ alumno, onCerrar }: Props) {
  const [tabActiva, setTabActiva]         = useState<ParcialKey>('general')
  const [asigFiltro, setAsigFiltro]       = useState<string | null>(null) // null = todas
  const [tabIdx, setTabIdx]               = useState(0)
  const [animDir, setAnimDir]             = useState<'der' | 'izq'>('der')
  const [visible, setVisible]             = useState(true)

  if (typeof window === 'undefined') return null

  const cals = alumno.calificaciones

  // Asignatura seleccionada o todas
  const calsFiltradas = asigFiltro
    ? cals.filter(c => c.asignatura_id === asigFiltro)
    : cals

  const promTab = promedioTab(calsFiltradas, tabActiva)

  function cambiarTab(key: ParcialKey) {
    if (key === tabActiva) return
    const newIdx = TABS.findIndex(t => t.key === key)
    setAnimDir(newIdx > tabIdx ? 'der' : 'izq')
    setVisible(false)
    setTimeout(() => {
      setTabActiva(key)
      setTabIdx(newIdx)
      setVisible(true)
    }, 160)
  }

  // Color de asistencia
  const asiColor = alumno.asistenciaPct === null
    ? '#94a3b8'
    : alumno.asistenciaPct >= 80 ? '#16a34a'
    : alumno.asistenciaPct >= 65 ? '#d97706'
    : '#dc2626'

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      animation: 'backdropIn 0.22s ease',
    }}>
      <style>{`
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
        @keyframes cardIn { from{opacity:0;transform:scale(0.94) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
          width: 480,
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cardIn 0.38s cubic-bezier(0.34,1.4,0.64,1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {/* ── Encabezado ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1e6fcc 60%, #2563eb 100%)',
          padding: '1.5rem 1.5rem 1.25rem',
          position: 'relative',
          flexShrink: 0,
        }}>
          <button onClick={onCerrar} style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
            width: 28, height: 28, borderRadius: '50%',
            color: 'white', fontSize: '0.9rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
          >✕</button>

          {/* Avatar + datos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.125rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '0.875rem',
              background: '#dde3ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 800, color: '#6b7897', flexShrink: 0,
            }}>
              {alumno.nombre_completo.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', margin: '0 0 0.3rem' }}>
                {alumno.nombre_completo}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.92)', padding: '0.15rem 0.55rem', borderRadius: 9999, fontWeight: 600 }}>
                  {alumno.grupo_label}
                </span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.92)', padding: '0.15rem 0.55rem', borderRadius: 9999, fontWeight: 600 }}>
                  Mat. {alumno.matricula}
                </span>
              </div>
            </div>
          </div>

          {/* Stats rápidos */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Promedio general */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.13)', borderRadius: '0.875rem',
              padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>Promedio Gral.</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1 }}>
                {alumno.promedioGeneral ?? '—'}
              </p>
            </div>
            {/* Asistencia */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.13)', borderRadius: '0.875rem',
              padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>Asistencia</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1 }}>
                {alumno.asistenciaPct !== null ? `${alumno.asistenciaPct}%` : '—'}
              </p>
            </div>
            {/* Asignaturas */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.13)', borderRadius: '0.875rem',
              padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>Asignaturas</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1 }}>
                {cals.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filtro de asignatura ── */}
        <div style={{
          padding: '0.875rem 1.25rem 0',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.875rem', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setAsigFiltro(null)}
              style={{
                flexShrink: 0,
                padding: '0.35rem 0.875rem',
                borderRadius: 9999,
                fontSize: '0.72rem', fontWeight: 600,
                border: '1.5px solid',
                cursor: 'pointer', transition: 'all 0.15s',
                background: asigFiltro === null ? '#1e40af' : 'white',
                color:      asigFiltro === null ? 'white'   : '#64748b',
                borderColor: asigFiltro === null ? '#1e40af' : '#e2e8f0',
              }}
            >
              Todas
            </button>
            {cals.map(c => (
              <button
                key={c.asignatura_id}
                onClick={() => setAsigFiltro(asigFiltro === c.asignatura_id ? null : c.asignatura_id)}
                style={{
                  flexShrink: 0,
                  padding: '0.35rem 0.875rem',
                  borderRadius: 9999,
                  fontSize: '0.72rem', fontWeight: 600,
                  border: '1.5px solid',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: asigFiltro === c.asignatura_id ? '#1e40af' : 'white',
                  color:      asigFiltro === c.asignatura_id ? 'white'   : '#64748b',
                  borderColor: asigFiltro === c.asignatura_id ? '#1e40af' : '#e2e8f0',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.asignatura_nombre}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs de parciales ── */}
        <div style={{ padding: '0.875rem 1.25rem 0', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', background: '#f8fafc', borderRadius: '0.875rem', padding: '3px' }}>
            <div style={{
              position: 'absolute', top: 3, bottom: 3,
              width: `calc(${100 / TABS.length}% - 2px)`,
              left: `calc(${tabIdx * (100 / TABS.length)}% + 3px)`,
              background: 'white', borderRadius: '0.625rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: 'none',
            }} />
            {TABS.map((t) => (
              <button key={t.key} onClick={() => cambiarTab(t.key)} style={{
                position: 'relative', zIndex: 1, flex: 1,
                padding: '0.4rem 0',
                fontSize: '0.68rem',
                fontWeight: tabActiva === t.key ? 700 : 500,
                color: tabActiva === t.key ? '#1e40af' : '#94a3b8',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'color 0.2s', textAlign: 'center', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenido: lista de asignaturas con nota ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 1.5rem' }}>

          {/* Promedio de la tab actual */}
          <div style={{
            background: bgNota(promTab),
            border: `1px solid ${borderNota(promTab)}`,
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1rem',
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'translateX(0) scale(1)'
              : `translateX(${animDir === 'der' ? '10px' : '-10px'}) scale(0.97)`,
            transition: visible
              ? 'opacity 0.24s ease, transform 0.24s ease'
              : 'opacity 0.12s ease, transform 0.12s ease',
          }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 0.2rem' }}>
                {TABS.find(t => t.key === tabActiva)?.label} · {asigFiltro ? calsFiltradas[0]?.asignatura_nombre : 'Todas las asignaturas'}
              </p>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: colorNota(promTab), margin: 0 }}>
                {etiqueta(promTab)}
              </p>
            </div>
            <p style={{ fontSize: '3rem', fontWeight: 800, color: colorNota(promTab), margin: 0, lineHeight: 1 }}>
              {promTab ?? '—'}
            </p>
          </div>

          {/* Lista por asignatura */}
          {calsFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sin calificaciones registradas</p>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              opacity: visible ? 1 : 0,
              transform: visible
                ? 'translateX(0)'
                : `translateX(${animDir === 'der' ? '8px' : '-8px'})`,
              transition: visible
                ? 'opacity 0.24s ease 0.05s, transform 0.24s ease 0.05s'
                : 'opacity 0.1s ease, transform 0.1s ease',
            }}>
              {calsFiltradas.map(cal => {
                const val = getVal(cal, tabActiva)
                return (
                  <div key={cal.asignatura_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '0.875rem',
                    border: '1px solid #f1f5f9',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#f8fafc')}
                  >
                    {/* Nombre asignatura */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                        {cal.asignatura_nombre}
                      </p>
                      {/* Mini-pills de todos los parciales */}
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        {([['P1', cal.parcial_1], ['P2', cal.parcial_2], ['P3', cal.parcial_3], ['F', cal.final]] as [string, number | null][]).map(([lbl, v]) => (
                          <span key={lbl} style={{
                            fontSize: '0.6rem', fontWeight: 700,
                            padding: '0.1rem 0.4rem', borderRadius: 9999,
                            background: v !== null ? bgNota(v) : '#f1f5f9',
                            color: v !== null ? colorNota(v) : '#c0c0d0',
                            border: `1px solid ${v !== null ? borderNota(v) : '#e2e8f0'}`,
                          }}>
                            {lbl} {v ?? '—'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nota destacada de la tab activa */}
                    <div style={{
                      minWidth: 52, height: 44,
                      background: bgNota(val),
                      border: `1px solid ${borderNota(val)}`,
                      borderRadius: '0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: '0.75rem', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, color: colorNota(val) }}>
                        {val ?? '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Pie ── */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Barra de asistencia */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Asistencia</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: asiColor }}>
                  {alumno.asistenciaPct !== null ? `${alumno.asistenciaPct}%` : '—'}
                </span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${alumno.asistenciaPct ?? 0}%`,
                  background: asiColor,
                  borderRadius: 9999,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}