// src/app/super-admin/actions.ts
"use server"

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * 🔒 VALIDACIÓN: Email válido
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 🔒 VALIDACIÓN: Password seguro
 */
function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false
  }
  
  // Al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    return false
  }
  
  // Al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    return false
  }
  
  // Al menos un número
  if (!/[0-9]/.test(password)) {
    return false
  }
  
  return true
}

/**
 * 🔒 CREAR USUARIO DIRECTOR
 * Server Action protegida - Solo super admin puede llamar
 */
export async function crearUsuarioDirector(
  emailAdmin: string, 
  passwordAdmin: string, 
  nombreAdmin: string, 
  plantelId: string
) {
  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 1: VERIFICAR AUTENTICACIÓN Y ROL
  // ────────────────────────────────────────────────────────────
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('No autenticado')
  }

  const rol = user.user_metadata?.rol

  // ✅ CRÍTICO: Verificar que es super admin
  if (rol !== 'super_admin') {
    console.warn(
      `[Security] Intento no autorizado de crear director`,
      `User: ${user.email}`,
      `Rol: ${rol}`
    )
    throw new Error('No autorizado. Solo super admin puede crear directores.')
  }

  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 2: VALIDAR PARÁMETROS
  // ────────────────────────────────────────────────────────────
  
  // Validar email
  if (!emailAdmin || !isValidEmail(emailAdmin)) {
    throw new Error('Email inválido')
  }

  // Validar password
  if (!passwordAdmin || !isValidPassword(passwordAdmin)) {
    throw new Error(
      'Password debe tener mínimo 8 caracteres, ' +
      'una mayúscula, una minúscula y un número'
    )
  }

  // Validar nombre
  if (!nombreAdmin || nombreAdmin.trim().length < 3) {
    throw new Error('Nombre debe tener al menos 3 caracteres')
  }

  // Validar plantelId
  if (!plantelId || plantelId.length < 10) {
    throw new Error('ID de plantel inválido')
  }

  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 3: VERIFICAR QUE PLANTEL EXISTE
  // ────────────────────────────────────────────────────────────
  const { data: plantel, error: plantelError } = await supabase
    .from('planteles')
    .select('id, subdominio')
    .eq('id', plantelId)
    .single()

  if (plantelError || !plantel) {
    throw new Error('Plantel no encontrado')
  }

  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 4: CREAR USUARIO CON SERVICE ROLE
  // ────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Server] Variables de entorno de Supabase no configuradas')
    throw new Error('Error de configuración del servidor')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Normalizar email
  const emailNormalizado = emailAdmin.trim().toLowerCase()

  // Crear usuario
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: emailNormalizado,
    password: passwordAdmin,
    email_confirm: true,
    user_metadata: {
      rol: 'director',
      plantel_id: plantelId,
      nombre_completo: nombreAdmin.trim(),
      primer_login: true,
    },
  })

  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 5: MANEJO DE ERRORES
  // ────────────────────────────────────────────────────────────
  if (error) {
    console.error('[Server] Error creando usuario director:', error.message)
    
    // 🔒 No exponer detalles del error
    if (error.message.includes('already registered')) {
      throw new Error('Este email ya está registrado')
    }
    
    throw new Error('Error al crear el usuario. Intenta nuevamente.')
  }

  if (!data.user) {
    throw new Error('Error al crear el usuario')
  }

  // ────────────────────────────────────────────────────────────
  // 🔒 PASO 6: LOGGING DE AUDITORÍA
  // ────────────────────────────────────────────────────────────
  console.log(
    `[Audit] Director creado`,
    `Super Admin: ${user.email}`,
    `Nuevo Director: ${emailNormalizado}`,
    `Plantel: ${plantel.subdominio}`,
    `Timestamp: ${new Date().toISOString()}`
  )

  return data.user
}

/**
 * 🔒 VALIDAR SUBDOMAIN
 * Verifica formato y disponibilidad
 */
export async function validarSubdomain(subdomain: string): Promise<{
  valido: boolean
  error?: string
}> {
  // Verificar autenticación
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.rol !== 'super_admin') {
    return { valido: false, error: 'No autorizado' }
  }

  // Normalizar
  const sub = subdomain.trim().toLowerCase()

  // Validar formato
  const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
  if (!SUBDOMAIN_REGEX.test(sub)) {
    return { 
      valido: false, 
      error: 'Formato inválido. Solo letras, números y guiones. No puede comenzar/terminar con guión.' 
    }
  }

  // Validar longitud
  if (sub.length < 3 || sub.length > 63) {
    return { valido: false, error: 'Longitud debe ser entre 3 y 63 caracteres' }
  }

  // Verificar no reservado
  const RESERVED = ['www', 'admin', 'app', 'api', 'mail', 'ftp', 'localhost', 'educontrol']
  if (RESERVED.includes(sub)) {
    return { valido: false, error: 'Subdomain reservado' }
  }

  // Verificar disponibilidad
  const { data } = await supabase
    .from('planteles')
    .select('id')
    .eq('subdominio', sub)
    .single()

  if (data) {
    return { valido: false, error: 'Subdomain ya está en uso' }
  }

  return { valido: true }
}