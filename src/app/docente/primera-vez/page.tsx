// src/app/docente/primera-vez/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PrimeraVezPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })

  useEffect(() => {
    async function init() {
      // Leer el hash del URL y extraer el access_token
      const hash = window.location.hash
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && refreshToken && type === 'invite') {
        // Establecer la sesión manualmente con el token del email
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError || !data.session) {
          router.push('/login?error=link-invalido')
          return
        }

        // Obtener datos del docente
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre_completo, email, cuenta_activada')
          .eq('auth_id', data.session.user.id)
          .single()

        if (userData?.cuenta_activada) {
          router.push('/docente/grupos')
          return
        }

        setNombre(userData?.nombre_completo ?? data.session.user.email ?? '')
        setEmail(userData?.email ?? data.session.user.email ?? '')
        setLoading(false)
        return
      }

      // Si no hay token en el hash, verificar sesión existente
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?error=link-invalido')
        return
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('nombre_completo, email, cuenta_activada')
        .eq('auth_id', session.user.id)
        .single()

      if (userData?.cuenta_activada) {
        router.push('/docente/grupos')
        return
      }

      setNombre(userData?.nombre_completo ?? session.user.email ?? '')
      setEmail(userData?.email ?? session.user.email ?? '')
      setLoading(false)
    }

    init()
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setGuardando(true)

      const { error: passError } = await supabase.auth.updateUser({
        password: formData.password,
      })
      if (passError) throw passError

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('usuarios')
          .update({ cuenta_activada: true })
          .eq('auth_id', user.id)
      }

      setSuccess(true)
      setTimeout(() => router.push('/docente/grupos'), 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: '#94a3b8' }}>Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
            <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1e3a5f' }}>¡Cuenta activada!</h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Redirigiendo a tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8" style={{ border: '1px solid #e2e8f0' }}>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
              <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1e3a5f' }}>
              Bienvenido/a, {nombre.split(' ')[0]}
            </h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Crea tu contraseña para acceder a tu panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>TU EMAIL</label>
              <input type="email" value={email} disabled
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>NUEVA CONTRASEÑA</label>
              <input type="password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres" required
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ border: '1px solid #e2e8f0', color: '#1e3a5f' }} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>CONFIRMAR CONTRASEÑA</label>
              <input type="password" value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña" required
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ border: '1px solid #e2e8f0', color: '#1e3a5f' }} />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={guardando}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: guardando ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}>
              {guardando ? 'Guardando...' : 'Crear contraseña y continuar'}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: '#94a3b8' }}>
            Una vez creada tu contraseña, podrás iniciar sesión normalmente
          </p>
        </div>
      </div>
    </div>
  )
}