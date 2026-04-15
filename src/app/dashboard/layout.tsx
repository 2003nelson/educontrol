// src/app/dashboard/layout.tsx
'use client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, metadata } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && metadata) {
      // Redirigir según rol
      if (metadata.rol === 'super_admin') {
        router.push('/super-admin')
      } else if (metadata.rol === 'docente') {
        router.push('/docente')
      }
      // Si es director, se queda en dashboard
    }
  }, [loading, metadata, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}