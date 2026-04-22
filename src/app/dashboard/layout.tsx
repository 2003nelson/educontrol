import Sidebar from '@/components/Sidebar'
import { PlantelProvider } from '@/contexts/PlantelContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlantelProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </PlantelProvider>
  )
}