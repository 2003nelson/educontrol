// src/contexts/DocenteContext.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AsignacionDocente = {
  id: string
  grupo_id: string
  grupo_numero: string
  grupo_grado: number
  asignatura_id: string
  asignatura_nombre: string
}

type DocenteData = {
  id: string
  nombre_completo: string
  email: string
  email_institucional: string | null
  plantel_id: string
  cuenta_activada: boolean
  asignaciones: AsignacionDocente[]
}

type DocenteContextType = {
  docente: DocenteData | null
  loading: boolean
  error: string | null
  recargar: () => Promise<void>
}

// Supabase puede devolver joins como objeto o array
type GrupoRaw = { numero: string; grado: number } | { numero: string; grado: number }[] | null
type AsignaturaRaw = { nombre: string } | { nombre: string }[] | null

function resolveGrupo(raw: GrupoRaw): { numero: string; grado: number } | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

function resolveAsignatura(raw: AsignaturaRaw): { nombre: string } | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

const DocenteContext = createContext<DocenteContextType | null>(null)

export function DocenteProvider({ children }: { children: ReactNode }) {
  const [docente, setDocente] = useState<DocenteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function cargarDatos() {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: docenteData, error: docenteError } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, email, email_institucional, plantel_id, cuenta_activada')
        .eq('auth_id', user.id)
        .eq('rol', 'docente')
        .single()

      if (docenteError) throw docenteError
      if (!docenteData) { router.push('/login'); return }

      if (!docenteData.cuenta_activada) {
        router.push('/docente/primera-vez')
        return
      }

      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones_docentes')
        .select(`
          id,
          grupo_id,
          asignatura_id,
          grupos!inner(numero, grado),
          asignaturas!inner(nombre)
        `)
        .eq('docente_id', docenteData.id)

      if (asignacionesError) throw asignacionesError

      const asignaciones: AsignacionDocente[] = (asignacionesData || []).map((a) => {
        const grupo = resolveGrupo(a.grupos as GrupoRaw)
        const asignatura = resolveAsignatura(a.asignaturas as AsignaturaRaw)
        return {
          id: a.id,
          grupo_id: a.grupo_id,
          grupo_numero: grupo?.numero ?? '',
          grupo_grado: grupo?.grado ?? 0,
          asignatura_id: a.asignatura_id,
          asignatura_nombre: asignatura?.nombre ?? '',
        }
      })

      setDocente({ ...docenteData, asignaciones })
    } catch (err) {
      console.error('Error al cargar datos del docente:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DocenteContext.Provider value={{ docente, loading, error, recargar: cargarDatos }}>
      {children}
    </DocenteContext.Provider>
  )
}

export function useDocente() {
  const context = useContext(DocenteContext)
  if (!context) throw new Error('useDocente debe usarse dentro de DocenteProvider')
  return context
}