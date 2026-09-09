'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex-1 flex flex-col min-w-0 min-h-0 transition-[padding-left] duration-200 `}
    >
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto pt-6 pb-8 px-4 lg:pt-8 lg:px-8">
        <div className="max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--background)]">
          <Sidebar />
          <AdminContent>{children}</AdminContent>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
