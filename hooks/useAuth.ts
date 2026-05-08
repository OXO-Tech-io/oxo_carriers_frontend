'use client';

import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const accessToken = useAuthStore(s => s.accessToken);
  const user = useAuthStore(s => s.user);
  const login = useAuthStore(s => s.login);
  const logout = useAuthStore(s => s.logout);
  const setUser = useAuthStore(s => s.setUser);

  const isAuthenticated = !!accessToken;

  const isSuperAdmin = user?.role === 'super_admin';
  const isHRManager = user?.role === 'hr_manager';
  const isHRExecutive = user?.role === 'hr_executive';
  const isEmployee = user?.role === 'employee';
  const isConsultant = user?.role === 'consultant';
  const isServiceProvider = user?.role === 'service_provider';
  const isFinanceManager = user?.role === 'finance_manager';
  const isFinanceExecutive = user?.role === 'finance_executive';
  const isHR = isHRManager || isHRExecutive;
  const isFinance = isFinanceManager || isFinanceExecutive;

  return {
    user,
    token: accessToken,
    isAuthenticated,
    login,
    logout,
    setUser,
    isSuperAdmin,
    isHRManager,
    isHRExecutive,
    isEmployee,
    isConsultant,
    isServiceProvider,
    isFinanceManager,
    isFinanceExecutive,
    isFinance,
    isHR,
  };
};
