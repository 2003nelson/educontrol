// src/components/grupos/ModalAsignarEstudiantes.tsx
'use client'
import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface Alumno {
  id: string
  matricula: string
  nombreCompleto: string
}

interface ModalAsignarEstudiantesProps {
  grupo: {
    id: string
    grado: number
    numero: string
    turno: 'matutino' | 'vespertino'
  }
  alumnosExistentes?: Alumno[]
  onCerrar: () => void
  onGuardar: (alumnos: Alumno[]) => Promise<void>
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
  // Eliminar caracteres peligrosos y limitar longitud
  return texto
    .replace(/[<>{}[\]\\]/g, '') // Eliminar caracteres potencialmente peligrosos
    .slice(0, 10000) // Límite de 10,000 caracteres
}

function validarNombreSeguro(nombre: string): boolean {
  // Validar que solo contenga letras, espacios, acentos y guiones
  const regex = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-']+$/
  return regex.test(nombre) && nombre.length >= 3 && nombre.length <= 100
}

function validarMatriculaSegura(matricula: string): boolean {
  // Validar que solo contenga letras, números y guiones
  const regex = /^[a-zA-Z0-9\-]+$/
  return matricula.length === 0 || (regex.test(matricula) && matricula.length <= 20)
}

function procesarTexto(texto: string): { alumnos: Alumno[], duplicados: Set<number> } {
  const textoSeguro = sanitizarTexto(texto)
  const lineas = textoSeguro.split('\n')
  const alumnos: Alumno[] = []
  const duplicados = new Set<number>()
  
  // Sets para detectar duplicados
  const matriculasVistas = new Set<string>()
  const nombresVistos = new Set<string>()
  
  const maxAlumnos = 100

  for (let i = 0; i < lineas.length; i++) {
    if (alumnos.length >= maxAlumnos) break

    const linea = lineas[i].trim()
    if (!linea) continue
    
    // Intentar separar por diferentes métodos
    let matricula = ''
    let nombreCompleto = ''
    
    // Método 1: Buscar tabulador o coma
    if (linea.includes('\t')) {
      const partes = linea.split('\t')
      matricula = partes[0].trim()
      nombreCompleto = partes.slice(1).join(' ').trim()
    } else if (linea.includes(',')) {
      const partes = linea.split(',')
      matricula = partes[0].trim()
      nombreCompleto = partes.slice(1).join(' ').trim()
    } else if (linea.includes(' ')) {
      // Método 2: Primer espacio separa matrícula de nombre
      const primerEspacio = linea.indexOf(' ')
      const posibleMatricula = linea.substring(0, primerEspacio).trim()
      const posibleNombre = linea.substring(primerEspacio + 1).trim()
      
      // Si la primera parte parece matrícula (números/letras sin espacios)
      if (/^[a-zA-Z0-9\-]+$/.test(posibleMatricula)) {
        matricula = posibleMatricula
        nombreCompleto = posibleNombre
      } else {
        // Todo es nombre (sin matrícula)
        nombreCompleto = linea
      }
    } else {
      // Sin espacios, probablemente solo una palabra - saltar
      continue
    }
    
    // Validar que el nombre tenga al menos 2 palabras
    const palabrasNombre = nombreCompleto.split(/\s+/).filter(p => p.length > 0)
    
    if (palabrasNombre.length < 2) {
      continue
    }
    
    // Validar seguridad del nombre
    if (!validarNombreSeguro(nombreCompleto)) {
      continue
    }
    
    // Validar matrícula si existe
    if (matricula && !validarMatriculaSegura(matricula)) {
      continue
    }
    
    const nombreNormalizado = capitalizarNombre(nombreCompleto)
    
    // Verificar duplicados
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
  alumnosExistentes = [],
  onCerrar,
  onGuardar,
}: ModalAsignarEstudiantesProps) {
  // Inicializar con alumnos existentes si los hay
  const textoInicial = alumnosExistentes
    .map(a => `${a.matricula}\t${a.nombreCompleto}`)
    .join('\n')
  
  const [textoPegado, setTextoPegado] = useState(textoInicial)
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  // Calcular alumnos con useMemo para optimización
  const { alumnos, duplicados } = useMemo(() => {
    if (textoPegado.trim()) {
      return procesarTexto(textoPegado)
    }
    return { alumnos: [], duplicados: new Set<number>() }
  }, [textoPegado])

  // Función para eliminar alumno individual
  const eliminarAlumno = useCallback((id: string) => {
    // Filtrar el alumno eliminado
    const alumnosFiltrados = alumnos.filter(a => a.id !== id)
    
    // Reconstruir texto sin el alumno eliminado
    const nuevoTexto = alumnosFiltrados
      .map(a => a.matricula ? `${a.matricula}\t${a.nombreCompleto}` : a.nombreCompleto)
      .join('\n')
    
    setTextoPegado(nuevoTexto)
  }, [alumnos])

  const handleGuardar = useCallback(async () => {
    // Validaciones de seguridad
    if (alumnos.length === 0) return
    if (alumnos.length > 100) {
      console.error('Excede el límite de 100 alumnos por grupo')
      return
    }

    // Validar que todos los alumnos tengan datos válidos
    const todosValidos = alumnos.every(a => 
      validarNombreSeguro(a.nombreCompleto) && validarMatriculaSegura(a.matricula)
    )

    if (!todosValidos) {
      console.error('Algunos alumnos contienen datos inválidos')
      return
    }

    setGuardando(true)
    try {
      await onGuardar(alumnos)
      
      // Mostrar éxito por 1.5 segundos antes de cerrar
      setGuardadoExitoso(true)
      setTimeout(() => {
        onCerrar()
      }, 1500)
    } catch (err) {
      console.error('Error:', err)
      setGuardando(false)
      setGuardadoExitoso(false)
    }
  }, [alumnos, onGuardar, onCerrar])

  const styles = `
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideIn { from{opacity:0;transform:scale(0.96) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
    
    /* Scrollbar personalizada - más visible */
    textarea,
    div {
      scrollbar-width: thin;
      scrollbar-color: #94a3b8 #f1f5f9;
    }
    
    textarea::-webkit-scrollbar,
    div::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    
    textarea::-webkit-scrollbar-track,
    div::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
      margin: 4px;
    }
    
    textarea::-webkit-scrollbar-thumb,
    div::-webkit-scrollbar-thumb {
      background: #94a3b8;
      border-radius: 10px;
      border: 2px solid #f1f5f9;
    }
    
    textarea::-webkit-scrollbar-thumb:hover,
    div::-webkit-scrollbar-thumb:hover {
      background: #64748b;
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
        padding: '1rem',
      }}
    >
      <style>{styles}</style>
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          width: '100%',
          maxWidth: '800px', // Reducido de 920px para zoom 100%
          maxHeight: '80vh', // Reducido de 85vh
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
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 0.25rem' }}>
              Cargar alumnos — Grupo {grupo.numero}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Pega una lista nueva o edita nombres y matrícula
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
          gap: '1.5rem', // Reducido de 2rem
          padding: '1.5rem 1.75rem', // Reducido de 2rem 2.25rem
          flex: 1,
          overflow: 'hidden',
        }}>
          
          {/* Columna Izquierda - Campo de pegado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              margin: 0,
            }}>
              PEGAR LISTA
            </p>

            {/* Área de pegado con flechas de duplicados */}
            <div style={{ position: 'relative', height: '280px' }}>
              {/* Capa de fondo con flechas rojas para duplicados */}
              <div style={{
                position: 'absolute',
                inset: 0,
                padding: '0.75rem 0.875rem',
                pointerEvents: 'none',
                overflowY: 'auto',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                fontFamily: 'monospace',
                color: 'transparent',
              }}>
                {textoPegado.split('\n').map((linea, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.25rem' }}>
                    <span style={{ 
                      color: duplicados.has(idx) ? '#dc2626' : 'transparent',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}>
                      {duplicados.has(idx) ? '→' : '\u00A0'}
                    </span>
                    <span>{linea || '\u00A0'}</span>
                  </div>
                ))}
              </div>

              {/* Textarea real */}
              <textarea
                value={textoPegado}
                onChange={e => setTextoPegado(e.target.value)}
                placeholder="Pega aquí tu lista"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 0.875rem',
                  paddingLeft: '1.5rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  lineHeight: 1.5,
                  color: '#1e3a5f',
                  fontFamily: 'monospace',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
              Matrícula + Nombre (por línea) · → = duplicado
            </p>
          </div>

          {/* Columna Derecha - Vista previa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                color: '#94a3b8', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                margin: 0,
              }}>
                LISTA DE ALUMNOS
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', margin: 0 }}>
                {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div 
              style={{ 
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                background: '#fafbfc',
                height: '280px', // Reducido de 300px
                overflowY: 'scroll',
              }}
            >
              {alumnos.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '2rem 1rem',
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, textAlign: 'center' }}>
                    La vista previa aparecerá aquí
                  </p>
                </div>
              ) : (
                <div style={{ padding: '0.5rem' }}>
                  {alumnos.map((alumno, index) => (
                    <div
                      key={alumno.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: '#94a3b8',
                        minWidth: '24px',
                        marginTop: '0.125rem',
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: '#1e3a5f', 
                          margin: 0,
                          lineHeight: 1.4,
                          wordBreak: 'normal', // Permitir que el nombre fluya naturalmente
                        }}>
                          {alumno.nombreCompleto}
                        </p>
                        {alumno.matricula && (
                          <p style={{ 
                            fontSize: '0.7rem', 
                            color: '#94a3b8', 
                            margin: '0.25rem 0 0',
                          }}>
                            Matrícula: {alumno.matricula}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => eliminarAlumno(alumno.id)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#dc2626'
                          e.currentTarget.style.color = 'white'
                          e.currentTarget.style.borderColor = '#dc2626'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fef2f2'
                          e.currentTarget.style.color = '#dc2626'
                          e.currentTarget.style.borderColor = '#fecaca'
                        }}
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

        {/* Foooter */}
        <div style={{ 
          padding: '1rem 1.75rem 1.5rem',
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} en el grupo {grupo.numero}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onCerrar}
              disabled={guardando || guardadoExitoso}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: guardando || guardadoExitoso ? 'not-allowed' : 'pointer',
                opacity: guardando || guardadoExitoso ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || alumnos.length === 0 || guardadoExitoso}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: guardadoExitoso ? '#16a34a' : (guardando || alumnos.length === 0 ? '#cbd5e1' : '#1e3a5f'),
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: guardando || alumnos.length === 0 || guardadoExitoso ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
              }}
            >
              {guardadoExitoso ? (
                <>
                  <span>✓</span>
                  Carga exitosa
                </>
              ) : guardando ? (
                'Guardando...'
              ) : (
                <>
                  <span>✓</span>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}