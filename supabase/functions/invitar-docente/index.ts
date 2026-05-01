// supabase/functions/invitar-docente/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://dinoti.xyz'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('No autorizado', 401)

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError || !user) return errorResponse('Sesión inválida', 401)

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('usuarios')
      .select('rol, plantel_id')
      .eq('auth_id', user.id)
      .single()

    if (callerError || !caller) return errorResponse('Usuario no encontrado', 403)
    if (!['admin', 'secretaria', 'director'].includes(caller.rol)) {
      return errorResponse('Sin permisos', 403)
    }

    const body = await req.json()
    const { docente_id } = body
    if (!docente_id) return errorResponse('docente_id requerido', 400)

    const { data: docente, error: docenteError } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, email, cuenta_activada, plantel_id, auth_id')
      .eq('id', docente_id)
      .eq('plantel_id', caller.plantel_id)
      .eq('rol', 'docente')
      .single()

    if (docenteError || !docente) return errorResponse('Docente no encontrado', 404)
    if (docente.cuenta_activada) return errorResponse('La cuenta ya está activada', 409)

    const redirectTo = `${APP_URL}/cambiar-password`

    // ── Si tiene auth_id, borrar de auth.users directamente ──────────────
    // Esto es más confiable que buscar por email con listUsers
    if (docente.auth_id) {
      console.log(`Borrando auth_id previo: ${docente.auth_id}`)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(docente.auth_id)
      if (deleteError) {
        console.error('Error al borrar auth user:', deleteError.message)
        // Si no se pudo borrar, intentar de todas formas
      }
      // Limpiar auth_id y estado en tabla usuarios
      await supabaseAdmin
        .from('usuarios')
        .update({ auth_id: null, cuenta_activada: false, invitacion_enviada: false })
        .eq('id', docente_id)
      // Pequeña espera para que Auth procese el delete
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // ── Invitar fresco ────────────────────────────────────────────────────
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      docente.email,
      {
        redirectTo,
        data: {
          nombre_completo: docente.nombre_completo,
          plantel_id: docente.plantel_id,
          rol: 'docente',
          primer_login: true,
        },
      }
    )

    if (inviteError) {
      console.error('Invite error:', inviteError.message, inviteError.status)
      return errorResponse(`Error al invitar: ${inviteError.message}`, 500)
    }

    // Registrar invitación enviada
    await supabaseAdmin
      .from('usuarios')
      .update({
        invitacion_enviada: true,
        invitacion_enviada_at: new Date().toISOString(),
      })
      .eq('id', docente.id)
      .eq('plantel_id', caller.plantel_id)

    console.log(`Invitación enviada exitosamente a ${docente.email}`)

    return new Response(
      JSON.stringify({ ok: true, message: `Invitación enviada a ${docente.email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en invitar-docente:', err)
    return errorResponse(err instanceof Error ? err.message : 'Error interno', 500)
  }
})

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}