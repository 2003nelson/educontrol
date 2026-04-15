// src/hooks/useGrupos.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

// ═════════════════════════════════════════════════════════════════
// 🎯 INTERFACES
// ═════════════════════════════════════════════════════════════════

export interface Grupo {
  id: string
  grado: number
  numero: number
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id: string | null
  plantel_id: string
  activo: boolean
  created_at: string
  updated_at: string
  docentes?: {
    id: string
    nombre_completo: string
    activo: boolean
  } | null
}

export interface NuevoGrupo {
  grado: number
  numero: number
  turno: 'matutino' | 'vespertino'
  ciclo_escolar: string
  docente_id: string | null
}

export interface ActualizarGrupo {
  grado?: number
  numero?: number
  turno?: 'matutino' | 'vespertino'
  ciclo_escolar?: string
  docente_id?: string | null
}

// ═════════════════════════════════════════════════════════════════
// 🪝 HOOK
// ═════════════════════════════════════════════════════════════════

export function useGrupos() {
  const { plantelId, isSuperAdmin } = useAuth()
  const supabase = createClient()
  
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────────
  // 📥 CARGAR GRUPOS
  // ─────────────────────────────────────────────────────────────────
  const cargarGrupos = useCallback(async () => {
    if (!plantelId && !isSuperAdmin) return
    
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('grupos')
        .select(`
          *,
          docentes!grupos_docente_id_fkey (
            id,
            nombre_completo,
            activo
          )
        `)
        .eq('activo', true)
        .order('grado', { ascending: true })
        .order('numero', { ascending: true })

      // Super admin ve todos los grupos, otros solo su plantel
      if (!isSuperAdmin && plantelId) {
        query = query.eq('plantel_id', plantelId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setGrupos((data as unknown) as Grupo[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      console.error('Error al cargar grupos:', err)
    } finally {
      setLoading(false)
    }
  }, [plantelId, isSuperAdmin, supabase])

  // ─────────────────────────────────────────────────────────────────
  // ➕ AGREGAR GRUPO
  // ─────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────
  // ✏️ ACTUALIZAR GRUPO
  // ─────────────────────────────────────────────────────────────────
  const actualizarGrupo = useCallback(async (
    id: string,
    cambios: ActualizarGrupo
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('grupos')
        .update({
          ...cambios,
          updated_at: new Date().toISOString(),
        })
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

  // ─────────────────────────────────────────────────────────────────
  // 🗑️ ELIMINAR GRUPO (soft delete)
  // ─────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────
  // 🔄 CARGAR AL MONTAR
  // ─────────────────────────────────────────────────────────────────
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
  }
}