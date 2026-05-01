// supabase/functions/eliminar-docente/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar que el request viene de un usuario autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { docente_id } = await req.json()
    if (!docente_id) {
      return new Response(JSON.stringify({ error: 'docente_id requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cliente con service role para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Cliente con JWT del usuario para verificar su rol
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar que quien llama tiene rol permitido
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: caller } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('auth_id', user.id)
      .single()

    const rolesPermitidos = ['super_admin', 'admin', 'director', 'subdirector']
    if (!caller || !rolesPermitidos.includes(caller.rol)) {
      return new Response(JSON.stringify({ error: 'Sin permisos para eliminar docentes' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtener auth_id del docente a eliminar
    const { data: docente, error: docenteError } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_id, nombre_completo, email')
      .eq('id', docente_id)
      .single()

    if (docenteError || !docente) {
      return new Response(JSON.stringify({ error: 'Docente no encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Borrar asignaciones
    const { error: asigError } = await supabaseAdmin
      .from('asignaciones_docentes')
      .delete()
      .eq('docente_id', docente_id)

    if (asigError) {
      console.error('Error al borrar asignaciones:', asigError)
      // No es fatal, continuar
    }

    // 2. Borrar de tabla usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', docente_id)

    if (usuarioError) {
      return new Response(JSON.stringify({ error: 'Error al eliminar usuario: ' + usuarioError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Borrar de auth.users si tiene auth_id
    if (docente.auth_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(docente.auth_id)
      if (authDeleteError) {
        console.error('Error al borrar auth user:', authDeleteError)
        // No es fatal — el usuario ya fue borrado de la tabla, solo quedó en auth
        // El correo ya quedará libre para ser re-invitado en el próximo ciclo
      }
    }

    console.log(`Docente eliminado: ${docente.nombre_completo} (${docente.email})`)

    return new Response(JSON.stringify({ ok: true, mensaje: `Docente ${docente.nombre_completo} eliminado correctamente` }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error inesperado:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})