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
        background: '#f2f2f7',
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #f0f0f5',
          borderRadius: '1.25rem',
          padding: '2rem',
          maxWidth: 360,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', margin: '0 0 1rem' }}>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e6fcc', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#f7f7fb',
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}