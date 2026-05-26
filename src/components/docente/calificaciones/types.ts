// src/components/docente/calificaciones/types.ts

export interface Trabajo {
  id: string
  nombre: string
  peso: number   // % que vale — la barra va de 0 a este valor
  orden: number
}

export interface NotaAlumno {
  trabajo_id: string
  estudiante_id: string
  puntos: number | null   // de 0 a peso del trabajo
}

export interface Alumno {
  id: string
  nombre_completo: string
  matricula: string
}

export interface ContextoCalificacion {
  grupo_id: string
  grupo_numero: string
  grupo_grado: number
  asignatura_id: string
  asignatura_nombre: string
  periodo: '1' | '2' | '3'
}