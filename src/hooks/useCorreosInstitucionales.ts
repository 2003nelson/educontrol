// src/hooks/useCorreosInstitucionales.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlantelId } from '@/contexts/PlantelContext'

// ═════════════════════════════════════════════════════════════════
// 🔒 TIPOS
// ═════════════════════════════════════════════════════════════════

export type CorreoInstitucional = {
  id: string
  plantel_id: string
  email: string
  nombre_docente: string | null
  activo: boolean
  usado: boolean
  fecha_creacion: string
  fecha_activacion: string | null
  fecha_uso: string | null
  notas: string | null
}

type CrearCorreoData = {
  email: string
  nombre_docente?: string
  notas?: string
}

// ═════════════════════════════════════════════════════════════════
// 🛡️ VALIDACIONES
// ═════════════════════════════════════════════════════════════════

// Regex RFC 5322 simplificada pero robusta
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

function validarEmail(email: string): { valido: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed) {
    return { valido: false, error: 'El correo es obligatorio' }
  }

  if (trimmed.length > 254) {
    return { valido: false, error: 'El correo es demasiado largo (máx 254 caracteres)' }
  }

  const [local, domain] = trimmed.split('@')

  if (!local || !domain) {
    return { valido: false, error: 'Formato de correo inválido' }
  }

  if (local.length > 64) {
    return { valido: false, error: 'La parte local del correo es demasiado larga (máx 64 caracteres)' }
  }

  if (domain.length > 253) {
    return { valido: false, error: 'El dominio es demasiado largo (máx 253 caracteres)' }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valido: false, error: 'Formato de correo inválido' }
  }

  return { valido: true }
}

function sanitizarNombre(nombre: string): string {
  return nombre.trim().slice(0, 200)
}

function sanitizarNotas(notas: string): string {
  return notas.trim().slice(0, 500)
}

// ═════════════════════════════════════════════════════════════════
// 🎣 HOOK
// ═════════════════════════════════════════════════════════════════

export function useCorreosInstitucionales() {
  const plantelId = usePlantelId()
  const [correos, setCorreos] = useState<CorreoInstitucional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const cargarCorreos = useCallback(async () => {
    if (!plantelId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('correos_institucionales')
        .select('*')
        .eq('plantel_id', plantelId)
        .order('email', { ascending: true })

      if (fetchError) throw fetchError

      setCorreos(data || [])
    } catch (err) {
      console.error('Error al cargar correos:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar correos')
    } finally {
      setLoading(false)
    }
  }, [plantelId, supabase])

  useEffect(() => {
    cargarCorreos()
  }, [cargarCorreos])

  const crearCorreo = async (data: CrearCorreoData): Promise<boolean> => {
    if (!plantelId) {
      setError('No hay plantel seleccionado')
      return false
    }

    try {
      // Validar email
      const emailValidacion = validarEmail(data.email)
      if (!emailValidacion.valido) {
        setError(emailValidacion.error || 'Email inválido')
        return false
      }

      const emailNormalizado = data.email.trim().toLowerCase()

      // Verificar que no exista ya
      const { data: existente, error: checkError } = await supabase
        .from('correos_institucionales')
        .select('id')
        .eq('email', emailNormalizado)
        .eq('plantel_id', plantelId)
        .maybeSingle()

      if (checkError) throw checkError

      if (existente) {
        setError('Este correo ya está registrado')
        return false
      }

      // Crear correo
      const { error: insertError } = await supabase
        .from('correos_institucionales')
        .insert([{
          plantel_id: plantelId,
          email: emailNormalizado,
          nombre_docente: data.nombre_docente ? sanitizarNombre(data.nombre_docente) : null,
          notas: data.notas ? sanitizarNotas(data.notas) : null,
          activo: true,
          usado: false,
        }])

      if (insertError) throw insertError

      await cargarCorreos()
      return true
    } catch (err) {
      console.error('Error al crear correo:', err)
      setError(err instanceof Error ? err.message : 'Error al crear correo')
      return false
    }
  }

  const activarCorreo = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('correos_institucionales')
        .update({ activo: true })
        .eq('id', id)
        .eq('plantel_id', plantelId)

      if (updateError) throw updateError

      await cargarCorreos()
      return true
    } catch (err) {
      console.error('Error al activar correo:', err)
      setError(err instanceof Error ? err.message : 'Error al activar correo')
      return false
    }
  }

  const desactivarCorreo = async (id: string): Promise<boolean> => {
    try {
      // Verificar que no esté en uso
      const { data: correo, error: fetchError } = await supabase
        .from('correos_institucionales')
        .select('usado')
        .eq('id', id)
        .eq('plantel_id', plantelId)
        .single()

      if (fetchError) throw fetchError

      if (correo.usado) {
        setError('No se puede desactivar un correo que está en uso')
        return false
      }

      const { error: updateError } = await supabase
        .from('correos_institucionales')
        .update({ activo: false })
        .eq('id', id)
        .eq('plantel_id', plantelId)

      if (updateError) throw updateError

      await cargarCorreos()
      return true
    } catch (err) {
      console.error('Error al desactivar correo:', err)
      setError(err instanceof Error ? err.message : 'Error al desactivar correo')
      return false
    }
  }

  const eliminarCorreo = async (id: string): Promise<boolean> => {
    try {
      // Verificar que no esté en uso
      const { data: correo, error: fetchError } = await supabase
        .from('correos_institucionales')
        .select('usado')
        .eq('id', id)
        .eq('plantel_id', plantelId)
        .single()

      if (fetchError) throw fetchError

      if (correo.usado) {
        setError('No se puede eliminar un correo que está en uso')
        return false
      }

      const { error: deleteError } = await supabase
        .from('correos_institucionales')
        .delete()
        .eq('id', id)
        .eq('plantel_id', plantelId)

      if (deleteError) throw deleteError

      await cargarCorreos()
      return true
    } catch (err) {
      console.error('Error al eliminar correo:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar correo')
      return false
    }
  }

  const validarCorreoDisponible = async (email: string): Promise<boolean> => {
    if (!plantelId) return false

    try {
      const emailNormalizado = email.trim().toLowerCase()

      // Validar formato
      const emailValidacion = validarEmail(emailNormalizado)
      if (!emailValidacion.valido) {
        return false
      }

      // Buscar en la base de datos
      const { data, error: fetchError } = await supabase
        .from('correos_institucionales')
        .select('activo, usado')
        .eq('email', emailNormalizado)
        .eq('plantel_id', plantelId)
        .maybeSingle()

      if (fetchError) throw fetchError

      // Disponible si: existe, está activo y NO está usado
      return data ? (data.activo && !data.usado) : false
    } catch (err) {
      console.error('Error al validar correo:', err)
      return false
    }
  }

  return {
    correos,
    loading,
    error,
    crearCorreo,
    activarCorreo,
    desactivarCorreo,
    eliminarCorreo,
    validarCorreoDisponible,
    recargar: cargarCorreos,
  }
}