// src/app/super-admin/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { crearUsuarioDirector, validarSubdomain } from './actions'
import { useAuth } from '@/lib/hooks/useAuth'

type Plantel = {
  id: string
  subdominio: string
  nombre: string
  nombre_completo: string
  activo: boolean
  plan: string
  created_at: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // 🔒 USAR HOOK useAuth
  const { user, rol, loading: authLoading } = useAuth()

  const [planteles, setPlanteles] = useState<Plantel[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [subdominio, setSubdominio] = useState('')
  const [nombre, setNombre] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [plan, setPlan] = useState('basico')
  
  // Admin user states
  const [emailAdmin, setEmailAdmin] = useState('')
  const [nombreAdmin, setNombreAdmin] = useState('')
  const [passwordAdmin, setPasswordAdmin] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creando, setCreando] = useState(false)

  // Validación en tiempo real de subdomain
  const [subdominioValido, setSubdominioValido] = useState<boolean | null>(null)
  const [subdominioError, setSubdominioError] = useState('')

  // 🔒 PROTECCIÓN: Redirigir si no es super admin
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (rol !== 'super_admin') {
      console.warn(`[Security] Acceso denegado a super-admin (rol: ${rol})`)
      router.push('/dashboard')
      return
    }
  }, [user, rol, authLoading, router])

  // Cargar planteles
  useEffect(() => {
    if (!user || rol !== 'super_admin') return

    async function cargarPlanteles() {
      setLoading(true)
      const { data, error } = await supabase
        .from('planteles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando planteles:', error)
      } else {
        setPlanteles(data || [])
      }
      setLoading(false)
    }

    cargarPlanteles()
  }, [user, rol, supabase])

  // 🔒 VALIDAR SUBDOMAIN en tiempo real
  useEffect(() => {
    if (!subdominio) {
      setSubdominioValido(null)
      setSubdominioError('')
      return
    }

    const timer = setTimeout(async () => {
      const result = await validarSubdomain(subdominio)
      setSubdominioValido(result.valido)
      setSubdominioError(result.error || '')
    }, 500)

    return () => clearTimeout(timer)
  }, [subdominio])

  async function crearPlantel() {
    // ─────────────────────────────────────────────────────────
    // 🔒 VALIDACIONES
    // ─────────────────────────────────────────────────────────
    if (!subdominio || !nombre || !emailAdmin || !nombreAdmin || !passwordAdmin) {
      setError('Completa todos los campos obligatorios')
      return
    }

    if (!subdominioValido) {
      setError('Subdomain inválido o no disponible')
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAdmin)) {
      setError('Email inválido')
      return
    }

    // Validar password
    if (passwordAdmin.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setCreando(true)
    setError('')
    setSuccess('')

    // ─────────────────────────────────────────────────────────
    // 🔒 CREACIÓN CON ROLLBACK
    // ─────────────────────────────────────────────────────────
    try {
      // PASO 1: Crear plantel
      const { data: plantelData, error: plantelError } = await supabase
        .from('planteles')
        .insert({
          subdominio: subdominio.toLowerCase().trim(),
          nombre: nombre.trim(),
          nombre_completo: nombreCompleto.trim() || nombre.trim(),
          plan,
          activo: true,
        })
        .select()
        .single()

      if (plantelError || !plantelData) {
        throw new Error('Error al crear el plantel')
      }

      // PASO 2: Crear usuario director
      let usuarioId: string
      try {
        const usuarioCreado = await crearUsuarioDirector(
          emailAdmin,
          passwordAdmin,
          nombreAdmin,
          plantelData.id
        )
        usuarioId = usuarioCreado.id
      } catch (userError) {
        // 🔒 ROLLBACK: Eliminar plantel si falla creación de usuario
        await supabase.from('planteles').delete().eq('id', plantelData.id)
        throw userError
      }

      // PASO 3: Crear perfil
      try {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .insert({
            id: usuarioId,
            plantel_id: plantelData.id,
            rol: 'director',
            nombre_completo: nombreAdmin.trim(),
            email: emailAdmin.trim().toLowerCase(),
            activo: true,
          })

        if (perfilError) {
          throw perfilError
        }
      } catch (perfilError) {
        // 🔒 ROLLBACK: Marcar plantel inactivo si falla perfil
        console.error('Error creando perfil, iniciando rollback:', perfilError)
        
        await supabase
          .from('planteles')
          .update({ activo: false })
          .eq('id', plantelData.id)
        
        throw new Error('Error al crear el perfil del director')
      }

      // ─────────────────────────────────────────────────────────
      // ✅ ÉXITO
      // ─────────────────────────────────────────────────────────
      setSuccess(`✅ Plantel "${nombre}" creado exitosamente`)

      // Limpiar formulario
      setSubdominio('')
      setNombre('')
      setNombreCompleto('')
      setPlan('basico')
      setEmailAdmin('')
      setNombreAdmin('')
      setPasswordAdmin('')

      // Recargar lista
      const { data } = await supabase
        .from('planteles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setPlanteles(data)

      // Cerrar modal después de 3 segundos
      setTimeout(() => {
        setShowModal(false)
        setSuccess('')
      }, 3000)

    } catch (err) {
      const error = err as Error
      console.error('[Super Admin] Error:', error)
      
      // 🔒 No exponer detalles técnicos
      if (error.message.includes('ya está registrado')) {
        setError('Este email ya está registrado')
      } else if (error.message.includes('No autorizado')) {
        setError('Sesión expirada. Vuelve a iniciar sesión')
      } else {
        setError('Error al crear el plantel. Intenta nuevamente.')
      }
    } finally {
      setCreando(false)
    }
  }

  async function togglePlantelActivo(id: string, activo: boolean) {
    const { error } = await supabase
      .from('planteles')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado')
    } else {
      // Actualizar lista local
      setPlanteles(prev => 
        prev.map(p => p.id === id ? { ...p, activo: !activo } : p)
      )
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 🔒 LOADING STATE
  if (authLoading || !user || rol !== 'super_admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium font-sans">
          Verificando credenciales maestras...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-gray-200/80 sticky top-0 z-10 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-xl font-['Outfit']">D</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 font-['Outfit']">
                  Dinoti Console
                </h1>
                <p className="text-xs text-gray-500 font-medium">Gestión Global EduControl</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cerrar Sesión
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg font-medium shadow-sm transition-all"
              >
                + Nuevo Plantel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Planteles Activos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Supervisa y administra las instancias de tus clientes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-6 h-6 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-sm">Cargando infraestructura...</p>
          </div>
        ) : planteles.length === 0 ? (
          <div 
            className="text-center py-20 bg-white rounded-2xl border border-gray-200/60 shadow-sm" 
            style={{ animation:'fadeIn 0.4s ease' }}
          >
            <h3 className="text-gray-900 font-medium mb-1">Ningún plantel configurado</h3>
            <p className="text-sm text-gray-500 mb-6">
              Comienza registrando tu primera escuela en el sistema.
            </p>
            <button 
              onClick={() => setShowModal(true)} 
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Crear primer plantel →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {planteles.map((plantel) => (
              <div
                key={plantel.id}
                className="bg-white rounded-xl border border-gray-200/70 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                style={{ animation:'slideIn 0.3s ease-out' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{plantel.nombre}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        plantel.activo 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {plantel.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <code className="text-xs font-mono text-gray-600">
                      {plantel.subdominio}.educontrol.com
                    </code>
                  </div>
                  <button 
                    onClick={() => togglePlantelActivo(plantel.id, plantel.activo)} 
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    {plantel.activo ? 'Suspender' : 'Reactivar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" 
          onClick={() => !creando && setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 font-['Outfit'] mb-6">
                Crear Nuevo Plantel
              </h2>

              {/* Información del Plantel */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subdominio}
                      onChange={e => setSubdominio(e.target.value.toLowerCase())}
                      placeholder="cbta62"
                      className={`flex-1 px-3 py-2 border rounded-lg outline-none ${
                        subdominioValido === false 
                          ? 'border-red-300 focus:ring-2 focus:ring-red-200' 
                          : subdominioValido === true
                          ? 'border-green-300 focus:ring-2 focus:ring-green-200'
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-200'
                      }`}
                    />
                    <span className="text-sm text-gray-500">.educontrol.com</span>
                  </div>
                  {subdominioError && (
                    <p className="text-xs text-red-600 mt-1">{subdominioError}</p>
                  )}
                  {subdominioValido && (
                    <p className="text-xs text-green-600 mt-1">✓ Subdomain disponible</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Plantel *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="CBTA 62"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo (opcional)
                  </label>
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={e => setNombreCompleto(e.target.value)}
                    placeholder="Centro de Bachillerato Tecnológico Agropecuario No. 62"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="basico">Básico</option>
                    <option value="profesional">Profesional</option>
                    <option value="empresarial">Empresarial</option>
                  </select>
                </div>
              </div>

              {/* Información del Director */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium text-gray-900 mb-4">Cuenta del Director</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email del Director *
                  </label>
                  <input
                    type="email"
                    value={emailAdmin}
                    onChange={e => setEmailAdmin(e.target.value)}
                    placeholder="director@cbta62.edu.mx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo del Director *
                  </label>
                  <input
                    type="text"
                    value={nombreAdmin}
                    onChange={e => setNombreAdmin(e.target.value)}
                    placeholder="Juan Pérez García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Temporal *
                  </label>
                  <input
                    type="password"
                    value={passwordAdmin}
                    onChange={e => setPasswordAdmin(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Debe contener mayúsculas, minúsculas y números
                  </p>
                </div>
              </div>

              {/* Mensajes */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Botones */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => !creando && setShowModal(false)}
                  disabled={creando}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearPlantel}
                  disabled={creando || !subdominioValido}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creando ? 'Creando...' : 'Crear Plantel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}