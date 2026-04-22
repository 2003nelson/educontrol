// src/app/docente/layout.tsx
'use client'
import HeaderDocente from '@/components/docente/HeaderDocente'
import { DocenteProvider, useDocente } from '@/contexts/DocenteContext'

function DocenteLayoutContent({ children }: { children: React.ReactNode }) {
  const { docente, loading } = useDocente()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <HeaderDocente nombre={docente?.nombre_completo || 'Docente'} />
      <main className="w-full">
        {children}
      </main>
    </div>
  )
}

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DocenteProvider>
      <DocenteLayoutContent>{children}</DocenteLayoutContent>
    </DocenteProvider>
  )
}