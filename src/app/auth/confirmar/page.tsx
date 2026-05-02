'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ConfirmarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const token = searchParams.get('token')
  const type = searchParams.get('type') as 'invite' | 'recovery' | null

  const [estado, setEstado] = useState<'listo' | 'procesando' | 'error'>(
    token ? 'listo' : 'error'
  )
  const [error, setError] = useState(
    token ? '' : 'Link inválido — falta el token'
  )

  async function handleActivar() {
    if (!token || !type) return
    setEstado('procesando')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type === 'invite' ? 'invite' : 'recovery',
    })

    if (verifyError) {
      setEstado('error')
      setError('El enlace expiró o ya fue usado. Pide al director una nueva invitación.')
      return
    }

    router.replace('/cambiar-password')
  }

  const dots = [
    { color: '#ef4444' },
    { color: '#f59e0b' },
    { color: '#22c55e' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#f2f2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
      padding: '1rem',
    }}>
      <style>{`
        @keyframes dotBounce {
          0%,100% { transform: translateY(0); opacity: .4 }
          40%      { transform: translateY(-8px); opacity: 1 }
        }
        .btn-activar { transition: all 0.18s; }
        .btn-activar:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .btn-activar:active { transform: translateY(0); }
      `}</style>

      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        padding: '2.5rem', width: '100%', maxWidth: 380,
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1e6fcc, #155ca0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>EC</span>
        </div>

        {estado === 'error' ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff5f5', border: '1.5px solid #ffd7d5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="22" height="22" fill="none" stroke="#ff3b30" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.5rem' }}>Enlace inválido</h2>
            <p style={{ fontSize: '0.82rem', color: '#8e8e93', margin: '0 0 1.5rem', lineHeight: 1.6 }}>{error}</p>
            <a href="/login" style={{ display: 'block', background: '#007aff', color: 'white', padding: '0.75rem', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              Ir al inicio de sesión
            </a>
          </>
        ) : estado === 'procesando' ? (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.75rem' }}>Activando cuenta...</h2>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {dots.map((dot, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: dot.color, animation: `dotBounce 1.1s ease-in-out ${i * 0.15}s infinite` }}/>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1c1e', margin: '0 0 0.5rem' }}>Activar cuenta</h2>
            <p style={{ fontSize: '0.82rem', color: '#8e8e93', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
              Has sido invitado a EduControl. Haz clic en el botón para activar tu cuenta y crear tu contraseña.
            </p>

            {/* Dots de marca */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1.5rem' }}>
              {dots.map((dot, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: dot.color }}/>
              ))}
            </div>

            <button
              onClick={handleActivar}
              className="btn-activar"
              style={{ width: '100%', padding: '0.875rem', borderRadius: 10, border: 'none', background: '#007aff', color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,122,255,0.25)' }}
            >
              Activar mi cuenta →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8e8e93', fontSize: '0.8rem' }}>Cargando...</p>
      </div>
    }>
      <ConfirmarContent />
    </Suspense>
  )
}