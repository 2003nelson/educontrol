// src/app/dashboard/seguimiento/page.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'
import SemanaSlidePanel, { type Semana } from '@/components/dashboard/seguimiento/SemanaSlidePanel'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type AsignacionGrupo   = { asignatura: string; asignatura_id: string; docente: string; docente_id: string }
type Grupo             = { id: string; numero: string; grado: number; ciclo_escolar: string; activo: boolean; plantel_id: string; total_alumnos: number; asignaciones: AsignacionGrupo[] }
type Alumno            = { id: string; nombre_completo: string; matricula: string | null }
type ResumenAsistencia = { estudiante_id: string; total: number; presentes: number; ausentes: number; porcentaje: number }
type RegistroDia       = { fecha: string; estado: string }
type AsistenciaDiaria  = Record<string, RegistroDia[]>
type Vista             = 'semestres' | 'grupos' | 'alumnos'
type Direccion         = 'adelante' | 'atras'
type FiltroPanel       = 'asignaturas' | null

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInicioSemana(fecha: Date): Date {
  const d = new Date(fecha)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatFechaCorta(iso: string): string {
  const [y, m, dia] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(dia)).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function generarSemanas(fechasRegistradas: string[]): Semana[] {
  if (fechasRegistradas.length === 0) return []
  const hoy = new Date()
  const primerFecha = new Date(fechasRegistradas[0] + 'T12:00:00')
  let cursor = getInicioSemana(primerFecha)
  const semanas: Semana[] = []
  while (cursor <= hoy) {
    const fin = new Date(cursor)
    fin.setDate(fin.getDate() + 4)
    semanas.push({
      inicio: formatISO(cursor),
      fin: formatISO(fin),
      label: cursor.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
        ' – ' + fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }
  return semanas.reverse()
}

function diasDeSemana(inicioISO: string): { iso: string; letra: string }[] {
  return ['L', 'M', 'M', 'J', 'V'].map((letra, i) => {
    const d = new Date(inicioISO + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return { iso: formatISO(d), letra }
  })
}

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

// ─── Modal toggle activo/inactivo ─────────────────────────────────────────────
function ModalToggle({ grado, activando, onConfirmar, onCerrar }: { grado: number; activando: boolean; onConfirmar: () => void; onCerrar: () => void }) {
  const [cerrando, setCerrando] = useState(false)
  function cerrar() { setCerrando(true); setTimeout(onCerrar, 350) }
  function confirmar() { setCerrando(true); setTimeout(() => { onConfirmar(); onCerrar() }, 350) }
  return createPortal(
    <>
      <style>{`
        @keyframes bdI { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bdO { from { opacity: 1 } to { opacity: 0 } }
        @keyframes mI  { from { opacity: 0; transform: scale(0.92) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes mO  { from { opacity: 1; transform: scale(1) translateY(0) } to { opacity: 0; transform: scale(0.92) translateY(12px) } }
      `}</style>
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
      <div
        style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', animation: ('cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ' + idx * 0.07 + 's both') }}
        onClick={onClick}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* Cabecera */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f2f2f7' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
                Semestre
              </p>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1c1e', margin: 0, fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
                {grado}°
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#8e8e93', margin: 0, fontWeight: 500 }}>
                  {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
                </p>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#c7c7cc', display: 'inline-block' }}/>
                <p style={{ fontSize: '0.7rem', color: '#8e8e93', margin: 0, fontWeight: 500 }}>
                  {totalAlumnos} alumnos
                </p>
              </div>
            </div>
            {/* Número grande */}
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#3a3a3c', fontFamily: 'Outfit, sans-serif' }}>{grado}</span>
            </div>
          </div>
        </div>

        {/* Footer con grupos y toggle */}
        <div style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Grupos como dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
            {grupos.slice(0, 3).map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c7c7cc', flexShrink: 0 }}/>
                <span style={{ fontSize: '0.75rem', color: '#3a3a3c', fontWeight: 500 }}>Grupo {g.numero}</span>
              </div>
            ))}
            {grupos.length > 3 && (
              <span style={{ fontSize: '0.7rem', color: '#8e8e93', paddingLeft: '0.875rem' }}>+{grupos.length - 3} más</span>
            )}
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}
            onClick={e => { e.stopPropagation(); setPendiente(!activo); setModal(true) }}>
            <div style={{ width: 44, height: 24, borderRadius: 9999, background: activo ? '#16a34a' : '#dc2626', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', boxShadow: activo ? '0 0 8px rgba(22,163,74,0.3)' : '0 0 8px rgba(220,38,38,0.2)' }}>
              <div style={{ position: 'absolute', top: 3, left: activo ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)' }}/>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: activo ? '#16a34a' : '#dc2626' }}>{activo ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
      </div>
      {modal && pendiente !== null && (
        <ModalToggle grado={grado} activando={pendiente} onConfirmar={() => setActivo(pendiente!)} onCerrar={() => { setPendiente(null); setModal(false) }}/>
      )}
    </>
  )
}

// ─── Tabla asistencia semanal L-V ─────────────────────────────────────────────
function TablaAsistenciaSemanal({ alumnos, asistenciaDiaria, semanaInicio }: {
  alumnos: Alumno[]
  asistenciaDiaria: AsistenciaDiaria
  semanaInicio: string
}) {
  const dias = diasDeSemana(semanaInicio)
  const [tooltip, setTooltip] = useState<{ id: string; texto: string } | null>(null)

  return (
    <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #f1f5f9', position: 'relative' }} onClick={() => setTooltip(null)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 1.25rem', borderBottom: '1px solid #f1f5f9', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {[
          { icon: <svg width="11" height="11" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>, bg: '#f0fdf4', border: '#bbf7d0', label: 'Presente',    color: '#64748b' },
          { icon: <svg width="10" height="10" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>, bg: '#fef2f2', border: '#fecaca', label: 'Falta',       color: '#64748b' },
          { icon: <svg width="10" height="10" fill="none" stroke="#d97706" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>, bg: '#fffbeb', border: '#fde68a', label: 'Justificada', color: '#64748b' },
          { icon: <svg width="10" height="10" fill="none" stroke="#7c3aed" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>, bg: '#f5f3ff', border: '#ddd6fe', label: 'Retardo',     color: '#64748b' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 20, height: 20, borderRadius: '0.375rem', background: item.bg, border: ('1px solid ' + item.border), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
            <span style={{ fontSize: '0.68rem', color: item.color, fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ maxHeight: 'calc(8 * 56px + 44px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', width: 40 }}>#</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alumno</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Matrícula</th>
              {dias.map(d => (
                <th key={d.iso} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', minWidth: 36 }}>{d.letra}</th>
              ))}
              <th style={{ textAlign: 'center', padding: '0.75rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 48 }}>Faltas</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno, i) => {
              const registros = asistenciaDiaria[alumno.id] ?? []
              const regMap = Object.fromEntries(registros.map(r => [r.fecha, r.estado]))
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
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{alumno.matricula ?? '—'}</span>
                  </td>
                  {dias.map(d => {
                    const estado = regMap[d.iso]
                    const esPresente = estado === 'presente'
                    const esFalta    = estado === 'falta'
                    const esJustif   = estado === 'justificada'
                    const esRetardo  = estado === 'retardo'
                    const tieneReg   = !!estado
                    const tooltipId = alumno.id + d.iso
                    return (
                      <td key={d.iso} style={{ textAlign: 'center', padding: '0.875rem 0.5rem', position: 'relative' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '0.5rem', background: esPresente ? '#16a34a' : esFalta ? '#dc2626' : esJustif ? 'linear-gradient(135deg,#f59e0b,#d97706)' : esRetardo ? '#7c3aed' : '#f1f1f4', border: tieneReg ? 'none' : '1px solid #e5e5ea', cursor: tieneReg ? 'pointer' : 'default' }}
                          onClick={e => {
                            if (!tieneReg) return
                            e.stopPropagation()
                            const label = esPresente ? 'Presente' : esFalta ? 'Falta' : esJustif ? 'Justificada' : 'Retardo'
                            const id = alumno.id + d.iso
                            setTooltip(prev => prev?.id === id ? null : { id, texto: formatFechaCorta(d.iso) + ' · ' + label })
                          }}
                        >
                          {esPresente && <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {esFalta    && <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {esJustif   && <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {esRetardo  && <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>}
                          {!tieneReg  && <span style={{ fontSize: '0.55rem', color: '#e2e8f0' }}>—</span>}
                        </div>
                        {tooltip?.id === tooltipId && (
                          <div
                            onClick={e => { e.stopPropagation(); setTooltip(null) }}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              right: '110%',
                              transform: 'translateY(-50%)',
                              background: '#1c1c1e',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              padding: '4px 10px',
                              borderRadius: 7,
                              zIndex: 50,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              pointerEvents: 'auto',
                            }}>
                            {tooltip.texto}
                            <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '4px solid #1c1c1e' }}/>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td style={{ textAlign: 'center', padding: '0.875rem 0.75rem' }}>
                    {(() => {
                      const faltas = dias.filter(d => regMap[d.iso] === 'falta').length
                      return faltas > 0
                        ? <span style={{ fontSize: '0.85rem', fontWeight: 700, color: faltas >= 3 ? '#dc2626' : '#f59e0b', background: faltas >= 3 ? '#fef2f2' : '#fffbeb', padding: '2px 10px', borderRadius: 9999, border: faltas >= 3 ? '1px solid #fecaca' : '1px solid #fde68a' }}>{faltas}</span>
                        : <span style={{ fontSize: '0.75rem', color: '#c7c7cc' }}>—</span>
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}

// ─── Vista alumnos ────────────────────────────────────────────────────────────
function AlumnosVista({ grupo, alumnos, loadingAlumnos, volver }: {
  grupo: Grupo
  alumnos: Alumno[]
  loadingAlumnos: boolean
  volver: () => void
}) {
  const supabase = createClient()
  const [busqueda, setBusqueda]   = useState('')
  const [searchExp, setSearchExp] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const [panelAbierto, setPanelAbierto]   = useState<FiltroPanel>(null)
  const [asigSelec, setAsigSelec]         = useState<AsignacionGrupo | null>(null)
  const [semanaSlide, setSemanaSlide]     = useState(false)
  const [semanaSelec, setSemanaSelec]     = useState<string | null>(null)

  // ── Asistencias — cargadas al seleccionar asignatura ──────────────────────
  const [asistencias, setAsistencias]           = useState<ResumenAsistencia[]>([])
  const [asistenciaDiaria, setAsistenciaDiaria] = useState<AsistenciaDiaria>({})
  const [semanas, setSemanas]                   = useState<Semana[]>([])
  const [loadingAsist, setLoadingAsist]         = useState(false)

  // Cada vez que cambia la asignatura seleccionada, recargar asistencias
  useEffect(() => {
    // Capturar valores antes del async para evitar null en closures
    const asigId    = asigSelec?.asignatura_id ?? null
    const docenteId = asigSelec?.docente_id ?? null

    async function cargarAsistencias() {
      setLoadingAsist(true)
      setAsistencias([])
      setAsistenciaDiaria({})
      setSemanas([])
      setSemanaSelec(null)

      if (!asigId || !docenteId) { setLoadingAsist(false); return }

      // ── FIX PRINCIPAL: filtrar por asignatura_id Y docente_id ──────────────
      const { data: asistData } = await supabase
        .from('asistencias')
        .select('estudiante_id, estado, fecha')
        .eq('grupo_id', grupo.id)
        .eq('asignatura_id', asigId)
        .eq('docente_id', docenteId)

      if (asistData && asistData.length > 0) {
        // Resumen general
        const resumen: Record<string, ResumenAsistencia> = {}
        alumnos.forEach(a => { resumen[a.id] = { estudiante_id: a.id, total: 0, presentes: 0, ausentes: 0, porcentaje: 0 } })
        asistData.forEach(r => {
          if (!resumen[r.estudiante_id]) return
          resumen[r.estudiante_id].total++
          if (r.estado === 'presente') resumen[r.estudiante_id].presentes++
          if (r.estado === 'falta')    resumen[r.estudiante_id].ausentes++
        })
        Object.values(resumen).forEach(r => { r.porcentaje = r.total > 0 ? Math.round((r.presentes / r.total) * 100) : 0 })
        setAsistencias(Object.values(resumen))

        // Diaria por alumno
        const diaria: AsistenciaDiaria = {}
        alumnos.forEach(a => { diaria[a.id] = [] })
        asistData.forEach(r => {
          if (!diaria[r.estudiante_id]) diaria[r.estudiante_id] = []
          diaria[r.estudiante_id].push({ fecha: r.fecha as string, estado: r.estado as string })
        })
        setAsistenciaDiaria(diaria)

        const fechasUnicas = [...new Set(asistData.map(r => r.fecha as string))].sort()
        setSemanas(generarSemanas(fechasUnicas))
      }

      setLoadingAsist(false)
    }

    cargarAsistencias()
  }, [asigSelec, grupo.id, alumnos, supabase])

  const tieneAsig        = asigSelec !== null
  const asistMap         = Object.fromEntries(asistencias.map(a => [a.estudiante_id, a]))
  const tieneAsistencias = asistencias.some(a => a.total > 0)
  const semanaActual     = semanas.find(s => s.inicio === semanaSelec) ?? null

  const filtrados = alumnos.filter(a =>
    a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.matricula ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const btns = [
    { id: 'asignaturas',    label: 'Asignatura',    sub: asigSelec?.asignatura ?? null,            activo: true },
    { id: 'periodo',        label: 'Período',        sub: null,                                     activo: false },
    { id: 'calificaciones', label: 'Calificaciones', sub: null,                                     activo: false },
    { id: 'asistencias',    label: 'Asistencias',    sub: semanaActual ? semanaActual.label : null,  activo: tieneAsig },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <VolverBtn onClick={volver}/>
          <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>Grupo {grupo.numero}</p>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{grupo.grado}° Semestre</span>
          <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
          <div style={{ display: 'flex', alignItems: 'center', height: 32, borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', width: searchExp ? 180 : 32, cursor: searchExp ? 'text' : 'pointer' }}
            onClick={() => { if (!searchExp) { setSearchExp(true); setTimeout(() => searchRef.current?.focus(), 50) } }}
            onMouseLeave={() => { if (!busqueda) { searchRef.current?.blur(); setSearchExp(false) } }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input ref={searchRef} type="text" placeholder="Buscar alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              onFocus={() => setSearchExp(true)} onBlur={() => { if (!busqueda) setSearchExp(false) }}
              style={{ border: 'none', outline: 'none', fontSize: '0.78rem', color: '#334155', background: 'transparent', width: '100%', opacity: searchExp ? 1 : 0, transition: 'opacity 0.2s' }}/>
            {busqueda && <button onClick={e => { e.stopPropagation(); setBusqueda('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 0.4rem', fontSize: '1rem', lineHeight: 1 }}>✕</button>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {btns.map(btn => {
            const estaAbierto = panelAbierto === btn.id
            const tieneValor  = btn.sub !== null
            const disabled    = !btn.activo
            return (
              <div key={btn.id} style={{ position: 'relative' }}>
                <button disabled={disabled}
                  onClick={() => {
                    if (disabled) return
                    if (btn.id === 'asignaturas') setPanelAbierto(panelAbierto === 'asignaturas' ? null : 'asignaturas')
                    else if (btn.id === 'asistencias') { setSemanaSlide(true); setPanelAbierto(null) }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: estaAbierto || tieneValor ? 700 : 500, color: disabled ? '#cbd5e1' : (estaAbierto || tieneValor) ? '#1e3a5f' : '#64748b', background: disabled ? '#fafafa' : (estaAbierto || tieneValor) ? 'white' : '#f8fafc', border: '1px solid ' + (disabled ? '#f1f5f9' : tieneValor ? '#bfdbfe' : '#e2e8f0'), cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, boxShadow: estaAbierto ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s', maxWidth: btn.id === 'asignaturas' && tieneValor ? 220 : 'none', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{btn.label}{btn.sub ? (' · ' + btn.sub) : ''}</span>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: estaAbierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )
          })}
          {(asigSelec || semanaSelec) && (
            <button onClick={() => { setAsigSelec(null); setSemanaSelec(null); setPanelAbierto(null) }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}>
              × Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Panel asignaturas */}
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
                const sel = asigSelec?.asignatura_id === asig.asignatura_id && asigSelec?.docente_id === asig.docente_id
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', background: sel ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => { setAsigSelec(sel ? null : asig); setPanelAbierto(null) }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'white' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: sel ? 700 : 500, color: sel ? '#1e3a5f' : '#334155' }}>{asig.asignatura}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{asig.docente.charAt(0)}</div>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{asig.docente}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      {sel
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(242,242,247,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid #e5e5ea', animation: 'cardIn 0.22s cubic-bezier(0.34,1.56,0.64,1)', flexWrap: 'wrap' }}>
          {/* Avatar docente */}
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{asigSelec.docente.charAt(0)}</div>
          <div>
            <p style={{ fontSize: '0.6rem', color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Docente</p>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1c1c1e', margin: 0 }}>{asigSelec.docente}</p>
          </div>
          {/* Pills */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 12px', borderRadius: 9999, background: 'white', color: '#3a3a3c', border: '1px solid #e5e5ea', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>{asigSelec.asignatura}</span>
            {semanaActual && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 12px', borderRadius: 9999, background: 'white', color: '#3a3a3c', border: '1px solid #e5e5ea', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>{semanaActual.label}</span>}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {loadingAlumnos || loadingAsist ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', display: 'flex', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }}/>
        </div>
      ) : !tieneAsig ? (
        <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #f1f5f9', padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
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
      ) : !semanaSelec ? (
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          {filtrados.length === 0 ? (
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
                                  <div style={{ height: '100%', borderRadius: 9999, background: asist.porcentaje >= 80 ? '#16a34a' : '#dc2626', width: asist.porcentaje + '%' }}/>
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
                {!tieneAsistencias
                  ? <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Sin registros de asistencia aún</p>
                  : <button onClick={() => setSemanaSlide(true)}
                      style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '3px 10px', cursor: 'pointer' }}>
                      Ver por semana →
                    </button>
                }
              </div>
            </>
          )}
        </div>
      ) : (
        <TablaAsistenciaSemanal
          alumnos={filtrados}
          asistenciaDiaria={asistenciaDiaria}
          semanaInicio={semanaSelec}
        />
      )}

      {semanaSlide && (
        <SemanaSlidePanel
          semanas={semanas}
          semanaSelec={semanaSelec}
          onSelec={setSemanaSelec}
          onCerrar={() => setSemanaSlide(false)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeguimientoPage() {
  const supabase = createClient()
  const [vista, setVista] = useState<Vista>('semestres')
  const [dir, setDir]     = useState<Direccion>('adelante')
  const { visible, transicionar } = useViewTransition()

  const [grupos, setGrupos]               = useState<Grupo[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [gradoActivo, setGradoActivo]     = useState<number | null>(null)
  const [grupoActivo, setGrupoActivo]     = useState<Grupo | null>(null)
  const [alumnos, setAlumnos]             = useState<Alumno[]>([])
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)

  useEffect(() => {
    async function cargar() {
      setLoadingGrupos(true)
      const { data: gruposData } = await supabase
        .from('grupos')
        .select('id, numero, grado, ciclo_escolar, activo, plantel_id')
        .eq('activo', true)
        .order('grado').order('numero')

      if (!gruposData) { setLoadingGrupos(false); return }

      const { data: asignData } = await supabase
        .from('asignaciones_docentes')
        .select('grupo_id, asignaturas(id, nombre), usuarios(id, nombre_completo)')

      const asignMap: Record<string, AsignacionGrupo[]> = {}
      ;(asignData ?? []).forEach((row: Record<string, unknown>) => {
        const grupoId  = row.grupo_id as string
        const rawAsig  = row.asignaturas as { id: string; nombre: string } | { id: string; nombre: string }[] | null
        const rawUser  = row.usuarios as { id: string; nombre_completo: string } | { id: string; nombre_completo: string }[] | null
        const asig     = Array.isArray(rawAsig) ? rawAsig[0] : rawAsig
        const user     = Array.isArray(rawUser) ? rawUser[0] : rawUser
        if (!asignMap[grupoId]) asignMap[grupoId] = []
        if (asig && user) asignMap[grupoId].push({ asignatura: asig.nombre, asignatura_id: asig.id, docente: user.nombre_completo, docente_id: user.id })
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

  // ── Cargar alumnos del grupo — ya NO carga asistencias ───────────────────
  const cargarGrupo = useCallback(async (grupo: Grupo) => {
    setLoadingAlumnos(true)
    setAlumnos([])

    const { data: alumnosData } = await supabase
      .from('estudiantes')
      .select('id, nombre_completo, matricula')
      .eq('grupo_id', grupo.id)
      .eq('activo', true)
      .order('nombre_completo')

    setAlumnos(alumnosData ?? [])
    setLoadingAlumnos(false)
  }, [supabase])

  function nav(nuevaVista: Vista, d: Direccion, fn?: () => void) {
    setDir(d); transicionar(() => { fn?.(); setVista(nuevaVista) })
  }

  const gradosMap       = grupos.reduce((acc, g) => { if (!acc[g.grado]) acc[g.grado] = []; acc[g.grado].push(g); return acc }, {} as Record<number, Grupo[]>)
  const grados          = Object.keys(gradosMap).map(Number).sort()
  const gruposDelGrado  = gradoActivo ? (gradosMap[gradoActivo] ?? []) : []
  const slideIn         = dir === 'adelante' ? 'translateX(18px)' : 'translateX(-18px)'

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
      `}</style>
      <Header titulo="Seguimiento Académico"/>
      <div className="px-4 pb-4 pt-3 flex flex-col" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', gap: '1rem' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0) scale(1)' : (slideIn + ' scale(0.985)'), transition: visible ? 'opacity 0.38s cubic-bezier(0.34,1.56,0.64,1),transform 0.38s cubic-bezier(0.34,1.56,0.64,1)' : 'opacity 0.2s ease,transform 0.2s ease' }}>

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

          {vista === 'grupos' && gradoActivo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <VolverBtn onClick={() => nav('semestres', 'atras', () => setGradoActivo(null))}/>
                <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>{gradoActivo}° Semestre</p>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{gruposDelGrado[0]?.ciclo_escolar}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {gruposDelGrado.map((grupo, i) => {
                  const asignaturasUnicas = [...new Set(grupo.asignaciones.map(a => a.asignatura))]
                  return (
                    <button key={grupo.id}
                      onClick={() => { nav('alumnos', 'adelante', () => setGrupoActivo(grupo)); cargarGrupo(grupo) }}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'all 0.22s ease', animation: ('cardIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ' + i * 0.06 + 's both') }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: '#f2f2f7', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800, color: '#3a3a3c', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                          {grupo.numero}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Grupo {grupo.numero}</p>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>{grupo.total_alumnos} alumnos</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
                            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }}/>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Asignaturas: <strong style={{ color: '#64748b' }}>{asignaturasUnicas.length}</strong>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {vista === 'alumnos' && grupoActivo && (
            <AlumnosVista
              grupo={grupoActivo}
              alumnos={alumnos}
              loadingAlumnos={loadingAlumnos}
              volver={() => nav('grupos', 'atras', () => setGrupoActivo(null))}
            />
          )}
        </div>
      </div>
    </div>
  )
}