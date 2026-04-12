'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/Header'

const SECCIONES = [
  { key: 'inicio',      label: 'Inicio',        icon: '◈', desc: 'Estadísticas y gráficas'     },
  { key: 'docentes',    label: 'Docentes',       icon: '◈', desc: 'Docentes y asignaciones'     },
  { key: 'seguimiento', label: 'Seguimiento',    icon: '◈', desc: 'Seguimiento académico'        },
  { key: 'asignaturas', label: 'Asignaturas',    icon: '◈', desc: 'Gestión de asignaturas'       },
  { key: 'grupos',      label: 'Grupos',         icon: '◈', desc: 'Grupos y alumnos'             },
  { key: 'ciclo',       label: 'Ciclo Escolar',  icon: '◈', desc: 'Ciclo y fechas'               },
  { key: 'sistema',     label: 'Sistema',        icon: '◈', desc: 'Configuración general'        },
]

type Estado = 'vacio' | 'creado'

// ─── Modal confirmar eliminar usuario ─────────────────────────────────────────
function ModalEliminarUsuario({ nombreUsuario, onConfirmar, onCancelar }: { nombreUsuario: string; onConfirmar: () => void; onCancelar: () => void }) {
  if (typeof window === 'undefined') return null
  
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:'elimBack 0.25s ease' }}>
      <style>{`
        @keyframes elimBack { from { opacity:0 } to { opacity:1 } }
        @keyframes elimSpring { from { opacity:0; transform:scale(0.9) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
      <div style={{ background:'white', borderRadius:'1.25rem', width:'420px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', animation:'elimSpring 0.46s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
          <svg width="26" height="26" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.375rem', textAlign:'center' }}>¿Eliminar usuario?</h3>
        <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#64748b', margin:'0 0 1.25rem', textAlign:'center' }}>&ldquo;{nombreUsuario}&rdquo;</p>
        
        {/* Advertencia */}
        <div style={{ width:'100%', padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'#fef2f2', border:'1px solid #fecaca', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem' }}>
            <span style={{ fontSize:'1rem', flexShrink:0 }}>⚠️</span>
            <p style={{ fontSize:'0.8125rem', color:'#dc2626', margin:0, lineHeight:1.5, fontWeight:500 }}>
              Esta acción borrará al usuario permanentemente y no podrás recuperarlo después.
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'0.7rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#2563eb', color:'white', cursor:'pointer' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#1d4ed8')} onMouseLeave={e=>(e.currentTarget.style.background='#2563eb')}>Cancelar</button>
          <button onClick={onConfirmar} style={{ flex:1, padding:'0.7rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background:'#dc2626', color:'white', cursor:'pointer' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#b91c1c')} onMouseLeave={e=>(e.currentTarget.style.background='#dc2626')}>Sí, eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function SecretariaPage() {
  const [estado,   setEstado]   = useState<Estado>('vacio')
  const [nombre,   setNombre]   = useState('')
  const [correo,   setCorreo]   = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [editando, setEditando] = useState(false)
  const [permisos, setPermisos] = useState<Record<string,boolean>>(
    Object.fromEntries(SECCIONES.map(s => [s.key, false]))
  )
  const [guardadoCuenta, setGuardadoCuenta] = useState(false)
  const [guardadoPermisos, setGuardadoPermisos] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)

  const canCreate = nombre.trim() && correo.trim() && password.trim()
  const activosCount = SECCIONES.filter(s => permisos[s.key]).length

  function crearUsuario() {
    if (!canCreate) return
    setEstado('creado')
    setEditando(false)
  }

  function guardarCuenta() {
    setEditando(false)
    setGuardadoCuenta(true)
    setTimeout(() => setGuardadoCuenta(false), 2000)
  }

  function togglePermiso(key: string) {
    setPermisos(p => ({ ...p, [key]: !p[key] }))
    setGuardadoPermisos(false)
  }

  function guardarPermisos() {
    setGuardadoPermisos(true)
    setTimeout(() => setGuardadoPermisos(false), 2000)
  }

  function resetear() {
    setEstado('vacio')
    setNombre(''); setCorreo(''); setPassword('')
    setPermisos(Object.fromEntries(SECCIONES.map(s => [s.key, false])))
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes scIn { from{opacity:0;transform:translateY(10px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
      <Header titulo="Secretaría" />

      {/* Wrapper — ocupa el espacio disponible, centra la card */}
      <div style={{ flex:'1 1 0', minHeight:0, padding:'1rem 1rem 1rem', display:'flex', alignItems:'flex-start' }}>

        {/* ── Card grande estática split ── */}
        <div style={{
          width:'100%', background:'white', borderRadius:'1.5rem',
          border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
          display:'flex', flexDirection:'column',
          height:'calc(100vh - 7.5rem)', maxHeight:'680px',
          animation:'scIn 0.42s cubic-bezier(0.34,1.56,0.64,1)',
          overflow:'hidden',
        }}>

          {/* ══ HEADER ÚNICO ══ */}
          <div style={{ background:'#94a3b8', padding:'1.5rem 1.75rem', flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.75rem' }}>
            {/* Header izquierdo */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'white', border:'2px solid #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:800, color:'#475569', fontFamily:'Outfit,sans-serif', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                {nombre ? nombre.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <p style={{ fontSize:'0.62rem', fontWeight:600, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 0.15rem' }}>Rol del sistema</p>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color:'white', margin:0 }}>
                  {estado === 'creado' ? nombre : 'Sin usuario creado'}
                </p>
              </div>
              {estado === 'creado' && (
                <span style={{ marginLeft:'auto', fontSize:'0.62rem', fontWeight:700, padding:'0.2rem 0.6rem', borderRadius:'9999px', background:'#dcfce7', color:'#16a34a', border:'1px solid #bbf7d0', flexShrink:0 }}>Activa</span>
              )}
            </div>

            {/* Header derecho */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color: estado==='creado'?'white':'rgba(255,255,255,0.6)', margin:'0 0 0.15rem', fontFamily:'Outfit,sans-serif' }}>Accesos al sistema</p>
                <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.7)', margin:0 }}>
                  {estado === 'creado'
                    ? <><span style={{ fontWeight:700, color:'white' }}>{activosCount}</span> de {SECCIONES.length} activos</>
                    : 'Crea el usuario primero'}
                </p>
              </div>
              {estado === 'creado' && (
                <button onClick={guardarPermisos}
                  style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'32px', padding:'0 0.875rem', borderRadius:'0.875rem', border:'none', background: guardadoPermisos?'#16a34a':'#475569', color:'white', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', transition:'background 0.2s' }}
                  onMouseEnter={e=>{ if(!guardadoPermisos) e.currentTarget.style.background='#334155' }} onMouseLeave={e=>{ if(!guardadoPermisos) e.currentTarget.style.background='#475569' }}>
                  {guardadoPermisos ? <><svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>Listo</> : 'Guardar'}
                </button>
              )}
            </div>
          </div>

          {/* ══ GRID CONTENIDO ══ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', flex:'1 1 0', minHeight:0 }}>

          {/* ══ IZQUIERDA — cuenta ══ */}
          <div style={{ borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', height:'100%' }}>

            {/* Campos — estado vacío = crear, creado = ver/editar */}
            <div style={{ flex:'1 1 0', overflowY:'auto', padding:'1.25rem 1.75rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>

              {estado === 'vacio' && (
                <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0 0 0.25rem', padding:'0.75rem', borderRadius:'0.75rem', background:'white', border:'1px dashed #e2e8f0' }}>
                  Crea la cuenta de la secretaria para después asignarle permisos.
                </p>
              )}

              {/* Nombre */}
              <div>
                <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.35rem' }}>Nombre completo</label>
                {(estado === 'vacio' || editando)
                  ? <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Apellido Apellido Nombre"
                      style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.875rem', outline:'none', color:'#1e3a5f', boxSizing:'border-box', background:'white' }}
                      onFocus={e=>(e.currentTarget.style.borderColor='#94a3b8')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                  : <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>{nombre}</p>
                }
              </div>

              {/* Correo */}
              <div>
                <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.35rem' }}>Correo electrónico</label>
                {(estado === 'vacio' || editando)
                  ? <input type="email" value={correo} onChange={e=>setCorreo(e.target.value)} placeholder="correo@cbta62.edu.mx"
                      style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', fontSize:'0.875rem', outline:'none', color:'#1e3a5f', boxSizing:'border-box', background:'white' }}
                      onFocus={e=>(e.currentTarget.style.borderColor='#94a3b8')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                  : <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>{correo}</p>
                }
              </div>

              {/* Contraseña */}
              <div>
                <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.35rem' }}>Contraseña</label>
                {(estado === 'vacio' || editando)
                  ? <div style={{ position:'relative' }}>
                      <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                        style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.625rem', padding:'0.5rem 2.25rem 0.5rem 0.75rem', fontSize:'0.875rem', outline:'none', color:'#1e3a5f', boxSizing:'border-box', background:'white' }}
                        onFocus={e=>(e.currentTarget.style.borderColor='#94a3b8')} onBlur={e=>(e.currentTarget.style.borderColor='#e2e8f0')}/>
                      <button onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:'0.65rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                        {showPass ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  : <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1e3a5f', letterSpacing: showPass?'normal':'0.2em' }}>{showPass ? password : '••••••••'}</span>
                      <button onClick={()=>setShowPass(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                        {showPass ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                }
              </div>
            </div>

            {/* Botones footer izquierda */}
            <div style={{ padding:'1rem 1.75rem', borderTop:'1px solid #f1f5f9', flexShrink:0, display:'flex', gap:'0.5rem' }}>
              {estado === 'vacio' ? (
                <button onClick={crearUsuario} disabled={!canCreate}
                  style={{ flex:1, padding:'0.6rem', fontSize:'0.825rem', fontWeight:700, borderRadius:'0.875rem', border:'none', background: canCreate?'#475569':'#e2e8f0', color: canCreate?'white':'#94a3b8', cursor: canCreate?'pointer':'not-allowed', transition:'background 0.18s' }}
                  onMouseEnter={e=>{ if(canCreate) e.currentTarget.style.background='#334155' }} onMouseLeave={e=>{ if(canCreate) e.currentTarget.style.background='#475569' }}>
                  Crear usuario
                </button>
              ) : editando ? (
                <>
                  <button onClick={()=>setEditando(false)}
                    style={{ flex:1, padding:'0.6rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={guardarCuenta}
                    style={{ flex:2, padding:'0.6rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.875rem', border:'none', background: guardadoCuenta?'#16a34a':'#475569', color:'white', cursor:'pointer', transition:'background 0.2s' }}
                    onMouseEnter={e=>{ if(!guardadoCuenta) e.currentTarget.style.background='#334155' }} onMouseLeave={e=>{ if(!guardadoCuenta) e.currentTarget.style.background='#475569' }}>
                    {guardadoCuenta ? '✓ Guardado' : 'Guardar cambios'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={()=>setEditando(true)}
                    style={{ flex:2, padding:'0.6rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'0.875rem', border:'1px solid #2563eb', background:'white', color:'#2563eb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#1d4ed8';e.currentTarget.style.background='#eff6ff'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.background='white'}}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button onClick={() => setModalEliminar(true)}
                    style={{ flex:1, padding:'0.6rem', fontSize:'0.8rem', fontWeight:500, borderRadius:'0.875rem', border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#fee2e2')} onMouseLeave={e=>(e.currentTarget.style.background='#fef2f2')}>
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ══ DERECHA — permisos ══ */}
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            {/* Lista de permisos — solo esta área con scroll */}
            <div style={{ flex:'1 1 0', overflowY:'auto', minHeight:0, opacity: estado==='creado'?1:0.35, pointerEvents: estado==='creado'?'all':'none', transition:'opacity 0.3s', background: estado==='vacio'?'#f8fafc':'transparent' }}>
              {SECCIONES.map(s => (
                <div key={s.key}
                  onClick={() => togglePermiso(s.key)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.8rem 1.75rem', borderBottom:'1px solid #f8fafc', cursor: estado==='creado'?'pointer':'default', transition:'background 0.12s', background:'white' }}
                  onMouseEnter={e=>{ if(estado==='creado') e.currentTarget.style.background='#f8fafc' }}
                  onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                  <div>
                    <p style={{ fontSize:'0.845rem', fontWeight:600, color: permisos[s.key]?'#1e3a5f':'#94a3b8', margin:'0 0 0.1rem', transition:'color 0.2s' }}>{s.label}</p>
                    <p style={{ fontSize:'0.7rem', color:'#cbd5e1', margin:0 }}>{s.desc}</p>
                  </div>
                  <div style={{ width:'40px', height:'22px', borderRadius:'9999px', background: permisos[s.key]?'#475569':'#e2e8f0', position:'relative', flexShrink:0, transition:'background 0.22s' }}>
                    <div style={{ position:'absolute', top:'2px', left: permisos[s.key]?'20px':'2px', width:'18px', height:'18px', borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.18)', transition:'left 0.2s cubic-bezier(0.4,0,0.2,1)' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip cuando no hay usuario */}
            {estado === 'vacio' && (
              <div style={{ padding:'1.5rem 1.75rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', textAlign:'center', flex:1 }}>
                <svg width="36" height="36" fill="none" stroke="#e2e8f0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p style={{ fontSize:'0.8rem', color:'#cbd5e1', margin:0, lineHeight:1.4 }}>Los permisos se habilitan<br/>después de crear el usuario</p>
              </div>
            )}
          </div>

          </div> {/* Fin grid contenido */}

        </div> {/* Fin card */}
      </div> {/* Fin wrapper */}

      {/* Modal eliminar usuario */}
      {modalEliminar && (
        <ModalEliminarUsuario
          nombreUsuario={nombre}
          onConfirmar={() => { setModalEliminar(false); resetear() }}
          onCancelar={() => setModalEliminar(false)}
        />
      )}
    </div>
  )
}