'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  UserGroupIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { UserRole, Vendor } from '@/types';
import CreateUserModal from '@/components/modals/CreateUserModal';
import CreateServiceProviderModal, { CreateServiceProviderPayload } from '@/components/modals/CreateServiceProviderModal';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';

interface User {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  position?: string;
  hire_date?: string;
  must_change_password: boolean;
  created_at: string;
}

function isVendor(item: User | Vendor): item is Vendor {
  return 'company_name' in item && !('role' in item);
}

export default function AdminUsersPage() {
  const { user: currentUser, isHR, isFinance } = useAuth();
  const canAccessUsers = isHR || isFinance;
  const [listItems, setListItems] = useState<(User | Vendor)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateServiceProviderModal, setShowCreateServiceProviderModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (canAccessUsers) {
      fetchUsers();
      if (!isFinance) fetchDepartments();
    }
  }, [canAccessUsers, isFinance, searchTerm, filterRole, filterDepartment]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (isFinance) {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        const response = await api.get(`/vendors?${params.toString()}`);
        setListItems(response.data.vendors || []);
      } else {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterRole) params.append('role', filterRole);
        if (filterDepartment) params.append('department', filterDepartment);
        const response = await api.get(`/users?${params.toString()}`);
        setListItems(response.data.users || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch:', err);
      setError(err.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleCreateUser = async (formData: {
    employee_id?: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    department: string;
    position: string;
    hire_date: string;
    manager_id: string;
    hourly_rate?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_branch?: string;
    company_name?: string;
    contact_number?: string;
  }) => {
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/users', formData);
      setSuccess(response.data.message || 'User created successfully');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      throw err; // Re-throw to let modal handle loading state
    }
  };

  const handleCreateServiceProvider = async (data: CreateServiceProviderPayload) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/vendors', data);
      setSuccess(response.data.message || 'Vendor created successfully');
      setShowCreateServiceProviderModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create vendor');
      throw err;
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setError('');
      setSuccess('');
      const response = await api.post(`/users/${selectedUser.id}/reset-password`);
      setSuccess(response.data.message || 'Password reset email sent successfully');
      setShowResetModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!canAccessUsers) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#101828]">Access Denied</p>
          <p className="text-[#475467]">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">
            {isFinance ? 'Service Providers' : 'Employee Management'}
          </h1>
          <p className="mt-2 text-[#475467]">
            {isFinance ? 'Create and manage service provider accounts' : 'Create and manage employee accounts'}
          </p>
        </div>
        {(isHR || isFinance) && (
          <div className="flex items-center gap-2">
            {isFinance && (
              <button
                onClick={() => setShowCreateServiceProviderModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Service Provider</span>
              </button>
            )}
            {isHR && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Employee</span>
                </button>
                <button
                  onClick={() => setShowCreateServiceProviderModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-xl font-semibold hover:bg-[#F9FAFB] transition-colors shadow-sm"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Service Provider</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-4">
        <div className={`grid grid-cols-1 gap-4 ${isHR ? 'md:grid-cols-3' : ''}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[#98A2B3]" />
            </div>
            <input
              type="text"
              placeholder={isFinance ? 'Search service providers...' : 'Search employees...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
            />
          </div>
          {isHR && (
            <>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value={UserRole.HR_MANAGER}>HR Manager</option>
                <option value={UserRole.HR_EXECUTIVE}>HR Executive</option>
                <option value={UserRole.FINANCE_MANAGER}>Finance Manager</option>
                <option value={UserRole.FINANCE_EXECUTIVE}>Finance Executive</option>
                <option value={UserRole.PAYMENT_APPROVER}>Payment Approver</option>
                <option value={UserRole.EMPLOYEE}>Employee</option>
                <option value={UserRole.CONSULTANT}>Consultant</option>
                <option value={UserRole.SERVICE_PROVIDER}>Service Provider</option>
              </select>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E4E7EC]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                    {isFinance ? 'Company' : 'Employee'}
                  </th>
                  {!isFinance && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Position</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Status</th>
                    </>
                  )}
                  {isFinance && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Contact</th>
                  )}
                  {!isFinance && (
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#344054] uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E4E7EC]">
                {listItems.length === 0 ? (
                  <tr>
                    <td colSpan={isFinance ? 2 : 6} className="px-6 py-12 text-center">
                      <UserGroupIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[#344054]">
                        {isFinance ? 'No vendors found' : 'No employees found'}
                      </p>
                      <p className="text-sm text-[#98A2B3] mt-1">
                        {isFinance ? 'Try adjusting your search' : 'Try adjusting your search or filters'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  listItems.map((item) =>
                    isVendor(item) ? (
                      <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-[#101828]">{item.company_name}</p>
                            <p className="text-xs text-[#475467]">{item.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.contact_number || '—'}
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-[#101828]">
                              {item.first_name} {item.last_name}
                            </p>
                            <p className="text-xs text-[#475467]">{item.email}</p>
                            <p className="text-xs text-[#98A2B3] mt-0.5">ID: {item.employee_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECF3FF] text-[#465FFF]">
                            {item.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.department || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.position || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.must_change_password ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Password Setup Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(item);
                                setShowResetModal(true);
                              }}
                              className="p-2 text-[#465FFF] hover:bg-[#ECF3FF] rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <KeyIcon className="h-5 w-5" />
                            </button>
                            {currentUser?.role === UserRole.HR_MANAGER && (
                              <button
                                onClick={() => handleDeleteUser(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal (HR only - employees/consultants) */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        currentUserRole={currentUser?.role as UserRole | undefined}
      />

      {/* Create Service Provider Modal */}
      <CreateServiceProviderModal
        isOpen={showCreateServiceProviderModal}
        onClose={() => setShowCreateServiceProviderModal(false)}
        onSubmit={handleCreateServiceProvider}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResetPassword}
        userEmail={selectedUser?.email || ''}
      />
    </div>
  );
}
