'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FCFCFD]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:pl-72">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
