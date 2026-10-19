/**
 * Login Modal & Fast Account Switcher
 * Fully styled for Light and Dark themes
 */

import React, { useState } from 'react';
import { X, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onOpenForgotPassword?: () => void;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onOpenForgotPassword
}) => {
  const { login, switchRoleDemo, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    }
  };

  const handleQuick = async (role: UserRole) => {
    await switchRoleDemo(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Barangay Bang-Bang Sign In
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Access municipal waste monitoring services</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Switcher Strip */}
        <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 block mb-2">
            Instant Test Login (1-Click)
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuick('admin')}
              className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-300 font-medium text-left truncate transition-colors"
            >
              Captain (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuick('collector')}
              className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-300 font-medium text-left truncate transition-colors"
            >
              Collector (Danilo)
            </button>
            <button
              type="button"
              onClick={() => handleQuick('leader')}
              className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-300 font-medium text-left truncate transition-colors"
            >
              Leader (Mangga)
            </button>
            <button
              type="button"
              onClick={() => handleQuick('resident')}
              className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-300 font-medium text-left truncate transition-colors"
            >
              Resident (Maria)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
              Username or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. captain.degamo"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-850 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold">
                Password
              </label>
              {onOpenForgotPassword && (
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-850 text-neutral-900 dark:text-white"
            />
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 block">
              Demo default: Password123!
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
          >
            Sign In with Account
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <span>Are you a new resident in Barangay Bang-Bang? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-emerald-800 dark:text-emerald-400 font-bold hover:underline"
          >
            Register Household
          </button>
        </div>
      </div>
    </div>
  );
};
