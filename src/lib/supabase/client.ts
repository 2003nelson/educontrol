import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para el NAVEGADOR
 * ✅ Seguro: Usa variables públicas diseñadas para el cliente
 * ✅ Validación: Verifica que las variables existan
 */
export function createClient() {
  // 🔒 VALIDACIÓN: Verificar que las variables existan
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

  // ✅ SEGURIDAD: Solo usa la anon key (pública)
  // Esta key está DISEÑADA para exponerse al navegador
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * ℹ️ NOTA DE SEGURIDAD:
 * 
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY es SEGURA de exponer
 * - Está protegida por Row Level Security (RLS)
 * - RLS controla QUÉ puede ver/hacer cada usuario
 * - NUNCA uses SERVICE_ROLE_KEY en el cliente
 */