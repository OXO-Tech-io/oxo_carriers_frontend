'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  BellRing,
  Megaphone,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useNoticesQuery } from '@/hooks/queries/use-notices-query';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { resolveFileUrl as resolveImageUrl } from '@/lib/constants';

interface DashboardStats {
  totalEmployees?: number;
  pendingLeaveRequests?: number;
  leaveRequestsThisMonth?: number;
  salariesPaidThisMonth?: number;
  totalSalaryPaid?: number;
}

export default function HomePage() {
  const { user, isHR, isSuperAdmin } = useAuth();
  const canAccessHR = isHR || isSuperAdmin;
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const noticesQuery = useNoticesQuery();
  const notices = noticesQuery.data ?? [];

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        if (canAccessHR) {
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
  }, [canAccessHR, user]);

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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary-light)] px-3 py-1 text-[var(--primary)]">
              Welcome back, {user?.first_name}!
              <span aria-hidden>👋</span>
            </span>
          </h1>
          <p className="text-[var(--gray-400)] text-base font-medium">How can we help you today?</p>
        </div>
        <div className="shrink-0 rounded-full bg-[var(--card-bg)] shadow-[var(--shadow)] px-4 py-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--gray-400)] font-bold block">Today</span>
          <p className="text-sm font-bold text-[var(--foreground)]">{currentDate}</p>
        </div>
      </motion.div>

      {/* Attendance */}
      <motion.div variants={itemVariants}>
        <AttendanceCard />
      </motion.div>

      {/* KPI Stats (HR Only) */}
      {/* {canAccessHR && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees ?? 0}
            icon={Users}
            accentColor="#4C6FFF"
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
      )} */}

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
            {canAccessHR && (
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

        {/* Notice Board */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Notice Board</h2>
            {notices.length > 0 && <Badge variant="primary">{notices.length}</Badge>}
          </div>

          <Card padding="none" className="overflow-hidden shadow-md">
            {noticesQuery.isLoading ? (
              <p className="p-6 text-center text-xs font-semibold text-[var(--gray-400)]">Loading notices...</p>
            ) : notices.length === 0 ? (
              <p className="p-6 text-center text-xs font-semibold text-[var(--gray-400)]">No notices right now.</p>
            ) : (
              <div className="divide-y divide-[var(--gray-100)]">
                {notices.map((notice) => (
                  <NotificationItem
                    key={notice.id}
                    title={notice.title}
                    message={notice.message}
                    imageUrl={notice.imageUrl ? resolveImageUrl(notice.imageUrl) : null}
                    time={formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                    icon={Megaphone}
                    iconColor="var(--primary)"
                    iconBg="bg-blue-500/10 text-blue-500"
                  />
                ))}
              </div>
            )}
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
    <Card hover padding="md" className="group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{value}</p>
          {trend && (
            <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--gray-500)]">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 active:scale-95 shrink-0"
          style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
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
      className="group block rounded-[1.375rem] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-0.5"
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
  imageUrl,
}: {
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="p-4 transition-colors duration-200 hover:bg-[var(--gray-50)]">
      {imageUrl && (
        <div className="mb-3 overflow-hidden rounded-xl shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-32 w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`} style={{ color: iconColor }}>
          <Icon className="h-5 w-5 shrink-0" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
          <p className="text-xs text-[var(--gray-400)] line-clamp-2 leading-relaxed">{message}</p>
          <Badge variant="gray" className="mt-1">{time}</Badge>
        </div>
      </div>
    </div>
  );
}
