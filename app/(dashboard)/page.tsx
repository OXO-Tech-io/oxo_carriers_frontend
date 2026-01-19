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
} from '@heroicons/react/24/outline';

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#101828] tracking-tight">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="mt-2 text-[#667085]">
            {currentDate}
          </p>
        </div>
      </div>

      {/* HR Stats Section */}
      {isHR && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees || 0}
            icon={UserGroupIcon}
            color="blue"
            trend="+2.5% vs last month"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaveRequests || 0}
            icon={ClockIcon}
            color="yellow"
            trend="Needs attention"
          />
          <StatCard
            title="Active Leaves"
            value={stats.leaveRequestsThisMonth || 0}
            icon={CalendarIcon}
            color="green"
            trend="Currently on leave"
          />
          <StatCard
            title="Processed Payroll"
            value={stats.salariesPaidThisMonth || 0}
            icon={DocumentTextIcon}
            color="purple"
            trend="This month"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[#101828]">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              title="Leave Management"
              description="Request leave or view your leave history and balances."
              href="/leaves"
              icon={CalendarIcon}
              gradient="from-[#465FFF] to-[#3641F5]"
            />
            <QuickActionCard
              title="Salary Slips"
              description="View your monthly salary slips and download PDFs."
              href="/salary"
              icon={DocumentTextIcon}
              gradient="from-[#465FFF] to-[#3641F5]"
            />
            {isHR && (
              <>
                <QuickActionCard
                  title="Analytics & Reports"
                  description="View detailed payroll and employee statistics."
                  href="/reports"
                  icon={ChartBarIcon}
                  gradient="from-[#465FFF] to-[#3641F5]"
                />
                <QuickActionCard
                  title="Employee Management"
                  description="Add, edit, or remove employees from the system."
                  href="/admin/users"
                  icon={UserGroupIcon}
                  gradient="from-[#465FFF] to-[#3641F5]"
                />
              </>
            )}
            <QuickActionCard
              title="My Profile"
              description="Update your personal information and password."
              href="/profile"
              icon={UserGroupIcon}
              gradient="from-[#475467] to-[#344054]"
            />
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#101828]">Recent Updates</h2>
            <button className="text-sm font-medium text-[#465FFF] hover:text-[#3641F5] transition-colors">
              View all
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
            <div className="divide-y divide-[#E4E7EC]">
              {/* Mock Notification Items */}
              <NotificationItem
                title="System Update"
                message="Payroll system successfully updated to v1.2"
                time="2 hours ago"
                icon={CheckCircleIcon}
                color="text-[#10B981]"
                bg="bg-[#D1FADF]"
                iconBg="bg-[#10B981]"
              />
              <NotificationItem
                title="Payroll Generated"
                message="Salary slips for January 2026 are now available."
                time="1 day ago"
                icon={DocumentTextIcon}
                color="text-[#465FFF]"
                bg="bg-[#ECF3FF]"
                iconBg="bg-[#465FFF]"
              />
              <NotificationItem
                title="Welcome!"
                message="Welcome to the new HRIS dashboard."
                time="3 days ago"
                icon={UserGroupIcon}
                color="text-[#8B5CF6]"
                bg="bg-[#F3E8FF]"
                iconBg="bg-[#8B5CF6]"
              />
            </div>
            <div className="p-4 bg-[#F9FAFB] text-center border-t border-[#E4E7EC]">
              <button className="text-sm font-semibold text-[#465FFF] hover:text-[#3641F5] transition-colors">
                View All Notifications →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'yellow' | 'green' | 'purple';
  trend?: string;
}) {
  const colorStyles = {
    blue: { 
      bg: 'bg-[#ECF3FF]', 
      iconBg: 'bg-[#465FFF]',
      text: 'text-[#465FFF]', 
      value: 'text-[#101828]',
      trend: 'text-[#475467]',
      border: 'border-[#DDE9FF]'
    },
    yellow: { 
      bg: 'bg-[#FEF3C7]', 
      iconBg: 'bg-[#F59E0B]',
      text: 'text-[#F59E0B]', 
      value: 'text-[#101828]',
      trend: 'text-[#475467]',
      border: 'border-[#FDE68A]'
    },
    green: { 
      bg: 'bg-[#D1FADF]', 
      iconBg: 'bg-[#10B981]',
      text: 'text-[#10B981]', 
      value: 'text-[#101828]',
      trend: 'text-[#475467]',
      border: 'border-[#A6F4C5]'
    },
    purple: { 
      bg: 'bg-[#F3E8FF]', 
      iconBg: 'bg-[#8B5CF6]',
      text: 'text-[#8B5CF6]', 
      value: 'text-[#101828]',
      trend: 'text-[#475467]',
      border: 'border-[#E9D5FF]'
    },
  };

  const current = colorStyles[color];

  return (
    <div className={`group relative overflow-hidden rounded-2xl ${current.bg} p-6 shadow-sm hover:shadow-md transition-all duration-300 border ${current.border}`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#475467] mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-3xl font-bold ${current.value}`}>{value}</p>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${current.iconBg} shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs font-medium">
            <ArrowTrendingUpIcon className={`h-3.5 w-3.5 mr-1.5 ${current.trend}`} />
            <span className={current.trend}>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  gradient,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-[#E4E7EC] hover:shadow-md hover:border-[#D0D5DD] transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#101828] group-hover:text-[#465FFF] transition-colors mb-1">
              {title}
            </h3>
            <p className="text-sm text-[#475467] leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-[#98A2B3] group-hover:text-[#465FFF] transition-colors">
          <span>Get started</span>
          <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
  color,
  bg,
  iconBg,
}: {
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  iconBg: string;
}) {
  return (
    <div className="group p-4 hover:bg-[#F9FAFB] transition-colors flex items-start space-x-3 cursor-pointer">
      <div className={`flex-shrink-0 p-2.5 rounded-xl ${bg} group-hover:scale-105 transition-transform`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#101828] mb-0.5">{title}</p>
        <p className="text-sm text-[#475467] leading-relaxed line-clamp-2">{message}</p>
        <p className="text-xs text-[#98A2B3] mt-2">{time}</p>
      </div>
    </div>
  );
}
