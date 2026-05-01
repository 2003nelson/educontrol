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
    if (exitoso) { this.intentos = 0; this.bloqueadoHasta = 0 }
    else {
      this.intentos++
      if (this.intentos >= MAX_INTENTOS) this.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO
    }
  },
  getIntentosRestantes(): number { return Math.max(0, MAX_INTENTOS - this.intentos) }
}

function validarEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function sanitizeEmail(v: string): string { return v.trim().toLowerCase() }
function validarPassword(p: string): boolean { return p.length >= 6 }
function validarOrigin(): boolean {
  if (typeof window === 'undefined') return true
  return ALLOWED_ORIGINS.includes(window.location.origin)
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [olvidé, setOlvidé]     = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [focusEmail, setFocusEmail]     = useState(false)
  const [focusPass, setFocusPass]       = useState(false)

  async function handleLogin() {
    const { permitido, minutosRestantes } = loginLimiter.puedeIntentar()
    if (!permitido) { setError(`Demasiados intentos. Intenta en ${minutosRestantes} min.`); return }
    if (!email || !password) { setError('Completa todos los campos'); return }
    if (!validarEmail(email)) { setError('Formato de correo inválido'); return }
    if (!validarPassword(password)) { setError('Mínimo 6 caracteres'); return }

    setLoading(true); setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email), password,
      })
      if (authError) {
        loginLimiter.registrarIntento(false)
        const r = loginLimiter.getIntentosRestantes()
        setError(r > 0 && r <= 2 ? `Credenciales incorrectas. ${r} intento${r > 1 ? 's' : ''} restante${r > 1 ? 's' : ''}.` : 'Correo o contraseña incorrectos')
        setLoading(false); return
      }
      loginLimiter.registrarIntento(true)
      const meta = data.user?.user_metadata
      if (meta?.primer_login === true) { router.push('/cambiar-password'); return }
      const { data: ud } = await supabase.from('usuarios').select('rol').eq('auth_id', data.user.id).single()
      const rol = ud?.rol ?? meta?.rol
      if (rol === 'super_admin') router.push('/super-admin')
      else if (rol === 'docente') router.push('/docente/grupos')
      else router.push('/dashboard')
    } catch (err) {
      console.error(err); setError('Error al iniciar sesión.'); setLoading(false)
    }
  }

  async function handleReset() {
    if (!validarOrigin()) { setError('Dominio no autorizado'); return }
    if (!resetEmail) { setError('Ingresa tu correo'); return }
    if (!validarEmail(resetEmail)) { setError('Formato inválido'); return }
    setResetLoading(true); setError('')
    try {
      const { error: re } = await supabase.auth.resetPasswordForEmail(sanitizeEmail(resetEmail), {
        redirectTo: `${window.location.origin}/cambiar-password`
      })
      if (re) { setError('Error al enviar correo.'); setResetLoading(false); return }
      setResetSent(true); setResetLoading(false)
    } catch (err) { console.error(err); setError('Error.'); setResetLoading(false) }
  }

  const dots = [
    { color: '#ef4444' },
    { color: '#f59e0b' },
    { color: '#22c55e' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    }}>
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85) }
          50%      { opacity: 1;    transform: scale(1)    }
        }
        .lbtn { transition: all 0.18s ease; }
        .lbtn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,122,255,0.3) !important; }
        .lbtn:active:not(:disabled) { transform: translateY(0); filter: brightness(0.96); }
        .linput { transition: border-color 0.18s, box-shadow 0.18s; }
        .linput:hover { border-color: #c7c7cc !important; }
        @media (max-width: 768px) {
          .mac-window { flex-direction: column !important; }
          .mac-sidebar { display: none !important; }
          .mac-form-inner { padding: 2rem 1.5rem !important; }
          .mobile-logo { display: flex !important; }
        }
        .mobile-logo { display: none; }
      `}</style>

      {/* Layout pantalla completa */}
      <div className="mac-window" style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        position: 'fixed',
        inset: 0,
      }}>

        {/* Sidebar oscuro */}
        <div className="mac-sidebar" style={{
          width: 380, flexShrink: 0,
          background: '#1c1c1e',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: '3rem 2.5rem',
          animation: 'slideInLeft 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Fondo imagen sutil */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/fondo.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }}/>
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(28,28,30,0.6) 0%, rgba(28,28,30,0.95) 100%)' }}/>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div style={{ marginBottom: 'auto', paddingTop: '0.5rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: '#636366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem',
              }}>
                <span style={{ color: 'white', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>EC</span>
              </div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>EduControl</h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 2.5rem', lineHeight: 1.6 }}>CBTA 62 · Gestión escolar</p>

              {/* Features con dot de color */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { text: 'Gestión académica', dot: dots[2].color },
                  { text: 'Control de asistencias', dot: dots[1].color },
                  { text: 'Seguimiento académico', dot: dots[0].color },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0, boxShadow: `0 0 8px ${item.dot}88` }}/>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer sidebar */}
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)' }}>© 2026 Dinoti Platforms</span>
          </div>
        </div>

        {/* Panel principal blanco */}
        <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'slideInRight 0.5s cubic-bezier(0.22,1,0.36,1)' }}>



          {/* Contenido del formulario */}
          <div className="mac-form-inner" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 3.5rem' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>

              {olvidé ? (
                resetSent ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                      <svg width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1c1c1e', margin: '0 0 0.375rem' }}>Correo enviado</p>
                    <p style={{ fontSize: '0.8rem', color: '#8e8e93', margin: '0 0 1.75rem' }}>Revisa tu bandeja de entrada</p>
                    <button onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail(''); setError('') }}
                      style={{ fontSize: '0.8rem', color: '#007aff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      ← Volver
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.375rem', letterSpacing: '-0.02em' }}>Recuperar acceso</h2>
                    <p style={{ fontSize: '0.875rem', color: '#8e8e93', margin: '0 0 1.875rem' }}>Enviaremos un enlace a tu correo</p>

                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6c6c70', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Correo</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(sanitizeEmail(e.target.value))} placeholder="correo@dominio.com"
                      className="linput"
                      style={{ width: '100%', border: '1.5px solid #e5e5ea', borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#1c1c1e', outline: 'none', background: '#fafafa', boxSizing: 'border-box', marginBottom: error ? '0.75rem' : '1.25rem' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#007aff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e5e5ea'; e.currentTarget.style.boxShadow = 'none' }} />

                    {error && <p style={{ fontSize: '0.74rem', color: '#ff3b30', margin: '0 0 0.875rem', fontWeight: 500 }}>{error}</p>}

                    <button onClick={handleReset} disabled={!resetEmail || resetLoading} className="lbtn"
                      style={{ width: '100%', padding: '0.95rem', borderRadius: 12, border: 'none', background: resetEmail && validarEmail(resetEmail) ? '#007aff' : '#e5e5ea', color: resetEmail && validarEmail(resetEmail) ? 'white' : '#aeaeb2', fontSize: '0.9375rem', fontWeight: 600, cursor: resetEmail ? 'pointer' : 'not-allowed', marginBottom: '0.875rem', boxShadow: '0 2px 8px rgba(0,122,255,0.18)' }}>
                      {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                    <button onClick={() => { setOlvidé(false); setError('') }}
                      style={{ width: '100%', fontSize: '0.78rem', color: '#8e8e93', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', fontWeight: 500 }}>
                      ← Volver al inicio de sesión
                    </button>
                  </>
                )
              ) : (
                <>
                  {/* Logo móvil */}
                  <div className="mobile-logo" style={{ flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem', gap: '0.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#8e8e93', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>EC</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 500 }}>EduControl</span>
                  </div>

                  <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.375rem', letterSpacing: '-0.02em' }}>Bienvenido</h2>
                  <p style={{ fontSize: '0.875rem', color: '#8e8e93', margin: '0 0 1.875rem' }}>Ingresa tus credenciales para continuar</p>

                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6c6c70', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(sanitizeEmail(e.target.value))} placeholder="correo@dominio.com" autoComplete="email"
                    className="linput"
                    style={{ width: '100%', border: `1.5px solid ${focusEmail ? '#007aff' : '#e5e5ea'}`, borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#1c1c1e', outline: 'none', background: '#fafafa', boxSizing: 'border-box', marginBottom: '1rem', boxShadow: focusEmail ? '0 0 0 3px rgba(0,122,255,0.1)' : 'none', transition: 'all 0.18s' }}
                    onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />

                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6c6c70', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <div style={{ position: 'relative', marginBottom: error ? '0.75rem' : '1.25rem' }}>
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                      className="linput"
                      style={{ width: '100%', border: `1.5px solid ${focusPass ? '#007aff' : '#e5e5ea'}`, borderRadius: 12, padding: '0.875rem 3rem 0.875rem 1rem', fontSize: '0.9375rem', color: '#1c1c1e', outline: 'none', background: '#fafafa', boxSizing: 'border-box', boxShadow: focusPass ? '0 0 0 3px rgba(0,122,255,0.1)' : 'none', transition: 'all 0.18s' }}
                      onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button onClick={() => setShowPass(p => !p)} type="button"
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aeaeb2', padding: 0, display: 'flex' }}>
                      {showPass
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>

                  {error && (
                    <div style={{ background: '#fff5f5', border: '1px solid #ffd7d5', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3b30', flexShrink: 0 }}/>
                      <p style={{ fontSize: '0.76rem', color: '#ff3b30', margin: 0, fontWeight: 500 }}>{error}</p>
                    </div>
                  )}

                  <button onClick={handleLogin} disabled={loading} className="lbtn"
                    style={{ width: '100%', padding: '0.95rem', borderRadius: 12, border: 'none', background: loading ? '#aeaeb2' : '#007aff', color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 12px rgba(0,122,255,0.25)', marginBottom: '0.875rem' }}>
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block', animation: `dotPulse 0.9s ease-in-out ${i * 0.16}s infinite` }}/>
                        ))}
                      </span>
                    ) : 'Iniciar sesión'}
                  </button>

                  <button onClick={() => { setOlvidé(true); setResetEmail(email); setError('') }}
                    style={{ width: '100%', fontSize: '0.78rem', color: '#007aff', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0056cc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#007aff')}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}