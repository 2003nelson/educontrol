// src/components/grupos/ModalAsignarEstudiantes.tsx
'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

interface Alumno {
  id: string
  matricula: string
  nombreCompleto: string
}

// Interface para los estudiantes que se guardan en Supabase
export interface EstudianteInput {
  plantel_id: string
  grupo_id: string
  matricula: string | null
  nombre_completo: string
  activo: boolean
}

interface ModalAsignarEstudiantesProps {
  grupo: {
    id: string
    grado: number
    numero: string
    turno: 'matutino' | 'vespertino'
  }
  plantelId: string
  alumnosExistentes?: Alumno[]
  onCerrar: () => void
  onGuardar: (alumnos: EstudianteInput[]) => Promise<void>
}

function capitalizarNombre(texto: string): string {
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => {
      if (palabra.length === 0) return ''
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .filter(p => p.length > 0)
    .join(' ')
}

function sanitizarTexto(texto: string): string {
  return texto
    .replace(/[<>{}[\]\\]/g, '')
    .slice(0, 10000)
}

function validarNombreSeguro(nombre: string): boolean {
  const regex = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-']+$/
  return regex.test(nombre) && nombre.length >= 3 && nombre.length <= 100
}

function validarMatriculaSegura(matricula: string): boolean {
  if (!matricula) return true
  const regex = /^[a-zA-Z0-9\-]+$/
  return regex.test(matricula) && matricula.length <= 20
}

function procesarTexto(texto: string): { alumnos: Alumno[], duplicados: Set<number> } {
  const textoSeguro = sanitizarTexto(texto)
  const lineas = textoSeguro.split('\n')
  const alumnos: Alumno[] = []
  const duplicados = new Set<number>()
  
  const matriculasVistas = new Set<string>()
  const nombresVistos = new Set<string>()
  
  const maxAlumnos = 100

  for (let i = 0; i < lineas.length; i++) {
    if (alumnos.length >= maxAlumnos) break

    const linea = lineas[i].trim()
    if (!linea) continue
    
    let matricula = ''
    let nombreCompleto = ''
    
    if (linea.includes('\t')) {
      const partes = linea.split('\t')
      matricula = partes[0].trim()
      nombreCompleto = partes.slice(1).join(' ').trim()
    } else if (linea.includes(',')) {
      const partes = linea.split(',')
      matricula = partes[0].trim()
      nombreCompleto = partes.slice(1).join(' ').trim()
    } else if (linea.includes(' ')) {
      const primerEspacio = linea.indexOf(' ')
      const posibleMatricula = linea.substring(0, primerEspacio).trim()
      const posibleNombre = linea.substring(primerEspacio + 1).trim()
      
      if (/^[a-zA-Z0-9\-]+$/.test(posibleMatricula)) {
        matricula = posibleMatricula
        nombreCompleto = posibleNombre
      } else {
        nombreCompleto = linea
      }
    } else {
      continue
    }
    
    const palabrasNombre = nombreCompleto.split(/\s+/).filter(p => p.length > 0)
    
    if (palabrasNombre.length < 2) {
      continue
    }
    
    if (!validarNombreSeguro(nombreCompleto)) {
      continue
    }
    
    if (matricula && !validarMatriculaSegura(matricula)) {
      continue
    }
    
    const nombreNormalizado = capitalizarNombre(nombreCompleto)
    
    const esDuplicado = 
      (matricula && matriculasVistas.has(matricula)) ||
      nombresVistos.has(nombreNormalizado.toLowerCase())
    
    if (esDuplicado) {
      duplicados.add(i)
    } else {
      alumnos.push({
        id: crypto.randomUUID(),
        matricula,
        nombreCompleto: nombreNormalizado,
      })
      
      if (matricula) matriculasVistas.add(matricula)
      nombresVistos.add(nombreNormalizado.toLowerCase())
    }
  }

  return { alumnos, duplicados }
}

export default function ModalAsignarEstudiantes({
  grupo,
  plantelId,
  onCerrar,
  onGuardar,
}: ModalAsignarEstudiantesProps) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [textoPegado, setTextoPegado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  // Cargar estudiantes existentes del grupo
  useEffect(() => {
    async function cargarEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('matricula, nombre_completo')
          .eq('grupo_id', grupo.id)
          .eq('activo', true)
          .order('nombre_completo', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          const textoInicial = data
            .map(e => `${e.matricula || ''}\t${e.nombre_completo}`)
            .join('\n')
          setTextoPegado(textoInicial)
        }
      } catch (err) {
        console.error('Error al cargar estudiantes:', err)
      } finally {
        setCargando(false)
      }
    }

    cargarEstudiantes()
  }, [grupo.id, supabase])

  const { alumnos, duplicados } = useMemo(() => {
    if (textoPegado.trim()) {
      return procesarTexto(textoPegado)
    }
    return { alumnos: [], duplicados: new Set<number>() }
  }, [textoPegado])

  const eliminarAlumno = useCallback((id: string) => {
    const alumnosFiltrados = alumnos.filter(a => a.id !== id)
    
    const nuevoTexto = alumnosFiltrados
      .map(a => a.matricula ? `${a.matricula}\t${a.nombreCompleto}` : a.nombreCompleto)
      .join('\n')
    
    setTextoPegado(nuevoTexto)
  }, [alumnos])

  const handleGuardar = useCallback(async () => {
    if (alumnos.length === 0) return
    if (alumnos.length > 100) {
      console.error('Excede el límite de 100 alumnos por grupo')
      return
    }

    const todosValidos = alumnos.every(a => 
      validarNombreSeguro(a.nombreCompleto) && validarMatriculaSegura(a.matricula)
    )

    if (!todosValidos) {
      console.error('Algunos alumnos contienen datos inválidos')
      return
    }

    setGuardando(true)
    try {
      const alumnosParaGuardar: EstudianteInput[] = alumnos.map(a => ({
        plantel_id: plantelId,
        grupo_id: grupo.id,
        matricula: a.matricula || null,
        nombre_completo: a.nombreCompleto,
        activo: true,
      }))

      await onGuardar(alumnosParaGuardar)
      
      setGuardadoExitoso(true)
      setTimeout(() => {
        onCerrar()
      }, 1500)
    } catch (err) {
      console.error('Error:', err)
      setGuardando(false)
      setGuardadoExitoso(false)
    }
  }, [alumnos, plantelId, grupo.id, onGuardar, onCerrar])

  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `

  return createPortal(
    <div 
      onClick={e => e.stopPropagation()}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(4px)', 
        WebkitBackdropFilter: 'blur(4px)', 
        animation: 'fadeIn 0.2s ease',
        padding: '2rem',
      }}
    >
      <style>{styles}</style>
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          width: '100%',
          maxWidth: '900px',
          height: '85vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 0.25rem' }}>
              {alumnos.length > 0 ? 'Editar' : 'Cargar'} alumnos — Grupo {grupo.numero}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
              {grupo.grado}° grado · {grupo.turno}
            </p>
          </div>
          <button 
            onClick={onCerrar}
            disabled={guardando}
            style={{ 
              color: '#94a3b8', 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              background: 'none', 
              border: 'none', 
              cursor: guardando ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.5 : 1,
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          padding: '2rem',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Columna Izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            <p style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              margin: 0,
            }}>
              PEGAR LISTA
            </p>

            {/* Área de pegado con flechas */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              {/* Capa de fondo con flechas rojas */}
              <div 
                id="flechas-layer"
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: '1rem',
                  paddingLeft: '2rem',
                  pointerEvents: 'none',
                  overflowY: 'hidden',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  color: 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {textoPegado.split('\n').map((linea, idx) => (
                  <div key={idx} style={{ 
                    position: 'relative',
                    paddingLeft: '0',
                  }}>
                    <span style={{ 
                      position: 'absolute',
                      left: '-1.5rem',
                      color: duplicados.has(idx) ? '#dc2626' : 'transparent',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}>
                      {duplicados.has(idx) ? '→' : ''}
                    </span>
                    <span>{linea || '\u00A0'}</span>
                  </div>
                ))}
              </div>

              {/* Textarea real */}
              <textarea
                value={textoPegado}
                onChange={e => setTextoPegado(e.target.value)}
                onScroll={e => {
                  const flechasLayer = document.getElementById('flechas-layer')
                  if (flechasLayer) {
                    flechasLayer.scrollTop = e.currentTarget.scrollTop
                  }
                }}
                placeholder="Pega aquí tu lista"
                disabled={cargando}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  paddingLeft: '2rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  lineHeight: '1.6',
                  color: '#1e3a5f',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              Matrícula + Nombre (por línea) · → = duplicado
            </p>
          </div>

          {/* Columna Derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: '#94a3b8', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                margin: 0,
              }}>
                VISTA PREVIA
              </p>
              <p style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, margin: 0 }}>
                {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div 
              style={{ 
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                background: '#fafbfc',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
              {cargando ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                }}>
                  Cargando...
                </div>
              ) : alumnos.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  padding: '2rem',
                  textAlign: 'center',
                }}>
                  Los alumnos aparecerán aquí
                </div>
              ) : (
                <div style={{ padding: '0.75rem' }}>
                  {alumnos.map((alumno, idx) => (
                    <div
                      key={alumno.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'white',
                        marginBottom: '0.5rem',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#94a3b8',
                        minWidth: '1.5rem',
                        textAlign: 'center',
                      }}>
                        {idx + 1}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: '#1e3a5f', 
                          margin: 0,
                          lineHeight: 1.4,
                        }}>
                          {alumno.nombreCompleto}
                        </p>
                        {alumno.matricula && (
                          <p style={{ 
                            fontSize: '0.7rem', 
                            color: '#94a3b8', 
                            margin: '0.25rem 0 0',
                          }}>
                            Mat: {alumno.matricula}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => eliminarAlumno(alumno.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '0.25rem',
                          lineHeight: 1,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem', 
          padding: '1.5rem 2rem',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <button
            onClick={onCerrar}
            disabled={guardando}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              background: 'white',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: guardando ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleGuardar}
            disabled={guardando || alumnos.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.75rem',
              background: guardadoExitoso ? '#10b981' : (guardando || alumnos.length === 0) ? '#cbd5e1' : '#3b82f6',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: (guardando || alumnos.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {guardadoExitoso ? '✓ Guardado exitoso' : guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}