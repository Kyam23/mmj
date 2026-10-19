/**
 * Resident Disposal Participation View - Role 4: Resident
 * Submit waste disposal record for Leader verification. Prevents duplicates.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Clock, AlertCircle, FileText, Check, X } from 'lucide-react';
import { CollectionSchedule, DisposalSubmission } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ResidentDisposalView: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [submissions, setSubmissions] = useState<DisposalSubmission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [wasteType, setWasteType] = useState('Biodegradable');
  const [bagCount, setBagCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sData, subData] = await Promise.all([
        api.getSchedules(),
        api.getDisposalSubmissions()
      ]);
      setSchedules(sData);
      setSubmissions(subData);
      const available = sData.filter((s) => s.purok_id === user?.purok_id || !user?.purok_id);
      if (available.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(available[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      alert('Please select a collection schedule.');
      return;
    }

    try {
      await api.submitDisposal({
        schedule_id: selectedScheduleId,
        waste_type: wasteType,
        bag_count: Number(bagCount) || 1,
        notes,
        proof_url: proofUrl
      });
      setIsModalOpen(false);
      setNotes('');
      setProofUrl('');
      setSuccessMsg('Disposal record submitted. Sent to your Purok Leader for verification.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const myPurokSchedules = schedules.filter(
    (s) => s.purok_id === user?.purok_id || !user?.purok_id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Ecological Solid Waste Participation</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">
            My Garbage Disposal Records
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log your household waste set out for scheduled collections in Barangay Bang-Bang.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Disposal Entry
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/70">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
            Participation Logbook ({submissions.length} Entries)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Waste Type</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Resident Notes</th>
                <th className="py-3 px-4">Purok Leader Remarks</th>
                <th className="py-3 px-4 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No disposal records logged yet. Click "Log Disposal Entry" when setting out your segregated bags.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const statusColors: Record<string, string> = {
                    'Verified': 'text-emerald-800 bg-emerald-50 border-emerald-200',
                    'Pending': 'text-amber-800 bg-amber-50 border-amber-200',
                    'Rejected': 'text-rose-800 bg-rose-50 border-rose-200'
                  };

                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50">
                      <td className="py-3.5 px-4 font-mono text-neutral-900 whitespace-nowrap">
                        {new Date(sub.submission_timestamp).toLocaleDateString()} at{' '}
                        {new Date(sub.submission_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-800 whitespace-nowrap">
                        {sub.waste_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-neutral-700 whitespace-nowrap">
                        {sub.bag_count} bag(s)
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 truncate max-w-xs">
                        {sub.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 italic truncate max-w-xs">
                        {sub.verification_remarks || (sub.verification_status === 'Pending' ? 'Awaiting leader review...' : '—')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded border ${
                            statusColors[sub.verification_status || 'Pending']
                          }`}
                        >
                          {sub.verification_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h2 className="text-base font-bold text-neutral-900">Log Waste Disposal Participation</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Submit your segregated waste details for your Purok Leader to inspect and approve.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">
                  Select Collection Schedule
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-semibold"
                  required
                >
                  {myPurokSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.scheduled_date} ({s.time_slot}) — {s.waste_type} [{s.status}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Only 1 submission allowed per collection event to prevent duplicates.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Waste Type</label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  >
                    <option value="Biodegradable">Biodegradable (Malata)</option>
                    <option value="Non-Biodegradable">Non-Biodegradable (Dili Malata)</option>
                    <option value="Recyclable">Recyclable (Mabaligya)</option>
                    <option value="Special Waste">Special Waste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Number of Bags / Sacks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={bagCount}
                    onChange={(e) => setBagCount(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Location Details / Bin Marker</label>
                <input
                  type="text"
                  placeholder="e.g. Green sack placed right outside front gate bin"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Submit for Leader Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
