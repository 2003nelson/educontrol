'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const MAX_INTENTOS = 5
const TIEMPO_BLOQUEO = 15 * 60 * 1000

const ALLOWED_ORIGINS = [
  'https://dinoti.xyz',
  'https://www.dinoti.xyz',
  'http://localhost:3000',
]

const loginLimiter = {
  intentos: 0,
  bloqueadoHasta: 0,
  puedeIntentar(): { permitido: boolean; minutosRestantes?: number } {
    const ahora = Date.now()
    if (this.bloqueadoHasta > ahora) {
      const minutosRestantes = Math.ceil((this.bloqueadoHasta - ahora) / 60000)
      return { permitido: false, minutosRestantes }
    }
    return { permitido: this.intentos < MAX_INTENTOS }
  },
  registrarIntento(exitoso: boolean) {
    if (exitoso) {
      this.intentos = 0
      this.bloqueadoHasta = 0
    } else {
      this.intentos++
      if (this.intentos >= MAX_INTENTOS) {
        this.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO
      }
    }
  },
  getIntentosRestantes(): number {
    return Math.max(0, MAX_INTENTOS - this.intentos)
  }
}

function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function validarPassword(password: string): boolean {
  return password.length >= 6
}

function validarOrigin(): boolean {
  if (typeof window === 'undefined') return true
  return ALLOWED_ORIGINS.includes(window.location.origin)
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [olvidé, setOlvidé]       = useState(false)
  const [resetEmail, setResetEmail]   = useState('')
  const [resetSent, setResetSent]     = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin() {
    const { permitido, minutosRestantes } = loginLimiter.puedeIntentar()
    if (!permitido) {
      setError(`Demasiados intentos fallidos. Intenta en ${minutosRestantes} minuto${minutosRestantes! > 1 ? 's' : ''}.`)
      return
    }

    if (!email || !password) { setError('Completa todos los campos'); return }
    if (!validarEmail(email)) { setError('Formato de correo electrónico inválido'); return }
    if (!validarPassword(password)) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email),
        password,
      })

      if (authError) {
        loginLimiter.registrarIntento(false)
        const intentosRestantes = loginLimiter.getIntentosRestantes()
        if (intentosRestantes > 0 && intentosRestantes <= 2) {
          setError(`Correo o contraseña incorrectos. Te quedan ${intentosRestantes} intento${intentosRestantes > 1 ? 's' : ''}.`)
        } else {
          setError('Correo o contraseña incorrectos')
        }
        setLoading(false)
        return
      }

      loginLimiter.registrarIntento(true)

      const meta = data.user?.user_metadata
      if (meta?.primer_login === true) {
        router.push('/cambiar-password')
        return
      }

      // Verificar rol para redirigir correctamente
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('auth_id', data.user.id)
        .single()

      const rol = usuarioData?.rol ?? meta?.rol

      if (rol === 'super_admin') {
        router.push('/super-admin')
      } else if (rol === 'docente') {
        router.push('/docente/grupos')
      } else {
        router.push('/dashboard')
      }
      // No setLoading(false) — la página se desmonta al navegar
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error al iniciar sesión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!validarOrigin()) { setError('Dominio no autorizado'); return }
    if (!resetEmail) { setError('Ingresa tu correo electrónico'); return }
    if (!validarEmail(resetEmail)) { setError('Formato de correo electrónico inválido'); return }

    setResetLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizeEmail(resetEmail),
        { redirectTo: `${window.location.origin}/cambiar-password` }
      )
      if (resetError) { setError('Error al enviar el correo. Intenta de nuevo.'); setResetLoading(false); return }
      setResetSent(true)
      setResetLoading(false)
    } catch (err) {
      console.error('Error en reset:', err)
      setError('Error al enviar el correo. Intenta de nuevo.')
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      <style>{`
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeInUp     { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          .login-left-panel  { display: none !important; }
          .login-right-panel { flex: 1 !important; padding: 2rem 1.5rem !important; }
          .login-card        { animation: fadeInUp 0.6s cubic-bezier(0.22,1,0.36,1) !important; margin-top: 6rem !important; }
          .mobile-logo       { display: flex !important; flex-direction: column; align-items: center; gap: 0.5rem; }
        }
      `}</style>

      {/* Panel izquierdo */}
      <div className="login-left-panel" style={{ flex: '1', position: 'relative', overflow: 'hidden', animation: 'slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/fondo.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.75) 100%)' }}/>
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', color: 'white' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'white' }}>E</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>EduControl</h1>
          <p style={{ fontSize: '1.25rem', margin: '0 0 3rem', maxWidth: '500px', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
            Sistema integral de administración escolar para instituciones educativas modernas
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['Gestión académica completa', 'Control de asistencias', 'Seguimiento de calificaciones'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700 }}>✓</div>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
          <p style={{ position: 'absolute', bottom: '2rem', left: '4rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>© 2026 Dinoti Platforms · EduControl</p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="login-right-panel" style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#0f172a', animation: 'slideInRight 0.8s cubic-bezier(0.22,1,0.36,1)' }}>

        <div className="mobile-logo" style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'none' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif' }}>E</span>
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif', margin: 0 }}>EduControl</p>
        </div>

        <div className="login-card" style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e3a5f', fontFamily: 'Outfit, sans-serif', margin: '0 0 0.5rem' }}>
              {olvidé ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {olvidé ? 'Te enviaremos un enlace de recuperación' : 'Accede a tu cuenta'}
            </p>
          </div>

          {olvidé ? (
            <div>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', margin: '0 0 0.5rem' }}>Correo enviado</p>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 2rem' }}>Revisa tu bandeja de entrada</p>
                  <button onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail(''); setError('') }}
                    style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', display: 'block', marginBottom: '0.5rem' }}>Correo electrónico</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(sanitizeEmail(e.target.value))} placeholder="correo@escuela.edu.mx"
                      style={{ width: '100%', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#1e3a5f', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                  </div>
                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{error}</p>
                    </div>
                  )}
                  <button onClick={handleReset} disabled={!resetEmail || resetLoading}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: resetEmail && validarEmail(resetEmail) ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e2e8f0', color: resetEmail && validarEmail(resetEmail) ? 'white' : '#94a3b8', fontSize: '0.9375rem', fontWeight: 600, cursor: resetEmail && validarEmail(resetEmail) ? 'pointer' : 'not-allowed', marginBottom: '1rem' }}>
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                  <button onClick={() => { setOlvidé(false); setError('') }}
                    style={{ width: '100%', fontSize: '0.875rem', fontWeight: 500, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                    ← Volver al inicio de sesión
                  </button>
                </>
              )}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', display: 'block', marginBottom: '0.5rem' }}>Correo electrónico</label>
                <input type="email" value={email} onChange={e => setEmail(sanitizeEmail(e.target.value))} placeholder="correo@escuela.edu.mx" autoComplete="email"
                  style={{ width: '100%', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#1e3a5f', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ width: '100%', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.875rem 3rem 0.875rem 1rem', fontSize: '0.9375rem', color: '#1e3a5f', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                  <button onClick={() => setShowPass(p => !p)} type="button"
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {showPass ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <button onClick={handleLogin} disabled={loading}
                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(59,130,246,0.4)', marginBottom: '1.25rem' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(59,130,246,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)' }}>
                {loading ? 'Verificando...' : 'Iniciar sesión'}
              </button>

              <button onClick={() => { setOlvidé(true); setResetEmail(email); setError('') }}
                style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', width: '100%' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3b82f6')}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}