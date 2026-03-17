'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [splash, setSplash]     = useState(true)
  const [fadeOut, setFadeOut]   = useState(false)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Splash: 1.5s visible, luego fade out 0.5s
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500)
    const hideTimer = setTimeout(() => setSplash(false), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const meta = data.user?.user_metadata
    if (meta?.primer_login === true) {
      router.push('/cambiar-password')
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  // ── Splash Screen ──────────────────────────────────────────────────────────
  if (splash) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          background: 'white',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {/* Logo con efecto degradado en el fondo del ícono */}
        <div
          style={{
            opacity: fadeOut ? 0 : 1,
            transform: fadeOut ? 'scale(0.95)' : 'scale(1)',
            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Ícono con halo degradado */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Halo degradado detrás del ícono */}
            <div style={{
              position: 'absolute',
              width: '90px',
              height: '90px',
              borderRadius: '28px',
              background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0) 70%)',
              filter: 'blur(8px)',
              transform: 'scale(1.4)',
            }} />
            {/* Ícono principal */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
              position: 'relative',
            }}>
              <span style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
              }}>
                E
              </span>
            </div>
          </div>

          {/* Nombre */}
          <p style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1e3a5f',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '-0.3px',
          }}>
            EduControl
          </p>
        </div>
      </div>
    )
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/fondo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        animation: 'fadeIn 0.4s ease-in-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>EduControl</h1>
          <p className="text-sm text-gray-400 mt-1">Acceso al sistema escolar</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="director@escuela.edu.mx"
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </div>

      </div>
    </div>
  )
}