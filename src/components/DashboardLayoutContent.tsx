// src/components/DashboardLayoutContent.tsx
'use client'
import { usePlantel } from '@/contexts/PlantelContext'
import Sidebar from '@/components/Sidebar'
import LoadingDots from '@/components/LoadingDots'

export default function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, error } = usePlantel()

  if (loading) {
    return <LoadingDots mensaje="Cargando EduControl" submensaje="Verificando sesión..." />
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f172a',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem',
          maxWidth: 360,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.875rem', color: '#f87171', margin: '0 0 1rem' }}>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}