'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
    <header className="sticky top-0 z-20 h-16 lg:h-[72px] flex items-center bg-[var(--card-bg)] border-b border-[var(--gray-200)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-1 items-center justify-between gap-4 px-4 lg:pl-6 lg:pr-8">
        {/* Spacer for mobile menu button (same width as button so content aligns) */}
        <div className="w-10 lg:hidden" />

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div
            className={`
              relative flex items-center rounded-xl border bg-[var(--gray-50)] transition-all duration-200
              ${searchFocused ? 'border-[var(--primary)] ring-2 ring-[var(--primary-ring)] bg-[var(--card-bg)]' : 'border-[var(--gray-200)]'}
            `}
            style={searchFocused ? { ['--primary' as string]: 'var(--primary)' } : undefined}
          >
            <div className="pointer-events-none flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-[var(--gray-400)]" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-3 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-0"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2.5 rounded-xl text-[var(--gray-500)] hover:bg-[var(--gray-100)] hover:text-[var(--gray-700)] transition-colors duration-200"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-xl p-1.5 pr-3 hover:bg-[var(--gray-100)] transition-colors duration-200"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm bg-[var(--primary)]"
              >
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-[var(--gray-500)] capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-[var(--gray-400)] transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-[var(--card-bg)] shadow-[var(--shadow-lg)] border border-[var(--gray-200)] py-2 animate-fade-in z-50"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-[var(--gray-200)]">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-colors duration-200"
                    onClick={() => setShowDropdown(false)}
                  >
                    <UserCircleIcon className="h-5 w-5 text-[var(--gray-400)]" />
                    My Profile
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-colors duration-200"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Cog6ToothIcon className="h-5 w-5 text-[var(--gray-400)]" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-[var(--gray-200)] py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg mx-2 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
