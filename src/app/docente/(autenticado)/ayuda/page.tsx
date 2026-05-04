// src/app/docente/(autenticado)/ayuda/page.tsx
'use client'

const DOTS_DECO = ['#ef4444', '#f59e0b', '#22c55e']

const FAQS = [
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    border: '#bfdbfe', iconBg: '#dbeafe',
    q: '¿Cómo registro la asistencia?',
    a: 'Ve a Asistencia → selecciona tu grupo → elige la asignatura → toca "Tomar asistencia ahora".',
    extra: null,
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    border: '#fde68a', iconBg: '#fef3c7',
    q: '¿Puedo editar una asistencia ya registrada?',
    a: 'Sí. En la pantalla de confirmación aparece el botón "Editar" si ya registraste el día de hoy.',
    extra: null,
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    border: '#ddd6fe', iconBg: '#ede9fe',
    q: '¿Qué significan P, A, J y R?',
    a: 'Los estados de asistencia disponibles son:',
    extra: 'estados',
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    border: '#bbf7d0', iconBg: '#dcfce7',
    q: '¿Cómo contacto al administrador?',
    a: '',
    extra: 'dots',
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#0d9488" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    border: '#99f6e4', iconBg: '#ccfbf1',
    q: '¿Cuándo estará disponible Calificaciones?',
    a: '',
    extra: 'dots',
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="#db2777" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
    border: '#f9a8d4', iconBg: '#fce7f3',
    q: '¿Qué otros módulos tendrá EduControl?',
    a: '',
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
  return (
    <div className="page-slide-right p-4 md:p-8" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Centro de ayuda</h1>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.3rem' }}>Preguntas frecuentes y recursos de soporte</p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {FAQS.map((faq, i) => (
          <div key={i}
            style={{ background: 'white', borderRadius: '1rem', border: `1px solid ${faq.border}`, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}>

            {/* Header de card: ícono a la izquierda */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: faq.iconBg, border: `1px solid ${faq.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {faq.icon}
            </div>

            {/* Pregunta */}
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.4 }}>
              {faq.q}
            </p>

            {/* Texto o extra */}
            {faq.extra === null && faq.a && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.65 }}>{faq.a}</p>
            )}

            {faq.extra === 'estados' && (
              <>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.65 }}>{faq.a}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ESTADOS.map(e => (
                    <div key={e.letra} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: e.bg, border: `1px solid ${e.border}` }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: e.color }}>{e.letra}</span>
                      <span style={{ fontSize: '0.72rem', color: e.color, fontWeight: 500 }}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {faq.extra === 'dots' && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                {DOTS_DECO.map((c, di) => (
                  <div key={di} style={{ width: 18, height: 18, borderRadius: '50%', background: c, opacity: 0.45 }}/>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}