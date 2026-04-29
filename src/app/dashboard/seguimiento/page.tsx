// src/app/dashboard/seguimiento/page.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type AsignacionGrupo = { asignatura: string; asignatura_id: string; docente: string; docente_id: string }
type Grupo = { id: string; numero: string; grado: number; ciclo_escolar: string; activo: boolean; plantel_id: string; total_alumnos: number; asignaciones: AsignacionGrupo[] }
type Alumno = { id: string; nombre_completo: string; matricula: string | null }
type ResumenAsistencia = { estudiante_id: string; total: number; presentes: number; ausentes: number; porcentaje: number }
type Vista = 'semestres' | 'grupos' | 'alumnos'
type Direccion = 'adelante' | 'atras'
type FiltroPanel = 'asignaturas' | null

function useViewTransition() {
  const [visible, setVisible] = useState(true)
  function transicionar(fn: () => void) { setVisible(false); setTimeout(() => { fn(); setVisible(true) }, 220) }
  return { visible, transicionar }
}

function VolverBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem 0', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#1e3a5f')}
      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Volver
    </button>
  )
}

// ─── Modal toggle ─────────────────────────────────────────────────────────────
function ModalToggle({ grado, activando, onConfirmar, onCerrar }: { grado: number; activando: boolean; onConfirmar: () => void; onCerrar: () => void }) {
  const [cerrando, setCerrando] = useState(false)
  function cerrar() { setCerrando(true); setTimeout(onCerrar, 350) }
  function confirmar() { setCerrando(true); setTimeout(() => { onConfirmar(); onCerrar() }, 350) }
  return createPortal(
    <>
      <style>{`@keyframes bdI{from{opacity:0}to{opacity:1}}@keyframes bdO{from{opacity:1}to{opacity:0}}@keyframes mI{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes mO{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.92) translateY(12px)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: cerrando ? 'bdO 0.35s ease forwards' : 'bdI 0.22s ease' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1.25rem', width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', animation: cerrando ? 'mO 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'mI 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ background: activando ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
            <button onClick={cerrar} style={{ position: 'absolute', top: '1rem', right: '1rem', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>{activando ? 'Activar' : 'Desactivar'} {grado}° Semestre</p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ background: activando ? '#f0fdf4' : '#fef2f2', border: ('1px solid ' + (activando ? '#bbf7d0' : '#fecaca')), borderRadius: '0.875rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: activando ? '#15803d' : '#dc2626', margin: 0, fontWeight: 500 }}>
                {activando ? '✓ Los docentes podrán registrar calificaciones y asistencias.' : '⚠️ Los docentes no podrán registrar ni editar datos.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={cerrar} style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmar} style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.875rem', border: 'none', background: activando ? '#16a34a' : '#dc2626', color: 'white', cursor: 'pointer' }}>Sí, {activando ? 'activar' : 'desactivar'}</button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Card de grado ────────────────────────────────────────────────────────────
function GradoCard({ grado, grupos, onClick, idx }: { grado: number; grupos: Grupo[]; onClick: () => void; idx: number }) {
  const [activo, setActivo] = useState(grupos.some(g => g.activo))
  const [modal, setModal] = useState(false)
  const [pendiente, setPendiente] = useState<boolean | null>(null)
  const totalAlumnos = grupos.reduce((s, g) => s + g.total_alumnos, 0)

  return (
    <>
      <button onClick={onClick}
        style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.25rem', textAlign: 'left', cursor: 'pointer', padding: 0, overflow: 'hidden', transition: 'all 0.22s ease', animation: ('cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ' + idx * 0.07 + 's both') }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
        <div style={{ background: 'linear-gradient(135deg,#64748b,#94a3b8)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 800, color: '#1e3a5f', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>{grado}</div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', margin: 0, fontFamily: 'Outfit,sans-serif' }}>{grado}° Semestre</p>
          </div>
          <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grupos</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a5f', margin: 0, fontFamily: 'Outfit,sans-serif' }}>{grupos.length}</p>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: '#f1f5f9' }}/>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alumnos</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a5f', margin: 0, fontFamily: 'Outfit,sans-serif' }}>{totalAlumnos}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div onClick={e => { e.stopPropagation(); setPendiente(!activo); setModal(true) }}
              style={{ width: 44, height: 24, borderRadius: 9999, background: activo ? '#16a34a' : '#dc2626', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', boxShadow: activo ? '0 0 8px rgba(22,163,74,0.35)' : '0 0 8px rgba(220,38,38,0.25)' }}>
              <div style={{ position: 'absolute', top: 3, left: activo ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)' }}/>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: activo ? '#16a34a' : '#dc2626' }}>{activo ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
      </button>
      {modal && pendiente !== null && (
        <ModalToggle grado={grado} activando={pendiente} onConfirmar={() => setActivo(pendiente!)} onCerrar={() => { setPendiente(null); setModal(false) }}/>
      )}
    </>
  )
}

// ─── Vista alumnos ────────────────────────────────────────────────────────────
function AlumnosVista({ grupo, alumnos, asistencias, semanas, loadingAlumnos, volver }: {
  grupo: Grupo; alumnos: Alumno[]; asistencias: ResumenAsistencia[]; semanas: string[]; loadingAlumnos: boolean; volver: () => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [searchExp, setSearchExp] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Estado de filtros
  const [panelAbierto, setPanelAbierto] = useState<FiltroPanel>(null)
  const [asigSelec, setAsigSelec] = useState<AsignacionGrupo | null>(null)
  const [dropSemana, setDropSemana] = useState(false)
  const [semanaSelec, setSemanaSelec] = useState<string | null>(null)

  const tieneAsig = asigSelec !== null
  const asistMap = Object.fromEntries(asistencias.map(a => [a.estudiante_id, a]))
  const tieneAsistencias = asistencias.some(a => a.total > 0)

  const filtrados = alumnos.filter(a =>
    a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.matricula ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  // Botones de filtro
  const btns = [
    { id: 'asignaturas', label: 'Asignatura', sub: asigSelec?.asignatura ?? null, activo: true },
    { id: 'periodo',     label: 'Período',     sub: null,                           activo: false },
    { id: 'calificaciones', label: 'Calificaciones', sub: null,                    activo: false },
    { id: 'asistencias', label: 'Asistencias', sub: semanaSelec ? ('Sem. ' + semanaSelec) : null, activo: tieneAsig },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <VolverBtn onClick={volver}/>
          <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>Grupo {grupo.numero}</p>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{grupo.grado}° Semestre</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Botones filtro */}
          {btns.map(btn => {
            const estaAbierto = panelAbierto === btn.id || (btn.id === 'asistencias' && dropSemana)
            const tieneValor = btn.sub !== null
            const disabled = !btn.activo

            return (
              <div key={btn.id} style={{ position: 'relative' }}>
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return
                    if (btn.id === 'asignaturas') {
                      setPanelAbierto(panelAbierto === 'asignaturas' ? null : 'asignaturas')
                      setDropSemana(false)
                    } else if (btn.id === 'asistencias') {
                      setDropSemana(p => !p)
                      setPanelAbierto(null)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.45rem 0.875rem', borderRadius: '0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: estaAbierto || tieneValor ? 700 : 500,
                    color: disabled ? '#cbd5e1' : (estaAbierto || tieneValor) ? '#1e3a5f' : '#64748b',
                    background: disabled ? '#fafafa' : (estaAbierto || tieneValor) ? 'white' : '#f8fafc',
                    border: ('1px solid ' + (disabled ? '#f1f5f9' : (tieneValor ? '#bfdbfe' : '#e2e8f0'))),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    boxShadow: estaAbierto ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  <span>{btn.label}{btn.sub ? (' · ' + btn.sub) : ''}</span>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    style={{ transform: estaAbierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown semanas */}
                {btn.id === 'asistencias' && dropSemana && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 160, animation: 'cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    {semanas.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Sin semanas registradas</p>
                      </div>
                    ) : semanas.map((sem, idx) => (
                      <button key={sem} onClick={() => { setSemanaSelec(semanaSelec === sem ? null : sem); setDropSemana(false) }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.625rem 1rem', fontSize: '0.8rem', fontWeight: semanaSelec === sem ? 700 : 500, color: semanaSelec === sem ? '#1e3a5f' : '#475569', background: semanaSelec === sem ? '#eff6ff' : 'white', border: 'none', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => { if (semanaSelec !== sem) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (semanaSelec !== sem) e.currentTarget.style.background = 'white' }}>
                        Semana {sem}
                        {semanaSelec === sem && <svg width="11" height="11" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>}
                      </button>
                    ))}
                    {semanaSelec && (
                      <button onClick={() => { setSemanaSelec(null); setDropSemana(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%', padding: '0.525rem 1rem', fontSize: '0.78rem', fontWeight: 500, color: '#dc2626', background: 'white', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        Quitar filtro
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Limpiar */}
          {(asigSelec || semanaSelec) && (
            <button onClick={() => { setAsigSelec(null); setSemanaSelec(null); setPanelAbierto(null) }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}>
              × Limpiar
            </button>
          )}

          <div style={{ width: 1, height: 18, background: '#e2e8f0' }}/>

          {/* Buscador */}
          <div style={{ display: 'flex', alignItems: 'center', height: 36, borderRadius: '0.875rem', border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', width: searchExp ? 200 : 36, cursor: searchExp ? 'text' : 'pointer' }}
            onClick={() => { if (!searchExp) { setSearchExp(true); setTimeout(() => searchRef.current?.focus(), 50) } }}
            onMouseLeave={() => { if (!busqueda) { searchRef.current?.blur(); setSearchExp(false) } }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input ref={searchRef} type="text" placeholder="Buscar alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              onFocus={() => setSearchExp(true)} onBlur={() => { if (!busqueda) setSearchExp(false) }}
              style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#334155', background: 'transparent', width: '100%', opacity: searchExp ? 1 : 0, transition: 'opacity 0.2s' }}/>
            {busqueda && <button onClick={e => { e.stopPropagation(); setBusqueda('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 0.4rem', fontSize: '1rem', lineHeight: 1 }}>✕</button>}
          </div>
        </div>
      </div>

      {/* Panel asignaturas — se despliega sobre la tabla */}
      {panelAbierto === 'asignaturas' && (
        <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'cardIn 0.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Selecciona una asignatura</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                {['Asignatura', 'Docente', ''].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupo.asignaciones.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>Sin asignaturas registradas</td></tr>
              ) : grupo.asignaciones.map((asig, idx) => {
                const seleccionada = asigSelec?.asignatura_id === asig.asignatura_id && asigSelec?.docente_id === asig.docente_id
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', background: seleccionada ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => { setAsigSelec(seleccionada ? null : asig); setPanelAbierto(null) }}
                    onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!seleccionada) e.currentTarget.style.background = 'white' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: seleccionada ? 700 : 500, color: seleccionada ? '#1e3a5f' : '#334155' }}>{asig.asignatura}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{asig.docente.charAt(0)}</div>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{asig.docente}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      {seleccionada
                        ? <svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>
                        : <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info asignatura seleccionada */}
      {asigSelec && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', background: '#eff6ff', borderRadius: '0.875rem', border: '1px solid #bfdbfe', animation: 'cardIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{asigSelec.docente.charAt(0)}</div>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Docente asignado</p>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>{asigSelec.docente}</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 9999, background: 'white', color: '#2563eb', border: '1px solid #bfdbfe' }}>{asigSelec.asignatura}</span>
          {semanaSelec && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 9999, background: 'white', color: '#7c3aed', border: '1px solid #ddd6fe' }}>Sem. {semanaSelec}</span>}
        </div>
      )}

      {/* Tabla alumnos */}
      <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        {loadingAlumnos ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }}/>
          </div>
        ) : !tieneAsig ? (
          /* Estado vacío — sin asignatura seleccionada */
          <div style={{ padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', margin: 0 }}>Selecciona una asignatura para ver los datos</p>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: 0 }}>Usa el botón <strong>Asignatura</strong> en la parte superior</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No se encontraron alumnos</p>
          </div>
        ) : (
          <>
            <div style={{ maxHeight: 'calc(8 * 56px + 44px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    {['#', 'Alumno', 'Matrícula', 'Asistencia', 'Faltas'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((alumno, i) => {
                    const asist = asistMap[alumno.id]
                    return (
                      <tr key={alumno.id} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                              {alumno.nombre_completo.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1e3a5f' }}>{alumno.nombre_completo}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{alumno.matricula ?? '—'}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {tieneAsistencias && asist && asist.total > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 9999, background: '#f1f5f9', maxWidth: 60 }}>
                                <div style={{ height: '100%', borderRadius: 9999, background: asist.porcentaje >= 80 ? '#16a34a' : '#dc2626', width: (asist.porcentaje + '%') }}/>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: asist.porcentaje >= 80 ? '#16a34a' : '#dc2626' }}>{asist.porcentaje}%</span>
                            </div>
                          ) : <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>Sin datos</span>}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {tieneAsistencias && asist && asist.total > 0
                            ? <span style={{ fontSize: '0.875rem', fontWeight: 700, color: asist.ausentes > 5 ? '#dc2626' : '#475569' }}>{asist.ausentes}</span>
                            : <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>{filtrados.length} alumnos · {asigSelec.asignatura}</p>
              {!tieneAsistencias && <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Sin registros de asistencia aún</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeguimientoPage() {
  const supabase = createClient()
  const [vista, setVista] = useState<Vista>('semestres')
  const [dir, setDir] = useState<Direccion>('adelante')
  const { visible, transicionar } = useViewTransition()

  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [gradoActivo, setGradoActivo] = useState<number | null>(null)
  const [grupoActivo, setGrupoActivo] = useState<Grupo | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [asistencias, setAsistencias] = useState<ResumenAsistencia[]>([])
  const [semanas, setSemanas] = useState<string[]>([])
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)

  useEffect(() => {
    async function cargar() {
      setLoadingGrupos(true)
      const { data: gruposData } = await supabase
        .from('grupos')
        .select('id, numero, grado, ciclo_escolar, activo, plantel_id')
        .eq('activo', true)   // ← solo grupos activos
        .order('grado').order('numero')

      if (!gruposData) { setLoadingGrupos(false); return }

      const { data: asignData } = await supabase
        .from('asignaciones_docentes')
        .select('grupo_id, asignaturas(id, nombre), usuarios(id, nombre_completo)')

      const asignMap: Record<string, AsignacionGrupo[]> = {}
      ;(asignData ?? []).forEach((row: Record<string, unknown>) => {
        const grupoId = row.grupo_id as string
        const rawAsig = row.asignaturas as { id: string; nombre: string } | { id: string; nombre: string }[] | null
        const rawUser = row.usuarios as { id: string; nombre_completo: string } | { id: string; nombre_completo: string }[] | null
        const asig = Array.isArray(rawAsig) ? rawAsig[0] : rawAsig
        const user = Array.isArray(rawUser) ? rawUser[0] : rawUser
        if (!asignMap[grupoId]) asignMap[grupoId] = []
        if (asig && user) {
          asignMap[grupoId].push({
            asignatura: asig.nombre,
            asignatura_id: asig.id,
            docente: user.nombre_completo,
            docente_id: user.id,
          })
        }
      })

      const conConteo = await Promise.all(gruposData.map(async g => {
        const { count } = await supabase
          .from('estudiantes')
          .select('id', { count: 'exact', head: true })
          .eq('grupo_id', g.id)
          .eq('activo', true)
        return { ...g, total_alumnos: count ?? 0, asignaciones: asignMap[g.id] ?? [] }
      }))

      setGrupos(conConteo)
      setLoadingGrupos(false)
    }
    cargar()
  }, [supabase])

  const cargarGrupo = useCallback(async (grupo: Grupo) => {
    setLoadingAlumnos(true)
    setAlumnos([]); setAsistencias([]); setSemanas([])

    const { data: alumnosData } = await supabase
      .from('estudiantes')
      .select('id, nombre_completo, matricula')
      .eq('grupo_id', grupo.id)
      .eq('activo', true)
      .order('nombre_completo')

    if (!alumnosData) { setLoadingAlumnos(false); return }
    setAlumnos(alumnosData)

    const { data: asistData } = await supabase
      .from('asistencias')
      .select('estudiante_id, estado, fecha')
      .eq('grupo_id', grupo.id)

    if (asistData && asistData.length > 0) {
      const resumen: Record<string, ResumenAsistencia> = {}
      alumnosData.forEach(a => { resumen[a.id] = { estudiante_id: a.id, total: 0, presentes: 0, ausentes: 0, porcentaje: 0 } })
      asistData.forEach(r => {
        if (!resumen[r.estudiante_id]) return
        resumen[r.estudiante_id].total++
        if (r.estado === 'P') resumen[r.estudiante_id].presentes++
        if (r.estado === 'A') resumen[r.estudiante_id].ausentes++
      })
      Object.values(resumen).forEach(r => { r.porcentaje = r.total > 0 ? Math.round((r.presentes / r.total) * 100) : 0 })
      setAsistencias(Object.values(resumen))

      // Semanas únicas con asistencia registrada
      const fechasUnicas = [...new Set(asistData.map(r => r.fecha as string))].sort()
      setSemanas(fechasUnicas)
    }

    setLoadingAlumnos(false)
  }, [supabase])

  function nav(nuevaVista: Vista, d: Direccion, fn?: () => void) {
    setDir(d); transicionar(() => { fn?.(); setVista(nuevaVista) })
  }

  const gradosMap = grupos.reduce((acc, g) => {
    if (!acc[g.grado]) acc[g.grado] = []
    acc[g.grado].push(g)
    return acc
  }, {} as Record<number, Grupo[]>)
  const grados = Object.keys(gradosMap).map(Number).sort()
  const gruposDelGrado = gradoActivo ? (gradosMap[gradoActivo] ?? []) : []

  const slideIn = dir === 'adelante' ? 'translateX(18px)' : 'translateX(-18px)'

  return (
    <div className="flex flex-col h-full">
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Header titulo="Seguimiento Académico"/>
      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', gap: '1rem' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0) scale(1)' : (slideIn + ' scale(0.985)'), transition: visible ? 'opacity 0.38s cubic-bezier(0.34,1.56,0.64,1),transform 0.38s cubic-bezier(0.34,1.56,0.64,1)' : 'opacity 0.2s ease,transform 0.2s ease' }}>

          {/* Vista semestres */}
          {vista === 'semestres' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingGrupos ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }}/>
                </div>
              ) : grados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>No hay semestres activos</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>{grupos[0]?.ciclo_escolar ?? ''}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {grados.map((grado, idx) => (
                      <GradoCard key={grado} grado={grado} grupos={gradosMap[grado]} idx={idx}
                        onClick={() => nav('grupos', 'adelante', () => setGradoActivo(grado))}/>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Vista grupos */}
          {vista === 'grupos' && gradoActivo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <VolverBtn onClick={() => nav('semestres', 'atras', () => setGradoActivo(null))}/>
                <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>{gradoActivo}° Semestre</p>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{gruposDelGrado[0]?.ciclo_escolar}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {gruposDelGrado.map((grupo, i) => (
                  <button key={grupo.id}
                    onClick={() => { nav('alumnos', 'adelante', () => setGrupoActivo(grupo)); cargarGrupo(grupo) }}
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'all 0.22s ease', animation: ('cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ' + i * 0.06 + 's both') }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                        {grupo.numero}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Grupo {grupo.numero}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>{grupo.total_alumnos} alumnos</p>
                      </div>
                    </div>
                    {grupo.asignaciones.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {[...new Set(grupo.asignaciones.map(a => a.asignatura))].map(asig => (
                          <span key={asig} style={{ fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 9999, background: 'rgba(59,130,246,0.07)', color: '#4f88e3', border: '1px solid rgba(59,130,246,0.15)' }}>{asig}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vista alumnos */}
          {vista === 'alumnos' && grupoActivo && (
            <AlumnosVista
              grupo={grupoActivo} alumnos={alumnos} asistencias={asistencias}
              semanas={semanas} loadingAlumnos={loadingAlumnos}
              volver={() => nav('grupos', 'atras', () => setGrupoActivo(null))}
            />
          )}
        </div>
      </div>
    </div>
  )
}