'use client';

import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    mustChangePassword,
    login,
    logout,
    setUser,
    checkAuth,
  } = useAuthStore();

  const isHRManager = user?.role === 'hr_manager';
  const isHRExecutive = user?.role === 'hr_executive';
  const isEmployee = user?.role === 'employee';
  const isConsultant = user?.role === 'consultant';
  const isServiceProvider = user?.role === 'service_provider';
  const isFinanceManager = user?.role === 'finance_manager';
  const isFinanceExecutive = user?.role === 'finance_executive';
  const isPaymentApprover = user?.role === 'payment_approver';
  const isHR = isHRManager || isHRExecutive;
  const isFinance = isFinanceManager || isFinanceExecutive;

  return {
    user,
    token,
    isAuthenticated,
    mustChangePassword,
    login,
    logout,
    setUser,
    checkAuth,
    isHRManager,
    isHRExecutive,
    isEmployee,
    isConsultant,
    isServiceProvider,
    isFinanceManager,
    isFinanceExecutive,
    isPaymentApprover,
    isFinance,
    isHR,
  };
};
