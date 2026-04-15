import SidebarDocente from '@/components/SidebarDocente'

export default function DocenteLayout({
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
      <div className="shrink-0 h-screen overflow-hidden">
        <SidebarDocente />
      </div>
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}