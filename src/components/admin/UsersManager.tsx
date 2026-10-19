/**
 * Users & Staff Manager - Admin (Barangay Captain)
 * Manage residents, municipal garbage collectors, and purok leaders
 */

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Filter, ShieldCheck, Truck, Home, CheckCircle2, XCircle } from 'lucide-react';
import { User, Purok, UserRole } from '../../types';
import { api } from '../../services/api';

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [puroks, setPuroks] = useState<Purok[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<UserRole>('collector');
  const [purokId, setPurokId] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const loadData = async () => {
    try {
      const [uList, pList] = await Promise.all([
        api.getUsers(roleFilter || undefined),
        api.getPuroks()
      ]);
      setUsers(uList);
      setPuroks(pList);
      if (pList.length > 0 && !purokId) setPurokId(pList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        full_name: fullName,
        username,
        email,
        password,
        role,
        purok_id: role === 'leader' || role === 'resident' ? purokId : undefined,
        contact_number: contactNumber
      });
      setIsModalOpen(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setContactNumber('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create account');
    }
  };

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Barangay Captain', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    collector: { label: 'Garbage Collector', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    leader: { label: 'Purok Leader', color: 'bg-teal-100 text-teal-900 border-teal-300' },
    resident: { label: 'Resident Citizen', color: 'bg-neutral-100 text-neutral-800 border-neutral-300' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Personnel & Community Directory</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">
            Accounts & Leadership Roster
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Admin oversight of Barangay Captain, 7 Purok Leaders, assigned Collectors, and registered residents.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Personnel Account
        </button>
      </div>

      {/* Role Filters */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-200/60 rounded-xl w-fit">
        <button
          onClick={() => setRoleFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            roleFilter === '' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          All Roles ({users.length})
        </button>
        <button
          onClick={() => setRoleFilter('collector')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            roleFilter === 'collector' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Collectors
        </button>
        <button
          onClick={() => setRoleFilter('leader')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            roleFilter === 'leader' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Purok Leaders
        </button>
        <button
          onClick={() => setRoleFilter('resident')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            roleFilter === 'resident' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Residents
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Username / Email</th>
                <th className="py-3 px-4">Purok Assignment</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {users.map((u) => {
                const badge = roleBadges[u.role];
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                      {u.full_name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      <div>{u.username}</div>
                      <div className="text-[11px] text-neutral-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-800 whitespace-nowrap">
                      {u.purok_name || 'Barangay Bang-Bang (All)'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                      {u.contact_number || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h2 className="text-base font-bold text-neutral-900">Add Staff or Resident Account</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Authorized creation of municipal operational personnel.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-semibold"
                >
                  <option value="collector">Garbage Collector (Field Crew)</option>
                  <option value="leader">Purok Leader (Area Inspector)</option>
                  <option value="resident">Resident Citizen</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danilo Enoc"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="collector.danilo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="0918-000-0000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="danilo.enoc@bangbang-cordova.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                />
              </div>

              {(role === 'leader' || role === 'resident') && (
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Assigned Purok</label>
                  <select
                    value={purokId}
                    onChange={(e) => setPurokId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  >
                    {puroks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900 shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
