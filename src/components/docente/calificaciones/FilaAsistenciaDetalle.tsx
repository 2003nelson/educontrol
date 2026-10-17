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
}: {
  alumnoId: string
  grupoId: string
  asignaturaId: string
  periodo: string
  colSpan: number
}) {
  const supabase = createClient()
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>([])
  const [loading, setLoading] = useState(true)

  // Referencia y estados para el scroll de los meses
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)
  const [maxScrollX, setMaxScrollX] = useState(0)

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    setScrollX(el.scrollLeft)
    setMaxScrollX(el.scrollWidth - el.clientWidth)
  }, [])

  function scrollBy(delta: number) {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(updateScrollState, 250)
  }

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

  // Agrupación de datos por mes y métricas
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

      const diaNombreFmt = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3)
      const mesCortoFmt = mesCorto.charAt(0).toUpperCase() + mesCorto.slice(1, 3)
      const fechaFmt = `${diaNombreFmt}, ${diaNum}-${mesCortoFmt}`

      let bg = '#f0fdf4'
      let color = '#15803d'
      let border = '#bbf7d0'
      let tag = 'P'
      let label = 'Presente'

      if (a.estado === 'retardo') {
        bg = '#fffbeb'
        color = '#b45309'
        border = '#fef08a'
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
    const el = scrollContainerRef.current
    if (!el) return
    updateScrollState()
    const ro = new ResizeObserver(() => updateScrollState())
    ro.observe(el)
    return () => ro.disconnect()
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
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* ENCABEZADO FIJO / ANCLADO AL ANCHO VISIBLE DE LA PANTALLA */}
        <div
          style={{
            position: 'sticky',
            left: 0,
            width: '100vw',
            maxWidth: 'calc(100vw - 60px)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            background: '#f8fafc',
            paddingRight: '2rem',
            paddingBottom: '0.25rem',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📅</span> Desglose de Asistencia — Días impartidos ({total})
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', fontWeight: 700, flexWrap: 'wrap' }}>
                <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  ✓ {presentes} Asistencias
                </span>
                <span style={{ color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 6, border: '1px solid #fef08a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  ⏱ {retardos} Retardos
                </span>
                <span style={{ color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 6, border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  ✕ {faltas} Faltas
                </span>
                {justificadas > 0 && (
                  <span style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    📄 {justificadas} Justificadas
                  </span>
                )}
              </div>
            )}

            {/* Flechas con borde y color negro ancladas */}
            {!loading && mesesAgrupados.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', zIndex: 11, pointerEvents: 'auto' }}>
                <button
                  type="button"
                  onClick={() => scrollBy(-260)}
                  disabled={!canScrollLeft}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: `1.5px solid ${!canScrollLeft ? '#d1d5db' : '#111827'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !canScrollLeft ? 'default' : 'pointer',
                    background: '#ffffff',
                    color: !canScrollLeft ? '#d1d5db' : '#111827',
                    opacity: !canScrollLeft ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  aria-label="Meses anteriores"
                  title="Meses anteriores"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
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
                    border: `1.5px solid ${!canScrollRight ? '#d1d5db' : '#111827'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !canScrollRight ? 'default' : 'pointer',
                    background: '#ffffff',
                    color: !canScrollRight ? '#d1d5db' : '#111827',
                    opacity: !canScrollRight ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  aria-label="Siguientes meses"
                  title="Siguientes meses"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO DESPLAZABLE (TABLAS POR MES) */}
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
              paddingBottom: '0.4rem',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
              width: '100%',
            }}
          >
            {mesesAgrupados.map((grupo) => (
              <div
                key={grupo.titulo}
                style={{
                  minWidth: 220,
                  flex: '1 0 220px',
                  maxWidth: 280,
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