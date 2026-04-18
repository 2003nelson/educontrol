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
  total_estudiantes?: number  // Contador de estudiantes
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

export interface EstudianteInput {
  plantel_id: string
  grupo_id: string
  matricula: string | null
  nombre_completo: string
  activo: boolean
}

export function useGrupos() {
  const { user, plantelId } = useAuth()
  const supabase = createClient()
  
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarGrupos = useCallback(async () => {
    if (!plantelId) return
    
    setLoading(true)
    setError(null)

    try {
      // Cargar grupos con contador de estudiantes
      const { data: gruposData, error: fetchError } = await supabase
        .from('grupos')
        .select(`
          *,
          estudiantes:estudiantes(count)
        `)
        .eq('plantel_id', plantelId)
        .eq('activo', true)
        .order('grado', { ascending: true })
        .order('numero', { ascending: true })

      if (fetchError) throw fetchError

      // Formatear datos con contador
      const gruposConContador = (gruposData || []).map((grupo) => {
        // Extraer el contador de estudiantes del objeto anidado
        const estudiantesData = grupo.estudiantes as unknown
        const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : []
        const totalEstudiantes = estudiantesArray[0]?.count || 0
        
        // Crear objeto sin la propiedad 'estudiantes'
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { estudiantes: _estudiantes, ...grupoSinEstudiantes } = grupo
        
        return {
          ...grupoSinEstudiantes,
          total_estudiantes: totalEstudiantes,
        } as unknown as Grupo
      })

      setGrupos(gruposConContador)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      console.error('Error al cargar grupos:', err)
    } finally {
      setLoading(false)
    }
  }, [plantelId, supabase])

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

  async function guardarEstudiantes(estudiantes: EstudianteInput[]): Promise<boolean> {
    if (!user) {
      console.error('Usuario no autenticado')
      return false
    }

    try {
      const grupoId = estudiantes[0]?.grupo_id
      if (!grupoId) {
        console.error('No se proporcionó grupo_id')
        return false
      }

      // Paso 1: Eliminar estudiantes anteriores del grupo
      const { error: deleteError } = await supabase
        .from('estudiantes')
        .delete()
        .eq('grupo_id', grupoId)

      if (deleteError) {
        console.error('Error al eliminar estudiantes anteriores:', deleteError)
        return false
      }

      // Paso 2: Insertar nuevos estudiantes
      const { error: insertError } = await supabase
        .from('estudiantes')
        .insert(estudiantes)

      if (insertError) {
        console.error('Error al insertar estudiantes:', insertError)
        return false
      }

      console.log(`✅ ${estudiantes.length} estudiantes guardados exitosamente`)
      
      // Recargar grupos para actualizar contador
      await cargarGrupos()
      
      return true

    } catch (error) {
      console.error('Error en guardarEstudiantes:', error)
      return false
    }
  }

  useEffect(() => {
    if (plantelId) {
      cargarGrupos()
    }
  }, [plantelId, cargarGrupos])

  return {
    grupos,
    loading,
    error,
    cargarGrupos,
    agregarGrupo,
    actualizarGrupo,
    eliminarGrupo,
    guardarEstudiantes,
  }
}