// src/components/docente/calificaciones/ObservacionesCard.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContextoCalificacion } from './types'

export default function ObservacionesCard({
  ctx,
  docenteId,
  plantelId,
  onVerAlumnosObs,
}: {
  ctx: ContextoCalificacion
  docenteId: string | null
  plantelId: string | null
  onVerAlumnosObs?: () => void
}) {
  const supabase = createClient()
  const [textoObs, setTextoObs] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [estadoBoton, setEstadoBoton] = useState<'guardar' | 'exito' | 'editar'>('guardar')

  // Cargar observación existente del grupo al montar/cambiar contexto
  useEffect(() => {
    if (!docenteId || !plantelId) return

    let cancelado = false
    setCargando(true)

    async function cargarObsGrupo() {
      const { data } = await supabase
        .from('observaciones_grupo')
        .select('contenido')
        .eq('docente_id', docenteId)
        .eq('grupo_id', ctx.grupo_id)
        .eq('asignatura_id', ctx.asignatura_id)
        .eq('periodo', ctx.periodo)
        .maybeSingle()

      if (!cancelado) {
        if (data?.contenido && data.contenido.trim().length > 0) {
          setTextoObs(data.contenido)
          setEstadoBoton('editar')
        } else {
          setTextoObs('')
          setEstadoBoton('guardar')
        }
        setCargando(false)
      }
    }

    void cargarObsGrupo()

    return () => { cancelado = true }
  }, [supabase, docenteId, plantelId, ctx.grupo_id, ctx.asignatura_id, ctx.periodo])

  // Guardar o Actualizar observación
  const handleGuardarObs = async () => {
    if (!docenteId || !plantelId) return
    const textoLimpio = textoObs.trim()

    if (textoLimpio.length === 0) {
      await handleBorrarObs()
      return
    }

    setGuardando(true)

    const { error } = await supabase.from('observaciones_grupo').upsert([{
      plantel_id: plantelId,
      docente_id: docenteId,
      grupo_id: ctx.grupo_id,
      asignatura_id: ctx.asignatura_id,
      periodo: ctx.periodo,
      contenido: textoLimpio,
      updated_at: new Date().toISOString()
    }], { onConflict: 'docente_id,grupo_id,asignatura_id,periodo' })

    setGuardando(false)

    if (!error) {
      setEstadoBoton('exito')
      setTimeout(() => {
        setEstadoBoton('editar')
      }, 1500)
    }
  }

  // Eliminar observación de la BD
  const handleBorrarObs = async () => {
    if (!docenteId || !plantelId) return
    setGuardando(true)

    await supabase
      .from('observaciones_grupo')
      .delete()
      .eq('docente_id', docenteId)
      .eq('grupo_id', ctx.grupo_id)
      .eq('asignatura_id', ctx.asignatura_id)
      .eq('periodo', ctx.periodo)

    setTextoObs('')
    setEstadoBoton('guardar')
    setGuardando(false)
  }

  const estaEditandoODeshabilitado = cargando || guardando || estadoBoton === 'editar'

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8eaf0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OBSERVACIÓN DEL GRUPO
          </span>
          <span style={{ fontSize: '0.65rem', color: textoObs.length > 180 ? '#ef4444' : '#94a3b8', fontWeight: 500 }}>
            {textoObs.length}/200
          </span>
        </div>

        <textarea
          value={textoObs}
          disabled={cargando || estadoBoton === 'editar'}
          onChange={(e) => {
            if (e.target.value.length <= 200) setTextoObs(e.target.value)
          }}
          placeholder={cargando ? 'Cargando observación...' : 'Escribe una observación breve para este grupo...'}
          rows={3}
          style={{
            width: '100%',
            resize: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '0.6rem 0.75rem',
            fontSize: '0.78rem',
            outline: 'none',
            background: (cargando || estadoBoton === 'editar') ? '#f8fafc' : '#ffffff',
            color: '#1e3a5f',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#007aff'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <button
          onClick={onVerAlumnosObs}
          style={{
            background: 'none',
            border: 'none',
            color: '#007aff',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          Ver observaciones
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Botón Borrar (Solo visible cuando hay una observación guardada) */}
          {estadoBoton === 'editar' && (
            <button
              onClick={() => void handleBorrarObs()}
              disabled={guardando}
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '0.4rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: guardando ? 'default' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={e => { if (!guardando) e.currentTarget.style.background = '#fef2f2' }}
            >
              Borrar
            </button>
          )}

          {/* Botón Acción Principal: Guardar / ¡Guardado! / Editar */}
          <button
            onClick={() => {
              if (estadoBoton === 'editar') {
                setEstadoBoton('guardar') // Activa modo edición
              } else {
                void handleGuardarObs()
              }
            }}
            disabled={cargando || guardando}
            style={{
              background: estadoBoton === 'exito' ? '#34c759' : '#007aff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '0.4rem 1.1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: (cargando || guardando) ? 'default' : 'pointer',
              opacity: (cargando || guardando) ? 0.7 : 1,
              boxShadow: estadoBoton === 'exito' ? '0 2px 4px rgba(52,199,89,0.25)' : '0 2px 4px rgba(0,122,255,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (!cargando && !guardando && estadoBoton !== 'exito') e.currentTarget.style.background = '#0062cc'
            }}
            onMouseLeave={e => {
              if (!cargando && !guardando && estadoBoton !== 'exito') e.currentTarget.style.background = '#007aff'
            }}
          >
            {guardando ? 'Guardando...' : estadoBoton === 'exito' ? '¡Guardado!' : estadoBoton === 'editar' ? 'Editar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}