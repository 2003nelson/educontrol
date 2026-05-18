import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos exportados ─────────────────────────────────────────────────────────
export type EstudianteResultado = {
  id: string
  nombre_completo: string
  matricula: string
  grupo_id: string
  grupo_label: string   // ej. "Grupo 101 · 1° Sem"
  grado: number
  numero: string
}

export type Calificacion = {
  asignatura_id: string
  asignatura_nombre: string
  parcial_1: number | null
  parcial_2: number | null
  parcial_3: number | null
  final: number | null
  promedio_asignatura: number | null
}

export type AlumnoDetalle = EstudianteResultado & {
  calificaciones: Calificacion[]
  promedioGeneral: number | null
  asistenciaPct: number | null
}

// ─── Seguridad ────────────────────────────────────────────────────────────────
const DEBOUNCE_MS      = 350   // espera antes de consultar
const MIN_CHARS        = 2     // mínimo de caracteres para buscar
const MAX_RESULTADOS   = 8     // máximo de sugerencias mostradas
const MAX_CONSULTAS    = 20    // máximo de consultas por ventana
const VENTANA_MS       = 60_000 // ventana de 1 minuto para el rate limit

// Solo letras, números, espacios, puntos y guiones
function sanitizar(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÜÑ0-9 .\-]/gi, '')
    .slice(0, 80)
    .trim()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAlumnoSearch() {
  const supabase = createClient()

  const [query, setQuery]                     = useState('')
  const [sugerencias, setSugerencias]         = useState<EstudianteResultado[]>([])
  const [cargando, setCargando]               = useState(false)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [alumnoSelec, setAlumnoSelec]         = useState<AlumnoDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Rate limiting en cliente
  const consultas   = useRef<number[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Verifica si el usuario puede hacer otra consulta
  function puedeConsultar(): boolean {
    const ahora = Date.now()
    consultas.current = consultas.current.filter(t => ahora - t < VENTANA_MS)
    if (consultas.current.length >= MAX_CONSULTAS) return false
    consultas.current.push(ahora)
    return true
  }

  // Búsqueda real en Supabase
  const buscar = useCallback(async (valor: string) => {
    const limpio = sanitizar(valor)

    if (limpio.length < MIN_CHARS) {
      setSugerencias([])
      setDropdownAbierto(false)
      setCargando(false)
      return
    }

    if (!puedeConsultar()) {
      setSugerencias([])
      setDropdownAbierto(false)
      setCargando(false)
      console.warn('Rate limit alcanzado en búsqueda de alumnos')
      return
    }

    setCargando(true)

    try {
      // Buscar estudiantes activos por nombre o matrícula
      const { data: estudiantes, error } = await supabase
        .from('estudiantes')
        .select(`
          id,
          nombre_completo,
          matricula,
          grupo_id,
          grado:grupos!grupo_id(grado, numero)
        `)
        .eq('activo', true)
        .or(`nombre_completo.ilike.%${limpio}%,matricula.ilike.%${limpio}%`)
        .limit(MAX_RESULTADOS)

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultados: EstudianteResultado[] = ((estudiantes ?? []) as any[]).map((e) => {
        const grupoData = Array.isArray(e.grado) ? e.grado[0] : e.grado
        const grado  = grupoData?.grado  ?? 0
        const numero = grupoData?.numero ?? ''
        return {
          id:              e.id,
          nombre_completo: e.nombre_completo,
          matricula:       e.matricula,
          grupo_id:        e.grupo_id,
          grupo_label:     `Grupo ${numero} · ${grado}° Sem`,
          grado,
          numero,
        }
      })

      setSugerencias(resultados)
      setDropdownAbierto(resultados.length > 0 || limpio.length >= MIN_CHARS)
    } catch (err) {
      console.error('Error buscando alumnos:', err)
      setSugerencias([])
    } finally {
      setCargando(false)
    }
  }, [supabase])

  // Handler del input con debounce
  function handleInput(valor: string) {
    const limpio = valor.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ0-9 .\-]/gi, '').slice(0, 80)
    setQuery(limpio)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(limpio), DEBOUNCE_MS)
  }

  // Cargar detalle completo del alumno al seleccionar
  async function seleccionarAlumno(est: EstudianteResultado) {
    setQuery('')
    setSugerencias([])
    setDropdownAbierto(false)
    setCargandoDetalle(true)

    try {
      // Calificaciones agrupadas por asignatura y periodo
      const { data: cals } = await supabase
        .from('calificaciones')
        .select(`
          periodo,
          calificacion,
          asignatura_id,
          asignaturas!asignatura_id(nombre)
        `)
        .eq('estudiante_id', est.id)
        .eq('falta', false)

      // Asistencias
      const { data: asis } = await supabase
        .from('asistencias')
        .select('estado')
        .eq('estudiante_id', est.id)

      // Agrupar calificaciones por asignatura
      const mapaAsig: Record<string, Calificacion> = {}

      for (const c of (cals ?? [])) {
        const aid    = c.asignatura_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const asigData = Array.isArray((c as any).asignaturas) ? (c as any).asignaturas[0] : (c as any).asignaturas
        const nombre = (asigData as { nombre: string } | null)?.nombre ?? 'Sin nombre'
        const val    = Number(c.calificacion)
        const per    = (c.periodo ?? '').toLowerCase()

        if (!mapaAsig[aid]) {
          mapaAsig[aid] = {
            asignatura_id:       aid,
            asignatura_nombre:   nombre,
            parcial_1:           null,
            parcial_2:           null,
            parcial_3:           null,
            final:               null,
            promedio_asignatura: null,
          }
        }

        if (per === '1' || per === 'parcial 1' || per === 'p1') mapaAsig[aid].parcial_1 = val
        else if (per === '2' || per === 'parcial 2' || per === 'p2') mapaAsig[aid].parcial_2 = val
        else if (per === '3' || per === 'parcial 3' || per === 'p3') mapaAsig[aid].parcial_3 = val
        else if (per === 'final' || per === 'f') mapaAsig[aid].final = val
      }

      // Calcular promedio por asignatura
      const calificaciones: Calificacion[] = Object.values(mapaAsig).map(a => {
        const vals = [a.parcial_1, a.parcial_2, a.parcial_3, a.final].filter((v): v is number => v !== null)
        const prom = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
        return { ...a, promedio_asignatura: prom !== null ? Math.round(prom * 10) / 10 : null }
      })

      // Promedio general
      const promsValidos = calificaciones.map(c => c.promedio_asignatura).filter((v): v is number => v !== null)
      const promedioGeneral = promsValidos.length > 0
        ? Math.round((promsValidos.reduce((s, v) => s + v, 0) / promsValidos.length) * 10) / 10
        : null

      // % asistencia
      const totalDias = (asis ?? []).length
      const presentes = (asis ?? []).filter(a => a.estado === 'P').length
      const asistenciaPct = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : null

      setAlumnoSelec({ ...est, calificaciones, promedioGeneral, asistenciaPct })
    } catch (err) {
      console.error('Error cargando detalle:', err)
    } finally {
      setCargandoDetalle(false)
    }
  }

  function cerrarDetalle() { setAlumnoSelec(null) }
  function cerrarDropdown() { setDropdownAbierto(false) }

  return {
    query,
    sugerencias,
    cargando,
    dropdownAbierto,
    alumnoSelec,
    cargandoDetalle,
    handleInput,
    seleccionarAlumno,
    cerrarDetalle,
    cerrarDropdown,
    limpiarQuery: () => { setQuery(''); setSugerencias([]); setDropdownAbierto(false) },
  }
}