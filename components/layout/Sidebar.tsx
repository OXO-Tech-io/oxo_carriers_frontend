'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserCircleIcon,
  FolderIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  CalendarIcon as CalendarIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  FolderIcon as FolderIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  // { name: 'Profile', href: '/profile', icon: UserCircleIcon, iconSolid: UserCircleIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Leaves', href: '/leaves', icon: CalendarIcon, iconSolid: CalendarIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Salary', href: '/salary', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, roles: ['hr_manager', 'hr_executive'] },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: UsersIcon, iconSolid: UsersIconSolid, roles: ['hr_manager', 'hr_executive'] },
  // { name: 'Leave Management', href: '/admin/leaves', icon: CalendarIcon, iconSolid: CalendarIconSolid, roles: ['hr_manager', 'hr_executive'] },
  // { name: 'Salary Management', href: '/admin/salary', icon: FolderIcon, iconSolid: FolderIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Bulk Upload', href: '/admin/upload', icon: ArrowUpTrayIcon, iconSolid: ArrowUpTrayIconSolid, roles: ['hr_manager'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isHR } = useAuth();

  if (!user) return null;

  const allNavItems = [...navigation, ...(isHR ? adminNavigation : [])];
  const filteredNavItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#ffffff] text-white shadow-xl">
      {/* Logo Section */}
      <div className="flex h-20 items-center border-b border-slate-700/50 px-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="OXO International Logo"
              width={180}
              height={50}
              style={{ height: 'auto', width: 'auto', maxHeight: '60px' }}
              className="object-contain"
            />
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group relative flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium
                  transition-all duration-200 ease-in-out
                  ${isActive
                    ? 'bg-[#465FFF] text-white shadow-sm'
                    : 'text-[#344054] hover:bg-[#F9FAFB] hover:text-[#465FFF]'
                  }
                `}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="absolute right-2 h-2 w-2 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      {/* <div className="border-t border-[#E4E7EC] p-4 justify-end items-end">  
        <div className="flex items-center space-x-3 rounded-lg bg-slate-800/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#465FFF] text-sm font-semibold text-white shadow-sm">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-slate-400 capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
