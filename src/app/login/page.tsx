'use client'
import { useState, Suspense, useEffect, useRef } from 'react'
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

// Palabras motivacionales
const MOTIVATIONAL_WORDS = [
  'Éxito', 'Innovación', 'Liderazgo', 'Excelencia', 
  'Aprende', 'Disciplina', 'Persistencia', 'Enfoque', 
  'Crece', 'Impacto', 'Futuro', 'Meta', 'Pasión', 'Educa'
]

// Paletas de colores
const THEMES = [
  {
    name: 'Cyber Dark',
    bg: '#060911',
    cardBg: '#090d16',
    textColor: '#ffffff',
    subTextColor: '#94a3b8',
    dotTextColor: '#cbd5e1',
    orb1: 'rgba(37, 99, 235, 0.35)',
    orb2: 'rgba(124, 58, 237, 0.3)',
    particleColor: 'rgba(59, 130, 246, 0.55)',
    btnBg: '#2563eb',
    btnHover: '#1d4ed8',
    isLight: false,
  },
  {
    name: 'Executive Blue',
    bg: '#0f172a',
    cardBg: '#1e293b',
    textColor: '#ffffff',
    subTextColor: '#94a3b8',
    dotTextColor: '#cbd5e1',
    orb1: 'rgba(56, 189, 248, 0.35)',
    orb2: 'rgba(37, 99, 235, 0.35)',
    particleColor: 'rgba(56, 189, 248, 0.55)',
    btnBg: '#0284c7',
    btnHover: '#0369a1',
    isLight: false,
  },
  {
    name: 'Neon Purple',
    bg: '#13091e',
    cardBg: '#1c0f2e',
    textColor: '#ffffff',
    subTextColor: '#a78bfa',
    dotTextColor: '#e9d5ff',
    orb1: 'rgba(168, 85, 247, 0.35)',
    orb2: 'rgba(236, 72, 153, 0.3)',
    particleColor: 'rgba(168, 85, 247, 0.55)',
    btnBg: '#9333ea',
    btnHover: '#7e22ce',
    isLight: false,
  },
  {
    name: 'Emerald Tech',
    bg: '#06120e',
    cardBg: '#0b1d17',
    textColor: '#ffffff',
    subTextColor: '#6ee7b7',
    dotTextColor: '#a7f3d0',
    orb1: 'rgba(16, 185, 129, 0.35)',
    orb2: 'rgba(6, 182, 212, 0.3)',
    particleColor: 'rgba(16, 185, 129, 0.55)',
    btnBg: '#059669',
    btnHover: '#047857',
    isLight: false,
  },
  {
    name: 'Clean Light',
    bg: '#f1f5f9',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    subTextColor: '#475569',
    dotTextColor: '#334155',
    orb1: 'rgba(37, 99, 235, 0.15)',
    orb2: 'rgba(147, 197, 253, 0.25)',
    particleColor: 'rgba(37, 99, 235, 0.35)',
    btnBg: '#2563eb',
    btnHover: '#1d4ed8',
    isLight: true,
  },
]

// Canvas Interactivo con Palabras Motivacionales en Intersecciones
function BackgroundCanvas({ particleColor }: { particleColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = []
    const particleCount = 55

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 2.5,
      })
    }

    // Lista de palabras activas que flotan
    let floatingTexts: Array<{
      text: string
      x: number
      y: number
      opacity: number
      life: number
    }> = []

    let mouse = { x: -1000, y: -1000 }
    let lastTriggerTime = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      const now = Date.now()

      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Dibujar partícula
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = particleColor
        ctx.fill()

        // Dibujar líneas y detectar intersecciones
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)

          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = particleColor.replace(/[\d\.]+\)$/g, `${0.3 - dist / 500})`)
            ctx.lineWidth = 0.9
            ctx.stroke()

            // Punto medio (intersección)
            const midX = (p.x + p2.x) / 2
            const midY = (p.y + p2.y) / 2
            const mouseDistToMid = Math.hypot(midX - mouse.x, midY - mouse.y)

            // Si el mouse pasa cerca del punto de intersección y ha pasado tiempo suficiente
            if (mouseDistToMid < 55 && now - lastTriggerTime > 350) {
              const randomWord = MOTIVATIONAL_WORDS[Math.floor(Math.random() * MOTIVATIONAL_WORDS.length)]
              floatingTexts.push({
                text: randomWord,
                x: midX,
                y: midY,
                opacity: 1,
                life: 1,
              })
              lastTriggerTime = now
            }
          }
        }

        // Conexión con el mouse
        const mouseDist = Math.hypot(p.x - mouse.x, p.y - mouse.y)
        if (mouseDist < 160) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = particleColor.replace(/[\d\.]+\)$/g, `${0.5 - mouseDist / 320})`)
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      })

      // Renderizar y animar palabras motivacionales
      floatingTexts.forEach((item, index) => {
        item.y -= 0.4 // Elevar suavemente
        item.life -= 0.015 // Reducir opacidad
        item.opacity = Math.max(0, item.life)

        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
        ctx.fillStyle = particleColor.replace(/[\d\.]+\)$/g, `${item.opacity})`)
        ctx.textAlign = 'center'
        ctx.fillText(item.text, item.x, item.y)

        // Limpiar palabras desvanecidas
        if (item.life <= 0) {
          floatingTexts.splice(index, 1)
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [particleColor])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}

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

  const [themeIndex, setThemeIndex] = useState(0)
  const theme = THEMES[themeIndex]

  function nextTheme() {
    setThemeIndex((prev) => (prev + 1) % THEMES.length)
  }

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

  const isEmailValid = validarEmail(email)

  return (
    <div className="login-container" style={{ background: theme.bg, transition: 'background 0.5s ease' }}>
      <BackgroundCanvas particleColor={theme.particleColor} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes neonGlow {
          0%, 100% {
            box-shadow: 0 0 15px ${theme.btnBg}66, 0 0 30px ${theme.btnBg}33;
          }
          50% {
            box-shadow: 0 0 25px ${theme.btnBg}aa, 0 0 45px ${theme.btnBg}66;
          }
        }

        @keyframes btnGlow {
          0%, 100% {
            box-shadow: 0 4px 14px ${theme.btnBg}55;
          }
          50% {
            box-shadow: 0 6px 22px ${theme.btnBg}88;
          }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        .card-wrapper {
          position: relative;
          width: 100%;
          max-width: 950px;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
        }

        .glow-orb-1 {
          position: absolute;
          top: -120px;
          left: -100px;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, ${theme.orb1} 0%, rgba(0,0,0,0) 70%);
          filter: blur(100px);
          pointer-events: none;
          z-index: 1;
          animation: pulseGlow 6s infinite ease-in-out;
          transition: background 0.5s ease;
        }

        .glow-orb-2 {
          position: absolute;
          bottom: -120px;
          right: -100px;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, ${theme.orb2} 0%, rgba(0,0,0,0) 70%);
          filter: blur(100px);
          pointer-events: none;
          z-index: 1;
          animation: pulseGlow 7s infinite ease-in-out alternate;
          transition: background 0.5s ease;
        }

        .glass-card {
          width: 100%;
          background: ${theme.cardBg};
          border-radius: 2rem;
          display: flex;
          box-shadow: ${theme.isLight ? '0 25px 50px -12px rgba(0,0,0,0.08)' : '0 25px 60px -15px rgba(0,0,0,0.7)'};
          overflow: hidden;
          border: 1px solid ${theme.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'};
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 2;
          transition: background 0.5s ease, border 0.5s ease, box-shadow 0.5s ease;
        }

        .side-info {
          flex: 1;
          background: transparent;
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .side-content {
          position: relative;
          z-index: 10;
        }

        .logo-glow {
          width: 54px;
          height: 54px;
          background: ${theme.btnBg};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          animation: neonGlow 3s infinite ease-in-out;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.5s ease;
        }

        .logo-glow:hover {
          transform: scale(1.1);
        }

        .logo-glow:active {
          transform: scale(0.95);
        }

        .form-section {
          width: 440px;
          flex-shrink: 0;
          padding: 3rem 3.5rem;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: color 0.25s ease;
        }

        .custom-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.875rem;
          padding: 0.85rem 1rem 0.85rem 2.6rem;
          font-size: 0.9rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.25s ease;
          outline: none;
          color: #0f172a;
        }

        .custom-input:focus {
          border-color: ${theme.btnBg};
          box-shadow: 0 0 0 4px ${theme.btnBg}22;
          background: white;
        }

        .custom-input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: ${theme.btnBg};
        }

        .btn-cobalto {
          width: 100%;
          background: ${theme.btnBg};
          color: white;
          padding: 0.9rem;
          border-radius: 0.875rem;
          font-weight: 700;
          font-size: 0.95rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          animation: btnGlow 3s infinite ease-in-out;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-cobalto:hover:not(:disabled) {
          background: ${theme.btnHover};
          transform: translateY(-2px);
          box-shadow: 0 8px 25px ${theme.btnBg}88;
        }

        .btn-cobalto:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-cobalto:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          animation: none;
        }

        .status-dots {
          display: flex;
          gap: 0.75rem;
          position: relative;
          z-index: 10;
        }

        .dot-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 0.85rem;
          background: ${theme.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};
          backdrop-filter: blur(12px);
          border: 1px solid ${theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          border-radius: 0.875rem;
          transition: all 0.25s ease;
        }

        .dot-card:hover {
          background: ${theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          border-color: ${theme.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)'};
          transform: translateY(-2px);
        }

        .logo-mobile {
          display: none;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 820px) {
          .side-info { display: none; }
          .glass-card { max-width: 420px; border-radius: 1.75rem; margin: 0 1rem; }
          .form-section { width: 100%; padding: 2.75rem 2rem 2.5rem; }
          .login-container { padding: 1.5rem; align-items: center; }
          .logo-mobile { display: flex; }
          .title-block { text-align: center; }
        }

        @media (max-height: 700px) {
          .form-section { padding: 2rem 3rem; }
        }
      `}</style>

      <div className="card-wrapper">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />

        <div className="glass-card">
          {/* ── Panel izquierdo ── */}
          <div className="side-info">
            <div className="side-content">
              <button 
                className="logo-glow" 
                onClick={nextTheme}
                title={`Cambiar tema de color (${theme.name})`}
              >
                <span style={{ color:'white', fontWeight:800, fontSize:20, fontFamily:'Plus Jakarta Sans, sans-serif' }}>EC</span>
              </button>
              <h1 style={{ color: theme.textColor, fontSize:'2.25rem', fontWeight:800, lineHeight:1.15, fontFamily:'Plus Jakarta Sans, sans-serif', margin:0, transition: 'color 0.4s ease' }}>
                Control escolar,<br/>sin complicaciones.
              </h1>
              <p style={{ color: theme.subTextColor, marginTop:'1.25rem', fontSize:'0.95rem', maxWidth:'280px', lineHeight:1.65, fontFamily:'Plus Jakarta Sans, sans-serif', transition: 'color 0.4s ease' }}>
                Todo lo que tu plantel necesita, en un solo lugar.
              </p>
            </div>

            <div className="status-dots">
              {[
                { 
                  color: '#22c55e', 
                  label: 'Gestión',
                  icon: (
                    <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  )
                },
                { 
                  color: '#eab308', 
                  label: 'Control',
                  icon: (
                    <svg width="14" height="14" fill="none" stroke="#eab308" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  )
                },
                { 
                  color: '#ef4444', 
                  label: 'Seguimiento',
                  icon: (
                    <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  )
                },
              ].map((d, i) => (
                <div key={i} className="dot-card">
                  {d.icon}
                  <span style={{ fontSize:'0.68rem', fontWeight:700, color: theme.dotTextColor, textTransform:'uppercase', letterSpacing:'0.05em', fontFamily:'Plus Jakarta Sans, sans-serif', transition: 'color 0.4s ease' }}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Formulario ── */}
          <div className="form-section">

            <div className="logo-mobile">
              <button 
                onClick={nextTheme}
                style={{
                  width: 56,
                  height: 56,
                  background: theme.btnBg,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${theme.btnBg}55`,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.4s ease'
                }}
              >
                <span style={{ color:'white', fontWeight:800, fontSize:22, fontFamily:'Plus Jakarta Sans, sans-serif' }}>EC</span>
              </button>
            </div>

            <div className="title-block" style={{ marginBottom:'2rem' }}>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a', margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                {olvidé ? 'Recuperar cuenta' : 'Bienvenido a EduControl'}
              </h2>
              <p style={{ color:'#64748b', marginTop:'0.375rem', fontSize:'0.875rem', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                {olvidé ? 'Ingresa tu correo para recibir un enlace.' : 'Ingresa tus credenciales para acceder.'}
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
              {!olvidé ? (
                <>
                  <div>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, color:'#475569', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      Correo electrónico
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(sanitizeEmail(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="custom-input"
                        placeholder="usuario@educontrol.com"
                        autoComplete="email"
                      />
                      <div className="input-icon">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <path d="M22 6l-10 7L2 6"/>
                        </svg>
                      </div>
                      {isEmailValid && (
                        <span style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'#22c55e', fontSize:'0.9rem' }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, color:'#475569', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      Contraseña
                    </label>
                    <div className="input-wrapper">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="custom-input"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <div className="input-icon">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                        {showPass ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p style={{ color:'#ef4444', fontSize:'0.8rem', fontWeight:500, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      {error}
                    </p>
                  )}

                  <div style={{ marginTop:'0.5rem' }}>
                    <button className="btn-cobalto" onClick={handleLogin} disabled={loading}>
                      {loading ? (
                        <>
                          <span style={{ width:14, height:14, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />
                          Verificando...
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </>
                      ) : 'Ingresar'}
                    </button>
                  </div>

                  <div style={{ textAlign:'center', marginTop:'0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setOlvidé(true); setError('') }}
                      style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.8rem', cursor:'pointer', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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
                  <button type="button" onClick={() => { setOlvidé(false); setResetSent(false); setResetEmail('') }}
                    style={{ background:'none', border:'none', color: theme.btnBg, cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                    Volver al inicio
                  </button>
                </div>
              ) : (
                <>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(sanitizeEmail(e.target.value))}
                      className="custom-input"
                      placeholder="Tu correo de recuperación"
                      autoComplete="email"
                    />
                    <div className="input-icon">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <path d="M22 6l-10 7L2 6"/>
                      </svg>
                    </div>
                  </div>
                  {error && <p style={{ color:'#ef4444', fontSize:'0.8rem', fontWeight:500, margin:0 }}>{error}</p>}
                  <button className="btn-cobalto" onClick={handleReset} disabled={resetLoading}>
                    {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                  <div style={{ textAlign:'center' }}>
                    <button type="button" onClick={() => { setOlvidé(false); setError('') }}
                      style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                      Volver
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop:'2.5rem', textAlign:'center' }}>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                &copy; 2026 EduControl · Dinoti Platforms
              </p>
            </div>
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