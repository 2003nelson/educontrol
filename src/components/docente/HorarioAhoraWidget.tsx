// src/components/docente/HorarioAhoraWidget.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Bloque {
  asignatura_id: string
  asignatura_nombre: string
  grupo_numero: string
  hora_inicio: string
  hora_fin: string
  dia: number
}

function horaActual() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

function diaActual() { return new Date().getDay() }

function saludo() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function primerNombre(nombre: string) { return nombre.split(' ')[0] }

interface Asignacion { asignatura_id: string; grupo_numero: string; grupo_id: string }

export interface ClaseActivaInfo { asignatura_id: string; grupo_id: string }

export default function HorarioAhoraWidget({
  docenteId, nombre, onClaseActiva, asignaciones = [],
}: {
  docenteId: string
  nombre: string
  onClaseActiva?: (info: ClaseActivaInfo | null) => void
  asignaciones?: Asignacion[]
}) {
  const supabase = createClient()
  const [bloque, setBloque]             = useState<Bloque | null | undefined>(undefined)
  const [proxima, setProxima]           = useState<Bloque | null>(null)
  const [tieneHorario, setTieneHorario] = useState(false)

  // ── Estado minimizado ──────────────────────────────────────────────────────
  const [minimizado, setMinimizado] = useState(false)
  const [animando, setAnimando]     = useState(false) // true durante la animación

  function minimizar() {
    setAnimando(true)
    // Fase 1: contrae (200ms) → Fase 2: desaparece (150ms)
    setTimeout(() => setMinimizado(true), 200)
    setTimeout(() => setAnimando(false), 360)
  }

  function expandir() {
    setMinimizado(false)
    setAnimando(true)
    setTimeout(() => setAnimando(false), 360)
  }

  useEffect(() => {
    async function verificar() {
      const dia = diaActual()
      if (dia === 0 || dia === 6) { setBloque(null); onClaseActiva?.(null); return }
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
        const asignacion = asignaciones.find(a => a.asignatura_id === data.asignatura_id)

        if (!asignacion) {
          setBloque(null); onClaseActiva?.(null); setProxima(null); return
        }

        const b: Bloque = {
          asignatura_id:     data.asignatura_id,
          asignatura_nombre: asig?.nombre ?? '—',
          grupo_numero:      asignacion?.grupo_numero ?? '',
          hora_inicio:       (data.hora_inicio as string).slice(0, 5),
          hora_fin:          (data.hora_fin as string).slice(0, 5),
          dia:               data.dia,
        }
        setBloque(b)
        onClaseActiva?.(asignacion ? { asignatura_id: data.asignatura_id, grupo_id: asignacion.grupo_id } : null)
        setProxima(null)
      } else {
        setBloque(null); onClaseActiva?.(null)

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
          const [hhi, mmi] = (h.hora_inicio as string).slice(0, 5).split(':').map(Number)
          return hhi * 60 + mmi > ahoraMin && hhi * 60 + mmi <= ahoraMin + 30
        }) ?? null

        if (next) {
          const nAsig = (Array.isArray(next.asignaturas) ? next.asignaturas[0] : next.asignaturas) as { nombre: string } | null
          const nAsignacion = asignaciones.find(a => a.asignatura_id === next.asignatura_id)
          setProxima({
            asignatura_id:     next.asignatura_id,
            asignatura_nombre: nAsig?.nombre ?? '—',
            grupo_numero:      nAsignacion?.grupo_numero ?? '',
            hora_inicio:       (next.hora_inicio as string).slice(0, 5),
            hora_fin:          (next.hora_fin as string).slice(0, 5),
            dia:               next.dia,
          })
        } else {
          setProxima(null)
        }
      }
    }

    verificar()
    const interval = setInterval(verificar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [docenteId, supabase, onClaseActiva, asignaciones])

  if (bloque === undefined || !tieneHorario) return null

  const esFinDeSemana = diaActual() === 0 || diaActual() === 6
  const hayClase      = !!bloque && !esFinDeSemana

  // ── Botón expandir (cuando está minimizado) ────────────────────────────────
  if (minimizado && !animando) {
    return (
      <>
        <style>{`
          @keyframes expandBtn {
            from { opacity:0; transform:scale(0.6) translateY(4px) }
            to   { opacity:1; transform:scale(1) translateY(0) }
          }
        `}</style>
        {/* Solo desktop — en móvil no mostramos el botón expandir */}
        <div className="hw-expand-btn" style={{ marginBottom: '0.75rem' }}>
          <style>{`.hw-expand-btn { display:flex; }`}</style>
          <button
            onClick={expandir}
            title="Mostrar horario"
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: '#28c840',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(40,200,64,0.45)',
              animation: 'expandBtn 0.32s cubic-bezier(0.34,1.56,0.64,1)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(40,200,64,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,200,64,0.45)' }}
          >
            {/* Icono expand: dos flechas hacia afuera */}
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
      </>
    )
  }

  // ── Widget completo ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulseGreen  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideWidget { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        /* Animación minimizar estilo macOS — contrae hacia arriba-izquierda */
        @keyframes macMinimize {
          0%   { opacity:1; transform: scale(1) translateY(0); }
          40%  { opacity:1; transform: scale(0.85) translateY(-4px) scaleX(0.9); }
          70%  { opacity:0.6; transform: scale(0.4) translateY(-20px) scaleX(0.3); }
          100% { opacity:0; transform: scale(0.05) translateY(-40px) scaleX(0.05); }
        }

        /* Animación expandir — efecto rebote desde el punto */
        @keyframes macExpand {
          0%   { opacity:0; transform: scale(0.05) translateY(-40px); }
          60%  { opacity:1; transform: scale(1.04) translateY(2px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }

        .hw-root {
          animation: slideWidget 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .hw-root.minimizando {
          animation: macMinimize 0.32s cubic-bezier(0.4,0,0.2,1) forwards;
          pointer-events: none;
        }
        .hw-root.expandiendo {
          animation: macExpand 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        /* Botón minimizar — solo visible en sm+ */
        .hw-min-btn { display:flex; }
      `}</style>

      <div
        className={`hw-root${animando && !minimizado ? ' minimizando' : ''}${animando && minimizado ? ' expandiendo' : ''}`}
        style={{
          borderRadius: 16, overflow: 'hidden',
          border: hayClase ? '1px solid #86efac' : '1px solid #e5e5ea',
          boxShadow: hayClase ? '0 4px 20px rgba(22,163,74,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: '0.75rem',
          position: 'relative',
        }}
      >
        {/* ── Barra superior ── */}
        <div style={{
          background: hayClase ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#f2f2f7',
          padding: '0.5rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: hayClase ? 'rgba(255,255,255,0.9)' : '#3a3a3c' }}>
              Hola, {primerNombre(nombre)} · {saludo()}
            </span>
            {!hayClase && proxima && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', fontSize:'0.7rem', fontWeight:700, color:'#92400e', background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #f59e0b', padding:'4px 10px', borderRadius:9, whiteSpace:'nowrap', boxShadow:'0 1px 4px rgba(245,158,11,0.2)' }}>
                <svg width="11" height="11" fill="none" stroke="#d97706" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 7v5l3 3"/>
                </svg>
                {proxima.asignatura_nombre.split(' ')[0]}{proxima.grupo_numero ? ` · G${proxima.grupo_numero}` : ''} · {proxima.hora_inicio}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: '0.75rem' }}>
            {/* Botón minimizar */}
            <button
              className="hw-min-btn"
              onClick={minimizar}
              title="Minimizar"
              style={{
                width: 16, height: 16,
                borderRadius: '50%',
                background: '#febc2e',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(254,188,46,0.5)',
                flexShrink: 0,
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.2)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(254,188,46,0.7)'
                const icon = e.currentTarget.querySelector('svg') as SVGElement | null
                if (icon) icon.style.opacity = '1'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(254,188,46,0.5)'
                const icon = e.currentTarget.querySelector('svg') as SVGElement | null
                if (icon) icon.style.opacity = '0'
              }}
            >
              {/* Icono guión — aparece en hover */}
              <svg width="8" height="2" viewBox="0 0 8 2" fill="none" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'absolute' }}>
                <line x1="1" y1="1" x2="7" y2="1" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Contenido ── */}
        <div style={{
          background: hayClase ? '#f0fdf4' : 'white',
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>
            {esFinDeSemana ? '🏖️' : hayClase ? '📚' : '☕'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: hayClase ? '#15803d' : '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>
              {esFinDeSemana ? 'Fin de semana' : hayClase ? 'Clase en curso' : 'Sin clase ahora'}
            </p>
            {esFinDeSemana ? (
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3a3a3c', margin: 0 }}>Disfruta tu descanso</p>
            ) : hayClase ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1c1c1e', margin: 0, lineHeight: 1.2 }}>{bloque!.asignatura_nombre}</p>
                  {bloque!.grupo_numero && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: 'white', color: '#15803d', border: '1px solid #86efac' }}>
                      Grupo {bloque!.grupo_numero}
                    </span>
                  )}
                </div>
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