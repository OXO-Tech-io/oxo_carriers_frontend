"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissionLevel } from "@/hooks/useMyPermissionLevel";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Vendor } from "@/types";
import CreateServiceProviderModal, {
  CreateServiceProviderPayload,
} from "@/components/modals/CreateServiceProviderModal";

// Service providers (vendors) used to live inside Employee Management
// (/admin/users). They now have their own page; access is driven by the
// configurable `vendors` permission (HR + Finance roles hold it by default,
// Administrator bypasses permission checks).
export default function AdminServiceProvidersPage() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const { allowed: canRead } = useMyPermissionLevel("vendors", "read");
  const { allowed: canCreate } = useMyPermissionLevel("vendors", "write");
  const canAccess = isSuperAdmin || canRead;
  const canCreateProvider = isSuperAdmin || canCreate;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (canAccess) fetchVendors();
  }, [canAccess, searchTerm]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const response = await api.get(`/vendors?${params.toString()}`);
      setVendors(response.data.vendors || []);
    } catch (err: any) {
      console.error("Failed to fetch service providers:", err);
      toast.error(
        "Failed to load",
        err.response?.data?.message || "Could not fetch service providers",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServiceProvider = async (
    data: CreateServiceProviderPayload,
  ) => {
    try {
      const response = await api.post("/vendors", data);
      toast.success(
        "Vendor created",
        response.data.message ||
          "Service provider account created successfully",
      );
      setShowCreateModal(false);
      fetchVendors();
    } catch (err: any) {
      toast.error(
        "Failed to create vendor",
        err.response?.data?.message || "Please check the form and try again",
      );
      throw err; // let the modal keep itself open
    }
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">Access Denied</p>
          <p className="text-[var(--gray-400)]">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Service Providers
          </h1>
          <p className="mt-2 text-[var(--gray-400)]">
            Create and manage service provider accounts
          </p>
        </div>
        {canCreateProvider && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-[var(--primary-hover)] transition-colors shadow-sm hover:shadow-md"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Service Provider</span>
          </button>
        )}
      </div>

      <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--gray-100)] p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[var(--gray-300)]" />
          </div>
          <input
            type="text"
            placeholder="Search service providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--gray-100)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--gray-100)]">
              <thead className="bg-[var(--gray-25)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <UserGroupIcon className="h-12 w-12 text-[var(--gray-300)] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[var(--gray-600)]">
                        No service providers found
                      </p>
                      <p className="text-sm text-[var(--gray-300)] mt-1">
                        Try adjusting your search
                      </p>
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-[var(--gray-25)] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {vendor.company_name}
                        </p>
                        <p className="text-xs text-[var(--gray-400)]">
                          {vendor.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-400)]">
                        {vendor.contact_number || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateServiceProviderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateServiceProvider}
      />
    </div>
  );
}
