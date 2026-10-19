/**
 * Resident Self-Registration Modal
 * Registers resident and creates mapped household record in Barangay Bang-Bang
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Purok } from '../../types';
import { api } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onRequireVerification?: (userId: string, email: string, demoCode?: string) => void;
}

export const RegisterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRequireVerification
}) => {
  const { register, loading } = useAuth();
  const [puroks, setPuroks] = useState<Purok[]>([]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [purokId, setPurokId] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [familyMembers, setFamilyMembers] = useState('3');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPuroks() {
      try {
        const list = await api.getPuroks();
        setPuroks(list);
        if (list.length > 0 && !purokId) setPurokId(list[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPuroks();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await register({
        full_name: fullName,
        username,
        email,
        password,
        contact_number: contactNumber,
        purok_id: purokId,
        address_details: addressDetails,
        family_member_count: Number(familyMembers) || 1
      });

      if (res?.require_verification && onRequireVerification && res.user_id && res.email) {
        onClose();
        onRequireVerification(res.user_id, res.email, res.demo_code);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Resident Household Registration
            </h2>
            <p className="text-xs text-neutral-500">Barangay Bang-Bang, Cordova, Cebu</p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Full Name (Head of Household)</label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Clara Deatras"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="maria.clara"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Contact Number</label>
              <input
                type="text"
                placeholder="0917-000-0000"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="maria@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Purok in Bang-Bang</label>
              <select
                value={purokId}
                onChange={(e) => setPurokId(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                required
              >
                {puroks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Family Members</label>
              <input
                type="number"
                min="1"
                value={familyMembers}
                onChange={(e) => setFamilyMembers(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Sitio / Street / House Landmark</label>
            <input
              type="text"
              placeholder="e.g. Sitio Seaside, near Mangga Chapel"
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Account Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
          >
            Complete Registration
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-neutral-500 pt-3 border-t border-neutral-100">
          <span>Already registered? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-emerald-800 font-bold hover:underline"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
