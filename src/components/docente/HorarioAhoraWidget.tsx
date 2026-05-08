// src/components/docente/HorarioAhoraWidget.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Bloque {
  asignatura_id: string
  asignatura_nombre: string
  hora_inicio: string
  hora_fin: string
  dia: number
}

function horaActual() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

function diaActual() {
  const d = new Date().getDay() // 0=Dom,1=Lun,2=Mar,3=Mié,4=Jue,5=Vie,6=Sáb
  return d // 0=Dom y 6=Sáb → fin de semana. 1-5 coinciden con el formato de la BD
}

function saludo() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function primerNombre(nombre: string) {
  return nombre.split(' ')[0]
}

export default function HorarioAhoraWidget({ docenteId, nombre }: { docenteId: string; nombre: string }) {
  const supabase = createClient()
  const [bloque, setBloque] = useState<Bloque | null | undefined>(undefined)
  const [proxima, setProxima] = useState<Bloque | null>(null)
  const [tieneHorario, setTieneHorario] = useState(false)

  useEffect(() => {
    async function verificar() {
      const dia = diaActual()
      if (dia === 0 || dia === 6) { setBloque(null); return }
      const hora = horaActual()

      const { data } = await supabase
        .from('horario_docente')
        .select('asignatura_id, hora_inicio, hora_fin, dia, asignaturas(nombre)')
        .eq('docente_id', docenteId)
        .eq('dia', dia)
        .eq('activo', true)
        .lte('hora_inicio', hora)
        .gte('hora_fin', hora)
        .maybeSingle()

      const { count } = await supabase
        .from('horario_docente')
        .select('id', { count: 'exact', head: true })
        .eq('docente_id', docenteId)
        .eq('activo', true)

      setTieneHorario((count ?? 0) > 0)

      if (data) {
        const asigRaw = data.asignaturas
        const asig = (Array.isArray(asigRaw) ? asigRaw[0] : asigRaw) as { nombre: string } | null
        setBloque({
          asignatura_id: data.asignatura_id,
          asignatura_nombre: asig?.nombre ?? '—',
          hora_inicio: (data.hora_inicio as string).slice(0, 5),
          hora_fin:    (data.hora_fin as string).slice(0, 5),
          dia: data.dia,
        })
        setProxima(null)
      } else {
        setBloque(null)
        // Buscar próxima clase en los siguientes 30 min
        // Traer todas las clases del día y filtrar en cliente para evitar bugs de comparación de strings
        const { data: todasHoy } = await supabase
          .from('horario_docente')
          .select('asignatura_id, hora_inicio, hora_fin, dia, asignaturas(nombre)')
          .eq('docente_id', docenteId)
          .eq('dia', dia)
          .eq('activo', true)
          .order('hora_inicio', { ascending: true })
        const [hh, mm] = hora.split(':').map(Number)
        const ahoraMin = hh * 60 + mm
        const next = (todasHoy ?? []).find(h => {
          const [hhi, mmi] = (h.hora_inicio as string).slice(0,5).split(':').map(Number)
          const inicioMin = hhi * 60 + mmi
          return inicioMin > ahoraMin && inicioMin <= ahoraMin + 30
        }) ?? null
        if (next) {
          const nAsig = (Array.isArray(next.asignaturas) ? next.asignaturas[0] : next.asignaturas) as { nombre: string } | null
          setProxima({ asignatura_id: next.asignatura_id, asignatura_nombre: nAsig?.nombre ?? '—', hora_inicio: (next.hora_inicio as string).slice(0,5), hora_fin: (next.hora_fin as string).slice(0,5), dia: next.dia })
        } else {
          setProxima(null)
        }
      }
    }

    verificar()
    const interval = setInterval(verificar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [docenteId, supabase])

  if (bloque === undefined || !tieneHorario) return null

  const hora = horaActual()
  const esFinDeSemana = diaActual() === 0 || diaActual() === 6
  const hayClase = !!bloque && !esFinDeSemana

  return (
    <>
      <style>{`
        @keyframes pulseGreen { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideWidget { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: hayClase ? '1px solid #86efac' : '1px solid #e5e5ea',
        boxShadow: hayClase ? '0 4px 20px rgba(22,163,74,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
        animation: 'slideWidget 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        marginBottom: '0.75rem',
      }}>

        {/* Barra superior */}
        <div style={{
          background: hayClase
            ? 'linear-gradient(135deg, #16a34a, #15803d)'
            : '#f2f2f7',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Saludo + próxima clase */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: hayClase ? 'rgba(255,255,255,0.9)' : '#3a3a3c' }}>
              Hola, {primerNombre(nombre)} · {saludo()}
            </span>
            {!hayClase && proxima && (
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 10px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                📖 Tu próxima clase: {proxima.asignatura_nombre.split(' ')[0]} a las {proxima.hora_inicio}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: hayClase ? 'rgba(255,255,255,0.8)' : '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {hora}
          </span>
        </div>

        {/* Contenido */}
        <div style={{
          background: hayClase ? '#f0fdf4' : 'white',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {/* Emoji */}
          <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>
            {esFinDeSemana ? '🏖️' : hayClase ? '📚' : '☕'}
          </span>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: hayClase ? '#15803d' : '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>
              {esFinDeSemana ? 'Fin de semana' : hayClase ? 'Clase en curso' : 'Sin clase ahora'}
            </p>
            {esFinDeSemana ? (
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3a3a3c', margin: 0 }}>Disfruta tu descanso</p>
            ) : hayClase ? (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1c1c1e', margin: 0, lineHeight: 1.2 }}>{bloque!.asignatura_nombre}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', animation: 'pulseGreen 2s ease-in-out infinite' }}>
                    ● En curso
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                    {bloque!.hora_inicio} – {bloque!.hora_fin}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>Tiempo libre</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}