'use client'
import { useState } from 'react'
import Header from '@/components/Header'

type Permisos = {
  inicio:      boolean
  docentes:    boolean
  seguimiento: boolean
  sistema:     boolean
  roles:       boolean
}

type Usuario = {
  id: string
  nombre: string
  email: string
  permisos: Permisos
  creadoEn: string
}

const PERMISOS_INFO: { key: keyof Permisos; label: string; desc: string }[] = [
  { key: 'inicio',      label: 'Inicio estadístico', desc: 'Gráficas y estadísticas'        },
  { key: 'docentes',    label: 'Docentes',            desc: 'Gestión de docentes'            },
  { key: 'seguimiento', label: 'Seguimiento',         desc: 'Seguimiento académico'          },
  { key: 'sistema',     label: 'Sistema',             desc: 'Configuración del sistema'      },
  { key: 'roles',       label: 'Roles',               desc: 'Usuarios y permisos'            },
]

const MAX_USUARIOS = 5

const usuariosIniciales: Usuario[] = [
  {
    id: '1',
    nombre: 'Ana González',
    email: 'ana.gonzalez@cbta62.edu.mx',
    permisos: { inicio: true, docentes: true, seguimiento: true, sistema: false, roles: false },
    creadoEn: '12 Mar 2026',
  },
  {
    id: '2',
    nombre: 'Luis Ramírez',
    email: 'luis.ramirez@cbta62.edu.mx',
    permisos: { inicio: true, docentes: false, seguimiento: true, sistema: false, roles: false },
    creadoEn: '14 Mar 2026',
  },
]

function Switch({ activo, onChange }: { activo: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex items-center rounded-full transition-all duration-300 shrink-0"
      style={{ width: '40px', height: '22px', background: activo ? '#16a34a' : '#d1d5db' }}
    >
      <span
        className="inline-block rounded-full bg-white shadow-sm transition-all duration-300"
        style={{ width: '16px', height: '16px', transform: activo ? 'translateX(20px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

function Avatar({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colores   = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
  const color     = colores[nombre.charCodeAt(0) % colores.length]
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
      style={{ background: color }}>
      {iniciales}
    </div>
  )
}

export default function RolesPage() {
  const [usuarios, setUsuarios]               = useState<Usuario[]>(usuariosIniciales)
  const [modalAbierto, setModalAbierto]       = useState(false)
  const [editando, setEditando]               = useState<Usuario | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<Usuario | null>(null)
  const [form, setForm]                       = useState({ nombre: '', email: '' })
  const [permisos, setPermisos]               = useState<Permisos>({
    inicio: false, docentes: false, seguimiento: false, sistema: false, roles: false,
  })

  const puedeAgregar = usuarios.length < MAX_USUARIOS

  function abrirNuevo() {
    setEditando(null)
    setForm({ nombre: '', email: '' })
    setPermisos({ inicio: false, docentes: false, seguimiento: false, sistema: false, roles: false })
    setModalAbierto(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({ nombre: u.nombre, email: u.email })
    setPermisos({ ...u.permisos })
    setModalAbierto(true)
  }

  function guardar() {
    if (!form.nombre.trim() || !form.email.trim()) return
    if (editando) {
      setUsuarios(prev => prev.map(u =>
        u.id === editando.id ? { ...u, nombre: form.nombre, email: form.email, permisos } : u
      ))
    } else {
      setUsuarios(prev => [...prev, {
        id:       Date.now().toString(),
        nombre:   form.nombre,
        email:    form.email,
        permisos,
        creadoEn: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      }])
    }
    setModalAbierto(false)
  }

  function eliminar() {
    if (!confirmEliminar) return
    setUsuarios(prev => prev.filter(u => u.id !== confirmEliminar.id))
    setConfirmEliminar(null)
  }

  function togglePermiso(key: keyof Permisos) {
    setPermisos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col h-full">
      <Header titulo="Roles del Sistema" />

      <div className="p-6 space-y-4">

        {/* Contador */}
        <div>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {usuarios.length} de {MAX_USUARIOS} perfiles creados
          </p>
          <div className="mt-1.5 w-48 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width:      `${(usuarios.length / MAX_USUARIOS) * 100}%`,
                background: usuarios.length >= MAX_USUARIOS ? '#dc2626' : '#3b82f6',
              }} />
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-4">
          {usuarios.map(u => (
            <div key={u.id} className="bg-white rounded-2xl shadow-sm overflow-hidden"
              style={{ border: '1px solid #f1f5f9' }}>
              <div className="h-16 w-full"
                style={{ background: 'linear-gradient(135deg, #dce8f5, #eff6ff)' }} />
              <div className="px-5 pb-5">
                <div className="flex justify-center -mt-8 mb-3">
                  <div style={{ border: '3px solid white', borderRadius: '9999px' }}>
                    <Avatar nombre={u.nombre} />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold" style={{ color: '#1e3a5f' }}>{u.nombre}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{u.email}</p>
                  <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Creado el {u.creadoEn}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {PERMISOS_INFO.filter(p => u.permisos[p.key]).map(p => (
                    <span key={p.key}
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      {p.label}
                    </span>
                  ))}
                  {PERMISOS_INFO.filter(p => u.permisos[p.key]).length === 0 && (
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Sin permisos asignados</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEditar(u)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl transition"
                    style={{ background: '#eff6ff', color: '#2563eb' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                    Editar
                  </button>
                  <button onClick={() => setConfirmEliminar(u)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl transition"
                    style={{ background: '#fef2f2', color: '#dc2626' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {puedeAgregar && (
            <button onClick={abrirNuevo}
              className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md"
              style={{ border: '2px dashed #e2e8f0', minHeight: '280px' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: '#eff6ff' }}>
                <span className="text-2xl font-bold" style={{ color: '#3b82f6' }}>+</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#3b82f6' }}>Agregar perfil</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                {MAX_USUARIOS - usuarios.length} espacio{MAX_USUARIOS - usuarios.length !== 1 ? 's' : ''} disponible{MAX_USUARIOS - usuarios.length !== 1 ? 's' : ''}
              </p>
            </button>
          )}
        </div>
      </div>

      {/* ── Modal crear / editar ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
              style={{ borderColor: '#f1f5f9' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
                  {editando ? 'Editar perfil' : 'Nuevo perfil'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  Configura los datos y permisos del usuario
                </p>
              </div>
              <button onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">

              {/* Nombre + Email en fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }}>
                    Nombre completo
                  </label>
                  <input type="text" placeholder="Nombre del usuario"
                    value={form.nombre}
                    onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }}>
                    Correo electrónico
                  </label>
                  <input type="email" placeholder="correo@escuela.edu.mx"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ borderColor: '#e2e8f0' }} />
                </div>
              </div>

              {/* Permisos en 2 columnas */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                  Permisos de acceso
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISOS_INFO.map(p => (
                    <div key={p.key}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition"
                      style={{
                        background: permisos[p.key] ? '#f0fdf4' : '#f8fafc',
                        border:     `1px solid ${permisos[p.key] ? '#bbf7d0' : '#f1f5f9'}`,
                      }}>
                      <div className="mr-2 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#1e3a5f' }}>{p.label}</p>
                        <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{p.desc}</p>
                      </div>
                      <Switch activo={permisos[p.key]} onChange={() => togglePermiso(p.key)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl border transition"
                  style={{ borderColor: '#e2e8f0', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={guardar}
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                  style={{ background: '#1e3a5f' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}>
                  {editando ? 'Guardar cambios' : 'Crear perfil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar ── */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: '#fef2f2' }}>
                <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-center mb-2" style={{ color: '#1e3a5f' }}>¿Estás seguro?</h3>
            <p className="text-sm text-center mb-1" style={{ color: '#475569' }}>Estás a punto de eliminar a</p>
            <p className="text-sm font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>{confirmEliminar.nombre}</p>
            <p className="text-xs text-center mb-6" style={{ color: '#94a3b8' }}>No podrás recuperarlo si lo borras.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                style={{ background: '#2563eb' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
                Regresar
              </button>
              <button onClick={eliminar}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                style={{ background: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}