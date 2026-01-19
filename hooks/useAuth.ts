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
  const isHR = isHRManager || isHRExecutive;

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
    isHR,
  };
};
