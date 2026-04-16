import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduControl - Sistema de Administración Escolar',
  description: 'Plataforma de gestión escolar para CBTA 62',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}