// src/hooks/useDocenteData.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AsignacionDocente = {
  id: string
  grupo_id: string
  grupo_numero: string
  grupo_grado: number
  asignatura_id: string
  asignatura_nombre: string
}

export type DocenteData = {
  id: string
  nombre_completo: string
  email: string
  email_institucional: string | null
  plantel_id: string
  asignaciones: AsignacionDocente[]
}

// Tipo que refleja la forma que devuelve Supabase en el join
type AsignacionRaw = {
  id: string
  grupo_id: string
  asignatura_id: string
  grupos: { numero: string; grado: number }[]
  asignaturas: { nombre: string }[]
}

export function useDocenteData() {
  const [docente, setDocente] = useState<DocenteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      // Obtener datos del docente
      const { data: docenteData, error: docenteError } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, email, email_institucional, plantel_id')
        .eq('auth_id', user.id)
        .eq('rol', 'docente')
        .single()

      if (docenteError) throw docenteError
      if (!docenteData) throw new Error('No se encontró el docente')

      // Obtener asignaciones con grupos y asignaturas
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

      // Mapear asignaciones
      const asignaciones: AsignacionDocente[] = ((asignacionesData ?? []) as AsignacionRaw[]).map((a) => ({
        id: a.id,
        grupo_id: a.grupo_id,
        grupo_numero: a.grupos[0]?.numero ?? '',
        grupo_grado: a.grupos[0]?.grado ?? 0,
        asignatura_id: a.asignatura_id,
        asignatura_nombre: a.asignaturas[0]?.nombre ?? '',
      }))

      setDocente({ ...docenteData, asignaciones })
    } catch (err) {
      console.error('Error al cargar datos del docente:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  return { docente, loading, error, recargar: cargarDatos }
}