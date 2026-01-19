'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
  BellIcon, 
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 h-20 bg-white shadow-sm border-b border-gray-100">
      <div className="flex h-full items-center justify-between px-8">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full rounded-lg border-0 bg-[#F9FAFB] py-2.5 pl-12 pr-4 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:bg-white focus:ring-2 focus:ring-[#465FFF] transition-colors"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828] transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#465FFF] text-sm font-semibold text-white shadow-sm ring-2 ring-white">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[#101828]">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-[#475467] capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in">
                <div className="p-2">
                  <div className="px-4 py-3 border-b border-[#E4E7EC]">
                    <p className="text-sm font-semibold text-[#101828]">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-[#475467] truncate">{user.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <a
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 text-[#98A2B3]" />
                      <span>My Profile</span>
                    </a>
                    <a
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-[#98A2B3]" />
                      <span>Settings</span>
                    </a>
                  </div>
                  
                  <div className="border-t border-[#E4E7EC] py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
