/**
 * Role-Based Clean Sidebar Navigation
 * Barangay Bang-Bang Smart Garbage Monitoring System
 * Fully styled for Light and Dark themes
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Home,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  FileCheck2,
  FileSpreadsheet,
  Megaphone,
  Settings,
  History,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose
}) => {
  const { user, switchRoleDemo } = useAuth();
  const role = user?.role || 'admin';

  // Navigation configurations strictly following prompt specifications
  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { id: 'schedules', label: 'Collection Schedules', icon: CalendarDays },
          { id: 'monitoring', label: 'Collector Monitoring', icon: Truck },
          { id: 'households', label: 'Households', icon: Home },
          { id: 'residents', label: 'Residents Management', icon: Users },
          { id: 'staff', label: 'Collectors & Leaders', icon: UserCheck },
          { id: 'payments', label: 'Payment Ledgers', icon: Receipt },
          { id: 'endorsements', label: 'Endorsement Statuses', icon: FileCheck2 },
          { id: 'reports', label: 'Operational Reports', icon: FileSpreadsheet },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'activity-logs', label: 'System Activity Logs', icon: History },
          { id: 'settings', label: 'Barangay Settings', icon: Settings }
        ];

      case 'collector':
        return [
          { id: 'dashboard', label: 'Collector Dashboard', icon: LayoutDashboard },
          { id: 'assigned-tasks', label: "Today's Route & Tasks", icon: Truck },
          { id: 'collection-history', label: 'Collection History', icon: History },
          { id: 'schedules', label: 'Municipal Schedules', icon: CalendarDays },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'profile', label: 'Collector Profile', icon: Users }
        ];

      case 'leader':
        return [
          { id: 'dashboard', label: 'Purok Dashboard', icon: LayoutDashboard },
          { id: 'purok-households', label: 'Purok Households', icon: Home },
          { id: 'disposal-verification', label: 'Disposal Verification', icon: CheckCircle2 },
          { id: 'payment-verification', label: 'Payment Verification', icon: Receipt },
          { id: 'endorsement-processing', label: 'Endorsement Requests', icon: FileCheck2 },
          { id: 'purok-schedules', label: 'Purok Schedules', icon: CalendarDays },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'profile', label: 'Purok Leader Profile', icon: Users }
        ];

      case 'resident':
        return [
          { id: 'dashboard', label: 'Resident Dashboard', icon: LayoutDashboard },
          { id: 'resident-schedules', label: 'Collection Schedules', icon: CalendarDays },
          { id: 'my-disposal', label: 'My Disposal Records', icon: CheckCircle2 },
          { id: 'contributions', label: 'Weekly Contributions (₱5)', icon: Receipt },
          { id: 'endorsements', label: 'Endorsement Requests', icon: FileCheck2 },
          { id: 'announcements', label: 'Barangay Advisories', icon: Megaphone },
          { id: 'profile', label: 'My Household Profile', icon: Users }
        ];

      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const roleBadgeInfo: Record<UserRole, { badge: string; color: string }> = {
    admin: { badge: 'Barangay Captain', color: 'bg-emerald-900 text-white dark:bg-emerald-800' },
    collector: { badge: 'Garbage Collector', color: 'bg-amber-900 text-white dark:bg-amber-800' },
    leader: { badge: 'Purok Leader', color: 'bg-teal-900 text-white dark:bg-teal-800' },
    resident: { badge: 'Resident Household', color: 'bg-neutral-800 text-white dark:bg-neutral-700' }
  };

  const currentRoleInfo = roleBadgeInfo[role];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 lg:hidden backdrop-blur-2xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* User Card */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'BB'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {user?.full_name || 'Hon. Artemio Degamo'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${currentRoleInfo.color}`}>
                  {currentRoleInfo.badge}
                </span>
                {user?.purok_name && (
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {user.purok_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  active
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Quick Role Switcher */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-850/60 lg:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Switch View</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => switchRoleDemo('admin')}
              className={`p-1.5 text-[11px] rounded font-medium border text-center transition-colors ${
                role === 'admin'
                  ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Captain
            </button>
            <button
              onClick={() => switchRoleDemo('collector')}
              className={`p-1.5 text-[11px] rounded font-medium border text-center transition-colors ${
                role === 'collector'
                  ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Collector
            </button>
            <button
              onClick={() => switchRoleDemo('leader')}
              className={`p-1.5 text-[11px] rounded font-medium border text-center transition-colors ${
                role === 'leader'
                  ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Leader
            </button>
            <button
              onClick={() => switchRoleDemo('resident')}
              className={`p-1.5 text-[11px] rounded font-medium border text-center transition-colors ${
                role === 'resident'
                  ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Resident
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500">
          <p className="font-semibold text-neutral-600 dark:text-neutral-300">Barangay Bang-Bang</p>
          <p>Cordova, Cebu · Solid Waste Dept.</p>
        </div>
      </aside>
    </>
  );
};
