// supabase/functions/invitar-docente/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// APP_URL debe estar configurado en los secrets de la Edge Function:
// supabase secrets set APP_URL=https://dinoti.xyz
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

    if (authError || !user) {
      console.error('Auth error:', authError?.message)
      return errorResponse('Sesión inválida', 401)
    }

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
      .select('id, nombre_completo, email, cuenta_activada, plantel_id')
      .eq('id', docente_id)
      .eq('plantel_id', caller.plantel_id)
      .eq('rol', 'docente')
      .single()

    if (docenteError || !docente) return errorResponse('Docente no encontrado', 404)
    if (docente.cuenta_activada) return errorResponse('La cuenta ya está activada', 409)

    // ── Redirect a cambiar-password (primer login) ────────────────────────
    const redirectTo = `${APP_URL}/cambiar-password`

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
      if (inviteError.status === 422) {
        // Usuario ya existe en auth — generar magic link
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: docente.email,
          options: { redirectTo },
        })
        if (linkError) {
          console.error('Generate link error:', linkError.message)
          throw linkError
        }
      } else {
        console.error('Invite error:', inviteError.message)
        throw inviteError
      }
    }

    await supabaseAdmin
      .from('usuarios')
      .update({
        invitacion_enviada: true,
        invitacion_enviada_at: new Date().toISOString(),
      })
      .eq('id', docente.id)
      .eq('plantel_id', caller.plantel_id)

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