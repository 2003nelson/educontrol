// src/contexts/PlantelContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Usuario {
  id: string
  auth_id: string
  plantel_id: string
  email: string
  nombre_completo: string
  rol: 'super_admin' | 'admin' | 'director' | 'subdirector' | 'docente' | 'secretaria'
  activo: boolean
}

interface PlantelContextType {
  plantelId: string | null
  usuario: Usuario | null
  loading: boolean
  error: string | null
  recargarUsuario: () => Promise<void>
}

const PlantelContext = createContext<PlantelContextType>({
  plantelId: null,
  usuario: null,
  loading: true,
  error: null,
  recargarUsuario: async () => {},
})

export function PlantelProvider({ children }: { children: ReactNode }) {
  const [plantelId, setPlantelId] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef(createClient())
  const cargandoRef = useRef(false) // Prevenir cargas duplicadas

  const cargarUsuario = async () => {
    // Prevenir cargas duplicadas simultáneas
    if (cargandoRef.current) {
      return
    }

    try {
      cargandoRef.current = true
      setLoading(true)
      setError(null)

      const supabase = supabaseRef.current
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      
      if (!user) {
        setPlantelId(null)
        setUsuario(null)
        setLoading(false)
        return
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .eq('activo', true)
        .single()

      if (usuarioError) {
        if (usuarioError.code === 'PGRST116') {
          throw new Error('Usuario no encontrado en el sistema. Contacta al administrador.')
        }
        throw usuarioError
      }

      if (!usuarioData) {
        throw new Error('No se encontraron datos del usuario')
      }

      setUsuario(usuarioData as Usuario)
      setPlantelId(usuarioData.plantel_id)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuario'
      setError(message)
      console.error('Error en PlantelContext:', err)
      setPlantelId(null)
      setUsuario(null)
    } finally {
      setLoading(false)
      cargandoRef.current = false
    }
  }

  useEffect(() => {
    cargarUsuario()

    // Solo escuchar SIGN_OUT, no SIGN_IN
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setPlantelId(null)
          setUsuario(null)
          setLoading(false)
        }
        // NO recargar en SIGNED_IN - evita loops cuando vuelves a la pestaña
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <PlantelContext.Provider 
      value={{ 
        plantelId, 
        usuario, 
        loading, 
        error,
        recargarUsuario: cargarUsuario 
      }}
    >
      {children}
    </PlantelContext.Provider>
  )
}

export function usePlantel() {
  const context = useContext(PlantelContext)
  
  if (context === undefined) {
    throw new Error('usePlantel debe usarse dentro de PlantelProvider')
  }
  
  return context
}

export function usePlantelId(): string | null {
  const { plantelId } = usePlantel()
  return plantelId
}

export function useRol(): string | null {
  const { usuario } = usePlantel()
  return usuario?.rol || null
}

export function usePermisos() {
  const { usuario } = usePlantel()
  
  return {
    esSuperAdmin: usuario?.rol === 'super_admin',
    esAdmin: usuario?.rol === 'admin' || usuario?.rol === 'super_admin',
    esDirector: usuario?.rol === 'director' || usuario?.rol === 'admin' || usuario?.rol === 'super_admin',
    esDocente: usuario?.rol === 'docente',
    esSecretaria: usuario?.rol === 'secretaria',
  }
}