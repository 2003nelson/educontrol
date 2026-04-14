import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase para el SERVIDOR
 * ✅ Seguro: Maneja cookies para autenticación
 * ✅ Validación: Verifica que las variables existan
 * ✅ RLS: Funciona correctamente con políticas de seguridad
 */
export async function createClient() {
  const cookieStore = await cookies()

  // 🔒 VALIDACIÓN: Verificar que las variables existan
  // NOTA: Usamos NEXT_PUBLIC_* por compatibilidad, pero también
  // podrías usar variables sin prefijo exclusivas del servidor
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '⚠️ Error de configuración: Faltan variables de entorno de Supabase.\n' +
      'Asegúrate de que .env.local contenga:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  // ✅ SEGURIDAD: Cliente con cookies para autenticación
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // 🔒 SEGURIDAD: Fallos silenciosos en Server Components
          // El middleware ya maneja las cookies correctamente
          // Este error solo ocurre en contextos de solo lectura
          console.warn(
            '[Supabase Server] No se pudieron establecer cookies (esto es normal en Server Components)'
          )
        }
      },
    },
  })
}

/**
 * ℹ️ NOTAS DE SEGURIDAD:
 * 
 * 1. COOKIES:
 *    - Permiten que RLS verifique quién es el usuario
 *    - auth.jwt() en Supabase solo funciona con cookies
 *    - Sin cookies = Sin autenticación = RLS falla
 * 
 * 2. ANON KEY vs SERVICE ROLE KEY:
 *    - ANON KEY: Usada aquí, respeta RLS ✅
 *    - SERVICE ROLE KEY: NUNCA usar en server components ❌
 *    - SERVICE ROLE KEY: Solo en Server Actions para operaciones admin
 * 
 * 3. VALIDACIÓN:
 *    - Falla rápido si faltan variables
 *    - Error claro para debugging
 *    - Evita errores crípticos en runtime
 */