// src/components/docente/grupos/ConfirmarFechaView.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
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

function formatFechaHora(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const POR_PAGINA = 10

export default function ConfirmarFechaView({
  asignatura, grupo, onConfirmar, onBack, onEstadoHoy = () => {}, onEditarFecha,
  fechaEditadaExito,
}: {
  asignatura: AsignaturaItem
  grupo: GrupoAgrupado
  onConfirmar: () => void
  onBack: () => void
  onEstadoHoy?: (grupoId: string, asignaturaId: string, completada: boolean) => void
  onEditarFecha?: (fecha: string) => void
  fechaEditadaExito?: string | null
}) {
  const supabase = createClient()
  const [registros, setRegistros]     = useState<{ fecha: string; updated_at: string | null }[]>([])
  const [total, setTotal]             = useState(0)
  const [pagina, setPagina]           = useState(1)
  const [loadingHist, setLoadingHist] = useState(true)
  const [docenteId, setDocenteId]     = useState<string | null>(null)

  const hoy = formatFechaISO()
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('usuarios').select('id').eq('auth_id', user.id).single()
        .then(({ data: ud }) => { if (ud?.id) setDocenteId(ud.id) })
    })
  }, [supabase])

  const cargar = useCallback(async (pag: number) => {
    if (!docenteId) return
    setLoadingHist(true)
    const { data: todas } = await supabase
      .from('asistencias')
      .select('fecha, updated_at')
      .eq('grupo_id', grupo.id)
      .eq('asignatura_id', asignatura.id)
      .eq('docente_id', docenteId)
      .order('fecha', { ascending: false })

    if (todas) {
      const mapaFechas: Record<string, string | null> = {}
      todas.forEach(r => {
        const f = r.fecha as string
        const u = r.updated_at as string | null
        if (!(f in mapaFechas)) { mapaFechas[f] = u }
        else { if (u && (!mapaFechas[f] || u > mapaFechas[f]!)) mapaFechas[f] = u }
      })
      const fechasUnicas = Object.entries(mapaFechas)
        .map(([fecha, updated_at]) => ({ fecha, updated_at }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
      setTotal(fechasUnicas.length)
      const inicio = (pag - 1) * POR_PAGINA
      setRegistros(fechasUnicas.slice(inicio, inicio + POR_PAGINA))
      onEstadoHoy(grupo.id, asignatura.id, fechasUnicas.some(f => f.fecha === hoy))
    }
    setLoadingHist(false)
  }, [docenteId, grupo.id, asignatura.id, supabase, onEstadoHoy, hoy])

  useEffect(() => {
    let cancelled = false
    async function run() { if (cancelled) return; await cargar(pagina) }
    if (docenteId) run()
    return () => { cancelled = true }
  }, [docenteId, pagina, cargar])

  const [hayHoy, setHayHoy] = useState(false)
  useEffect(() => {
    if (!docenteId) return
    supabase.from('asistencias').select('fecha', { count: 'exact', head: true })
      .eq('grupo_id', grupo.id).eq('asignatura_id', asignatura.id)
      .eq('docente_id', docenteId).eq('fecha', hoy)
      .then(({ count }) => setHayHoy((count ?? 0) > 0))
  }, [docenteId, grupo.id, asignatura.id, hoy, supabase])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4fa', padding: '1.25rem 0.75rem 2rem' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .confirmar-grid { display:grid; gap:1rem; }
        @media(min-width:768px) {
          .confirmar-grid { grid-template-columns:1fr 1fr; gap:1.25rem; }
          .confirmar-wrap { padding: 1.5rem 1.25rem 3rem; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <button onClick={onBack}
          style={{ width:36, height:36, borderRadius:10, background:'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit, sans-serif' }}>{asignatura.nombre}</h1>
          <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:0 }}>Grupo {grupo.numero} · {grupo.grado}° Semestre</p>
        </div>
      </div>

      <div className="confirmar-grid">

        {/* Card izquierda — acción del día */}
        <div style={{ background:'white', border:'1px solid #f0f0f5', borderRadius:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'2.5rem 1.5rem 1.5rem', flex:1 }}>
            <p style={{ color:'#1e3a5f', fontSize:'2.25rem', fontWeight:800, fontFamily:'Outfit, sans-serif', lineHeight:1.1, textTransform:'capitalize', marginBottom:'0.5rem' }}>
              {new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' })}
            </p>
            <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:'0.25rem' }}>{new Date().getFullYear()}</p>
            <div style={{ height:1, background:'#f4f4f8', margin:'1.25rem 0' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#f4f4f8', border:'1px solid #ebebf0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'1.1rem', lineHeight:1 }}>📖</span>
              </div>
              <p style={{ fontSize:'0.82rem', color:'#475569', fontWeight:500, lineHeight:1.3 }}>{asignatura.nombre}</p>
            </div>
          </div>

          <div style={{ padding:'0 1.5rem 2rem', display:'flex', gap:'0.75rem' }}>
            {!docenteId || loadingHist ? (
              <div style={{ flex:1, height:48, borderRadius:'0.875rem', background:'#f4f4f8', animation:'pulse 1.5s ease-in-out infinite' }}/>
            ) : hayHoy ? (
              <>
                <div style={{ flex:1, padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <svg width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize:'0.8rem', color:'#16a34a', fontWeight:500 }}>Asistencia tomada</span>
                </div>
                <button onClick={onConfirmar}
                  style={{ padding:'0.875rem 1.25rem', background:'#eff6ff', color:'#2563eb', border:'1.5px solid #bfdbfe', borderRadius:'0.875rem', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                  Editar
                </button>
              </>
            ) : (
              <button onClick={onConfirmar} style={{ width:'100%', background:'linear-gradient(135deg, #1e6fcc, #155ca0)', color:'white', border:'none', borderRadius:'0.875rem', cursor:'pointer', fontWeight:700, padding:'0.95rem', fontSize:'0.9rem' }}>
                Tomar asistencia ahora →
              </button>
            )}
          </div>
        </div>

        {/* Card derecha — historial */}
        <div style={{ background:'white', borderRadius:'1rem', border:'1px solid #f0f0f5', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'1.25rem 1.25rem', borderBottom:'1px solid #f4f4f8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Historial de asistencias</p>
              <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:'0.2rem 0 0' }}>
                {total > 0 ? `${total} sesión${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}` : 'Sin registros aún'}
              </p>
            </div>
            <div style={{ width:36, height:36, borderRadius:10, background:'#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'1.1rem', lineHeight:1 }}>📅</span>
            </div>
          </div>

          {fechaEditadaExito && (
            <div style={{ margin:'0.75rem 1rem 0', padding:'0.625rem 0.875rem', borderRadius:10, background:'#f0fdf4', border:'1px solid #86efac', display:'flex', alignItems:'center', gap:'0.5rem', animation:'slideIn 0.3s ease' }}>
              <svg width="13" height="13" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#16a34a' }}>
                Editado correctamente · {formatFechaLegible(fechaEditadaExito)}
              </span>
            </div>
          )}

          <div style={{ flex:1, overflowY:'auto', maxHeight:320 }}>
            {loadingHist ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"/>
              </div>
            ) : registros.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'0.5rem' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:'1.25rem', lineHeight:1 }}>📅</span>
                </div>
                <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>Sin registros aún</p>
              </div>
            ) : registros.map((reg, idx) => {
              const esHoy = reg.fecha === hoy
              const fueEditado = reg.updated_at &&
                new Date(reg.updated_at).toDateString() !== new Date(reg.fecha + 'T12:00:00').toDateString()
              return (
                <div key={reg.fecha}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.25rem', borderBottom: idx < registros.length - 1 ? '1px solid #f7f7fb' : 'none', transition:'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', minWidth:0 }}>
                    <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background: esHoy ? '#eff6ff' : '#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center', border: esHoy ? '1px solid #bfdbfe' : '1px solid #ebebf0' }}>
                      <span style={{ fontSize:'0.9rem', lineHeight:1 }}>📅</span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:'0.8rem', fontWeight:600, color: esHoy ? '#2563eb' : '#1e3a5f', margin:0, textTransform:'capitalize' }}>
                        {formatFechaLegible(reg.fecha)}
                        {esHoy && <span style={{ marginLeft:6, fontSize:'0.65rem', fontWeight:700, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:9999, padding:'1px 7px' }}>Hoy</span>}
                      </p>
                      {fueEditado ? (
                        <p style={{ fontSize:'0.65rem', color:'#d97706', margin:'0.15rem 0 0', fontWeight:500 }}>
                          ✏️ Editado: {formatFechaHora(reg.updated_at!)}
                        </p>
                      ) : (
                        <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>Registrada</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'2px 8px', borderRadius:9999, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>✓</span>
                    {onEditarFecha && (
                      <button onClick={() => onEditarFecha(reg.fecha)}
                        style={{ fontSize:'0.68rem', fontWeight:600, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'3px 10px', cursor:'pointer', whiteSpace:'nowrap' }}>
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalPaginas > 1 && (
            <div style={{ padding:'0.75rem 1.25rem', borderTop:'1px solid #f4f4f8', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem' }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                style={{ width:28, height:28, borderRadius:8, border:'1px solid #e5e5ea', background:'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer', opacity: pagina === 1 ? 0.4 : 1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="12" height="12" fill="none" stroke="#3a3a3c" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)}
                  style={{ width:28, height:28, borderRadius:8, border: p === pagina ? 'none' : '1px solid #e5e5ea', background: p === pagina ? '#1c1c1e' : 'white', color: p === pagina ? 'white' : '#3a3a3c', fontSize:'0.72rem', fontWeight: p === pagina ? 700 : 500, cursor:'pointer' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                style={{ width:28, height:28, borderRadius:8, border:'1px solid #e5e5ea', background:'white', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', opacity: pagina === totalPaginas ? 0.4 : 1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="12" height="12" fill="none" stroke="#3a3a3c" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}