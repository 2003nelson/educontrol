'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Forzar dynamic rendering para esta página
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [splash, setSplash] = useState(false)
  const [fadeOut] = useState(false)
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
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    setSplash(true)
    await new Promise(r => setTimeout(r, 2000))

    const meta = data.user?.user_metadata
    if (meta?.primer_login === true) { router.push('/cambiar-password'); return }
    const rol = meta?.rol
    
    if (rol === 'super_admin') {
      router.push('/super-admin')
    } else if (rol === 'docente') {
      router.push('/docente')
    } else {
      router.push('/dashboard')
    }
  }

  async function handleReset() {
    if (!resetEmail) return
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/cambiar-password`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  // ── Splash ──
  if (splash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          backgroundImage:'url(/fondo.png)',
          backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat',
          opacity: fadeOut ? 0 : 1,
          transition:'opacity 0.65s ease-in-out',
        }}>
        <style>{`
          @keyframes splashIn {
            from { opacity:0; transform:scale(0.88) translateY(16px); }
            to   { opacity:1; transform:scale(1) translateY(0); }
          }
          @keyframes dotPulse {
            0%,100% { opacity:0.4; transform:scale(0.85); }
            50%      { opacity:1;   transform:scale(1.15); }
          }
          @keyframes splashPulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4), 0 8px 32px rgba(37,99,235,0.35); }
            50%      { box-shadow: 0 0 0 12px rgba(59,130,246,0), 0 8px 32px rgba(37,99,235,0.35); }
          }
        `}</style>

        <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)' }}/>

        <div style={{
          position:'relative', zIndex:1,
          display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem',
          opacity: fadeOut ? 0 : 1,
          transform: fadeOut ? 'scale(0.95) translateY(-8px)' : 'scale(1) translateY(0)',
          transition:'opacity 0.65s ease-in-out, transform 0.65s ease-in-out',
          animation:'splashIn 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{
            background:'rgba(255,255,255,0.14)',
            backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
            borderRadius:'1.75rem',
            border:'1px solid rgba(255,255,255,0.28)',
            boxShadow:'0 24px 64px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
            padding:'2.5rem 3rem',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'1.125rem',
          }}>
            <div style={{ position:'relative' }}>
              <div style={{
                position:'absolute', inset:'-8px', borderRadius:'26px',
                background:'rgba(59,130,246,0.2)',
                filter:'blur(10px)',
              }}/>
              <div style={{
                width:'64px', height:'64px', borderRadius:'18px',
                background:'linear-gradient(135deg,#3b82f6,#2563eb)',
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative',
                animation:'splashPulse 2s ease-in-out infinite',
              }}>
                <span style={{ color:'white', fontSize:'28px', fontWeight:700, fontFamily:'Outfit,sans-serif' }}>E</span>
              </div>
            </div>

            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'1.375rem', fontWeight:700, color:'white', fontFamily:'Outfit,sans-serif', margin:0, letterSpacing:'-0.3px', textShadow:'0 1px 8px rgba(0,0,0,0.2)' }}>
                EduControl
              </p>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', margin:'0.375rem 0 0' }}>
                Sistema de administración escolar
              </p>
            </div>

            <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.25rem' }}>
              {[['#ef4444','rgba(239,68,68,0.4)'],['#f59e0b','rgba(245,158,11,0.4)'],['#22c55e','rgba(34,197,94,0.4)']].map(([color, glow], i) => (
                <div key={i} style={{
                  width:'8px', height:'8px', borderRadius:'50%',
                  background: color,
                  animation:`dotPulse 1.2s ease-in-out ${i*0.22}s infinite`,
                  boxShadow: `0 0 6px ${glow}`,
                }}/>
              ))}
            </div>
          </div>

          <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', margin:0 }}>
            Dinoti Platforms
          </p>
        </div>
      </div>
    )
  }

  // ── Login Split Screen ──
  return (
    <div className="min-h-screen flex" style={{ background:'#0f172a' }}>
      <style>{`
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-40px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(40px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* ══ IZQUIERDA - Imagen ══ */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
        clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)', // Diagonal sutil
        animation: 'slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Imagen de fondo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/fondo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}/>

        {/* Overlay gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.75) 100%)',
        }}/>

        {/* Contenido sobre la imagen */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem',
          color: 'white',
        }}>
          {/* Logo grande */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <span style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              color: 'white',
            }}>E</span>
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontFamily: 'Outfit, sans-serif',
            margin: '0 0 1rem',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            EduControl
          </h1>

          <p style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            margin: '0 0 3rem',
            maxWidth: '500px',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 10px rgba(0,0,0,0.2)',
          }}>
            Sistema integral de administración escolar para instituciones educativas modernas
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '✓', text: 'Gestión académica completa' },
              { icon: '✓', text: 'Control de asistencias' },
              { icon: '✓', text: 'Seguimiento de calificaciones' },
            ].map((feature, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}>
                  {feature.icon}
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{
            position: 'absolute',
            bottom: '2rem',
            left: '4rem',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
          }}>
            © 2026 Dinoti Platforms · EduControl
          </p>
        </div>
      </div>

      {/* ══ DERECHA - Login Card ══ */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#0f172a',
        animation: 'slideInRight 0.8s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1e3a5f',
              fontFamily: 'Outfit, sans-serif',
              margin: '0 0 0.5rem',
            }}>
              {olvidé ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {olvidé ? 'Te enviaremos un enlace de recuperación' : 'Accede a tu cuenta'}
            </p>
          </div>

          {/* ── Vista olvidé contraseña ── */}
          {olvidé ? (
            <div>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    border: '2px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}>
                    <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', margin: '0 0 0.5rem' }}>
                    Correo enviado
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 2rem' }}>
                    Revisa tu bandeja de entrada
                  </p>
                  <button
                    onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail('') }}
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#3b82f6',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1e3a5f',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="correo@escuela.edu.mx"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem',
                        fontSize: '0.9375rem',
                        color: '#1e3a5f',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    />
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={!resetEmail || resetLoading}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      background: resetEmail ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e2e8f0',
                      color: resetEmail ? 'white' : '#94a3b8',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: resetEmail ? 'pointer' : 'not-allowed',
                      marginBottom: '1rem',
                      boxShadow: resetEmail ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                  <button
                    onClick={() => setOlvidé(false)}
                    style={{
                      width: '100%',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#64748b',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Vista login ── */
            <div>
              {/* Email */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e3a5f',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@escuela.edu.mx"
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1rem',
                    fontSize: '0.9375rem',
                    color: '#1e3a5f',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e3a5f',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      padding: '0.875rem 3rem 0.875rem 1rem',
                      fontSize: '0.9375rem',
                      color: '#1e3a5f',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  />
                  <button
                    onClick={() => setShowPass(p => !p)}
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPass ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Botón login */}
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                  transition: 'all 0.2s',
                  marginBottom: '1.25rem',
                }}
                onMouseEnter={e => {
                  if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(59,130,246,0.6)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)'
                }}
              >
                {loading ? 'Verificando...' : 'Iniciar sesión'}
              </button>

              {/* Olvidé contraseña */}
              <button
                onClick={() => { setOlvidé(true); setResetEmail(email) }}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  width: '100%',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3b82f6')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}