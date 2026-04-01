'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  BriefcaseIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  CalendarIcon as CalendarIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  HeartIcon as HeartIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  BanknotesIcon as BanknotesIconSolid,
} from '@heroicons/react/24/solid';

const navigation: any[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid, roles: ['hr_manager', 'hr_executive', 'finance_manager', 'finance_executive', 'payment_approver', 'employee', 'consultant', 'service_provider'] },
  {
    name: 'Voucher',
    href: '/vouchers',
    icon: BanknotesIcon,
    iconSolid: BanknotesIconSolid,
    roles: ['finance_manager', 'finance_executive', 'payment_approver'],
    children: [
      { name: 'Approved Vouchers', href: '/vouchers?status=approved' },
      { name: 'Reject Vouchers', href: '/vouchers?status=rejected' },
      { name: 'Information Request', href: '/vouchers?status=information_request' },
      { name: 'Payment Upload', href: '/vouchers?status=bank_upload' },
      { name: 'Paid Voucher', href: '/vouchers?status=paid' },
    ],
  },
  { name: 'Work Submissions', href: '/work-submissions', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid, roles: ['consultant'] },
  { name: 'Leaves', href: '/leaves', icon: CalendarIcon, iconSolid: CalendarIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Medical Insurance', href: '/medical-insurance', icon: HeartIcon, iconSolid: HeartIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Salary', href: '/salary', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Facilities', href: '/facilities', icon: BuildingOfficeIcon, iconSolid: BuildingOfficeIconSolid, roles: ['hr_manager', 'hr_executive', 'employee'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, roles: ['hr_manager', 'hr_executive'] },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: UsersIcon, iconSolid: UsersIconSolid, roles: ['hr_manager', 'hr_executive', 'finance_manager', 'finance_executive'] },
  { name: 'Leave Calendar', href: '/admin/leave-calendar', icon: CalendarIcon, iconSolid: CalendarIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Consultant Submissions', href: '/admin/consultant-submissions', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Medical Insurance', href: '/admin/medical-insurance', icon: HeartIcon, iconSolid: HeartIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Facility Management', href: '/admin/facilities', icon: WrenchScrewdriverIcon, iconSolid: WrenchScrewdriverIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Booking Calendar', href: '/admin/facilities/calendar', icon: CalendarIcon, iconSolid: CalendarIconSolid, roles: ['hr_manager', 'hr_executive'] },
  { name: 'Bulk Upload', href: '/admin/upload', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, roles: ['hr_manager'] },
];

/* Accent for active nav (works on dark sidebar) */
const SIDEBAR_ACTIVE = '#0154fc';

function NavItems({
  filteredNavItems,
  pathname,
  collapsed,
}: {
  filteredNavItems: any[];
  pathname: string;
  collapsed: boolean;
}) {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status');

  return (
    <>
      {filteredNavItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isParentActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
        const Icon = isParentActive ? item.iconSolid : item.icon;

        return (
          <div key={item.href} className="space-y-0.5">
            <Link
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`
                group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200 ease-out
                ${collapsed ? 'justify-center' : 'gap-3'}
                ${isParentActive
                  ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-text-active)]'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                }
              `}
            >
              {isParentActive && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[var(--sidebar-active)]"
                  style={{ backgroundColor: SIDEBAR_ACTIVE }}
                />
              )}
              <Icon className="h-5 w-5 shrink-0 transition-transform duration-200" style={{ color: isParentActive ? SIDEBAR_ACTIVE : undefined }} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {hasChildren && (
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isParentActive ? 'rotate-180' : ''}`} />
                  )}
                </>
              )}
            </Link>

            {!collapsed && hasChildren && isParentActive && (
              <div className="ml-4 pl-5 space-y-0.5 mt-1">
                {item.children.map((child: any) => {
                  const childUrl = new URL(child.href, 'http://localhost');
                  const childStatus = childUrl.searchParams.get('status');
                  const isChildActive = pathname === childUrl.pathname && currentStatus === childStatus;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`
                        block rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200
                        ${isChildActive
                          ? 'text-[var(--sidebar-active)]'
                          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                        }
                      `}
                      style={isChildActive ? { color: SIDEBAR_ACTIVE } : undefined}
                    >
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isHR, isFinance } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const showAdminNav = isHR || isFinance;
  const allNavItems = [...navigation, ...(showAdminNav ? adminNavigation : [])];
  const filteredNavItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const sidebarContent = (
    <>
      <div className={`flex h-16 lg:h-[72px] items-center justify-between transition-[padding] duration-200 ${collapsed ? 'px-2' : 'px-4'}`}>
        <Link href="/" className={`flex items-center min-w-0 flex-1 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {collapsed ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ml-5 text-white font-bold text-sm bg-[var(--sidebar-active)]">
              OXO
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="OXO"
              width={140}
              height={40}
              className="object-contain"
              style={{ maxHeight: '55px' }}
            />
          )}
        </Link>
        <div className="flex items-center gap-1 shrink-0 relative left-8 bg-[#0154fc0f] rounded-full p-1">
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)] transition-colors duration-200"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto py-5 transition-[padding] duration-200 ${collapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1">
          <Suspense fallback={<div className="h-10 rounded-xl bg-slate-600/30 animate-pulse" />}>
            <NavItems filteredNavItems={filteredNavItems} pathname={pathname} collapsed={collapsed} />
          </Suspense>
        </div>
      </nav>
    </>
  );

  const widthClass = collapsed ? 'w-20' : 'w-64';
  const commonSidebar = `fixed left-0 top-0 z-40 h-screen flex flex-col bg-[var(--sidebar-bg)]  shadow-[var(--shadow)] transition-[width] duration-200 ease-out ${widthClass}`;

  return (
    <>
      <aside className={`${commonSidebar} hidden lg:flex`}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar - always expanded, same dark theme */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-[var(--sidebar-bg)] border-r border-slate-600/50 shadow-[var(--shadow)] w-64 lg:hidden transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-600/50 px-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image src="/logo.png" alt="OXO" width={140} height={40} className="object-contain" style={{ maxHeight: '55px' }} />
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            <Suspense fallback={<div className="h-10 rounded-xl bg-slate-600/30 animate-pulse" />}>
              <NavItems filteredNavItems={filteredNavItems} pathname={pathname} collapsed={false} />
            </Suspense>
          </div>
        </nav>
      </aside>

      {/* Mobile menu button - shown when sidebar is closed on small screens */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-20 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[var(--gray-200)] shadow-sm text-[var(--gray-700)]"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
    </>
  );
}
