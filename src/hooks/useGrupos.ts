// src/hooks/useGrupos.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export interface Grupo {
  id: string
  grado: number
  numero: string  // Alfanumérico (letras + números, max 5 caracteres)
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id: string | null
  plantel_id: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface NuevoGrupo {
  grado: number
  numero: string  // Alfanumérico
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id: string | null
}

export interface ActualizarGrupo {
  grado?: number
  numero?: string  // Alfanumérico
  turno?: 'matutino' | 'vespertino'
  ciclo_escolar?: string
  docente_id?: string | null
}

export function useGrupos() {
  const { plantelId, isSuperAdmin } = useAuth()
  const supabase = createClient()
  
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarGrupos = useCallback(async () => {
    if (!plantelId && !isSuperAdmin) return
    
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('grupos')
        .select('*')
        .eq('activo', true)
        .order('grado', { ascending: true })
        .order('numero', { ascending: true })

      if (!isSuperAdmin && plantelId) {
        query = query.eq('plantel_id', plantelId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setGrupos(data as Grupo[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      console.error('Error al cargar grupos:', err)
    } finally {
      setLoading(false)
    }
  }, [plantelId, isSuperAdmin, supabase])

  const agregarGrupo = useCallback(async (datos: NuevoGrupo): Promise<boolean> => {
    if (!plantelId) {
      setError('No se encontró el plantel del usuario')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('grupos')
        .insert({
          ...datos,
          numero: datos.numero.toUpperCase(), // Convertir a mayúsculas
          plantel_id: plantelId,
          activo: true,
        })

      if (insertError) throw insertError

      await cargarGrupos()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar grupo'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [plantelId, cargarGrupos, supabase])

  const actualizarGrupo = useCallback(async (
    id: string,
    cambios: ActualizarGrupo
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Convertir numero a mayúsculas si existe
      const cambiosFormateados = {
        ...cambios,
        ...(cambios.numero && { numero: cambios.numero.toUpperCase() }),
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('grupos')
        .update(cambiosFormateados)
        .eq('id', id)

      if (updateError) throw updateError

      await cargarGrupos()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar grupo'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [cargarGrupos, supabase])

  const eliminarGrupo = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('grupos')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await cargarGrupos()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar grupo'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [cargarGrupos, supabase])

  const asignarEstudiantes = useCallback(async (
    grupoId: string,
    estudiantesIds: string[]
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Actualizar estudiantes seleccionados
      const { error: updateError } = await supabase
        .from('estudiantes')
        .update({ grupo_id: grupoId, updated_at: new Date().toISOString() })
        .in('id', estudiantesIds)

      if (updateError) throw updateError

      // Desvincular estudiantes que ya no están seleccionados
      const { error: clearError } = await supabase
        .from('estudiantes')
        .update({ grupo_id: null, updated_at: new Date().toISOString() })
        .eq('grupo_id', grupoId)
        .not('id', 'in', `(${estudiantesIds.join(',')})`)

      if (clearError) throw clearError

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar estudiantes'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (plantelId || isSuperAdmin) {
      cargarGrupos()
    }
  }, [plantelId, isSuperAdmin, cargarGrupos])

  return {
    grupos,
    loading,
    error,
    cargarGrupos,
    agregarGrupo,
    actualizarGrupo,
    eliminarGrupo,
    asignarEstudiantes,
  }
}