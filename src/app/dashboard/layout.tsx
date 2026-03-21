import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #dce8f5 0%, #e8f0fb 50%, #d6e4f0 100%)',
      }}
    >
      {/* Sidebar fijo — nunca se desplaza */}
      <div className="shrink-0 h-screen overflow-hidden">
        <Sidebar />
      </div>

      {/* Área derecha con scroll interno */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="page-transition">
          {children}
        </div>
      </main>
    </div>
  )
}