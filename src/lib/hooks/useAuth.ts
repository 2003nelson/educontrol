// src/lib/hooks/useAuth.ts
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface UserMetadata {
  rol: 'super_admin' | 'director' | 'docente'
  plantel_id: string
  nombre_completo: string
  primer_login?: boolean
}

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<UserMetadata | null>(null)

  useEffect(() => {
    // Verificar usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        setLoading(false)
        return
      }

      const meta = user.user_metadata as UserMetadata

      // Validar metadata
      if (!meta?.plantel_id || !meta?.rol) {
        console.error('Usuario sin plantel_id o rol')
        supabase.auth.signOut()
        router.push('/login')
        setLoading(false)
        return
      }

      setUser(user)
      setMetadata(meta)
      setLoading(false)
    })

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setMetadata(session.user.user_metadata as UserMetadata)
      } else {
        setUser(null)
        setMetadata(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return {
    user,
    metadata,
    loading,
    signOut,
    plantelId: metadata?.plantel_id,
    rol: metadata?.rol,
    nombreCompleto: metadata?.nombre_completo,
    isSuperAdmin: metadata?.rol === 'super_admin',
    isDirector: metadata?.rol === 'director',
    isDocente: metadata?.rol === 'docente',
  }
}