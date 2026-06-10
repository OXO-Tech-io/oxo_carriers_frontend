'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BellRing,
  Award,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

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

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Hero */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 p-6 lg:p-8 text-white shadow-xl dark:from-slate-800 dark:to-slate-900 border border-white/10"
      >
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-16 h-36 w-36 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>Portal Active</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="text-blue-100 dark:text-slate-300 text-sm font-medium">
              We hope you are having an productive day. Here's your workspace overview.
            </p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <span className="text-xs uppercase tracking-wider text-blue-200 dark:text-slate-400 font-bold">Today's Date</span>
            <p className="text-lg font-bold">{currentDate}</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats (HR Only) */}
      {isHR && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees ?? 0}
            icon={Users}
            accentColor="var(--primary)"
            trend="+2.5% vs last month"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaveRequests ?? 0}
            icon={Clock}
            accentColor="#f59e0b"
            trend="Needs attention"
          />
          <StatCard
            title="Active Leaves"
            value={stats.leaveRequestsThisMonth ?? 0}
            icon={Calendar}
            accentColor="#10b981"
            trend="Currently on leave"
          />
          <StatCard
            title="Processed Payroll"
            value={stats.salariesPaidThisMonth ?? 0}
            icon={FileText}
            accentColor="#8b5cf6"
            trend="This month"
          />
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              title="Leave Management"
              description="Request leave or view your leave history and balances."
              href="/leaves"
              icon={Calendar}
              iconBg="bg-blue-500/10 text-blue-500"
            />
            <QuickActionCard
              title="Salary Slips"
              description="View your monthly salary slips and download PDFs."
              href="/salary"
              icon={FileText}
              iconBg="bg-teal-500/10 text-teal-500"
            />
            {isHR && (
              <>
                <QuickActionCard
                  title="Analytics & Reports"
                  description="View detailed payroll and employee statistics."
                  href="/reports"
                  icon={TrendingUp}
                  iconBg="bg-purple-500/10 text-purple-500"
                />
                <QuickActionCard
                  title="Employee Directory"
                  description="Add, edit, or remove employees from the system."
                  href="/admin/users"
                  icon={Users}
                  iconBg="bg-pink-500/10 text-pink-500"
                />
              </>
            )}
            <QuickActionCard
              title="My Profile"
              description="Update your personal details, credentials, and settings."
              href="/profile"
              icon={Users}
              iconBg="bg-slate-500/10 text-slate-500"
              muted
            />
          </div>
        </motion.div>

        {/* Recent Updates */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">Recent Updates</h2>
            </div>
            <button
              type="button"
              className="text-xs font-bold transition-opacity hover:opacity-85 text-[var(--primary)] hover:underline"
            >
              View all
            </button>
          </div>
          
          <Card padding="none" className="overflow-hidden shadow-md">
            <div className="divide-y divide-[var(--gray-100)]">
              <NotificationItem
                title="System Update"
                message="Payroll system successfully updated to v1.2"
                time="2 hours ago"
                icon={CheckCircle}
                iconColor="#22C55E"
                iconBg="bg-emerald-500/10 text-emerald-500"
              />
              <NotificationItem
                title="Payroll Generated"
                message="Salary slips for January 2026 are now available."
                time="1 day ago"
                icon={FileText}
                iconColor="var(--primary)"
                iconBg="bg-blue-500/10 text-blue-500"
              />
              <NotificationItem
                title="Welcome!"
                message="Welcome to the new HRIS dashboard."
                time="3 days ago"
                icon={Users}
                iconColor="#8b5cf6"
                iconBg="bg-purple-500/10 text-purple-500"
              />
            </div>
            <div className="p-4 bg-[var(--gray-25)] border-t border-[var(--gray-100)]">
              <button
                type="button"
                className="text-xs font-bold w-full text-center text-[var(--primary)] hover:underline flex items-center justify-center gap-1.5"
              >
                <span>View All Notifications</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
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
    <Card hover padding="md" className="group relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{value}</p>
          {trend && (
            <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--gray-500)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 active:scale-95 shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <Icon className="h-5 w-5" />
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
  iconBg,
  muted,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:border-[var(--primary)] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
            muted ? 'bg-[var(--gray-50)] text-[var(--gray-400)]' : iconBg
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200 text-sm lg:text-base">
            {title}
          </h3>
          <p className="text-xs text-[var(--gray-400)] line-clamp-2 leading-relaxed">{description}</p>
          <div className="pt-2 flex items-center text-xs font-bold text-[var(--gray-300)] group-hover:text-[var(--primary)] transition-colors duration-200 gap-1">
            <span>Get started</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
    <div className="flex items-start gap-3.5 p-4 transition-colors duration-200 hover:bg-[var(--gray-50)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`} style={{ color: iconColor }}>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
          <p className="text-[10px] text-[var(--gray-400)] font-semibold shrink-0">{time}</p>
        </div>
        <p className="text-xs text-[var(--gray-400)] line-clamp-2 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
