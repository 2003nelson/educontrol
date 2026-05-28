'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        setError(r > 0 && r <= 2
          ? `Credenciales incorrectas. ${r} intento${r > 1 ? 's' : ''} restante${r > 1 ? 's' : ''}.`
          : 'Correo o contraseña incorrectos')
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
          radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 90%, rgba(186,210,255,0.35) 0%, transparent 55%),
          linear-gradient(150deg, #dce8f7 0%, #b0c8e8 30%, #7aaad4 60%, #4a7db5 100%);
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          padding: 1rem;
        }

        .glass-card {
          width: 100%;
          max-width: 900px;
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 2rem;
          display: flex;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.12);
          overflow: hidden;
        }

        .side-info {
          flex: 1;
          background: rgba(71,85,105,0.15);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255,255,255,0.2);
        }

        .form-section {
          width: 400px;
          flex-shrink: 0;
          padding: 2.5rem 3rem;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .custom-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.875rem;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s;
          outline: none;
          color: #0f172a;
        }

        .custom-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          background: white;
        }

        .btn-cobalto {
          width: 100%;
          background: #0047ab;
          color: white;
          padding: 0.875rem;
          border-radius: 0.875rem;
          font-weight: 700;
          font-size: 0.95rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,71,171,0.25);
          letter-spacing: 0.01em;
        }

        .btn-cobalto:hover:not(:disabled) {
          background: #003a8c;
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(0,71,171,0.3);
        }

        .btn-cobalto:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .status-dots {
          display: flex;
          gap: 1.25rem;
        }

        .dot-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        /* Logo móvil: oculto en desktop */
        .logo-mobile {
          display: none;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 820px) {
          .side-info { display: none; }

          .glass-card {
            max-width: 400px;
            border-radius: 1.75rem;
            margin: 0 1rem;
          }

          .form-section {
            width: 100%;
            padding: 2.75rem 2rem 2.5rem;
          }

          .login-container {
            padding: 1.5rem;
            align-items: center;
          }

          /* Mostrar logo solo en móvil */
          .logo-mobile {
            display: flex;
          }

          /* Centrar título y subtítulo en móvil */
          .title-block {
            text-align: center;
          }
        }

        @media (max-height: 700px) {
          .form-section { padding: 2rem 3rem; }
        }
      `}</style>

      <div className="glass-card">
        {/* ── Panel izquierdo (solo desktop) ── */}
        <div className="side-info">
          <div>
            <div style={{ width:52, height:52, background:'#1e293b', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.75rem' }}>
              <span style={{ color:'white', fontWeight:800, fontSize:20, fontFamily:'Plus Jakarta Sans, sans-serif' }}>EC</span>
            </div>
            <h1 style={{ color:'#1e293b', fontSize:'2.1rem', fontWeight:800, lineHeight:1.15, fontFamily:'Plus Jakarta Sans, sans-serif', margin:0 }}>
              Control escolar,<br/>sin complicaciones.
            </h1>
            <p style={{ color:'#64748b', marginTop:'1rem', fontSize:'0.95rem', maxWidth:'260px', lineHeight:1.65, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              Todo lo que tu plantel necesita, en un solo lugar.
            </p>
          </div>
          <div className="status-dots">
            {[
              { color:'#22c55e', label:'Gestión' },
              { color:'#eab308', label:'Control' },
              { color:'#ef4444', label:'Seguimiento' },
            ].map((d, i) => (
              <div key={i} className="dot-group">
                <div className="dot" style={{ background:d.color, boxShadow:`0 0 8px ${d.color}88` }}/>
                <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Formulario ── */}
        <div className="form-section">

          {/* Logo EC — visible solo en móvil */}
          <div className="logo-mobile">
            <div style={{
              width: 56,
              height: 56,
              background: '#1e293b',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}>
              <span style={{ color:'white', fontWeight:800, fontSize:22, fontFamily:'Plus Jakarta Sans, sans-serif' }}>EC</span>
            </div>
          </div>

          <div className="title-block" style={{ marginBottom:'1.75rem' }}>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a', margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {olvidé ? 'Recuperar cuenta' : 'Bienvenido a EduControl'}
            </h2>
            <p style={{ color:'#64748b', marginTop:'0.375rem', fontSize:'0.875rem', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {olvidé ? 'Ingresa tu correo para recibir un enlace.' : 'Ingresa tus credenciales para acceder.'}
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {!olvidé ? (
              <>
                <div>
                  <label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, color:'#475569', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(sanitizeEmail(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="custom-input"
                    placeholder="usuario@educontrol.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, color:'#475569', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                    Contraseña
                  </label>
                  <div style={{ position:'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="custom-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      onClick={() => setShowPass(!showPass)}
                      style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      {showPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color:'#ef4444', fontSize:'0.8rem', fontWeight:500, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                    {error}
                  </p>
                )}

                <button className="btn-cobalto" onClick={handleLogin} disabled={loading}>
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>

                <button
                  onClick={() => { setOlvidé(true); setError('') }}
                  style={{ background:'none', border:'none', color:'#94a3b8', fontSize:'0.8rem', cursor:'pointer', fontWeight:500, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : resetSent ? (
              <div style={{ textAlign:'center', padding:'1rem 0' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'#f0fdf4', border:'1.5px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                  <svg width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p style={{ fontSize:'0.875rem', color:'#16a34a', fontWeight:600, margin:'0 0 0.5rem', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Correo enviado</p>
                <p style={{ fontSize:'0.8rem', color:'#64748b', margin:'0 0 1.25rem', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Revisa tu bandeja de entrada.</p>
                <button onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail('') }}
                  style={{ background:'none', border:'none', color:'#0047ab', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                  Volver al inicio
                </button>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(sanitizeEmail(e.target.value))}
                  className="custom-input"
                  placeholder="Tu correo de recuperación"
                  autoComplete="email"
                />
                {error && <p style={{ color:'#ef4444', fontSize:'0.8rem', fontWeight:500, margin:0 }}>{error}</p>}
                <button className="btn-cobalto" onClick={handleReset} disabled={resetLoading}>
                  {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button onClick={() => { setOlvidé(false); setError('') }}
                  style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.8rem', fontWeight:500, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                  Volver
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop:'1.75rem', textAlign:'center' }}>
            <p style={{ fontSize:'0.7rem', color:'#cbd5e1', margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              &copy; 2026 EduControl · Dinoti Platforms
            </p>
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