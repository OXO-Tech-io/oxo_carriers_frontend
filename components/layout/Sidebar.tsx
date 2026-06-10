"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { Suspense, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Image from "next/image";
import {
  LayoutDashboard,
  Receipt,
  Briefcase,
  Calendar,
  Heart,
  FileText,
  Building,
  BarChart3,
  Users,
  ShieldCheck,
  CalendarDays,
  Wrench,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

type AccessLevel = "read" | "write";

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  children?: { name: string; href: string }[];
  permissionKeys?: string[];
  requiredLevel?: AccessLevel;
  superAdminOnly?: boolean;
};

const navigation: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permissionKeys: ["dashboard"],
    requiredLevel: "read",
  },
  {
    name: "Voucher",
    href: "/vouchers",
    icon: Receipt,
    permissionKeys: [
      "vouchers.view",
      "vouchers.create",
      "vouchers.review",
      "vouchers.resubmit",
      "vouchers.bank_upload",
      "vouchers.mark_paid",
    ],
    requiredLevel: "read",
    children: [
      { name: "Approved Vouchers", href: "/vouchers?status=approved" },
      { name: "Reject Vouchers", href: "/vouchers?status=rejected" },
      {
        name: "Information Request",
        href: "/vouchers?status=information_request",
      },
      { name: "Payment Upload", href: "/vouchers?status=bank_upload" },
      { name: "Paid Voucher", href: "/vouchers?status=paid" },
    ],
  },
  {
    name: "Work Submissions",
    href: "/work-submissions",
    icon: Briefcase,
    permissionKeys: ["consultant_submissions"],
    requiredLevel: "read",
  },
  {
    name: "Leaves",
    href: "/leaves",
    icon: Calendar,
    permissionKeys: ["leaves"],
    requiredLevel: "read",
  },
  {
    name: "Medical Insurance",
    href: "/medical-insurance",
    icon: Heart,
    permissionKeys: ["medical_claims"],
    requiredLevel: "read",
  },
  {
    name: "Salary",
    href: "/salary",
    icon: FileText,
    permissionKeys: ["salaries"],
    requiredLevel: "read",
  },
  {
    name: "Facilities",
    href: "/facilities",
    icon: Building,
    permissionKeys: ["facilities"],
    requiredLevel: "read",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    permissionKeys: ["reports"],
    requiredLevel: "read",
  },
];

const adminNavigation: MenuItem[] = [
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    permissionKeys: ["users"],
    requiredLevel: "read",
  },
  {
    name: "Permissions",
    href: "/admin/permissions",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
  {
    name: "Leave Calendar",
    href: "/admin/leave-calendar",
    icon: CalendarDays,
    permissionKeys: ["leaves"],
    requiredLevel: "write",
  },
  {
    name: "Consultant Submissions",
    href: "/admin/consultant-submissions",
    icon: Briefcase,
    permissionKeys: ["consultant_submissions"],
    requiredLevel: "write",
  },
  {
    name: "Medical Insurance",
    href: "/admin/medical-insurance",
    icon: Heart,
    permissionKeys: ["medical_claims"],
    requiredLevel: "write",
  },
  {
    name: "Facility Management",
    href: "/admin/facilities",
    icon: Wrench,
    permissionKeys: ["facilities"],
    requiredLevel: "write",
  },
  {
    name: "Booking Calendar",
    href: "/admin/facilities/calendar",
    icon: Calendar,
    permissionKeys: ["facilities"],
    requiredLevel: "read",
  },
  {
    name: "Bulk Upload",
    href: "/admin/upload",
    icon: Upload,
    permissionKeys: ["users"],
    requiredLevel: "write",
  },
];

function NavItems({
  filteredNavItems,
  pathname,
  collapsed,
}: Readonly<{
  filteredNavItems: any[];
  pathname: string;
  collapsed: boolean;
}>) {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  return (
    <>
      {filteredNavItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isParentActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/");
        const Icon = item.icon;

        return (
          <div key={item.href} className="space-y-0.5">
            <Link
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`
                group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold
                transition-all duration-200 ease-out
                ${collapsed ? "justify-center" : "gap-3"}
                ${
                  isParentActive
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)]"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
                }
              `}
            >
              {/* Active indicator bar */}
              {isParentActive && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full"
                  style={{ backgroundColor: "var(--sidebar-indicator)" }}
                />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isParentActive ? "text-[var(--sidebar-indicator)]" : "text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-text-active)]"
                }`}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {hasChildren && (
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--gray-400)] transition-transform duration-200 ${
                        isParentActive ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </>
              )}
            </Link>

            {!collapsed && hasChildren && isParentActive && (
              <div className="ml-4 pl-5 space-y-0.5 mt-1 border-l border-[var(--sidebar-border)]">
                {item.children.map((child: any) => {
                  const childUrl = new URL(child.href, "http://localhost");
                  const childStatus = childUrl.searchParams.get("status");
                  const isChildActive =
                    pathname === childUrl.pathname &&
                    currentStatus === childStatus;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`
                        block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200
                        ${
                          isChildActive
                            ? "text-[var(--sidebar-indicator)]"
                            : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
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
  const { user, isSuperAdmin } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [permissionLevels, setPermissionLevels] = useState<
    Record<string, AccessLevel>
  >({});
  const [permissionLoaded, setPermissionLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setPermissionLevels({});
      setPermissionLoaded(true);
      return;
    }

    const loadPermissions = async () => {
      try {
        setPermissionLoaded(false);
        const res = await api.get("/permissions/me");
        if (
          res.data?.permissionLevels &&
          typeof res.data.permissionLevels === "object"
        ) {
          setPermissionLevels(
            res.data.permissionLevels as Record<string, AccessLevel>,
          );
        } else {
          setPermissionLevels({});
        }
      } catch {
        setPermissionLevels({});
      } finally {
        setPermissionLoaded(true);
      }
    };

    loadPermissions();
  }, [user?.id]);

  const canAccessPermission = (
    key: string,
    requiredLevel: AccessLevel = "read",
  ) => {
    const level = permissionLevels[key];
    if (!level) return false;
    if (level === "write") return true;
    return requiredLevel === "read" && level === "read";
  };

  const canSeeItem = (item: MenuItem) => {
    if (isSuperAdmin) return true;
    if (item.superAdminOnly) return false;
    if (!item.permissionKeys || item.permissionKeys.length === 0) return false;
    return item.permissionKeys.some((key) =>
      canAccessPermission(key, item.requiredLevel || "read"),
    );
  };

  const filteredNavItems = useMemo(() => {
    if (!permissionLoaded && !isSuperAdmin) {
      return [] as MenuItem[];
    }

    return [...navigation, ...adminNavigation].filter(canSeeItem);
  }, [permissionLoaded, isSuperAdmin, permissionLevels]);

  if (!user) return null;

  const showAdminNav = filteredNavItems.some((item) =>
    adminNavigation.some((a) => a.href === item.href),
  );

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div
        className={`flex h-16 lg:h-[72px] items-center justify-between transition-[padding] duration-200 ${
          collapsed ? "px-2" : "px-4"
        } border-b border-[var(--sidebar-border)]`}
      >
        <Link
          href="/"
          className={`flex items-center min-w-0 flex-1 ${collapsed ? "justify-center" : "gap-3"}`}
        >
          {collapsed ? (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs shadow-md"
              style={{ background: "var(--primary)" }}
            >
              OXO
            </div>
          ) : (
            <div className="relative h-10 w-32 shrink-0">
              <Image
                src="/logo.png"
                alt="OXO"
                fill
                sizes="(max-width: 768px) 100vw, 128px"
                className="object-contain dark:brightness-110"
                priority
              />
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-xl text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)] transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav
        className={`flex-1 overflow-y-auto py-5 transition-[padding] duration-200 ${
          collapsed ? "px-2" : "px-3"
        } scrollbar-thin`}
      >
        {/* Main */}
        <div className="space-y-1">
          <Suspense
            fallback={
              <div
                className="h-10 rounded-xl animate-pulse bg-[var(--sidebar-hover)]"
              />
            }
          >
            <NavItems
              filteredNavItems={filteredNavItems.filter(
                (item) => !adminNavigation.some((a) => a.href === item.href),
              )}
              pathname={pathname}
              collapsed={collapsed}
            />
          </Suspense>
        </div>

        {/* Admin section */}
        {showAdminNav &&
          filteredNavItems.some((item) =>
            adminNavigation.some((a) => a.href === item.href),
          ) && (
            <div className="mt-6">
              {!collapsed && (
                <p
                  className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--gray-400)]"
                >
                  Administration
                </p>
              )}
              {collapsed && (
                <div
                  className="mx-auto mb-3 h-px w-8 bg-[var(--sidebar-border)]"
                />
              )}
              <div className="space-y-1">
                <Suspense
                  fallback={
                    <div
                      className="h-10 rounded-xl animate-pulse bg-[var(--sidebar-hover)]"
                    />
                  }
                >
                  <NavItems
                    filteredNavItems={filteredNavItems.filter((item) =>
                      adminNavigation.some((a) => a.href === item.href),
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
          className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 border border-[var(--sidebar-border)] bg-[var(--background)]"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
            style={{ background: "var(--primary)" }}
          >
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[var(--sidebar-text-active)]">
              {user.first_name} {user.last_name}
            </p>
            <p
              className="truncate text-[10px] capitalize font-medium text-[var(--gray-400)]"
            >
              {user.role.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      )}
    </>
  );

  const widthClass = collapsed ? "w-20" : "w-64";
  const baseSidebar = `fixed left-0 top-0 z-40 h-screen flex flex-col transition-[width] duration-200 ease-out border-r border-[var(--sidebar-border)] ${widthClass}`;
  const sidebarStyle = { background: "var(--sidebar-bg)" };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`${baseSidebar} hidden lg:flex relative`}
        style={sidebarStyle}
      >
        {sidebarContent}

        {/* Middle collapse toggle (desktop) */}
        <button
          type="button"
          onClick={toggle}
          className="group absolute top-1/2 -right-3.5 -translate-y-1/2 h-7 w-7 rounded-full border border-[var(--sidebar-border)] bg-[var(--card-bg)] shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 z-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-[var(--sidebar-indicator)]">
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen flex flex-col w-64 lg:hidden transform transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={sidebarStyle}
      >
        <div
          className="flex h-16 items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="relative h-9 w-28 shrink-0">
              <Image
                src="/logo.png"
                alt="OXO"
                fill
                sizes="112px"
                className="object-contain dark:brightness-110"
                priority
              />
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)] transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
          <div className="space-y-1">
            <Suspense
              fallback={
                <div
                  className="h-10 rounded-xl animate-pulse bg-[var(--sidebar-hover)]"
                />
              }
            >
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
        className="fixed left-4 top-3 z-30 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--sidebar-border)] shadow-sm text-[var(--sidebar-text)] cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors duration-200"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}
