import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex"
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #dce8f5 0%, #e8f0fb 50%, #d6e4f0 100%)',
      }}
    >
      {/* Sidebar fijo */}
      <div className="shrink-0" style={{ height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
      </div>

      {/* Contenido — ocupa toda la altura, sin scroll externo */}
      <main style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}