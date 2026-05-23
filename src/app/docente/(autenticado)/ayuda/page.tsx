'use client'

import React, { useState, useEffect } from 'react'

const DOTS_DECO = ['#ef4444', '#f59e0b', '#22c55e']

const FAQS = [
  {
    id: 1,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    color: '#2563eb', bg: '#eff6ff',
    q: '¿Cómo registro la asistencia?',
    a: 'Ve a la sección de Asistencia en el menú principal, selecciona tu grupo, luego elige la asignatura y finalmente presiona el botón "Tomar asistencia ahora".',
    extra: null,
  },
  {
    id: 2,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    color: '#d97706', bg: '#fffbeb',
    q: '¿Puedo editar una asistencia ya registrada?',
    a: 'Sí. En la pantalla de confirmación de tu grupo aparecerá el botón "Editar" siempre y cuando la asistencia se haya registrado en el día en curso.',
    extra: null,
  },
  {
    id: 3,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    color: '#7c3aed', bg: '#f5f3ff',
    q: '¿Qué significan P, A, J y R?',
    a: 'El sistema maneja la siguiente nomenclatura oficial para el pase de lista:',
    extra: 'estados',
  },
  {
    id: 4,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#16a34a', bg: '#f0fdf4',
    q: '¿Cómo contacto al administrador?',
    a: 'Si presentas un error de sistema o necesitas recuperar tu acceso, el soporte técnico está disponible para ayudarte. Revisa el botón de "Contactar a Sistemas" en esta misma página.',
    extra: 'dots',
  },
  {
    id: 5,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    color: '#0d9488', bg: '#f0fdfa',
    q: '¿Cuándo estará disponible Calificaciones?',
    a: 'Estamos trabajando en el módulo de gestión de notas. Estará habilitado en la próxima actualización importante del sistema.',
    extra: null,
  },
  {
    id: 6,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#db2777', bg: '#fdf2f8',
    q: '¿Qué otros módulos tendrá la plataforma?',
    a: 'Próximamente integraremos: Reportes avanzados de desempeño, Mensajería interna docente-alumno y un gestor de Planeaciones didácticas.',
    extra: 'dots',
  },
]

const ESTADOS = [
  { letra: 'P', label: 'Presente',    bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  { letra: 'A', label: 'Ausente',     bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  { letra: 'J', label: 'Justificada', bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  { letra: 'R', label: 'Retardo',     bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
]

export default function AyudaPage() {
  const [openId, setOpenId] = useState<number | null>(1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleFaq = (id: number) => setOpenId(openId === id ? null : id)

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isModalOpen])

  return (
    <>
      <style>{`
        .ayuda-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1.5rem 1rem 2rem;
          min-height: calc(100vh - 64px);
          background: #f8fafc;
        }
        @media (min-width: 1024px) {
          .ayuda-layout {
            flex-direction: row;
            align-items: stretch;
            gap: 3rem;
            padding: 2rem 2.5rem;
            /* altura exacta del viewport menos el header */
            height: calc(100vh - 64px);
            overflow: hidden;
          }
          .ayuda-left {
            width: 340px;
            flex-shrink: 0;
            /* sticky nativo — se queda fija mientras el lado derecho scrollea */
            position: sticky;
            top: 0;
            align-self: flex-start;
            height: 100%;
          }
          .ayuda-right {
            flex: 1;
            overflow-y: auto;
            padding-right: 0.25rem;
            /* scrollbar discreta */
            scrollbar-width: thin;
            scrollbar-color: #e2e8f0 transparent;
          }
          .ayuda-right::-webkit-scrollbar { width: 5px; }
          .ayuda-right::-webkit-scrollbar-track { background: transparent; }
          .ayuda-right::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
        }
      `}</style>

      <div className="ayuda-layout">

        {/* ── Columna izquierda — estática ── */}
        <div className="ayuda-left">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#2563eb', background: 'rgba(219,234,254,0.7)', borderRadius: 9999, border: '1px solid #bfdbfe', textTransform: 'uppercase' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
                Soporte EduControl
              </div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, color: '#1e293b', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 1rem' }}>
                ¿En qué podemos<br/>
                <span style={{ backgroundImage: 'linear-gradient(135deg, #2563eb, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ayudarte hoy?
                </span>
              </h1>
              <p style={{ fontSize: '0.975rem', color: '#64748b', lineHeight: 1.65, margin: 0 }}>
                Encuentra respuestas rápidas a las dudas más comunes sobre el uso de la plataforma.
              </p>
            </div>

            {/* Tarjeta contacto */}
            <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>¿No encuentras lo que buscas?</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.55 }}>
                Nuestro equipo de soporte técnico está disponible para atender casos específicos.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ width: '100%', padding: '0.875rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.875rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0f172a')}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Contactar a Sistemas
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha — scrollable ── */}
        <div className="ayuda-right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2rem' }}>
            {FAQS.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div
                  key={faq.id}
                  style={{
                    background: 'white',
                    border: `1px solid ${isOpen ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '1.25rem',
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 4px 20px rgba(37,99,235,0.08), 0 0 0 4px rgba(219,234,254,0.4)' : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 1.375rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{
                        flexShrink: 0, width: 44, height: 44, borderRadius: '0.875rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: faq.bg, color: faq.color,
                        transform: isOpen ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 0.2s cubic-bezier(0.34,1.4,0.64,1)',
                      }}>
                        {faq.icon}
                      </div>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: isOpen ? '#1d4ed8' : '#334155', transition: 'color 0.15s' }}>
                        {faq.q}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: '1rem', color: isOpen ? '#2563eb' : '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease, color 0.15s' }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Contenido desplegable */}
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                    transition: 'grid-template-rows 0.28s ease, opacity 0.22s ease',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 1.375rem 1.375rem', paddingLeft: 'calc(1.375rem + 44px + 0.875rem)' }}>
                        {faq.a && (
                          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, margin: '0 0 0.75rem' }}>
                            {faq.a}
                          </p>
                        )}
                        {faq.extra === 'estados' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem', marginTop: '0.5rem' }}>
                            {ESTADOS.map(e => (
                              <div key={e.letra} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.75rem', border: `1px solid ${e.border}`, background: e.bg }}>
                                <span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: 'white', color: e.color, fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                  {e.letra}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: e.color }}>{e.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {faq.extra === 'dots' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {DOTS_DECO.map((col, i) => (
                              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: col, opacity: 0.6, animation: `pulse 1.5s ${i * 150}ms infinite` }}/>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal contacto */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        opacity: isModalOpen ? 1 : 0,
        visibility: isModalOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.25s, visibility 0.25s',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setIsModalOpen(false)} />

        <div style={{
          position: 'relative', width: '100%', maxWidth: 380,
          background: 'white', borderRadius: '2rem', padding: '2rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          transform: isModalOpen ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.92)',
          opacity: isModalOpen ? 1 : 0,
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{ position: 'absolute', top: '1.125rem', right: '1.125rem', width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: 60, height: 60, background: '#eff6ff', borderRadius: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#2563eb' }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.375rem' }}>Soporte Técnico</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.55 }}>Comunícate con nosotros para resolver cualquier inconveniente con EduControl.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>, label: 'Teléfono', value: '+52 (55) 1234 5678', dotBg: '#dcfce7', dotColor: '#16a34a' },
              { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></>, label: 'Correo', value: 'soporte@educontrol.com', dotBg: '#e0e7ff', dotColor: '#4f46e5' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: item.dotBg, color: item.dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{item.icon}</svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>{item.label}</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '1.25rem', fontWeight: 500 }}>
            Horario de atención: Lunes a Viernes, 8am – 4pm
          </p>
        </div>
      </div>
    </>
  )
}