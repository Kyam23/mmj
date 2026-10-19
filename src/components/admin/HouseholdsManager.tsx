/**
 * Households Manager - Barangay Bang-Bang
 * Record and monitor household segregation status, members, and purok distribution
 */

import React, { useState, useEffect } from 'react';
import { Home, Plus, Search, Filter, CheckCircle2, XCircle, Users } from 'lucide-react';
import { Household, Purok } from '../../types';
import { api } from '../../services/api';

export const HouseholdsManager: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [puroks, setPuroks] = useState<Purok[]>([]);
  const [search, setSearch] = useState('');
  const [filterPurok, setFilterPurok] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Household Form
  const [headName, setHeadName] = useState('');
  const [purokId, setPurokId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [familyMembers, setFamilyMembers] = useState('4');

  const loadData = async () => {
    try {
      const [hList, pList] = await Promise.all([
        api.getHouseholds(filterPurok || undefined, search || undefined),
        api.getPuroks()
      ]);
      setHouseholds(hList);
      setPuroks(pList);
      if (pList.length > 0 && !purokId) setPurokId(pList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPurok, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHousehold({
        head_name: headName,
        purok_id: purokId,
        contact_number: contactNumber,
        address_details: addressDetails,
        family_member_count: Number(familyMembers) || 1
      });
      setIsModalOpen(false);
      setHeadName('');
      setContactNumber('');
      setAddressDetails('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register household');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Home className="w-4 h-4 text-emerald-700" />
            <span>Barangay Bang-Bang Household Registry</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">
            Registered Households & Waste Compliance
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Directory of Bang-Bang families mapped to their respective Purok Leaders for solid waste verification.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Household
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search household no., head of family, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white focus:outline-emerald-600 text-neutral-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={filterPurok}
            onChange={(e) => setFilterPurok(e.target.value)}
            className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 focus:bg-white text-neutral-800"
          >
            <option value="">All Puroks</option>
            {puroks.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-neutral-400 ml-auto font-mono">
          {households.length} Households
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Household No.</th>
                <th className="py-3 px-4">Head of Family</th>
                <th className="py-3 px-4">Purok</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Address Details</th>
                <th className="py-3 px-4">Family Size</th>
                <th className="py-3 px-4 text-right">Segregation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {households.map((h) => (
                <tr key={h.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-900 whitespace-nowrap">
                    {h.household_number}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                    {h.head_name}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-800 whitespace-nowrap">
                    {h.purok_name}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 font-mono whitespace-nowrap">
                    {h.contact_number || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 truncate max-w-xs">
                    {h.address_details}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-neutral-700">
                    {h.family_member_count} members
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Compliant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h2 className="text-base font-bold text-neutral-900">Register Household</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Adds household to Barangay Bang-Bang solid waste registry.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Head of Household Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Deatras"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Assigned Purok</label>
                <select
                  value={purokId}
                  onChange={(e) => setPurokId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  required
                >
                  {puroks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="0917-000-0000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Family Members</label>
                  <input
                    type="number"
                    min="1"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Address & Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Sitio Seaside, near Mangga Chapel"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
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
                  Save Household
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
