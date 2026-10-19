/**
 * Resident & User Profile View
 */

import React, { useState } from 'react';
import { User as UserIcon, Home, Phone, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const ResidentProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [contactNumber, setContactNumber] = useState(user?.contact_number || '');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.updateUser(user.id, {
        contact_number: contactNumber
      });
      setSuccess(true);
      refreshUser();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <UserIcon className="w-4 h-4 text-emerald-700" />
          <span>Resident Registry Record</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-1">
          Profile & Household Information
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Official registered citizen record in Barangay Bang-Bang, Cordova, Cebu.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
          <div>
            <span className="text-neutral-500 block">Full Name</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">{user?.full_name}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Account Role</span>
            <span className="text-sm font-bold text-emerald-900 capitalize mt-0.5 block">{user?.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
          <div>
            <span className="text-neutral-500 block">Purok Assignment</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
              {user?.purok_name || 'Barangay Bang-Bang'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Household Identifier</span>
            <span className="text-sm font-mono font-bold text-emerald-900 mt-0.5 block">
              {user?.household_number || 'HH-MNG-001'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-neutral-500 block">Registered Address</span>
          <span className="text-sm font-medium text-neutral-800 mt-0.5 block">
            {user?.address_details || 'Sitio Seaside, Purok Mangga, Barangay Bang-Bang, Cordova, Cebu'}
          </span>
        </div>

        <form onSubmit={handleUpdate} className="pt-4 border-t border-neutral-100 space-y-3">
          <div>
            <label className="block text-neutral-700 font-semibold mb-1">
              Contact Phone Number
            </label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            Save Contact Updates
          </button>
        </form>
      </div>
    </div>
  );
};
