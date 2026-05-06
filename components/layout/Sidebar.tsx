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
  ShieldCheckIcon,
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
  ShieldCheckIcon as ShieldCheckIconSolid,
} from '@heroicons/react/24/solid';

const ALL_ROLES = [
  'super_admin',
  'hr_manager',
  'hr_executive',
  'finance_manager',
  'finance_executive',
  'payment_approver',
  'employee',
  'consultant',
  'service_provider',
];

const navigation: any[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    roles: ALL_ROLES,
  },
  {
    name: 'Voucher',
    href: '/vouchers',
    icon: BanknotesIcon,
    iconSolid: BanknotesIconSolid,
    roles: ['super_admin', 'finance_manager', 'finance_executive', 'payment_approver'],
    children: [
      { name: 'Approved Vouchers',   href: '/vouchers?status=approved' },
      { name: 'Reject Vouchers',     href: '/vouchers?status=rejected' },
      { name: 'Information Request', href: '/vouchers?status=information_request' },
      { name: 'Payment Upload',      href: '/vouchers?status=bank_upload' },
      { name: 'Paid Voucher',        href: '/vouchers?status=paid' },
    ],
  },
  {
    name: 'Work Submissions',
    href: '/work-submissions',
    icon: BriefcaseIcon,
    iconSolid: BriefcaseIconSolid,
    roles: ['consultant'],
  },
  {
    name: 'Leaves',
    href: '/leaves',
    icon: CalendarIcon,
    iconSolid: CalendarIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive', 'employee'],
  },
  {
    name: 'Medical Insurance',
    href: '/medical-insurance',
    icon: HeartIcon,
    iconSolid: HeartIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive', 'employee'],
  },
  {
    name: 'Salary',
    href: '/salary',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive', 'employee'],
  },
  {
    name: 'Facilities',
    href: '/facilities',
    icon: BuildingOfficeIcon,
    iconSolid: BuildingOfficeIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive', 'employee'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
];

const adminNavigation = [
  {
    name: 'Users',
    href: '/admin/users',
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive', 'finance_manager', 'finance_executive'],
  },
  {
    name: 'Permissions',
    href: '/admin/permissions',
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
    roles: ['super_admin'],
  },
  {
    name: 'Leave Calendar',
    href: '/admin/leave-calendar',
    icon: CalendarIcon,
    iconSolid: CalendarIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
  {
    name: 'Consultant Submissions',
    href: '/admin/consultant-submissions',
    icon: BriefcaseIcon,
    iconSolid: BriefcaseIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
  {
    name: 'Medical Insurance',
    href: '/admin/medical-insurance',
    icon: HeartIcon,
    iconSolid: HeartIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
  {
    name: 'Facility Management',
    href: '/admin/facilities',
    icon: WrenchScrewdriverIcon,
    iconSolid: WrenchScrewdriverIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
  {
    name: 'Booking Calendar',
    href: '/admin/facilities/calendar',
    icon: CalendarIcon,
    iconSolid: CalendarIconSolid,
    roles: ['super_admin', 'hr_manager', 'hr_executive'],
  },
  {
    name: 'Bulk Upload',
    href: '/admin/upload',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    roles: ['super_admin', 'hr_manager'],
  },
];

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
        const isParentActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== '/');
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
                ${
                  isParentActive
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)]'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                }
              `}
            >
              {/* Active indicator bar */}
              {isParentActive && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                  style={{ backgroundColor: 'var(--sidebar-indicator)' }}
                />
              )}
              <Icon
                className="h-5 w-5 shrink-0 transition-transform duration-200"
                style={{ color: isParentActive ? 'var(--sidebar-indicator)' : undefined }}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {hasChildren && (
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isParentActive ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </>
              )}
            </Link>

            {!collapsed && hasChildren && isParentActive && (
              <div className="ml-4 pl-5 space-y-0.5 mt-1 border-l border-[var(--sidebar-border)]">
                {item.children.map((child: any) => {
                  const childUrl = new URL(child.href, 'http://localhost');
                  const childStatus = childUrl.searchParams.get('status');
                  const isChildActive =
                    pathname === childUrl.pathname && currentStatus === childStatus;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`
                        block rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200
                        ${
                          isChildActive
                            ? 'text-[var(--sidebar-indicator)] font-semibold'
                            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                        }
                      `}
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
  const { user, isHR, isFinance, isSuperAdmin } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const showAdminNav = isSuperAdmin || isHR || isFinance;
  const allNavItems = [...navigation, ...(showAdminNav ? adminNavigation : [])];
  const filteredNavItems = allNavItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div
        className={`flex h-16 lg:h-[72px] items-center justify-between transition-[padding] duration-200 ${
          collapsed ? 'px-2' : 'px-4'
        } border-b border-[var(--sidebar-border)]`}
      >
        <Link
          href="/"
          className={`flex items-center min-w-0 flex-1 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          {collapsed ? (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
              style={{ background: 'var(--primary)' }}
            >
              OXO
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="OXO"
              width={140}
              height={40}
              className="object-contain"
              style={{ maxHeight: '44px' }}
            />
          )}
        </Link>

        {/* Collapse toggle (desktop) */}
        <div className="shrink-0 relative left-6">
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200"
            style={{ background: 'var(--sidebar-hover)', color: 'var(--sidebar-text)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav
        className={`flex-1 overflow-y-auto py-5 transition-[padding] duration-200 ${
          collapsed ? 'px-2' : 'px-3'
        }`}
      >
        {/* Main */}
        <div className="space-y-1">
          <Suspense
            fallback={
              <div className="h-10 rounded-xl animate-pulse"
                   style={{ background: 'var(--sidebar-hover)' }}
              />
            }
          >
            <NavItems
              filteredNavItems={filteredNavItems.filter(
                (item) => !adminNavigation.some((a) => a.href === item.href)
              )}
              pathname={pathname}
              collapsed={collapsed}
            />
          </Suspense>
        </div>

        {/* Admin section */}
        {showAdminNav && filteredNavItems.some((item) =>
          adminNavigation.some((a) => a.href === item.href)
        ) && (
          <div className="mt-6">
            {!collapsed && (
              <p
                className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'rgba(165,180,252,0.5)' }}
              >
                Administration
              </p>
            )}
            {collapsed && (
              <div
                className="mx-auto mb-3 h-px w-8"
                style={{ background: 'var(--sidebar-border)' }}
              />
            )}
            <div className="space-y-1">
              <Suspense
                fallback={
                  <div className="h-10 rounded-xl animate-pulse"
                       style={{ background: 'var(--sidebar-hover)' }}
                  />
                }
              >
                <NavItems
                  filteredNavItems={filteredNavItems.filter((item) =>
                    adminNavigation.some((a) => a.href === item.href)
                  )}
                  pathname={pathname}
                  collapsed={collapsed}
                />
              </Suspense>
            </div>
          </div>
        )}
      </nav>

      {/* User chip at bottom */}
      {!collapsed && (
        <div
          className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-3"
          style={{ background: 'var(--sidebar-hover)' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--sidebar-text-active)]">
              {user.first_name} {user.last_name}
            </p>
            <p
              className="truncate text-[10px] capitalize"
              style={{ color: 'var(--sidebar-text)' }}
            >
              {user.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}
    </>
  );

  const widthClass = collapsed ? 'w-20' : 'w-64';
  const baseSidebar = `fixed left-0 top-0 z-40 h-screen flex flex-col transition-[width] duration-200 ease-out ${widthClass}`;
  const sidebarStyle = { background: 'var(--sidebar-bg)' };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`${baseSidebar} hidden lg:flex`} style={sidebarStyle}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen flex flex-col w-64 lg:hidden transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={sidebarStyle}
      >
        <div
          className="flex h-16 items-center justify-between px-4"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo.png"
              alt="OXO"
              width={120}
              height={36}
              className="object-contain"
              style={{ maxHeight: '40px' }}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            <Suspense fallback={<div className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--sidebar-hover)' }} />}>
              <NavItems
                filteredNavItems={filteredNavItems}
                pathname={pathname}
                collapsed={false}
              />
            </Suspense>
          </div>
        </nav>
      </aside>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-20 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[var(--sidebar-border)] shadow-sm text-[var(--sidebar-text)]"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
    </>
  );
}
