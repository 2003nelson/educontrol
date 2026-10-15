// src/lib/excelExport.ts
import * as XLSX from 'xlsx'

export function exportarCalificacionesExcel(
  alumnos: any[], 
  trabajos: any[], 
  notas: Map<string, number | null>, 
  observacionesAlumnos: Map<string, string>, 
  nombreAsignatura: string,
  grupoNumero: string,
  grupoGrado: number,
  periodo: string
) {
  const PERIODO_LABEL: Record<string, string> = { '1': '1er Parcial', '2': '2do Parcial', '3': '3er Parcial' }
  const parcialTexto = PERIODO_LABEL[periodo] || `Parcial ${periodo}`

  // 1. Filas institucionales superiores
  const filasSuperiores = [
    [nombreAsignatura.toUpperCase()],
    [`GRUPO: ${grupoNumero} (${grupoGrado}° SEMESTRE) — ${parcialTexto.toUpperCase()}`],
    [''] // Fila en blanco
  ]

  // 2. Mapear los datos de cada alumno incluyendo el porcentaje en los títulos de los rubros
  const datosAlumnos = alumnos.map((al, index) => {
    const fila: Record<string, any> = {
      '#': index + 1,
      'ALUMNO': al.nombre_completo,
      'MATRÍCULA': al.matricula,
      'OBSERVACIONES': observacionesAlumnos.get(al.id) ?? ''
    }

    trabajos.forEach(t => {
      const valorNota = notas.get(`${t.id}:${al.id}`)
      // Incluir el porcentaje en la clave del objeto para que aparezca en el cabezal del Excel
      const nombreRubroConPeso = `${t.nombre.toUpperCase()} (${t.peso}%)`
      fila[nombreRubroConPeso] = valorNota !== null && valorNota !== undefined ? valorNota : '—'
    })

    const sumaPesos = trabajos.reduce((s, t) => s + t.peso, 0)
    let notaFinal = '—'
    if (sumaPesos > 0) {
      const total = trabajos.reduce((s, t) => {
        const calif = notas.get(`${t.id}:${al.id}`) ?? 0
        const clamp = Math.max(0, Math.min(100, calif))
        return s + (clamp / 100) * t.peso
      }, 0)
      notaFinal = String(Math.round(total * 10) / 10)
    }

    fila['CALIFICACIÓN FINAL'] = notaFinal
    return fila
  })

  // 3. Crear la hoja combinando título y datos
  const worksheet = XLSX.utils.json_to_sheet([])
  XLSX.utils.sheet_add_aoa(worksheet, filasSuperiores, { origin: 'A1' })
  XLSX.utils.sheet_add_json(worksheet, datosAlumnos, { origin: 'A4', skipHeader: false })

  // 4. Aplicar estilos profesionales a las celdas
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!worksheet[cellAddress]) continue

      // Cabecera de la tabla (Fila 4 -> índice 3)
      if (R === 3) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "0369A1" }, name: "Calibri", sz: 11 },
          fill: { fgColor: { rgb: "38BDF8" } }, // Azul cielo vibrante
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "0284C7" } },
            bottom: { style: "thin", color: { rgb: "0284C7" } },
            left: { style: "thin", color: { rgb: "0284C7" } },
            right: { style: "thin", color: { rgb: "0284C7" } }
          }
        }
      } 
      // Títulos principales (Filas 1 y 2)
      else if (R === 0 || R === 1) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "1E3A5F" }, name: "Calibri", sz: R === 0 ? 14 : 11 }
        }
      }
      // Celdas de datos (Filas 5 en adelante)
      else if (R > 3) {
        worksheet[cellAddress].s = {
          font: { name: "Calibri", sz: 11 },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
          }
        }
      }
    }
  }

  // 5. Ajustar ancho de columnas considerando el texto del porcentaje
  const colWidths = [
    { wch: 6 },   // #
    { wch: 32 },  // Alumno
    { wch: 14 },  // Matrícula
    { wch: 25 },  // Observaciones
  ]
  trabajos.forEach(t => {
    // Dar un poco más de espacio dinámicamente según el nombre + porcentaje
    const textLen = (t.nombre + ` (${t.peso}%)`).length
    colWidths.push({ wch: Math.max(16, textLen + 4) })
  })
  colWidths.push({ wch: 20 }) // Calificación Final

  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, `Parcial ${periodo}`)

  XLSX.writeFile(workbook, `Calificaciones_${nombreAsignatura.replace(/[^a-zA-Z0-9]/g, '_')}_Grupo_${grupoNumero}_P${periodo}.xlsx`, { cellStyles: true })
}