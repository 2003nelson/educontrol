// src/components/docente/grupos/ConfirmarFechaView.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AsignaturaItem { id: string; nombre: string }
export interface GrupoAgrupado  { id: string; numero: string; grado: number; asignaturas: AsignaturaItem[] }

function formatFechaISO() {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = String(hoy.getMonth() + 1).padStart(2, '0')
  const d = String(hoy.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatFechaLegible(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-MX', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function ConfirmarFechaView({
  asignatura, grupo, onConfirmar, onBack, onEstadoHoy = () => {},
}: {
  asignatura: AsignaturaItem
  grupo: GrupoAgrupado
  onConfirmar: () => void
  onBack: () => void
  onEstadoHoy?: (grupoId: string, asignaturaId: string, completada: boolean) => void
}) {
  const supabase = createClient()
  const [historial, setHistorial]     = useState<string[] | null>(null)
  const [loadingHist, setLoadingHist] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingHist(false); return }

      const { data: ud } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      if (!ud?.id) { setLoadingHist(false); return }

      const { data } = await supabase
        .from('asistencias')
        .select('fecha')
        .eq('grupo_id', grupo.id)
        .eq('asignatura_id', asignatura.id)
        .eq('docente_id', ud.id)
        .order('fecha', { ascending: false })
        .limit(1000)

      if (data) {
        const fechas = [...new Set(data.map(r => r.fecha as string))].slice(0, 10)
        setHistorial(fechas)
        // ── Notificar a la página si hoy ya está completada ──────────────────
        onEstadoHoy?.(grupo.id, asignatura.id, fechas.includes(formatFechaISO()))
      }
      setLoadingHist(false)
    }
    cargar()
  }, [grupo.id, asignatura.id, supabase, onEstadoHoy])

  const hoy      = formatFechaISO()
  const yaHayHoy = historial !== null && historial.includes(hoy)

  return (
    <div className="p-4 md:p-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>{asignatura.nombre}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Grupo {grupo.numero} · {grupo.grado}° Semestre</p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .confirmar-grid { min-height: calc(100vh - 200px); }
          .confirmar-card { min-height: calc(100vh - 200px) !important; }
        }
      `}</style>
      <div className="confirmar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>

        {/* Card izquierda — acción del día */}
        <div className="rounded-2xl confirmar-card" style={{
          background: 'white', border: '1px solid #f0f0f5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ padding: '3.5rem 2rem 2rem', flex: 1 }}>
            <p style={{ color: '#1e3a5f', fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1, textTransform: 'capitalize', marginBottom: '0.5rem' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              {new Date().getFullYear()}
            </p>
            <div style={{ height: 1, background: '#f4f4f8', margin: '1.25rem 0' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f4f8', border: '1px solid #ebebf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📖</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, lineHeight: 1.3 }}>
                {asignatura.nombre}
              </p>
            </div>
          </div>

          <div style={{ padding: '0 2rem 2.5rem', display: 'flex', gap: '0.75rem' }}>
            {historial === null ? (
              <div style={{ flex: 1, height: 48, borderRadius: '0.875rem', background: '#f4f4f8', animation: 'pulse 1.5s ease-in-out infinite' }}/>
            ) : yaHayHoy ? (
              <>
                <div style={{ flex: 1, padding: '0.875rem 1rem', borderRadius: '0.875rem', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>Asistencia tomada</span>
                </div>
                <button onClick={onConfirmar}
                  style={{ padding: '0.875rem 1.25rem', background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Editar
                </button>
              </>
            ) : (
              <button onClick={onConfirmar} style={{ width: '100%', background: 'linear-gradient(135deg, #1e6fcc, #155ca0)', color: 'white', border: 'none', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 700, padding: '0.95rem', fontSize: '0.9rem' }}>
                Tomar asistencia ahora →
              </button>
            )}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>

        {/* Card derecha — historial */}
        <div className="confirmar-card" style={{
          background: 'white', borderRadius: '1rem',
          border: '1px solid #f0f0f5', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}>
          <div style={{ padding: '2rem 1.75rem', borderBottom: '1px solid #f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Historial de asistencias</p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>Últimas 10 sesiones registradas</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📅</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
            {loadingHist ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"/>
              </div>
            ) : !historial || historial.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📅</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Sin registros aún</p>
              </div>
            ) : (historial ?? []).map((fecha, idx) => {
              const esHoy = fecha === hoy
              return (
                <div key={fecha} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.5rem', borderBottom: idx < historial.length - 1 ? '1px solid #f7f7fb' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: esHoy ? '#eff6ff' : '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: esHoy ? '1px solid #bfdbfe' : '1px solid #ebebf0' }}>
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>📅</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: esHoy ? '#2563eb' : '#1e3a5f', margin: 0, textTransform: 'capitalize' }}>{formatFechaLegible(fecha)}</p>
                      {esHoy
                        ? <p style={{ fontSize: '0.7rem', color: '#2563eb', margin: 0, fontWeight: 500 }}>Hoy</p>
                        : <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Registrada</p>
                      }
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}