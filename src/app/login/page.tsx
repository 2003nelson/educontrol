'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// --- CONSTANTES DE LÓGICA (Mantenidas) ---
const MAX_INTENTOS = 5
const TIEMPO_BLOQUEO = 15 * 60 * 1000

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

function LoginContent() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [olvidé, setOlvidé] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

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

      if (returnTo) {
        const esDocente = rol === 'docente'
        const esRetornoDocente = returnTo.startsWith('/docente')
        const esRetornoAdmin = !esRetornoDocente && !returnTo.startsWith('/super-admin')
        if ((esDocente && esRetornoDocente) || (!esDocente && esRetornoAdmin)) {
          router.push(returnTo); return
        }
      }

      if (rol === 'super_admin') router.push('/super-admin')
      else if (rol === 'docente') router.push('/docente/grupos')
      else router.push('/dashboard')
    } catch (err) {
      console.error(err); setError('Error al iniciar sesión.'); setLoading(false)
    }
  }

  async function handleReset() {
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

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%);
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 1.5rem;
        }

        .glass-card {
          width: 100%;
          max-width: 1000px;
          min-height: 600px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 2.5rem;
          display: flex;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .side-info {
          flex: 1;
          background: rgba(71, 85, 105, 0.15); /* Gris opaco translúcido */
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        .form-section {
          width: 450px;
          padding: 4rem;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .custom-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          font-size: 0.95rem;
          transition: all 0.2s;
          outline: none;
        }

        .custom-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .btn-cobalto {
          width: 100%;
          background: #0047ab; /* Azul Cobalto */
          color: white;
          padding: 1rem;
          border-radius: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 71, 171, 0.2);
        }

        .btn-cobalto:hover:not(:disabled) {
          background: #003a8c;
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(0, 71, 171, 0.3);
        }

        .status-dots {
          display: flex;
          gap: 1.5rem;
        }

        .dot-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        @media (max-width: 900px) {
          .side-info { display: none; }
          .form-section { width: 100%; padding: 3rem 1.5rem; }
          .glass-card { max-width: 450px; }
        }
      `}</style>

      <div className="glass-card">
        {/* LADO IZQUIERDO: Branding */}
        <div className="side-info">
          <div>
            <div style={{ width: 60, height: 60, background: '#1e293b', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 24 }}>EC</span>
            </div>
            <h1 style={{ color: '#1e293b', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1 }}>
              Optimiza tu <br /> Gestión Escolar
            </h1>
            <p style={{ color: '#475569', marginTop: '1.5rem', fontSize: '1.1rem', maxWidth: '320px' }}>
              La plataforma inteligente diseñada para el control y seguimiento educativo integral.
            </p>
          </div>

          {/* Dots originales abajo a la izquierda */}
          <div className="status-dots">
            {[
              { color: '#22c55e', label: 'Gestión' },
              { color: '#eab308', label: 'Control' },
              { color: '#ef4444', label: 'Seguimiento' }
            ].map((d, i) => (
              <div key={i} className="dot-group">
                <div className="dot" style={{ background: d.color, boxShadow: `0 0 10px ${d.color}66` }}></div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="form-section">
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              {olvidé ? 'Recuperar cuenta' : 'Bienvenido a EduControl'}
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!olvidé ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(sanitizeEmail(e.target.value))} 
                    className="custom-input"
                    placeholder="usuario@educontrol.com"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="custom-input"
                      placeholder="••••••••"
                    />
                    <button 
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      {showPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>{error}</p>}

                <button className="btn-cobalto" onClick={handleLogin} disabled={loading}>
                  {loading ? 'Cargando...' : 'Entrar al panel'}
                </button>

                <button 
                  onClick={() => setOlvidé(true)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : (
              /* Lógica de Reset Password (Mantenida) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input 
                  type="email" 
                  value={resetEmail} 
                  onChange={e => setResetEmail(sanitizeEmail(e.target.value))} 
                  className="custom-input"
                  placeholder="Tu correo de recuperación"
                />
                <button className="btn-cobalto" onClick={handleReset} disabled={resetLoading}>
                  {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button onClick={() => setOlvidé(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Volver</button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>&copy; 2026 EduControl • Dinoti Platforms</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  )
}