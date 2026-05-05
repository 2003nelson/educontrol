// src/app/docente/(autenticado)/layout.tsx
'use client'
import HeaderDocente from '@/components/docente/HeaderDocente'
import { DocenteProvider, useDocente } from '@/contexts/DocenteContext'
import LoadingDots from '@/components/LoadingDots'

function DocenteLayoutContent({ children }: { children: React.ReactNode }) {
  const { docente, loading } = useDocente()

  if (loading) {
    return <LoadingDots />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f2f2f7' }}>
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-32px) } to { opacity: 1; transform: translateX(0) } }
        .page-slide-right { animation: slideInRight 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .page-slide-left  { animation: slideInLeft  0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
      <HeaderDocente nombre={docente?.nombre_completo || 'Docente'} />
      <main className="w-full flex-1">
        {children}
      </main>
      <footer style={{ background: '#f5f5f7', borderTop: '1px solid #d2d2d7' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p style={{ fontSize: '0.72rem', color: '#6e6e73', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Desarrollado por{' '}
            <span style={{ color: '#1d1d1f', fontWeight: 500 }}>Nelson Narciso Contreras Mendez</span>
            {' '}y{' '}
            <span style={{ color: '#1d1d1f', fontWeight: 500 }}>Mario Alexander De La Mora</span>
          </p>
          <p style={{ fontSize: '0.72rem', color: '#6e6e73', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            © {new Date().getFullYear()} EduControl · Dinoti Platforms
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocenteProvider>
      <DocenteLayoutContent>{children}</DocenteLayoutContent>
    </DocenteProvider>
  )
}