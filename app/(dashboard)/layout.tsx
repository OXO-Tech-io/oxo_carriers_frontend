'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={`flex-1 flex flex-col min-w-0 transition-[padding-left] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <Header />
      <main className="flex-1 overflow-y-auto pt-6 pb-8 px-4 lg:pt-8 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen bg-[var(--background)]">
          <Sidebar />
          <DashboardContent>{children}</DashboardContent>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
