// src/app/docente/(autenticado)/calificaciones/page.tsx
'use client'

export default function CalificacionesPage() {
  return (
    <div className="page-slide-right p-4 md:p-8 max-w-4xl mx-auto">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>Calificaciones</h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Registro de calificaciones por grupo y asignatura</p>
      </div>

      {/* Placeholder */}
      <div style={{
        background: 'white', borderRadius: '1rem', border: '1px solid #f0f0f5',
        padding: '4rem 2rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '1rem', background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="#c0c0d0" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', margin: 0 }}>Módulo de calificaciones</p>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: 320 }}>
          Esta sección estará disponible próximamente. Aquí podrás registrar y consultar calificaciones por parcial.
        </p>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.875rem', borderRadius: 9999, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          Próximamente
        </span>
      </div>
    </div>
  )
}