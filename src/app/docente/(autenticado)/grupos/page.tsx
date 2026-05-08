// src/app/docente/(autenticado)/grupos/page.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useDocente } from '@/contexts/DocenteContext'
import HorarioAhoraWidget, { type ClaseActivaInfo } from '@/components/docente/HorarioAhoraWidget'
import ConfirmarFechaView from '@/components/docente/grupos/ConfirmarFechaView'
import AsistenciaView from '@/components/docente/grupos/AsistenciaView'
import type { AsignaturaItem, GrupoAgrupado } from '@/components/docente/grupos/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatFechaHoy() {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── Vista: Selección de asignatura ──────────────────────────────────────────
function AsignaturasView({ grupo, onSelect, onBack }: { grupo: GrupoAgrupado; onSelect: (a: AsignaturaItem) => void; onBack: () => void }) {
  return (
    <div className="p-4 md:p-6" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>Grupo {grupo.numero}</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Selecciona la asignatura</p>
        </div>
      </div>
      <style>{`
        .asig-grid { display: flex; flex-direction: column; gap: 0.75rem; }
        @media (min-width: 768px) { .asig-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; } }
        @media (min-width: 768px) { .asig-pc { display: block !important; } .asig-mobile { display: none !important; } }
      `}</style>
      <div className="asig-grid">
        {grupo.asignaturas.map((asig: AsignaturaItem) => (
          <button key={asig.id} onClick={() => onSelect(asig)}
            style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 16, padding: '1.5rem 1rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#fafeff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5ea'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'white' }}>
            <div className="asig-pc" style={{ display: 'none' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.625rem' }}>
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📒</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f', lineHeight: 1.4 }}>{asig.nombre}</span>
            </div>
            <div className="asig-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📒</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>{asig.nombre}</span>
              </div>
              <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Botón macOS ─────────────────────────────────────────────────────────────
function MacButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const fechaCorta = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <>
      <style>{`
        @keyframes macBounce { 0%{transform:translateY(0)} 30%{transform:translateY(-5px)} 60%{transform:translateY(1px)} 100%{transform:translateY(0)} }
        @keyframes emojiBounce { 0%{transform:scale(1) rotate(0deg)} 30%{transform:scale(1.4) rotate(-15deg)} 60%{transform:scale(0.9) rotate(8deg)} 100%{transform:scale(1) rotate(0deg)} }
        .emoji-bounce { transition: transform 0.2s; }
        .emoji-bounce:hover { animation: emojiBounce 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @media (max-width: 767px) { .mac-btn-desktop { display: none !important; } .mac-btn-mobile { display: flex !important; } }
        @media (min-width: 768px) { .mac-btn-desktop { display: flex !important; } .mac-btn-mobile { display: none !important; } }
      `}</style>
      {/* Dessktop */}
      <button className="mac-btn-desktop" onClick={onClick}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[{ color: '#ff5f57', shadow: 'rgba(255,95,87,0.5)' }, { color: '#febc2e', shadow: 'rgba(254,188,46,0.5)' }, { color: '#28c840', shadow: 'rgba(40,200,64,0.5)' }].map((dot, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: dot.color, boxShadow: hovered ? ('0 0 6px ' + dot.shadow) : 'none', animation: hovered ? ('macBounce 0.45s cubic-bezier(0.34,1.56,0.64,1) ' + (i * 0.08) + 's both') : 'none', transition: 'box-shadow 0.2s' }}/>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: hovered ? '#1e3a5f' : '#94a3b8', transition: 'color 0.2s', lineHeight: 1.3 }}>Tomar asistencia</span>
          <span style={{ fontSize: '0.68rem', color: '#5b9af0', fontWeight: 500, maxHeight: hovered ? '20px' : '0px', opacity: hovered ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.2s ease', marginTop: hovered ? 1 : 0 }}>{fechaCorta}</span>
        </div>
      </button>
      {/* Mobile */}
      <div className="mac-btn-mobile" style={{ display: 'none', gap: '0.625rem', width: '100%' }}>
        <div style={{ flex: 1, background: 'white', border: '1px solid #e5e5ea', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Hoy</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1c1e', textTransform: 'capitalize', marginTop: 2 }}>{fechaCorta}</span>
        </div>
        <button onClick={onClick} style={{ flex: 1, background: 'white', border: '1px solid #e5e5ea', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }}/>
              ))}
            </div>
            <svg width="12" height="12" fill="none" stroke="#c7c7cc" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          <span className="emoji-bounce" style={{ fontSize: '1.1rem', lineHeight: 1, display: 'inline-block' }}>📝</span>
        </button>
      </div>
    </>
  )
}

// ─── Tipos de vista ───────────────────────────────────────────────────────────
type Vista =
  | { tipo: 'grupos' }
  | { tipo: 'asignaturas'; grupo: GrupoAgrupado }
  | { tipo: 'confirmar'; grupo: GrupoAgrupado; asignatura: AsignaturaItem; ts?: number }
  | { tipo: 'asistencia'; grupo: GrupoAgrupado; asignatura: AsignaturaItem }

// ─── Página principal ─────────────────────────────────────────────────────────
export default function GruposPage() {
  const { docente, loading, error } = useDocente()
  const [vista, setVista]           = useState<Vista>({ tipo: 'grupos' })
  const [claseActiva, setClaseActiva]     = useState<ClaseActivaInfo | null>(null)
  const [completadas, setCompletadas]     = useState<Set<string>>(new Set())
  const supabase = createClient()

  // Consultar qué asignaturas ya tienen asistencia hoy al cargar y al volver
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
    async function init() {
      if (cancelled) return
      await cargarCompletadas()
    }
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

  if (vista.tipo === 'asistencia') return (
    <AsistenciaView
      asignatura={vista.asignatura}
      grupoId={vista.grupo.id}
      onBack={() => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })}
      onGuardado={() => {
          cargarCompletadas()
          setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: vista.asignatura, ts: Date.now() })
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
    />
  )

  if (vista.tipo === 'asignaturas') return (
    <AsignaturasView
      grupo={vista.grupo}
      onSelect={asig => setVistaConHistorial({ tipo: 'confirmar', grupo: vista.grupo, asignatura: asig })}
      onBack={() => setVistaConHistorial({ tipo: 'grupos' })}
    />
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto" style={{ minHeight: '100vh' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold" style={{ color: '#1e3a5f' }}>Mis grupos asignados</h1>
          <p className="text-xs md:text-sm mt-1 capitalize" style={{ color: '#94a3b8' }}>{formatFechaHoy()}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'white', border: '1px solid #e5e5ea', fontSize: '0.78rem', fontWeight: 600, color: '#3a3a3c', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <span style={{ fontSize: '0.9rem' }}>📘</span>
            Seguimiento
          </span>
          <Link href="/docente/horario" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <style>{`
              .horario-desktop { display: inline-flex; }
              .horario-mobile  { display: none; }
              @media (max-width: 767px) { .horario-desktop { display: none; } .horario-mobile { display: flex; } }
            `}</style>
            <span className="horario-desktop" style={{ alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'white', border: '1px solid #e5e5ea', fontSize: '0.78rem', fontWeight: 600, color: '#3a3a3c', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>⏰</span>
              Activar recordatorio de clases
            </span>
            <span className="horario-mobile" style={{ width: 38, height: 38, borderRadius: '50%', background: 'white', border: '1px solid #e5e5ea', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⏰</span>
            </span>
          </Link>
        </div>
      </div>

      {docente && (
        <HorarioAhoraWidget
          docenteId={docente.id}
          nombre={docente.nombre_completo}
          onClaseActiva={setClaseActiva}
          asignaciones={docente.asignaciones.map(a => ({
            asignatura_id: a.asignatura_id,
            grupo_numero:  a.grupo_numero,
            grupo_id:      a.grupo_id,
          }))}
        />
      )}

      {grupos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
              <svg width="32" height="32" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1e3a5f' }}>No tienes grupos asignados</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Contacta al administrador</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" style={{ alignItems: 'stretch' }}>
          {grupos.map(grupo => (
            <div key={grupo.id}
              style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>

              <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.3rem', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
                      Grupo {grupo.numero}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                        {grupo.grado}° Semestre
                      </p>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#c7c7cc', display: 'inline-block' }}/>
                      <p style={{ fontSize: '0.7rem', color: '#8e8e93', margin: 0, fontWeight: 500 }}>
                        {grupo.asignaturas.length} {grupo.asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
                      </p>
                    </div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#3a3a3c', fontFamily: 'Outfit, sans-serif' }}>{grupo.numero}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', flex: 1, background: 'white' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', flex: 1, maxHeight: 112, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e5e5ea transparent', background: '#f0fdf4', borderRadius: 10, padding: '0.5rem' }}>
                  {[...grupo.asignaturas]
                    .sort((a, b) => {
                      const aActiva = claseActiva?.asignatura_id === a.id && claseActiva?.grupo_id === grupo.id ? -1 : 0
                      const bActiva = claseActiva?.asignatura_id === b.id && claseActiva?.grupo_id === grupo.id ? -1 : 0
                      return aActiva - bActiva
                    })
                    .map((asig) => {
                      const esActiva = claseActiva?.asignatura_id === asig.id && claseActiva?.grupo_id === grupo.id
                      return (
                        <div key={asig.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 8, background: esActiva ? '#dcfce7' : 'white', border: esActiva ? '2px solid #16a34a' : '1px solid #e5e5ea', transition: 'all 0.3s', boxShadow: esActiva ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none' }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f2f2f7', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>📖</span>
                          </div>
                          <span style={{ fontSize: '0.775rem', color: '#3a3a3c', fontWeight: 500, lineHeight: 1.3 }}>{asig.nombre}</span>
                        </div>
                      )
                    })
                  }
                </div>
                {grupo.asignaturas.every(a => completadas.has(`${grupo.id}:${a.id}`)) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a' }}>Asistencia completada</span>
                  </div>
                ) : (
                  <MacButton onClick={() => setVistaConHistorial({ tipo: 'asignaturas', grupo })}/>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}