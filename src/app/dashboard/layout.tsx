import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #dce8f5 0%, #e8f0fb 50%, #d6e4f0 100%)',
      }}
    >
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-transition">
          {children}
        </div>
      </main>
    </div>
  )
}