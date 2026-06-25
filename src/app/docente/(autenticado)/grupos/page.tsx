// src/app/docente/(autenticado)/grupos/page.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDocente } from '@/contexts/DocenteContext'
import ConfirmarFechaView from '@/components/docente/grupos/ConfirmarFechaView'
import AsistenciaView from '@/components/docente/grupos/AsistenciaView'
import type { AsignaturaItem, GrupoAgrupado } from '@/components/docente/grupos/types'

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Círculo de progreso SVG ───────────────────────────────────────────────────
function ProgresoCircular({ completadas, total, activo }: { completadas: number; total: number; activo: boolean }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const pct = total === 0 ? 0 : completadas / total
  const offset = circ * (1 - pct)
  const todasListas = total > 0 && completadas === total

  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="26" cy="26" r={r} fill="none"
          stroke={activo ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.15)'}
          strokeWidth="3.5" />
        {/* Progreso */}
        <circle cx="26" cy="26" r={r} fill="none"
          stroke={todasListas ? '#4ade80' : activo ? '#86efac' : 'rgba(255,255,255,0.7)'}
          strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Número central */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {todasListas ? (
          <svg width="14" height="14" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : (
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {completadas}/{total}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Card de grupo ─────────────────────────────────────────────────────────────
function GrupoCard({
  grupo,
  idx,
  hayClaseAqui,
  completadasCount,
  todasCompletas,
  onClick,
}: {
  grupo: GrupoAgrupado
  idx: number
  hayClaseAqui: boolean
  completadasCount: number
  todasCompletas: boolean
  onClick: () => void
}) {
  const [hov, setHov]           = useState(false)
  const [asigAbiertas, setAsigAbiertas] = useState(false)

  // Temporal: gris pastel uniforme hasta implementar sistema de colores por grupo
  const p = { from: '#6b7280', to: '#9ca3af' }

  return (
    <>
      <style>{`
        @keyframes cardIn-${idx} {
          from { opacity:0; transform:translateY(16px) scale(0.96) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        .gc-${idx} { animation: cardIn-${idx} 0.45s cubic-bezier(0.34,1.4,0.64,1) ${idx * 0.08}s both; }
        @keyframes asigIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        className={`gc-${idx}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: hov
            ? `0 20px 48px -8px ${p.from}55, 0 8px 16px -4px ${p.from}33`
            : `0 6px 20px -4px ${p.from}40`,
          transform: hov ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)',
          background: 'white',
        }}
      >
        {/* ── Parte de color: nombre grupo + semestre ── */}
        <div
          className="card-color-top"
          onClick={onClick}
          style={{
            position: 'relative',
            cursor: 'pointer',
            background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)`,
            padding: '1.25rem 1.25rem 1.125rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Círculos decorativos */}
          <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-20, left:-10, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

          {/* Fila: nombre izquierda + progreso derecha */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem', zIndex:1, position:'relative' }}>
            <div>
              {/* Pill clase activa */}
              {hayClaseAqui && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:9999, background:'rgba(74,222,128,0.2)', border:'1px solid rgba(74,222,128,0.4)', marginBottom:'0.375rem' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 5px #4ade80' }} />
                  <span style={{ fontSize:'0.58rem', fontWeight:700, color:'#4ade80', letterSpacing:'0.06em', textTransform:'uppercase' }}>En clase</span>
                </div>
              )}
              {/* Nombre del grupo */}
              <h3 style={{ fontSize:'2rem', fontWeight:800, color:'white', margin:0, lineHeight:1, fontFamily:'Outfit, "Plus Jakarta Sans", sans-serif', letterSpacing:'-0.02em' }}>
                Grupo {grupo.numero}
              </h3>
              {/* Semestre debajo del nombre */}
              <p style={{ fontSize:'0.65rem', fontWeight:500, color:'rgba(255,255,255,0.65)', margin:'0.375rem 0 0', letterSpacing:'0.04em' }}>
                {grupo.grado}° semestre
              </p>
            </div>
            {/* Progreso circular */}
            <ProgresoCircular completadas={completadasCount} total={grupo.asignaturas.length} activo={hayClaseAqui} />
          </div>
        </div>

        {/* ── Parte blanca: dots + asignaturas desplegables + flecha ir ── */}
        <div style={{ background:'white', borderTop:'1px solid #f0f0f5' }}>

          {/* Fila de acciones */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem' }}>

            {/* Dots + toggle asignaturas */}
            <button
              onClick={(e) => { e.stopPropagation(); setAsigAbiertas(v => !v) }}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'background 0.15s' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display:'flex', gap:4 }}>
                {(['#ff5f57','#febc2e','#28c840'] as const).map((col, i) => (
                  <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:col }} />
                ))}
              </div>
              <svg
                width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: asigAbiertas ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.22s' }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>
                {todasCompletas ? 'Completada' : `${grupo.asignaturas.length} ${grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}`}
              </span>
            </button>

            {/* Ir al grupo — texto simple con flecha */}
            <button
              onClick={(e) => { e.stopPropagation(); onClick() }}
              style={{
                display:'flex', alignItems:'center', gap:'0.3rem',
                background:'none', border:'none', cursor:'pointer', padding:'4px 2px',
                transition:'opacity 0.15s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#475569' }}>Tomar asistencia</span>
              <svg width="13" height="13" fill="none" stroke="#475569" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Desplegable de asignaturas */}
          {asigAbiertas && (
            <div style={{ borderTop:'1px solid #f0f0f5', padding:'0.5rem 1rem 0.75rem', display:'flex', flexDirection:'column', gap:'0.375rem', animation:'asigIn 0.2s ease' }}>
              {grupo.asignaturas.map((a) => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 0.625rem', borderRadius:10, background:'#f8fafc', border:'1px solid #f0f0f5' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: `linear-gradient(135deg, ${p.from}, ${p.to})`, flexShrink:0 }} />
                  <span style={{ fontSize:'0.78rem', fontWeight:500, color:'#374151' }}>{a.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Vista de asignaturas ──────────────────────────────────────────────────────
function AsignaturasView({ grupo, onSelect, onBack }: { grupo: GrupoAgrupado; onSelect: (a: AsignaturaItem) => void; onBack: () => void }) {
  const supabase = createClient()
  const [alumnosPorAsig, setAlumnosPorAsig] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    async function cargarAlumnos() {
      const { data } = await supabase.rpc('get_estudiantes_grupo', { p_grupo_id: grupo.id })
      if (data) {
        // El RPC devuelve los alumnos del grupo — el conteo es el mismo para todas las asignaturas del grupo
        const total = (data as { id: string }[]).length
        const mapa: Record<string, number> = {}
        grupo.asignaturas.forEach(a => { mapa[a.id] = total })
        setAlumnosPorAsig(mapa)
      }
    }
    cargarAlumnos()
  }, [grupo.id, grupo.asignaturas, supabase])

  const fechaHoy = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ padding: '1.25rem 0.75rem 2rem', minHeight: '100vh', background: '#f0f4fa' }}>
      <style>{`
        .asig-header { margin-bottom: 1.25rem; }
        .asig-grid-wrap { display: flex; flex-direction: column; gap: 0.625rem; }
        @media (min-width: 640px) {
          .asig-grid-wrap { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
        }
        @media (min-width: 1024px) {
          .asig-grid-wrap { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
          .asig-header { margin-bottom: 1.5rem; }
        }
        .asig-pc2 { display: none; }
        .asig-mobile2 { display: flex; }
        @media (min-width: 640px) { .asig-pc2 { display: flex !important; flex-direction: column; align-items: center; } .asig-mobile2 { display: none !important; } }
      `}</style>

      {/* Encabezado */}
      <div className="asig-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Grupo {grupo.numero}</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Selecciona la asignatura</p>
        </div>
      </div>

      {/* Grid de asignaturas */}
      <div className="asig-grid-wrap">
        {grupo.asignaturas.map((asig: AsignaturaItem) => {
          const totalAlumnos = alumnosPorAsig[asig.id]
          return (
            <button key={asig.id} onClick={() => onSelect(asig)}
              style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#e5e5ea'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>

              {/* Desktop: centrado vertical */}
              <div className="asig-pc2" style={{ padding: '1.75rem 1rem 0', gap: '0.75rem', width: '100%' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📒</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', lineHeight: 1.4, textAlign: 'center', padding: '0 0.5rem' }}>{asig.nombre}</span>
              </div>

              {/* Móvil: fila horizontal */}
              <div className="asig-mobile2" style={{ padding: '0.875rem 1rem 0', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>📒</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{asig.nombre}</span>
                </div>
                <svg width="16" height="16" fill="none" stroke="#c7c7cc" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Footer: alumnos + fecha — igual en móvil y desktop */}
              <div style={{ width: '100%', borderTop: '1px solid #f0f0f5', marginTop: '0.875rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                    {totalAlumnos !== undefined ? `${totalAlumnos} alumno${totalAlumnos !== 1 ? 's' : ''}` : '…'}
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize' }}>
                  {fechaHoy}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Tipos de vista ────────────────────────────────────────────────────────────
type Vista =
  | { tipo: 'grupos' }
  | { tipo: 'asignaturas'; grupo: GrupoAgrupado }
  | { tipo: 'confirmar'; grupo: GrupoAgrupado; asignatura: AsignaturaItem; ts?: number; fechaEditadaExito?: string }
  | { tipo: 'asistencia'; grupo: GrupoAgrupado; asignatura: AsignaturaItem }
  | { tipo: 'editar-asistencia'; grupo: GrupoAgrupado; asignatura: AsignaturaItem; fecha: string }

// ── Página principal ──────────────────────────────────────────────────────────
export default function GruposPage() {
  const { docente, loading, error } = useDocente()
  const [vista, setVista]           = useState<Vista>({ tipo: 'grupos' })
  const [completadas, setCompletadas] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const cargarCompletadas = useCallback(async () => {
    if (!docente) return
    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: ud } = await supabase.from('usuarios').select('id').eq('auth_id', user.id).single()
    if (!ud?.id) return
    const { data } = await supabase
      .from('asistencias')
      .select('grupo_id, asignatura_id')
      .eq('docente_id', ud.id)
      .eq('fecha', fecha)
    if (data) {
      const keys = new Set(data.map((r: { grupo_id: string; asignatura_id: string }) => `${r.grupo_id}:${r.asignatura_id}`))
      setCompletadas(keys)
    }
  }, [docente, supabase])

  useEffect(() => {
    let cancelled = false
    async function init() { if (cancelled) return; await cargarCompletadas() }
    init()
    return () => { cancelled = true }
  }, [cargarCompletadas])

  const marcarCompletada = useCallback((grupoId: string, asignaturaId: string, completada: boolean) => {
    const key = `${grupoId}:${asignaturaId}`
    setCompletadas(prev => {
      const next = new Set(prev)
      if (completada) { next.add(key) } else { next.delete(key) }
      return next
    })
  }, [])

  useEffect(() => { window.history.replaceState({ vista: 'grupos' }, '') }, [])

  const vistaRef = React.useRef<Vista>({ tipo: 'grupos' })
  const setVistaConHistorial = useCallback((nuevaVista: Vista) => {
    window.history.pushState({ vista: nuevaVista.tipo, data: JSON.stringify(nuevaVista) }, '')
    vistaRef.current = nuevaVista
    setVista(nuevaVista)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePopState = useCallback((e: PopStateEvent) => {
    const state = e.state as { vista?: string; data?: string } | null
    if (!state?.vista) { window.location.href = '/login'; return }
    if (state.vista === 'grupos') {
      if (vistaRef.current.tipo === 'grupos') { window.location.href = '/login' }
      else { setVista({ tipo: 'grupos' }); vistaRef.current = { tipo: 'grupos' } }
      return
    }
    try {
      if (state.data) { const v = JSON.parse(state.data) as Vista; setVista(v); vistaRef.current = v }
    } catch { setVista({ tipo: 'grupos' }); vistaRef.current = { tipo: 'grupos' } }
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  // ── Loading / Error ──
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando tus grupos...</p>
      </div>
    </div>
  )

  if (error || !docente) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm" style={{ color: '#dc2626' }}>{error || 'Error al cargar datos'}</p>
    </div>
  )

  const gruposPorId = docente.asignaciones.reduce((acc: Record<string, GrupoAgrupado>, asig) => {
    if (!acc[asig.grupo_id]) acc[asig.grupo_id] = { id: asig.grupo_id, numero: asig.grupo_numero, grado: asig.grupo_grado, asignaturas: [] }
    acc[asig.grupo_id].asignaturas.push({ id: asig.asignatura_id as string, nombre: asig.asignatura_nombre as string })
    return acc
  }, {} as Record<string, GrupoAgrupado>)
  const grupos = Object.values(gruposPorId)

  // ── Sub-vistas ──
  if (vista.tipo === 'editar-asistencia') return (
    <AsistenciaView
      asignatura={vista.asignatura}
      grupoId={vista.grupo.id}
      fechaEditar={vista.fecha}
      onBack={() => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })}
      onGuardado={(fechaGuardada) => {
        cargarCompletadas()
        setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now(), fechaEditadaExito: fechaGuardada })
      }}
    />
  )

  if (vista.tipo === 'asistencia') return (
    <AsistenciaView
      asignatura={vista.asignatura}
      grupoId={vista.grupo.id}
      onBack={() => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })}
      onGuardado={(fechaGuardada) => {
        cargarCompletadas()
        setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now(), fechaEditadaExito: fechaGuardada })
      }}
    />
  )

  if (vista.tipo === 'confirmar') return (
    <ConfirmarFechaView
      key={`${vista.grupo.id}-${vista.asignatura.id}-${vista.ts ?? 0}`}
      asignatura={vista.asignatura}
      grupo={vista.grupo}
      onConfirmar={() => setVistaConHistorial({ tipo: 'asistencia', grupo: vista.grupo, asignatura: vista.asignatura })}
      onBack={() => setVistaConHistorial({ tipo: 'asignaturas', grupo: vista.grupo })}
      onEstadoHoy={marcarCompletada}
      fechaEditadaExito={vista.fechaEditadaExito ?? null}
      onEditarFecha={(fecha) => setVistaConHistorial({ tipo: 'editar-asistencia', grupo: vista.grupo, asignatura: vista.asignatura, fecha })}
    />
  )

  if (vista.tipo === 'asignaturas') return (
    <AsignaturasView
      grupo={vista.grupo}
      onSelect={asig => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: asig })}
      onBack={() => setVistaConHistorial({ tipo: 'grupos' })}
    />
  )

  // ── Vista principal de grupos ──
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4fa' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .grupos-wrap {
          max-width: 100%;
          padding: 1.25rem 0.75rem 2rem;
        }
        @media (min-width: 768px) {
          .grupos-wrap { padding: 1.5rem 1.25rem 3rem; }
        }

        .grupos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.125rem;
          margin-top: 1.75rem;
        }
        @media (min-width: 640px) {
          .grupos-grid { grid-template-columns: repeat(2, 1fr); gap: 1.375rem; margin-top: 2rem; }
        }
        @media (min-width: 1024px) {
          .grupos-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2.25rem; }
        }
        .card-color-top { min-height: 120px; }
        @media (min-width: 640px) { .card-color-top { min-height: 140px; } }

        .btn-accion {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; border-radius: 10px;
          background: white; border: 1px solid #e2e8f0;
          font-size: 0.78rem; font-weight: 600; color: #3a3a3c;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          white-space: nowrap; cursor: pointer;
          text-decoration: none;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .btn-accion:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.09);
          transform: translateY(-1px);
        }

        .horario-txt { display: inline-flex; }
        .horario-ico { display: none; }
        @media (max-width: 767px) {
          .horario-txt { display: none; }
          .horario-ico { display: flex; width: 38px; height: 38px; border-radius: 50%; background: white; border: 1px solid #e2e8f0; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        }
      `}</style>

      <div className="grupos-wrap">

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a5f', margin: '0 0 0.25rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              Mis grupos
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, textTransform: 'capitalize', fontWeight: 500 }}>
              {formatFechaHoy()}
            </p>
          </div>
        </div>

        {/* ── Grid de grupos ── */}
        {grupos.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '40vh' }}>
            <div style={{ textAlign: 'center', maxWidth: 320 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <svg width="30" height="30" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', marginBottom: '0.375rem' }}>Sin grupos asignados</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contacta al administrador</p>
            </div>
          </div>
        ) : (
          <div className="grupos-grid">
            {grupos.map((grupo, idx) => {
              const completadasCount = grupo.asignaturas.filter(a => completadas.has(`${grupo.id}:${a.id}`)).length
              const todasCompletas   = grupo.asignaturas.length > 0 && completadasCount === grupo.asignaturas.length
              const hayClaseAqui     = false // Se mantiene en false tras quitar el widget
              return (
                <GrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  idx={idx}
                  hayClaseAqui={hayClaseAqui}
                  completadasCount={completadasCount}
                  todasCompletas={todasCompletas}
                  onClick={() => setVistaConHistorial({ tipo: 'asignaturas', grupo })}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}