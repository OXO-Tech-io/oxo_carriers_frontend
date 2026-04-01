'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader } from '@/components/ui/Card';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

/* Uses CSS var(--primary) - Marketrix-style accent */

interface DashboardStats {
  totalEmployees?: number;
  pendingLeaveRequests?: number;
  leaveRequestsThisMonth?: number;
  salariesPaidThisMonth?: number;
  totalSalaryPaid?: number;
}

export default function HomePage() {
  const { user, isHR } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        if (isHR) {
          const response = await api.get('/reports/dashboard');
          setStats(response.data.metrics || response.data.data?.metrics || {});
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [isHR, user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] tracking-tight">
          Welcome back, {user?.first_name}
        </h1>
        <p className="mt-1 text-[var(--gray-500)]">{currentDate}</p>
      </div>

      {/* Stats */}
      {isHR && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees ?? 0}
            icon={UserGroupIcon}
            accentColor="var(--primary)"
            trend="+2.5% vs last month"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaveRequests ?? 0}
            icon={ClockIcon}
            accentColor="#f59e0b"
            trend="Needs attention"
          />
          <StatCard
            title="Active Leaves"
            value={stats.leaveRequestsThisMonth ?? 0}
            icon={CalendarIcon}
            accentColor="#10b981"
            trend="Currently on leave"
          />
          <StatCard
            title="Processed Payroll"
            value={stats.salariesPaidThisMonth ?? 0}
            icon={DocumentTextIcon}
            accentColor="#8b5cf6"
            trend="This month"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              title="Leave Management"
              description="Request leave or view your leave history and balances."
              href="/leaves"
              icon={CalendarIcon}
            />
            <QuickActionCard
              title="Salary Slips"
              description="View your monthly salary slips and download PDFs."
              href="/salary"
              icon={DocumentTextIcon}
            />
            {isHR && (
              <>
                <QuickActionCard
                  title="Analytics & Reports"
                  description="View detailed payroll and employee statistics."
                  href="/reports"
                  icon={ChartBarIcon}
                />
                <QuickActionCard
                  title="Employee Management"
                  description="Add, edit, or remove employees from the system."
                  href="/admin/users"
                  icon={UserGroupIcon}
                />
              </>
            )}
            <QuickActionCard
              title="My Profile"
              description="Update your personal information and password."
              href="/profile"
              icon={UserGroupIcon}
              muted
            />
          </div>
        </div>

        {/* Recent Updates */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Updates</h2>
            <button
              type="button"
              className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              View all
            </button>
          </div>
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-[var(--gray-200)]">
              <NotificationItem
                title="System Update"
                message="Payroll system successfully updated to v1.2"
                time="2 hours ago"
                icon={CheckCircleIcon}
                iconColor="#10b981"
                iconBg="bg-emerald-100"
              />
              <NotificationItem
                title="Payroll Generated"
                message="Salary slips for January 2026 are now available."
                time="1 day ago"
                icon={DocumentTextIcon}
                iconColor="var(--primary)"
                iconBg="bg-[var(--primary-light)]"
              />
              <NotificationItem
                title="Welcome!"
                message="Welcome to the new HRIS dashboard."
                time="3 days ago"
                icon={UserGroupIcon}
                iconColor="#8b5cf6"
                iconBg="bg-violet-100"
              />
            </div>
            <div className="p-4 bg-[var(--gray-50)] border-t border-[var(--gray-200)]">
              <button
                type="button"
                className="text-sm font-semibold w-full text-center transition-colors duration-200 hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                View All Notifications →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  trend?: string;
}) {
  return (
    <Card hover padding="md" className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--gray-500)]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{value}</p>
          {trend && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--gray-500)]">
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: accentColor }}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  muted,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--gray-300)] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white transition-all duration-200 group-hover:scale-105"
          style={{ backgroundColor: muted ? 'var(--gray-500)' : 'var(--primary)' }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--gray-500)] line-clamp-2">{description}</p>
          <div className="mt-3 flex items-center text-sm font-medium text-[var(--gray-400)] group-hover:text-[var(--primary)] transition-colors duration-200">
            <span>Get started</span>
            <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function NotificationItem({
  title,
  message,
  time,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 transition-colors duration-200 hover:bg-[var(--gray-50)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`} style={{ color: iconColor }}>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--gray-500)] line-clamp-2">{message}</p>
        <p className="mt-2 text-xs text-[var(--gray-400)]">{time}</p>
      </div>
    </div>
  );
}
