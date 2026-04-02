'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [splash, setSplash]         = useState(true)
  const [fadeOut, setFadeOut]       = useState(false)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [exiting, setExiting]       = useState(false)
  const [olvidé, setOlvidé]         = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500)
    const hideTimer = setTimeout(() => setSplash(false), 2000)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

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

    // Éxito — activar spring de salida antes de navegar
    setExiting(true)
    await new Promise(r => setTimeout(r, 450))

    const meta = data.user?.user_metadata
    if (meta?.primer_login === true) { router.push('/cambiar-password'); return }
    const rol = meta?.rol
    if (rol === 'docente') router.push('/docente')
    else router.push('/dashboard')
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

  // ── Splash ──────────────────────────────────────────────────────────────────
  if (splash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background:'white', opacity: fadeOut ? 0 : 1, transition:'opacity 0.5s ease-in-out' }}>
        <div style={{ opacity: fadeOut ? 0 : 1, transform: fadeOut ? 'scale(0.95)' : 'scale(1)', transition:'opacity 0.5s ease-in-out, transform 0.5s ease-in-out', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ position:'absolute', width:'90px', height:'90px', borderRadius:'28px', background:'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0) 70%)', filter:'blur(8px)', transform:'scale(1.4)' }}/>
            <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(37,99,235,0.35)', position:'relative' }}>
              <span style={{ color:'white', fontSize:'28px', fontWeight:700, fontFamily:'Outfit, sans-serif' }}>E</span>
            </div>
          </div>
          <p style={{ fontSize:'20px', fontWeight:700, color:'#1e3a5f', fontFamily:'Outfit, sans-serif', letterSpacing:'-0.3px' }}>EduControl</p>
        </div>
      </div>
    )
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage:'url(/fondo.png)', backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat', backgroundAttachment:'fixed' }}>
      <style>{`
        @keyframes loginIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes loginOut {
          from { opacity:1; transform:translateY(0) scale(1); }
          to   { opacity:0; transform:translateY(-10px) scale(0.97); }
        }
        @keyframes fadeInPage {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Overlay suave */}
      <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)', animation:'fadeInPage 0.5s ease' }}/>

      {/* Card */}
      <div style={{
        position:'relative', zIndex:10,
        width:'100%', maxWidth:'420px', margin:'0 1rem',
        background:'rgba(255,255,255,0.18)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        borderRadius:'1.5rem',
        border:'1px solid rgba(255,255,255,0.32)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
        padding:'2.5rem 2.25rem',
        boxSizing:'border-box',
        animation: exiting
          ? 'loginOut 0.45s ease-in forwards'
          : 'loginIn 0.55s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'2rem' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'1rem', background:'linear-gradient(135deg,#3b82f6,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(37,99,235,0.45)', marginBottom:'0.875rem' }}>
            <span style={{ color:'white', fontSize:'1.5rem', fontWeight:700, fontFamily:'Outfit,sans-serif' }}>E</span>
          </div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'white', fontFamily:'Outfit,sans-serif', margin:0, letterSpacing:'-0.3px', textShadow:'0 1px 8px rgba(0,0,0,0.2)' }}>EduControl</h1>
          <p style={{ fontSize:'0.8125rem', color:'rgba(255,255,255,0.65)', margin:'0.375rem 0 0' }}>
            {olvidé ? 'Recuperar contraseña' : 'Acceso al sistema escolar'}
          </p>
        </div>

        {/* ── Vista olvidé contraseña ── */}
        {olvidé ? (
          <div style={{ animation:'slideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {resetSent ? (
              <div style={{ textAlign:'center', padding:'0.5rem 0' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                  <svg width="22" height="22" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'white', margin:'0 0 0.375rem' }}>Correo enviado</p>
                <p style={{ fontSize:'0.775rem', color:'rgba(255,255,255,0.6)', margin:'0 0 1.5rem' }}>Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
                <button onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail('') }}
                  style={{ fontSize:'0.8rem', fontWeight:600, color:'rgba(255,255,255,0.75)', background:'none', border:'none', cursor:'pointer' }}>
                  ← Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:'1.25rem' }}>
                  <label style={{ fontSize:'0.8rem', fontWeight:500, color:'rgba(255,255,255,0.8)', display:'block', marginBottom:'0.5rem' }}>
                    Correo electrónico
                  </label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    placeholder="correo@escuela.edu.mx"
                    style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.875rem', color:'white', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.55)')}
                    onBlur={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')}/>
                </div>
                <button onClick={handleReset} disabled={!resetEmail || resetLoading}
                  style={{ width:'100%', padding:'0.8rem', borderRadius:'0.875rem', border:'none', background: resetEmail ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.15)', color:'white', fontSize:'0.875rem', fontWeight:600, cursor: resetEmail ? 'pointer' : 'not-allowed', marginBottom:'1rem', boxShadow: resetEmail ? '0 4px 16px rgba(37,99,235,0.4)' : 'none', transition:'all 0.2s' }}>
                  {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
                <button onClick={() => setOlvidé(false)}
                  style={{ width:'100%', fontSize:'0.8rem', fontWeight:500, color:'rgba(255,255,255,0.6)', background:'none', border:'none', cursor:'pointer', textAlign:'center' }}>
                  ← Volver al inicio de sesión
                </button>
              </>
            )}
          </div>
        ) : (

        /* ── Vista login ── */
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem', animation:'slideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Email */}
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:500, color:'rgba(255,255,255,0.8)', display:'block', marginBottom:'0.5rem' }}>
              Correo electrónico
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@escuela.edu.mx"
              style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.875rem', color:'white', outline:'none', boxSizing:'border-box' }}
              onFocus={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')}/>
          </div>

          {/* Password */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
              <label style={{ fontSize:'0.8rem', fontWeight:500, color:'rgba(255,255,255,0.8)' }}>Contraseña</label>
            </div>
            <div style={{ position:'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'0.75rem', padding:'0.75rem 2.75rem 0.75rem 1rem', fontSize:'0.875rem', color:'white', outline:'none', boxSizing:'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.55)')}
                onBlur={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.25)')}/>
              <button onClick={() => setShowPass(p => !p)} type="button"
                style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', padding:0, display:'flex', alignItems:'center' }}
                onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                {showPass
                  ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error — reserva espacio para no deformar */}
          <div style={{ minHeight:'2.25rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {error && (
              <div style={{ background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.35)', borderRadius:'0.75rem', padding:'0.5rem 1rem', width:'100%' }}>
                <p style={{ fontSize:'0.8rem', color:'#fca5a5', margin:0, textAlign:'center' }}>{error}</p>
              </div>
            )}
          </div>

          {/* Botón ingresar */}
          <button onClick={handleLogin} disabled={loading}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.875rem', border:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'white', fontSize:'0.9rem', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 4px 20px rgba(37,99,235,0.45)', transition:'all 0.2s', letterSpacing:'0.01em', marginTop:'0.25rem' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow='0 6px 28px rgba(37,99,235,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(37,99,235,0.45)' }}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>

          {/* Olvé mi contraseña */}
          <button onClick={() => { setOlvidé(true); setResetEmail(email) }}
            style={{ fontSize:'0.775rem', fontWeight:500, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', textAlign:'center', transition:'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
            Olvidé mi contraseña
          </button>
        </div>
        )}

        {/* Footer */}
        <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', textAlign:'center', margin:'1.75rem 0 0' }}>
          EduControl · Dinoti Platforms
        </p>
      </div>
    </div>
  )
}