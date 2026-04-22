// src/hooks/useAsignaturas.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlantelId } from '@/contexts/PlantelContext'
import { User } from '@supabase/supabase-js'

export interface Asignatura {
  id: string
  plantel_id: string
  nombre: string
  semestre: number
  activo: boolean
  created_at: string
  updated_at: string
}

interface AsignaturaInput {
  nombre: string
  semestre: number
}

export function useAsignaturas() {
  const plantelId = usePlantelId() // Obtener del context
  const supabase = createClient()
  
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Verificar autenticación
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Cargar asignaturas
  const cargarAsignaturas = useCallback(async () => {
    if (!plantelId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('asignaturas')
        .select('*')
        .eq('plantel_id', plantelId)
        .eq('activo', true)
        .order('semestre', { ascending: true })
        .order('nombre', { ascending: true })

      if (fetchError) throw fetchError
      setAsignaturas(data as Asignatura[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar asignaturas'
      setError(message)
      console.error('Error al cargar asignaturas:', err)
    } finally {
      setLoading(false)
    }
  }, [plantelId, supabase])

  // Cargar al montar y cuando cambie plantelId
  useEffect(() => {
    if (plantelId) {
      cargarAsignaturas()
    }
  }, [plantelId, cargarAsignaturas])

  // Crear asignatura
  const crearAsignatura = useCallback(async (data: AsignaturaInput): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    if (!plantelId) {
      setError('ID de plantel no disponible')
      return false
    }

    // Validación local
    const nombreTrim = data.nombre.trim().toUpperCase()
    if (nombreTrim.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return false
    }
    if (nombreTrim.length > 100) {
      setError('El nombre no puede exceder 100 caracteres')
      return false
    }
    if (data.semestre < 1 || data.semestre > 6) {
      setError('El semestre debe estar entre 1 y 6')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('asignaturas')
        .insert({
          plantel_id: plantelId,
          nombre: nombreTrim,
          semestre: data.semestre,
          activo: true,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Ya existe una asignatura con ese nombre en este semestre')
        }
        throw insertError
      }

      await cargarAsignaturas()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear asignatura'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [plantelId, user, supabase, cargarAsignaturas])

  // Editar asignatura
  const editarAsignatura = useCallback(async (
    id: string,
    cambios: Partial<AsignaturaInput>
  ): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const cambiosFormateados: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (cambios.nombre !== undefined) {
        const nombreTrim = cambios.nombre.trim().toUpperCase()
        if (nombreTrim.length < 3 || nombreTrim.length > 100) {
          throw new Error('El nombre debe tener entre 3 y 100 caracteres')
        }
        cambiosFormateados.nombre = nombreTrim
      }

      if (cambios.semestre !== undefined) {
        if (cambios.semestre < 1 || cambios.semestre > 6) {
          throw new Error('El semestre debe estar entre 1 y 6')
        }
        cambiosFormateados.semestre = cambios.semestre
      }

      const { error: updateError } = await supabase
        .from('asignaturas')
        .update(cambiosFormateados)
        .eq('id', id)

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Ya existe una asignatura con ese nombre en este semestre')
        }
        throw updateError
      }

      await cargarAsignaturas()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar asignatura'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase, cargarAsignaturas])

  // Eliminar asignatura (soft delete)
  const eliminarAsignatura = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('asignaturas')
        .update({ 
          activo: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (deleteError) throw deleteError

      await cargarAsignaturas()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar asignatura'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase, cargarAsignaturas])

  return {
    asignaturas,
    loading,
    error,
    crearAsignatura,
    editarAsignatura,
    eliminarAsignatura,
    cargarAsignaturas,
  }
}