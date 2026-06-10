'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Heart,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Leaves',
      href: '/leaves',
      icon: Calendar,
    },
    {
      name: 'Salary',
      href: '/salary',
      icon: FileText,
    },
    {
      name: 'Claims',
      href: '/medical-insurance',
      icon: Heart,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--card-bg)] border-t border-[var(--gray-100)] flex items-center justify-around px-2 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors duration-200">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-bold transition-all duration-200 ${
              isActive ? 'text-[var(--primary)] scale-105' : 'text-[var(--gray-400)] hover:text-[var(--foreground)]'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
