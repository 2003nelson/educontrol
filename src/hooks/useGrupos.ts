// src/hooks/useGrupos.ts - ACTUALIZADO PARA USAR CONTEXT
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlantelId } from '@/contexts/PlantelContext'
import { User } from '@supabase/supabase-js'

export interface Grupo {
  id: string
  grado: number
  numero: string
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id: string | null
  plantel_id: string
  activo: boolean
  created_at: string
  updated_at: string
  total_estudiantes?: number
}

export interface EstudianteInput {
  plantel_id: string
  grupo_id: string
  matricula: string | null
  nombre_completo: string
  activo: boolean
}

interface GrupoInput {
  grado: number
  numero: string
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id?: string | null
}

export function useGrupos() {
  const plantelId = usePlantelId() // Obtener del context
  const supabase = createClient()
  
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const cargarGrupos = useCallback(async () => {
    if (!plantelId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
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

      const gruposConContador = (gruposData || []).map((grupo) => {
        const estudiantesData = grupo.estudiantes as unknown
        const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : []
        const totalEstudiantes = estudiantesArray[0]?.count || 0
        
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

  useEffect(() => {
    if (plantelId) {
      cargarGrupos()
    }
  }, [plantelId, cargarGrupos])

  const crearGrupo = useCallback(async (data: GrupoInput): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    if (!plantelId) {
      setError('ID de plantel no disponible')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('grupos')
        .insert({
          plantel_id: plantelId,
          grado: data.grado,
          numero: data.numero.toUpperCase(),
          turno: data.turno,
          ciclo_escolar: data.ciclo_escolar,
          docente_id: data.docente_id || null,
          activo: true,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Ya existe un grupo con ese número en este grado y turno')
        }
        throw insertError
      }

      await cargarGrupos()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear grupo'
      setError(message)
      console.error('Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [plantelId, user, supabase, cargarGrupos])

  const editarGrupo = useCallback(async (
    id: string,
    cambios: Partial<GrupoInput>
  ): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const cambiosFormateados: Record<string, unknown> = {
        ...(cambios.grado && { grado: cambios.grado }),
        ...(cambios.turno && { turno: cambios.turno }),
        ...(cambios.ciclo_escolar && { ciclo_escolar: cambios.ciclo_escolar }),
        ...(cambios.docente_id !== undefined && { docente_id: cambios.docente_id || null }),
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
  }, [user, supabase, cargarGrupos])

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
  }, [supabase, cargarGrupos])

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

      const { error: deleteError } = await supabase
        .from('estudiantes')
        .delete()
        .eq('grupo_id', grupoId)

      if (deleteError) {
        console.error('Error al eliminar estudiantes anteriores:', deleteError)
        return false
      }

      const { error: insertError } = await supabase
        .from('estudiantes')
        .insert(estudiantes)

      if (insertError) {
        console.error('Error al insertar estudiantes:', insertError)
        return false
      }

      console.log(`✅ ${estudiantes.length} estudiantes guardados exitosamente`)
      
      await cargarGrupos()
      
      return true

    } catch (error) {
      console.error('Error en guardarEstudiantes:', error)
      return false
    }
  }

  return {
    grupos,
    loading,
    error,
    crearGrupo,
    editarGrupo,
    eliminarGrupo,
    cargarGrupos,
    guardarEstudiantes,
  }
}