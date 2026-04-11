'use client'
import { useState } from 'react'
import Header from '@/components/Header'

const SECCIONES = [
  { key: 'inicio',      label: 'Inicio',        desc: 'Panel de estadísticas y gráficas'       },
  { key: 'docentes',    label: 'Docentes',       desc: 'Gestión de docentes y asignaciones'     },
  { key: 'seguimiento', label: 'Seguimiento',    desc: 'Seguimiento académico por grupo'        },
  { key: 'asignaturas', label: 'Asignaturas',    desc: 'Administración de asignaturas'          },
  { key: 'grupos',      label: 'Grupos',         desc: 'Gestión de grupos y carga de alumnos'   },
  { key: 'ciclo',       label: 'Ciclo Escolar',  desc: 'Configuración del ciclo y fechas'       },
  { key: 'sistema',     label: 'Sistema',        desc: 'Configuración general del sistema'      },
]

export default function SecretariaPage() {
  const [mostrarPass, setMostrarPass] = useState(false)
  const [permisos, setPermisos]       = useState<Record<string, boolean>>(
    Object.fromEntries(SECCIONES.map(s => [s.key, true]))
  )
  const [guardado, setGuardado] = useState(false)

  function togglePermiso(key: string) {
    setPermisos(prev => ({ ...prev, [key]: !prev[key] }))
    setGuardado(false)
  }

  function guardar() {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2200)
  }

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes scIn { from{opacity:0;transform:translateY(10px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <Header titulo="Secretaría" />

      <div className="px-4 pb-4 pt-3" style={{ flex:'1 1 0', minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

        {/* ── Card datos secretaria ── */}
        <div style={{ background:'white', borderRadius:'1.25rem', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', animation:'cardIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Header degradado */}
          <div style={{ background:'linear-gradient(135deg,#64748b 0%,#94a3b8 100%)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:'46px', height:'46px', borderRadius:'50%', background:'rgba(255,255,255,0.92)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:800, color:'#475569', fontFamily:'Outfit,sans-serif', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
              A
            </div>
            <div>
              <p style={{ fontSize:'0.62rem', fontWeight:600, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.15rem' }}>Rol del sistema</p>
              <p style={{ fontSize:'1rem', fontWeight:700, color:'white', margin:0, fontFamily:'Outfit,sans-serif' }}>Secretaria escolar</p>
            </div>
            <span style={{ marginLeft:'auto', fontSize:'0.68rem', fontWeight:600, padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.9)', border:'1px solid rgba(255,255,255,0.25)' }}>
              Activa
            </span>
          </div>

          {/* Campos */}
          <div style={{ padding:'1.25rem 1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1.25rem' }}>
            {/* Nombre */}
            <div>
              <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.4rem' }}>Nombre completo</label>
              <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>Alma Rodríguez Pérez</p>
            </div>
            {/* Correo */}
            <div>
              <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.4rem' }}>Correo electrónico</label>
              <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#1e3a5f', margin:0 }}>secretaria@cbta62.edu.mx</p>
            </div>
            {/* Contraseña */}
            <div>
              <label style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'0.4rem' }}>Contraseña</label>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ fontSize:'0.9rem', fontWeight:600, color:'#1e3a5f', letterSpacing: mostrarPass ? 'normal' : '0.18em' }}>
                  {mostrarPass ? 'Cbta62#2025' : '••••••••••'}
                </span>
                <button onClick={() => setMostrarPass(p => !p)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'0 0.25rem', display:'flex', alignItems:'center', transition:'color 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#2563eb')} onMouseLeave={e=>(e.currentTarget.style.color='#94a3b8')}>
                  {mostrarPass
                    ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card permisos ── */}
        <div style={{ background:'white', borderRadius:'1.25rem', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', animation:'cardIn 0.44s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Header */}
          <div style={{ padding:'1.125rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e3a5f', margin:0, fontFamily:'Outfit,sans-serif' }}>Permisos de acceso</p>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.15rem 0 0' }}>Elige qué secciones puede ver y usar la secretaria</p>
            </div>
            <button onClick={guardar}
              style={{ display:'flex', alignItems:'center', gap:'0.4rem', height:'36px', padding:'0 1.125rem', borderRadius:'0.875rem', border:'none', background: guardado ? '#16a34a' : '#1e3a5f', color:'white', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'background 0.22s' }}
              onMouseEnter={e=>{ if(!guardado) e.currentTarget.style.background='#2563eb' }}
              onMouseLeave={e=>{ if(!guardado) e.currentTarget.style.background='#1e3a5f' }}>
              {guardado
                ? <><svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>Guardado</>
                : 'Guardar cambios'}
            </button>
          </div>

          {/* Lista secciones */}
          {SECCIONES.map((s, i) => (
            <div key={s.key}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.9rem 1.5rem', borderBottom:'1px solid #f8fafc' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
              onMouseLeave={e=>(e.currentTarget.style.background='white')}>
              <div>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color: permisos[s.key] ? '#1e3a5f' : '#94a3b8', margin:'0 0 0.1rem', transition:'color 0.2s' }}>{s.label}</p>
                <p style={{ fontSize:'0.73rem', color:'#94a3b8', margin:0 }}>{s.desc}</p>
              </div>
              {/* Toggle */}
              <button onClick={() => togglePermiso(s.key)}
                style={{ width:'44px', height:'24px', borderRadius:'9999px', border:'none', cursor:'pointer', position:'relative', flexShrink:0, background: permisos[s.key] ? '#1e3a5f' : '#e2e8f0', transition:'background 0.22s', padding:0 }}>
                <div style={{ position:'absolute', top:'3px', left: permisos[s.key] ? '23px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.22s cubic-bezier(0.4,0,0.2,1)' }}/>
              </button>
            </div>
          ))}

          {/* Servicios Escolares — siempre bloqueado */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.9rem 1.5rem', background:'#fafbfc', borderTop:'1px solid #f1f5f9' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.1rem' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#cbd5e1', margin:0 }}>Servicios Escolares</p>
                <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', padding:'0.1rem 0.45rem', borderRadius:'9999px', background:'#f1f5f9', border:'1px solid #e2e8f0' }}>Bloqueado</span>
              </div>
              <p style={{ fontSize:'0.73rem', color:'#cbd5e1', margin:0 }}>Carga y administración de alumnos — exclusivo de la dirección</p>
            </div>
            {/* Toggle deshabilitado */}
            <div style={{ width:'44px', height:'24px', borderRadius:'9999px', background:'#e2e8f0', position:'relative', flexShrink:0, opacity:0.45, pointerEvents:'none' }}>
              <div style={{ position:'absolute', top:'3px', left:'3px', width:'18px', height:'18px', borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }}/>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}