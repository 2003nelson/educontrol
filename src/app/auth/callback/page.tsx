'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleCallback() {
      // Supabase procesa el hash automáticamente al detectar access_token
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Sesión establecida — redirigir según tipo
        const tipo = new URLSearchParams(window.location.search).get('type')
        if (tipo === 'invite' || tipo === 'recovery') {
          router.replace('/cambiar-password')
        } else {
          // Login normal — verificar rol
          const { data: ud } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('auth_id', session.user.id)
            .single()
          const rol = ud?.rol ?? session.user.user_metadata?.rol
          if (rol === 'docente') router.replace('/docente/grupos')
          else if (rol === 'super_admin') router.replace('/super-admin')
          else router.replace('/dashboard')
        }
        return
      }

      // Escuchar evento de auth si aún no hay sesión
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          subscription.unsubscribe()
          router.replace('/cambiar-password')
        }
      })

      // Timeout
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/login')
      }, 10000)
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div style={{
      minHeight: '100vh', background: '#f2f2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <style>{`
          @keyframes dotBounce {
            0%,100% { transform: translateY(0); opacity: .4 }
            40%      { transform: translateY(-10px); opacity: 1 }
          }
        `}</style>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{c:'#ef4444',d:'0s'},{c:'#f59e0b',d:'0.15s'},{c:'#22c55e',d:'0.3s'}].map((dot,i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: dot.c, animation: `dotBounce 1.1s ease-in-out ${dot.d} infinite` }}/>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#8e8e93', margin: 0 }}>Procesando acceso...</p>
      </div>
    </div>
  )
}