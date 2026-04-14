'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Docente = {
  id: string
  nombre: string
  materias: string[]
  avatar: string
  online: boolean
}

type Mensaje = {
  id: string
  texto: string
  hora: string
  esDirector: boolean
  tipo: 'grupal' | 'privado'
  destinatarioId?: string
  respuestas?: Mensaje[]
}

const docentesMock: Docente[] = [
  { id: '1', nombre: 'PROF. MARÍA GONZÁLEZ', materias: ['Matemáticas', 'Física'], avatar: 'M', online: true },
  { id: '2', nombre: 'PROF. JUAN PÉREZ', materias: ['Química', 'Biología'], avatar: 'J', online: false },
  { id: '3', nombre: 'PROF. ANA MARTÍNEZ', materias: ['Historia', 'Geografía'], avatar: 'A', online: true },
  { id: '4', nombre: 'PROF. CARLOS LÓPEZ', materias: ['Inglés', 'Literatura'], avatar: 'C', online: true },
  { id: '5', nombre: 'PROF. LAURA SÁNCHEZ', materias: ['Informática', 'Programación'], avatar: 'L', online: false },
]

const mensajesMock: Mensaje[] = [
  { 
    id: '1', 
    texto: 'Buen día a todos. Les recuerdo que mañana tenemos junta a las 8 AM en sala de profesores.', 
    hora: '09:15', 
    esDirector: true, 
    tipo: 'grupal',
    respuestas: [
      { id: '1-1', texto: 'Entendido directora, ahí estaré', hora: '09:18', esDirector: false, tipo: 'grupal' },
      { id: '1-2', texto: 'Perfecto, gracias por avisar', hora: '09:20', esDirector: false, tipo: 'grupal' },
    ]
  },
  { 
    id: '2', 
    texto: 'Recuerden entregar las calificaciones del parcial antes del viernes.', 
    hora: '14:30', 
    esDirector: true, 
    tipo: 'grupal',
  },
]

type MensajeriaProps = {
  onCerrar: () => void
}

export default function Mensajeria({ onCerrar }: MensajeriaProps) {
  const [docenteSelec, setDocenteSelec] = useState<Docente | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesMock)
  const [textoMensaje, setTextoMensaje] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charsRestantes = 200 - textoMensaje.length

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  function handleCerrar() {
    setCerrando(true)
    setTimeout(() => onCerrar(), 320)
  }

  function enviarMensaje() {
    if (!textoMensaje.trim() || textoMensaje.length > 200) return

    const ahora = new Date()
    const hora = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`

    const tipoMensaje = docenteSelec ? 'privado' : 'grupal'

    const nuevoMensaje: Mensaje = {
      id: Date.now().toString(),
      texto: textoMensaje.trim(),
      hora,
      esDirector: true,
      tipo: tipoMensaje,
      destinatarioId: tipoMensaje === 'privado' ? docenteSelec?.id : undefined,
    }

    setMensajes(prev => [...prev, nuevoMensaje])
    setTextoMensaje('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  // Filtrar mensajes según el contexto
  const mensajesFiltrados = docenteSelec
    ? mensajes.filter(m => m.tipo === 'privado' && m.destinatarioId === docenteSelec.id)
    : mensajes.filter(m => m.tipo === 'grupal')

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      <style>{`
        @keyframes mensajesBackdropIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes mensajesBackdropOut { from { opacity:1 } to { opacity:0 } }
        @keyframes mensajesSpringIn  { from { opacity:0; transform:scale(0.92) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes mensajesSpringOut { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.92) translateY(20px) } }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position:'fixed', inset:0, zIndex:9990,
        background:'rgba(0,0,0,0.5)',
        backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
        animation: cerrando ? 'mensajesBackdropOut 0.32s ease forwards' : 'mensajesBackdropIn 0.25s ease',
      }}/>

      {/* Container centrado */}
      <div style={{
        position:'fixed', inset:0, zIndex:9991,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'none',
        padding: '2rem',
      }}>
        
        {/* Card principal */}
        <div style={{
          background:'white', 
          borderRadius:'1.5rem',
          boxShadow:'0 24px 64px rgba(0,0,0,0.2)',
          width:'100%', 
          maxWidth:'1100px', 
          height:'85vh',
          maxHeight:'700px',
          display:'flex', 
          flexDirection:'column',
          overflow:'hidden', 
          pointerEvents:'all',
          animation: cerrando ? 'mensajesSpringOut 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'mensajesSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header verde estilo WhatsApp */}
          <div style={{ 
            background:'linear-gradient(135deg, #16a34a, #22c55e)', 
            padding:'1.25rem 1.75rem',
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            flexShrink:0,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <div style={{ 
                width:'40px', 
                height:'40px', 
                borderRadius:'0.875rem', 
                background:'rgba(255,255,255,0.25)', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center',
                backdropFilter:'blur(8px)',
              }}>
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize:'1.0625rem', fontWeight:700, color:'white', margin:0, fontFamily:'Outfit,sans-serif' }}>
                  Dinoti Messenger
                </p>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.8)', margin:0 }}>
                  Comunicación con docentes
                </p>
              </div>
            </div>
            <button onClick={handleCerrar}
              style={{ 
                width:'36px', 
                height:'36px', 
                borderRadius:'50%', 
                background:'rgba(255,255,255,0.2)', 
                border:'none', 
                cursor:'pointer', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center',
                color:'white',
                fontSize:'1.1rem',
                fontWeight:700,
                transition:'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}>
              ✕
            </button>
          </div>

          {/* Body split */}
          <div style={{ display:'flex', flex:1, minHeight:0 }}>
            
            {/* IZQUIERDA — Lista de docentes */}
            <div style={{ 
              width:'340px', 
              borderRight:'1px solid #e2e8f0',
              display:'flex',
              flexDirection:'column',
              flexShrink:0,
            }}>
              
              {/* Header lista */}
              <div style={{ 
                padding:'1rem 1.25rem', 
                borderBottom:'1px solid #e2e8f0',
                background:'#f8fafc',
              }}>
                <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'#1e3a5f', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Docentes ({docentesMock.length})
                </p>
              </div>

              {/* Lista scrolleable */}
              <div className="scrollbar-thin" style={{ 
                flex:1, 
                overflowY:'auto',
              }}>
                {/* Opción "Todos" */}
                <button
                  onClick={() => setDocenteSelec(null)}
                  style={{
                    width:'100%',
                    padding:'1rem 1.25rem',
                    display:'flex',
                    alignItems:'center',
                    gap:'0.875rem',
                    background: !docenteSelec ? '#ecfdf5' : 'white',
                    border:'none',
                    borderBottom:'1px solid #f1f5f9',
                    cursor:'pointer',
                    transition:'background 0.12s',
                    textAlign:'left',
                  }}
                  onMouseEnter={e => { if (docenteSelec) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (docenteSelec) e.currentTarget.style.background = 'white' }}>
                  <div style={{ 
                    width:'44px', 
                    height:'44px', 
                    borderRadius:'50%', 
                    background:'linear-gradient(135deg, #16a34a, #22c55e)',
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent:'center',
                    fontSize:'0.9rem',
                    fontWeight:700,
                    color:'white',
                    flexShrink:0,
                  }}>
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                      Chat Grupal
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'#64748b', margin:'0.125rem 0 0' }}>
                      Todos los docentes
                    </p>
                  </div>
                  {!docenteSelec && (
                    <div style={{ 
                      width:'8px', 
                      height:'8px', 
                      borderRadius:'50%', 
                      background:'#16a34a',
                      flexShrink:0,
                    }}/>
                  )}
                </button>

                {/* Docentes individuales */}
                {docentesMock.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setDocenteSelec(doc)}
                    style={{
                      width:'100%',
                      padding:'1rem 1.25rem',
                      display:'flex',
                      alignItems:'center',
                      gap:'0.875rem',
                      background: docenteSelec?.id === doc.id ? '#ecfdf5' : 'white',
                      border:'none',
                      borderBottom:'1px solid #f1f5f9',
                      cursor:'pointer',
                      transition:'background 0.12s',
                      textAlign:'left',
                    }}
                    onMouseEnter={e => { if (docenteSelec?.id !== doc.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (docenteSelec?.id !== doc.id) e.currentTarget.style.background = 'white' }}>
                    <div style={{ position:'relative' }}>
                      <div style={{ 
                        width:'44px', 
                        height:'44px', 
                        borderRadius:'50%', 
                        background:'#1e3a5f',
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        fontSize:'0.9rem',
                        fontWeight:700,
                        color:'white',
                        flexShrink:0,
                      }}>
                        {doc.avatar}
                      </div>
                      {doc.online && (
                        <span style={{ 
                          position:'absolute',
                          bottom:0,
                          right:0,
                          width:'12px',
                          height:'12px',
                          borderRadius:'50%',
                          background:'#16a34a',
                          border:'2px solid white',
                        }}/>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                        {doc.nombre}
                      </p>
                      <p style={{ fontSize:'0.75rem', color:'#64748b', margin:'0.125rem 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {doc.materias.join(', ')}
                      </p>
                    </div>
                    {docenteSelec?.id === doc.id && (
                      <div style={{ 
                        width:'8px', 
                        height:'8px', 
                        borderRadius:'50%', 
                        background:'#16a34a',
                        flexShrink:0,
                      }}/>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* DERECHA — Chat */}
            <div style={{ 
              flex:1, 
              display:'flex', 
              flexDirection:'column',
              minWidth:0,
            }}>
              
              {/* Header del chat */}
              <div style={{ 
                padding:'1rem 1.75rem', 
                borderBottom:'1px solid #e2e8f0',
                background:'#f8fafc',
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  {docenteSelec ? (
                    <>
                      <div style={{ 
                        width:'36px', 
                        height:'36px', 
                        borderRadius:'50%', 
                        background:'#1e3a5f',
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        fontSize:'0.85rem',
                        fontWeight:700,
                        color:'white',
                      }}>
                        {docenteSelec.avatar}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                          {docenteSelec.nombre}
                        </p>
                        <p style={{ fontSize:'0.7rem', color:'#64748b', margin:0 }}>
                          Chat privado
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ 
                        width:'36px', 
                        height:'36px', 
                        borderRadius:'50%', 
                        background:'linear-gradient(135deg, #16a34a, #22c55e)',
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                      }}>
                        <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>
                          Chat Grupal
                        </p>
                        <p style={{ fontSize:'0.7rem', color:'#64748b', margin:0 }}>
                          Todos los docentes
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mensajes */}
              <div className="scrollbar-thin" style={{ 
                flex:1, 
                overflowY:'auto',
                padding:'1.5rem',
                background:'#fafbfc',
              }}>
                {mensajesFiltrados.map(msg => (
                  <div key={msg.id} style={{ marginBottom:'1.25rem' }}>
                    
                    {/* Mensaje principal */}
                    <div style={{ 
                      display:'flex', 
                      gap:'0.75rem',
                      alignItems:'flex-start',
                    }}>
                      {!msg.esDirector && (
                        <div style={{ 
                          width:'32px', 
                          height:'32px', 
                          borderRadius:'50%', 
                          background:'#1e3a5f',
                          display:'flex', 
                          alignItems:'center', 
                          justifyContent:'center',
                          fontSize:'0.75rem',
                          fontWeight:700,
                          color:'white',
                          flexShrink:0,
                        }}>
                          D
                        </div>
                      )}
                      <div style={{ 
                        flex:1,
                        display:'flex',
                        justifyContent: msg.esDirector ? 'flex-end' : 'flex-start',
                      }}>
                        <div style={{ 
                          maxWidth:'75%',
                          background: msg.esDirector ? '#16a34a' : 'white',
                          color: msg.esDirector ? 'white' : '#1e3a5f',
                          padding:'0.75rem 1rem',
                          borderRadius: msg.esDirector ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          boxShadow: msg.esDirector ? '0 2px 8px rgba(22,163,74,0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
                        }}>
                          <p style={{ fontSize:'0.8125rem', margin:0, lineHeight:1.5 }}>
                            {msg.texto}
                          </p>
                          <div style={{ 
                            display:'flex', 
                            alignItems:'center', 
                            gap:'0.5rem',
                            marginTop:'0.375rem',
                          }}>
                            <p style={{ 
                              fontSize:'0.65rem', 
                              color: msg.esDirector ? 'rgba(255,255,255,0.7)' : '#94a3b8', 
                              margin:0,
                            }}>
                              {msg.hora}
                            </p>
                            {msg.tipo === 'privado' && (
                              <span style={{ 
                                fontSize:'0.65rem',
                                padding:'0.125rem 0.375rem',
                                borderRadius:'9999px',
                                background: msg.esDirector ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                color: msg.esDirector ? 'white' : '#64748b',
                                fontWeight:600,
                              }}>
                                Privado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Respuestas */}
                    {msg.respuestas && msg.respuestas.length > 0 && (
                      <div style={{ marginTop:'0.5rem', marginLeft:'2.5rem' }}>
                        {msg.respuestas.map(resp => (
                          <div key={resp.id} style={{ 
                            display:'flex', 
                            gap:'0.75rem',
                            marginBottom:'0.625rem',
                          }}>
                            <div style={{ 
                              width:'28px', 
                              height:'28px', 
                              borderRadius:'50%', 
                              background:'#1e3a5f',
                              display:'flex', 
                              alignItems:'center', 
                              justifyContent:'center',
                              fontSize:'0.7rem',
                              fontWeight:700,
                              color:'white',
                              flexShrink:0,
                            }}>
                              D
                            </div>
                            <div style={{ 
                              background:'white',
                              padding:'0.625rem 0.875rem',
                              borderRadius:'0.875rem 0.875rem 0.875rem 0.25rem',
                              boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                            }}>
                              <p style={{ fontSize:'0.75rem', color:'#1e3a5f', margin:0, lineHeight:1.4 }}>
                                {resp.texto}
                              </p>
                              <p style={{ fontSize:'0.625rem', color:'#94a3b8', margin:'0.25rem 0 0' }}>
                                {resp.hora}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input de mensaje */}
              <div style={{ 
                padding:'1rem 1.75rem',
                borderTop:'1px solid #e2e8f0',
                background:'white',
                flexShrink:0,
              }}>
                {docenteSelec && (
                  <div style={{ 
                    fontSize:'0.7rem',
                    color:'#64748b',
                    marginBottom:'0.625rem',
                    display:'flex',
                    alignItems:'center',
                    gap:'0.375rem',
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Mensaje privado a {docenteSelec.nombre}
                  </div>
                )}
                <div style={{ position:'relative' }}>
                  <textarea
                    ref={textareaRef}
                    value={textoMensaje}
                    onChange={e => setTextoMensaje(e.target.value.slice(0, 200))}
                    onKeyDown={handleKeyDown}
                    placeholder={docenteSelec ? "Escribe un mensaje privado..." : "Escribe un mensaje grupal..."}
                    maxLength={200}
                    style={{
                      width:'100%',
                      minHeight:'60px',
                      maxHeight:'120px',
                      resize:'none',
                      padding:'0.875rem 1rem',
                      paddingRight:'5rem',
                      borderRadius:'1rem',
                      border:'1px solid #e2e8f0',
                      fontSize:'0.875rem',
                      fontFamily:'DM Sans, sans-serif',
                      outline:'none',
                      transition:'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#16a34a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  />
                  <div style={{ 
                    position:'absolute',
                    bottom:'0.875rem',
                    right:'1rem',
                    display:'flex',
                    alignItems:'center',
                    gap:'0.75rem',
                  }}>
                    <span style={{ 
                      fontSize:'0.7rem',
                      color: charsRestantes < 20 ? '#dc2626' : '#94a3b8',
                      fontWeight:500,
                    }}>
                      {charsRestantes}
                    </span>
                    <button
                      onClick={enviarMensaje}
                      disabled={!textoMensaje.trim()}
                      style={{
                        width:'36px',
                        height:'36px',
                        borderRadius:'50%',
                        background: textoMensaje.trim() ? '#16a34a' : '#e2e8f0',
                        border:'none',
                        cursor: textoMensaje.trim() ? 'pointer' : 'not-allowed',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (textoMensaje.trim()) {
                          e.currentTarget.style.background = '#15803d'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (textoMensaje.trim()) {
                          e.currentTarget.style.background = '#16a34a'
                          e.currentTarget.style.transform = 'scale(1)'
                        }
                      }}>
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p style={{ fontSize:'0.65rem', color:'#94a3b8', margin:'0.5rem 0 0', textAlign:'center' }}>
                  Enter para enviar • Shift+Enter para nueva línea
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}