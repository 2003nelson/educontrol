// src/components/docente/calificaciones/FilaAsistenciaDetalle.tsx
'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AsistenciaRegistro {
  id: string
  fecha: string
  estado: 'presente' | 'ausente' | 'retardo' | 'justificado'
}

interface ItemFormateado {
  id: string
  fechaRaw: string
  fechaFmt: string
  diaNombre: string
  diaNum: string
  mesNombre: string
  anio: number
  mesClave: string
  mesTitulo: string
  label: string
  tag: string
  bg: string
  color: string
  border: string
}

export default function FilaAsistenciaDetalle({
  alumnoId,
  grupoId,
  asignaturaId,
  colSpan,
  onCerrar,
}: {
  alumnoId: string
  grupoId: string
  asignaturaId: string
  periodo: string
  colSpan: number
  onCerrar?: () => void
}) {
  const supabase = createClient()
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>([])
  const [loading, setLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleWidth, setVisibleWidth] = useState<number>(1000)
  const [scrollX, setScrollX] = useState(0)
  const [maxScrollX, setMaxScrollX] = useState(0)

  const updateScrollState = useCallback(() => {
    if (containerRef.current) {
      const scrollWrapper = containerRef.current.closest('div[style*="overflow"]') || containerRef.current.parentElement?.closest('div')
      if (scrollWrapper instanceof HTMLElement) {
        setVisibleWidth(scrollWrapper.clientWidth - 24)
      } else {
        setVisibleWidth(window.innerWidth - 48)
      }
    }
    const el = scrollContainerRef.current
    if (el) {
      setScrollX(el.scrollLeft)
      setMaxScrollX(el.scrollWidth - el.clientWidth)
    }
  }, [])

  function scrollBy(delta: number) {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(updateScrollState, 250)
  }

  useEffect(() => {
    updateScrollState()
    const observer = new ResizeObserver(() => updateScrollState())
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', updateScrollState)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  useEffect(() => {
    if (!alumnoId || !grupoId || !asignaturaId) {
      setLoading(false)
      return
    }

    let cancel = false
    async function fetchAsistencias() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('asistencias')
          .select('id, fecha, estado')
          .eq('estudiante_id', alumnoId)
          .eq('grupo_id', grupoId)
          .eq('asignatura_id', asignaturaId)
          .order('fecha', { ascending: true })

        if (!cancel) {
          if (!error && data) {
            setAsistencias(data as AsistenciaRegistro[])
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancel) setLoading(false)
      }
    }

    void fetchAsistencias()
    return () => {
      cancel = true
    }
  }, [alumnoId, grupoId, asignaturaId, supabase])

  // Agrupación de datos por mes
  const { total, presentes, retardos, faltas, justificadas, mesesAgrupados } = useMemo(() => {
    const tot = asistencias.length
    const pres = asistencias.filter((a) => a.estado === 'presente').length
    const ret = asistencias.filter((a) => a.estado === 'retardo').length
    const fal = asistencias.filter((a) => a.estado === 'ausente').length
    const jus = asistencias.filter((a) => a.estado === 'justificado').length

    const list: ItemFormateado[] = asistencias.map((a) => {
      const fechaObj = new Date(a.fecha + 'T00:00:00')
      const diaSemana = fechaObj.toLocaleDateString('es-MX', { weekday: 'short' })
      const diaNum = fechaObj.toLocaleDateString('es-MX', { day: '2-digit' })
      const mesNombre = fechaObj.toLocaleDateString('es-MX', { month: 'long' })
      const mesCorto = fechaObj.toLocaleDateString('es-MX', { month: 'short' })
      const anio = fechaObj.getFullYear()

      const mesClave = `${anio}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}`
      const mesTitulo = `${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${anio}`

      let diaNombreFmt = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3)
      if (fechaObj.getDay() === 3) {
        diaNombreFmt = 'Mié'
      }

      const mesCortoFmt = mesCorto.charAt(0).toUpperCase() + mesCorto.slice(1, 3)
      const fechaFmt = `${diaNombreFmt}, ${diaNum}-${mesCortoFmt}`

      let bg = '#f0fdf4'
      let color = '#15803d'
      let border = '#bbf7d0'
      let tag = 'P'
      let label = 'Presente'

      if (a.estado === 'retardo') {
        bg = '#f3e8ff'
        color = '#7c3aed'
        border = '#ddd6fe'
        tag = 'R'
        label = 'Retardo'
      } else if (a.estado === 'ausente') {
        bg = '#fef2f2'
        color = '#b91c1c'
        border = '#fecaca'
        tag = 'F'
        label = 'Falta'
      } else if (a.estado === 'justificado') {
        bg = '#eff6ff'
        color = '#1d4ed8'
        border = '#bfdbfe'
        tag = 'J'
        label = 'Justificado'
      }

      return {
        id: a.id,
        fechaRaw: a.fecha,
        fechaFmt,
        diaNombre: diaNombreFmt,
        diaNum,
        mesNombre,
        anio,
        mesClave,
        mesTitulo,
        label,
        tag,
        bg,
        color,
        border,
      }
    })

    const gruposMap = new Map<string, { titulo: string; items: ItemFormateado[] }>()
    list.forEach((item) => {
      if (!gruposMap.has(item.mesClave)) {
        gruposMap.set(item.mesClave, { titulo: item.mesTitulo, items: [] })
      }
      gruposMap.get(item.mesClave)!.items.push(item)
    })

    const mesesArray = Array.from(gruposMap.values())

    return {
      total: tot,
      presentes: pres,
      retardos: ret,
      faltas: fal,
      justificadas: jus,
      mesesAgrupados: mesesArray,
    }
  }, [asistencias])

  useEffect(() => {
    updateScrollState()
  }, [updateScrollState, mesesAgrupados])

  const canScrollLeft = scrollX > 2
  const canScrollRight = maxScrollX > 0 && scrollX < maxScrollX - 2

  return (
    <td
      colSpan={colSpan}
      style={{
        padding: '0.85rem 1rem',
        borderBottom: '2px solid #cbd5e1',
        background: '#f8fafc',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* HEADER ESTÁTICO FIJO AL ANCHO VISIBLE */}
        <div
          style={{
            position: 'sticky',
            left: 0,
            width: `${visibleWidth}px`,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#f8fafc',
            paddingBottom: '0.25rem',
            boxSizing: 'border-box',
          }}
        >
          {/* Lado izquierdo: Título y Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span>📅</span> Días de clase impartidos ({total})
            </span>

            {total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', fontWeight: 700, flexWrap: 'wrap' }}>
                <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 6, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                  ✓ {presentes} Asistencias
                </span>
                <span style={{ color: '#7c3aed', background: '#f3e8ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #ddd6fe', whiteSpace: 'nowrap' }}>
                  ⏱ {retardos} Retardos
                </span>
                <span style={{ color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: 6, border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                  ✕ {faltas} Faltas
                </span>
                <span style={{ color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bfdbfe', whiteSpace: 'nowrap' }}>
                  📄 {justificadas} Justificadas
                </span>
              </div>
            )}
          </div>

          {/* Lado derecho: Flechas de navegación + Botón de Cierre (✕) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {!loading && mesesAgrupados.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => scrollBy(-260)}
                  disabled={!canScrollLeft}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: `1.5px solid ${!canScrollLeft ? '#e2e8f0' : '#111827'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !canScrollLeft ? 'default' : 'pointer',
                    background: '#ffffff',
                    color: !canScrollLeft ? '#cbd5e1' : '#111827',
                    opacity: !canScrollLeft ? 0.35 : 1,
                    boxShadow: canScrollLeft ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  aria-label="Meses anteriores"
                  title="Meses anteriores"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => scrollBy(260)}
                  disabled={!canScrollRight}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: `1.5px solid ${!canScrollRight ? '#e2e8f0' : '#111827'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !canScrollRight ? 'default' : 'pointer',
                    background: '#ffffff',
                    color: !canScrollRight ? '#cbd5e1' : '#111827',
                    opacity: !canScrollRight ? 0.35 : 1,
                    boxShadow: canScrollRight ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  aria-label="Siguientes meses"
                  title="Siguientes meses"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}

            {/* BOTÓN CERRAR ✕ */}
            {onCerrar && (
              <button
                type="button"
                onClick={onCerrar}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: '1.5px solid #111827',
                  background: '#ffffff',
                  color: '#111827',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                  marginLeft: '0.2rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2'
                  e.currentTarget.style.borderColor = '#dc2626'
                  e.currentTarget.style.color = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = '#111827'
                  e.currentTarget.style.color = '#111827'
                }}
                title="Cerrar desglose"
                aria-label="Cerrar desglose"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CONTENEDOR DESLIZABLE HORIZONTAL DE LAS TABLAS */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem 0' }}>
            <div style={{ width: 14, height: 14, border: '2px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
            Cargando historial de clases...
          </div>
        ) : mesesAgrupados.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
            No hay pases de lista registrados para esta asignatura.
          </p>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollState}
            style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              paddingBottom: '0.4rem',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
              width: `${visibleWidth}px`,
              maxWidth: 'calc(100vw - 32px)',
              position: 'sticky',
              left: 0,
              boxSizing: 'border-box',
            }}
          >
            {mesesAgrupados.map((grupo) => (
              <div
                key={grupo.titulo}
                style={{
                  minWidth: 210,
                  flex: '0 0 220px',
                  maxWidth: 260,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Cabecera del Mes */}
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '0.4rem 0.65rem',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{grupo.titulo}</span>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>{grupo.items.length} días</span>
                </div>

                {/* Tabla sencilla del mes */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: '#94a3b8', fontSize: '0.62rem' }}>FECHA</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, color: '#94a3b8', fontSize: '0.62rem' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: idx === grupo.items.length - 1 ? 'none' : '1px solid #f8fafc',
                        }}
                      >
                        <td style={{ padding: '4px 8px', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {item.diaNombre}, {item.diaNum}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <span
                            title={`${item.fechaFmt} — ${item.label}`}
                            style={{
                              background: item.bg,
                              color: item.color,
                              border: `1px solid ${item.border}`,
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              display: 'inline-block',
                              minWidth: 20,
                            }}
                          >
                            {item.tag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </td>
  )
}