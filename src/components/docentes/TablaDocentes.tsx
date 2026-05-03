'use client'
import { type Docente } from '@/hooks/useDocentes'
import { AsignaturasCell } from './AsignaturasCell'
import { UltimoAcceso } from './UltimoAcceso'

const PALETA = [
  { from: '#3b82f6', to: '#2563eb' },
  { from: '#8b5cf6', to: '#7c3aed' },
  { from: '#14b8a6', to: '#0d9488' },
  { from: '#f59e0b', to: '#d97706' },
  { from: '#ec4899', to: '#db2777' },
  { from: '#10b981', to: '#059669' },
]
function getColor(nombre: string) {
  return PALETA[nombre.charCodeAt(0) % PALETA.length]
}

const COLS = '2fr 1.4fr 1.4fr 1.2fr 0.9fr'

interface Props {
  docentes: Docente[]
  loading: boolean
  busqueda: string
  docenteExpandido: string | null
  onToggleExpandido: (id: string) => void
  onInvitar: (d: Docente) => void
  onEditar: (d: Docente) => void
  onEliminarAsignaturas: (d: Docente) => void
  onEliminar: (d: Docente) => void
}

export function TablaDocentes({
  docentes, loading, busqueda,
  docenteExpandido, onToggleExpandido,
  onInvitar, onEditar, onEliminarAsignaturas, onEliminar,
}: Props) {
  const filtrados = docentes.filter(d =>
    d.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.asignaciones.some(a =>
      a.asignatura_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${a.grupo_grado}${a.grupo_numero}`.includes(busqueda)
    )
  )

  return (
    <div style={{ flex: 1, background: 'white', borderRadius: '1rem', border: '1px solid #f0f0f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '0.875rem 1.5rem', borderBottom: '1px solid #f4f4f8', flexShrink: 0, background: '#fafafa' }}>
        {['Docente', 'Asignaturas', 'Último acceso', 'Email / Estado', 'Acciones'].map(col => (
          <span key={col} style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a0a0b0' }}>{col}</span>
        ))}
      </div>

      {/* Filas */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e8e8f0', borderTopColor: '#1e6fcc', animation: 'spin 0.8s linear infinite' }}/>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#c0c0d0" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
              {busqueda ? 'No se encontraron docentes' : 'No hay docentes registrados'}
            </p>
          </div>
        ) : filtrados.map((docente, idx) => {
          const ini = docente.nombre_completo.split(' ').filter(w => w.length > 0).slice(0, 2).map(w => w[0].toUpperCase()).join('')
          const col = getColor(docente.nombre_completo)
          const expandido = docenteExpandido === docente.id

          return (
            <div key={docente.id} style={{ borderBottom: idx < filtrados.length - 1 ? '1px solid #f7f7fb' : 'none' }}>

              {/* Fila principal */}
              <div
                style={{ display: 'grid', gridTemplateColumns: COLS, padding: '1rem 1.5rem', alignItems: 'center', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Docente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', background: `linear-gradient(135deg, ${col.from}, ${col.to})`, fontFamily: 'Outfit, sans-serif' }}>
                    {ini}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{docente.nombre_completo}</p>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.15rem 0 0' }}>{docente.asignaciones.length} asignación{docente.asignaciones.length !== 1 ? 'es' : ''}</p>
                  </div>
                </div>

                {/* Asignaturas */}
                <AsignaturasCell
                  docente={docente}
                  expandido={expandido}
                  onToggle={() => onToggleExpandido(docente.id)}
                />

                {/* Último acceso */}
                <UltimoAcceso authId={docente.auth_id} />

                {/* Email / Estado */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.375rem' }}>
                    <svg width="12" height="12" fill="none" stroke="#c0c0d0" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, display: 'block' }}>{docente.email}</span>
                  </div>
                  {docente.cuenta_activada ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 9999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Cuenta activa</span>
                  ) : docente.invitacion_enviada ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 9999, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>⏳ Pendiente</span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 9999, background: '#f4f4f8', color: '#9ca3af', border: '1px solid #ebebf0' }}>Sin invitar</span>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!docente.cuenta_activada && (
                    <button onClick={() => onInvitar(docente)} title="Enviar invitación"
                      style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.transform = 'scale(1.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'scale(1)' }}>
                      I
                    </button>
                  )}
                  {[
                    { letra: 'E', label: 'Editar',               bg: '#eff6ff', color: '#2563eb', hover: '#dbeafe', action: () => onEditar(docente) },
                    { letra: 'A', label: 'Eliminar asignaturas', bg: '#fffbeb', color: '#d97706', hover: '#fef3c7', action: () => onEliminarAsignaturas(docente) },
                    { letra: 'X', label: 'Eliminar',             bg: '#fef2f2', color: '#dc2626', hover: '#fee2e2', action: () => onEliminar(docente) },
                  ].map(btn => (
                    <button key={btn.letra} onClick={btn.action} title={btn.label}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: btn.bg, color: btn.color, border: `1px solid ${btn.hover}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.background = btn.hover; e.currentTarget.style.transform = 'scale(1.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = btn.bg; e.currentTarget.style.transform = 'scale(1)' }}>
                      {btn.letra}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila expandida */}
              {expandido && (
                <div style={{ padding: '0.625rem 1.5rem 1rem', background: '#f9fafb', borderTop: '1px solid #f0f0f5', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {docente.asignaciones.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: 'white', border: '1px solid #f0f0f5' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}/>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e6fcc', background: '#eff6ff', padding: '0.1rem 0.375rem', borderRadius: 5, border: '1px solid #bfdbfe', whiteSpace: 'nowrap' }}>
                        {a.grupo_grado}°-{a.grupo_numero}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#374151' }}>{a.asignatura_nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.625rem 1.5rem', borderTop: '1px solid #f4f4f8', background: '#fafafa', flexShrink: 0 }}>
        <p style={{ fontSize: '0.7rem', color: '#a0a0b0', margin: 0 }}>
          {filtrados.length} docente{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}