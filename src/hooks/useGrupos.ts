// src/hooks/useGrupos.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Grupo = {
  id: string
  plantel_id: string
  nombre: string
  semestre: number
  ciclo_escolar: string
  turno: string | null
  activo: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  total_alumnos?: number
}

export type Estudiante = {
  id: string
  plantel_id: string
  grupo_id: string
  matricula: string | null
  nombre_completo: string
  activo: boolean
  created_at: string
  updated_at: string
}

export type AlumnoInput = {
  matricula: string
  nombre: string
}

const CICLO_ESCOLAR_ACTUAL = '2025-2026 Ago-Ene'
const TURNO_DEFAULT = 'matutino'

export function useGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Obtener plantel_id del usuario actual
  const getPlantelId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return user.user_metadata?.plantel_id || null
  }, [supabase])

  // Fetch grupos del plantel
  const fetchGrupos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const plantelId = await getPlantelId()
      console.log('🔍 Plantel ID obtenido:', plantelId)
      
      if (!plantelId) {
        setError('No se encontró el plantel del usuario')
        setLoading(false)
        return
      }

      console.log('📊 Consultando grupos para plantel:', plantelId)
      
      // Obtener grupos
      const { data: gruposData, error: gruposError } = await supabase
        .from('grupos')
        .select('*')
        .eq('plantel_id', plantelId)
        .eq('activo', true)
        .order('semestre', { ascending: true })
        .order('nombre', { ascending: true })

      console.log('✅ Grupos obtenidos:', gruposData)
      console.log('❌ Error grupos:', gruposError)
      
      if (gruposError) throw gruposError

      /* TEMPORAL: Comentado hasta verificar estructura de estudiantes
      // Obtener conteo de alumnos por grupo
      const { data: countData, error: countError } = await supabase
        .from('estudiantes')
        .select('grupo_id')
        .eq('plantel_id', plantelId)
        .eq('activo', true)

      if (countError) throw countError

      // Mapear conteo
      const conteos: Record<string, number> = {}
      countData?.forEach(item => {
        conteos[item.grupo_id] = (conteos[item.grupo_id] || 0) + 1
      })
      */

      // Agregar total_alumnos a cada grupo (temporal = 0)
      const gruposConConteo = (gruposData || []).map(g => ({
        ...g,
        total_alumnos: 0 // conteos[g.id] || 0
      }))

      setGrupos(gruposConConteo)
    } catch (err) {
      console.error('Error al cargar grupos:', err)
      console.error('Error type:', typeof err)
      console.error('Error keys:', err ? Object.keys(err) : 'null')
      console.error('Error JSON:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }, [supabase, getPlantelId])

  // Crear grupo
  async function crearGrupo(nombre: string, semestre: number) {
    try {
      const plantelId = await getPlantelId()
      if (!plantelId) throw new Error('No se encontró el plantel del usuario')

      const { data, error } = await supabase
        .from('grupos')
        .insert({
          plantel_id: plantelId,
          nombre,
          semestre,
          ciclo_escolar: CICLO_ESCOLAR_ACTUAL,
          turno: TURNO_DEFAULT,
          activo: true,
          metadata: {}
        })
        .select()
        .single()

      if (error) throw error

      // Agregar al estado local
      setGrupos(prev => [...prev, { ...data, total_alumnos: 0 }])
      return data
    } catch (err) {
      console.error('Error al crear grupo:', err)
      throw err
    }
  }

  // Editar grupo
  async function editarGrupo(id: string, nombre: string, semestre: number) {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .update({ nombre, semestre, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Actualizar estado local
      setGrupos(prev => prev.map(g => 
        g.id === id ? { ...g, nombre, semestre } : g
      ))
      return data
    } catch (err) {
      console.error('Error al editar grupo:', err)
      throw err
    }
  }

  // Eliminar grupo
  async function eliminarGrupo(id: string) {
    try {
      // Soft delete - marcar como inactivo
      const { error } = await supabase
        .from('grupos')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // También marcar estudiantes como inactivos
      await supabase
        .from('estudiantes')
        .update({ activo: false })
        .eq('grupo_id', id)

      // Quitar del estado local
      setGrupos(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Error al eliminar grupo:', err)
      throw err
    }
  }

  // Cargar alumnos a un grupo
  async function cargarAlumnos(grupoId: string, alumnos: AlumnoInput[]) {
    try {
      const plantelId = await getPlantelId()
      if (!plantelId) throw new Error('No se encontró el plantel del usuario')

      // Primero, eliminar alumnos existentes del grupo (soft delete)
      await supabase
        .from('estudiantes')
        .update({ activo: false })
        .eq('grupo_id', grupoId)

      // Insertar nuevos alumnos
      const estudiantesData = alumnos.map(a => ({
        plantel_id: plantelId,
        grupo_id: grupoId,
        matricula: a.matricula || null,
        nombre_completo: a.nombre,
        activo: true
      }))

      const { error } = await supabase
        .from('estudiantes')
        .insert(estudiantesData)

      if (error) throw error

      // Actualizar conteo en estado local
      setGrupos(prev => prev.map(g => 
        g.id === grupoId ? { ...g, total_alumnos: alumnos.length } : g
      ))

      return true
    } catch (err) {
      console.error('Error al cargar alumnos:', err)
      throw err
    }
  }

  // Obtener alumnos de un grupo
  async function obtenerAlumnos(grupoId: string): Promise<Estudiante[]> {
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('grupo_id', grupoId)
        .eq('activo', true)
        .order('nombre_completo', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener alumnos:', err)
      throw err
    }
  }

  // Cargar grupos al montar
  useEffect(() => {
    fetchGrupos()
  }, [fetchGrupos])

  return {
    grupos,
    loading,
    error,
    fetchGrupos,
    crearGrupo,
    editarGrupo,
    eliminarGrupo,
    cargarAlumnos,
    obtenerAlumnos
  }
}