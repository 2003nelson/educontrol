'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CambiarPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  async function handleCambiar() {
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return }
    if (nueva.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }

    setLoading(true)
    setError('')

    // 1. Actualizar contraseña
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: nueva,
      data: { primer_login: false }
    })

    if (updateError) {
      setError('Error al actualizar contraseña')
      setLoading(false)
      return
    }

    // 2. Marcar cuenta_activada en tabla usuarios
    if (updateData.user) {
      await supabase
        .from('usuarios')
        .update({ cuenta_activada: true })
        .eq('auth_id', updateData.user.id)
    }

    // 3. Verificar rol para redirigir correctamente
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('auth_id', user.id)
        .single()

      const rol = usuarioData?.rol ?? user.user_metadata?.rol

      if (rol === 'docente') {
        router.push('/docente/grupos')
      } else if (rol === 'super_admin') {
        router.push('/super-admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '2.5rem', width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '0.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1e6fcc, #155ca0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>EC</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1c1e', margin: 0 }}>Crea tu contraseña</h1>
          <p style={{ fontSize: '0.8rem', color: '#8e8e93', margin: 0, textAlign: 'center' }}>
            Es tu primer acceso. Elige una contraseña segura.
          </p>
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6c6c70', display: 'block', marginBottom: '0.375rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Nueva contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNueva ? 'text' : 'password'}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                onKeyDown={e => e.key === 'Enter' && handleCambiar()}
                style={{ width: '100%', border: '1.5px solid #e5e5ea', borderRadius: 10, padding: '0.75rem 3rem 0.75rem 1rem', fontSize: '0.9rem', color: '#1c1c1e', outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007aff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e5ea'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowNueva(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aeaeb2', padding: 0, display: 'flex' }}>
                {showNueva
                  ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6c6c70', display: 'block', marginBottom: '0.375rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Confirmar contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                onKeyDown={e => e.key === 'Enter' && handleCambiar()}
                style={{ width: '100%', border: '1.5px solid #e5e5ea', borderRadius: 10, padding: '0.75rem 3rem 0.75rem 1rem', fontSize: '0.9rem', color: '#1c1c1e', outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007aff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e5ea'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowConfirmar(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aeaeb2', padding: 0, display: 'flex' }}>
                {showConfirmar
                  ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #ffd7d5', borderRadius: 8, padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3b30', flexShrink: 0 }}/>
              <p style={{ fontSize: '0.78rem', color: '#ff3b30', margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleCambiar}
            disabled={loading}
            style={{ width: '100%', padding: '0.875rem', borderRadius: 10, border: 'none', background: loading ? '#aeaeb2' : '#007aff', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', boxShadow: loading ? 'none' : '0 2px 12px rgba(0,122,255,0.25)', transition: 'all 0.18s' }}
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>

        <p style={{ fontSize: '0.7rem', color: '#c7c7cc', textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          © 2026 Dinoti Platforms · EduControl
        </p>
      </div>
    </div>
  )
}