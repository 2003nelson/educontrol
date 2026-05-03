// src/hooks/useDocentes.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlantelId } from '@/contexts/PlantelContext'

// ═════════════════════════════════════════════════════════════════
// 🔒 TIPOS
// ═════════════════════════════════════════════════════════════════

type GrupoRaw = { numero: string; grado: number } | { numero: string; grado: number }[]
type AsignaturaRaw = { nombre: string } | { nombre: string }[]

type AsignacionSupabaseRaw = {
  id: string
  docente_id: string
  grupo_id: string
  asignatura_id: string
  grupos: GrupoRaw
  asignaturas: AsignaturaRaw
}

export type AsignacionDocente = {
  id: string
  grupo_id: string
  asignatura_id: string
  grupo_numero: string
  grupo_grado: number
  asignatura_nombre: string
}

export type Docente = {
  id: string
  plantel_id: string
  auth_id: string | null
  nombre_completo: string
  email: string
  email_institucional: string | null
  activo: boolean
  invitacion_enviada: boolean
  fecha_invitacion: string | null
  cuenta_activada: boolean
  created_at: string
  asignaciones: AsignacionDocente[]
}

type CrearDocenteData = {
  nombre_completo: string
  email: string
  asignaciones: { grupo_id: string; asignatura_id: string }[]
}

type EditarDocenteData = {
  nombre_completo?: string
  asignaciones?: { grupo_id: string; asignatura_id: string }[]
}

// ═════════════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═════════════════════════════════════════════════════════════════

function resolveGrupo(raw: GrupoRaw): { numero: string; grado: number } | undefined {
  if (Array.isArray(raw)) return raw[0]
  return raw ?? undefined
}

function resolveAsignatura(raw: AsignaturaRaw): { nombre: string } | undefined {
  if (Array.isArray(raw)) return raw[0]
  return raw ?? undefined
}

// ═════════════════════════════════════════════════════════════════
// 🛡️ VALIDACIONES
// ═════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

function validarEmailReal(email: string): { valido: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { valido: false, error: 'El correo es obligatorio' }
  if (!EMAIL_REGEX.test(trimmed)) return { valido: false, error: 'Formato de correo inválido' }
  const dominiosPermitidos = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'live.com', 'protonmail.com']
  const [, dominio] = trimmed.split('@')
  if (!dominiosPermitidos.includes(dominio)) {
    return { valido: false, error: 'Por favor usa un correo de Gmail, Outlook, Yahoo, o iCloud para recibir la invitación' }
  }
  return { valido: true }
}

function validarNombre(nombre: string): { valido: boolean; error?: string } {
  const trimmed = nombre.trim()
  if (!trimmed) return { valido: false, error: 'El nombre es obligatorio' }
  if (trimmed.length < 3) return { valido: false, error: 'El nombre debe tener al menos 3 caracteres' }
  if (trimmed.length > 200) return { valido: false, error: 'El nombre es demasiado largo' }
  return { valido: true }
}

// ═════════════════════════════════════════════════════════════════
// 🎣 HOOK
// ═════════════════════════════════════════════════════════════════

export function useDocentes() {
  const plantelId = usePlantelId()
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const cargarDocentes = useCallback(async () => {
    if (!plantelId) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)

      const { data: docentesData, error: docentesError } = await supabase
        .from('usuarios')
        .select('id, plantel_id, auth_id, nombre_completo, email, email_institucional, activo, invitacion_enviada, fecha_invitacion, cuenta_activada, created_at')
        .eq('plantel_id', plantelId)
        .eq('rol', 'docente')
        .order('nombre_completo', { ascending: true })

      if (docentesError) throw docentesError
      if (!docentesData || docentesData.length === 0) { setDocentes([]); return }

      const docenteIds = docentesData.map(d => d.id)

      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones_docentes')
        .select(`
          id,
          docente_id,
          grupo_id,
          asignatura_id,
          grupos!inner(numero, grado),
          asignaturas!inner(nombre)
        `)
        .in('docente_id', docenteIds)
        .eq('plantel_id', plantelId)

      if (asignacionesError) throw asignacionesError

      const docentesConAsignaciones: Docente[] = docentesData.map(docente => {
        const asignacionesDelDocente = (asignacionesData || [])
          .filter((a: AsignacionSupabaseRaw) => a.docente_id === docente.id)
          .map((a: AsignacionSupabaseRaw) => {
            const grupo = resolveGrupo(a.grupos)
            const asignatura = resolveAsignatura(a.asignaturas)
            return {
              id: a.id,
              grupo_id: a.grupo_id,
              asignatura_id: a.asignatura_id,
              grupo_numero: grupo?.numero ?? '',
              grupo_grado: grupo?.grado ?? 0,
              asignatura_nombre: asignatura?.nombre ?? '',
            }
          })
        return { ...docente, asignaciones: asignacionesDelDocente }
      })

      setDocentes(docentesConAsignaciones)
    } catch (err) {
      console.error('Error al cargar docentes:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar docentes')
    } finally {
      setLoading(false)
    }
  }, [plantelId, supabase])

  useEffect(() => { cargarDocentes() }, [cargarDocentes])

  // ── Realtime: escuchar cambios en usuarios del plantel ──────────────────
  useEffect(() => {
    if (!plantelId) return

    const channel = supabase
      .channel(`docentes-${plantelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios',
          filter: `plantel_id=eq.${plantelId}`,
        },
        () => {
          // Cualquier cambio en usuarios del plantel recarga la lista
          cargarDocentes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [plantelId, supabase, cargarDocentes])

  const crearDocente = async (data: CrearDocenteData): Promise<boolean> => {
    if (!plantelId) { setError('No hay plantel seleccionado'); return false }
    try {
      const nombreValidacion = validarNombre(data.nombre_completo)
      if (!nombreValidacion.valido) { setError(nombreValidacion.error || 'Nombre inválido'); return false }

      const emailValidacion = validarEmailReal(data.email)
      if (!emailValidacion.valido) { setError(emailValidacion.error || 'Email inválido'); return false }

      const emailNormalizado = data.email.trim().toLowerCase()

      const { data: emailExistente, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailNormalizado)
        .eq('plantel_id', plantelId)
        .maybeSingle()

      if (checkError) throw checkError
      if (emailExistente) { setError('Este correo ya está registrado'); return false }

      const { data: nuevoDocente, error: insertError } = await supabase
        .from('usuarios')
        .insert([{
          plantel_id: plantelId,
          nombre_completo: data.nombre_completo.trim(),
          email: emailNormalizado,
          rol: 'docente',
          activo: true,
          invitacion_enviada: false,
          cuenta_activada: false,
        }])
        .select()
        .single()

      if (insertError) throw insertError

      if (data.asignaciones.length > 0) {
        const asignacionesInsert = data.asignaciones.map(a => ({
          docente_id: nuevoDocente.id,
          grupo_id: a.grupo_id,
          asignatura_id: a.asignatura_id,
          plantel_id: plantelId,
        }))
        const { error: asignacionesError } = await supabase.from('asignaciones_docentes').insert(asignacionesInsert)
        if (asignacionesError) throw asignacionesError
      }

      await cargarDocentes()
      return true
    } catch (err) {
      console.error('Error al crear docente:', err)
      setError(err instanceof Error ? err.message : 'Error al crear docente')
      return false
    }
  }

  const editarDocente = async (id: string, data: EditarDocenteData): Promise<boolean> => {
    try {
      if (data.nombre_completo) {
        const nombreValidacion = validarNombre(data.nombre_completo)
        if (!nombreValidacion.valido) { setError(nombreValidacion.error || 'Nombre inválido'); return false }

        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ nombre_completo: data.nombre_completo.trim() })
          .eq('id', id)
          .eq('plantel_id', plantelId)

        if (updateError) throw updateError
      }

      if (data.asignaciones) {
        const { error: deleteError } = await supabase
          .from('asignaciones_docentes')
          .delete()
          .eq('docente_id', id)
        if (deleteError) throw deleteError

        if (data.asignaciones.length > 0) {
          const asignacionesInsert = data.asignaciones.map(a => ({
            docente_id: id,
            grupo_id: a.grupo_id,
            asignatura_id: a.asignatura_id,
            plantel_id: plantelId,
          }))
          const { error: insertError } = await supabase.from('asignaciones_docentes').insert(asignacionesInsert)
          if (insertError) throw insertError
        }
      }

      await cargarDocentes()
      return true
    } catch (err) {
      console.error('Error al editar docente:', err)
      setError(err instanceof Error ? err.message : 'Error al editar docente')
      return false
    }
  }

  // ── Eliminar docente: llama Edge Function para borrar también de auth.users ──
  const eliminarDocente = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Sesión no válida'); return false }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/eliminar-docente`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ docente_id: id }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        setError(result.error ?? 'Error al eliminar docente')
        return false
      }

      await cargarDocentes()
      return true
    } catch (err) {
      console.error('Error al eliminar docente:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar docente')
      return false
    }
  }

  const eliminarAsignaciones = async (docenteId: string, asignacionesIds: string[]): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('asignaciones_docentes')
        .delete()
        .in('id', asignacionesIds)
        .eq('docente_id', docenteId)
      if (deleteError) throw deleteError
      await cargarDocentes()
      return true
    } catch (err) {
      console.error('Error al eliminar asignaciones:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar asignaciones')
      return false
    }
  }

  return {
    docentes,
    loading,
    error,
    crearDocente,
    editarDocente,
    eliminarDocente,
    eliminarAsignaciones,
    recargar: cargarDocentes,
  }
}