// src/app/dashboard/layout.tsx
import { PlantelProvider } from '@/contexts/PlantelContext'
import DashboardLayoutContent from '@/components/DashboardLayoutContent'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlantelProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </PlantelProvider>
  )
}