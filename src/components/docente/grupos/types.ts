// src/components/docente/grupos/types.ts
export interface AsignaturaItem {
  id: string
  nombre: string
}

export interface GrupoAgrupado {
  id: string
  numero: string
  grado: number
  asignaturas: AsignaturaItem[]
}

export type EstadoAsistencia = 'P' | 'A' | 'J' | 'R'