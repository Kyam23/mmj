/**
 * Resident Weekly Contributions View - Role 4: Resident
 * Submit ₱5.00 weekly garbage collection fee references (GCash, Maya, Cash to Leader)
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle2, Clock, XCircle, CreditCard, Copy, Check } from 'lucide-react';
import { PaymentSubmission } from '../../types';
import { api } from '../../services/api';

export const ResidentPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amount, setAmount] = useState('5.00');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Cash to Leader' | 'Maya' | 'Barangay Hall'>('GCash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [pData, sData] = await Promise.all([
        api.getPayments(),
        api.getSettings()
      ]);
      setPayments(pData);
      setSettings(sData);
      if (sData.weekly_contribution_fee) {
        setAmount(sData.weekly_contribution_fee);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // Default current 7-day period
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    setPeriodStart(start.toISOString().split('T')[0]);
    setPeriodEnd(end.toISOString().split('T')[0]);
  }, []);

  const handleCopyGcash = () => {
    const num = settings.gcash_treasury_number || '0917-849-2031';
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitPayment({
        period_start: periodStart,
        period_end: periodEnd,
        amount: Number(amount) || 5.0,
        payment_method: paymentMethod,
        reference_number: referenceNumber
      });
      setIsModalOpen(false);
      setReferenceNumber('');
      setSuccessMsg('Payment submitted. Your Purok Leader will review and verify your reference code.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Payment submission failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>Barangay Waste Fund Treasury</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">
            Weekly Solid Waste Contributions
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official mandatory fee: <strong className="text-emerald-950">₱{settings.weekly_contribution_fee || '5.00'} per week</strong> per household for fuel maintenance and waste staff.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit ₱5.00 Payment
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Official Payment Channel Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
            OFFICIAL GCASH DESTINATION
          </span>
          <h3 className="text-base font-bold text-neutral-900 mt-1">
            Barangay Bang-Bang Ecological Waste Fund
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5 font-mono">
            {settings.gcash_treasury_number || '0917-849-2031 (Barangay Bang-Bang Waste Fund)'}
          </p>
        </div>

        <button
          onClick={handleCopyGcash}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 self-start sm:self-center"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied to Clipboard' : 'Copy GCash Number'}
        </button>
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/70">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
            My Contribution Receipts & Status ({payments.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Period Covered</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No payment submissions found. Click "Submit ₱5.00 Payment" to upload your weekly reference.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const statusColors: Record<string, string> = {
                    'Verified': 'text-emerald-800 bg-emerald-50 border-emerald-200',
                    'Pending': 'text-amber-800 bg-amber-50 border-amber-200',
                    'Rejected': 'text-rose-800 bg-rose-50 border-rose-200'
                  };

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-700 whitespace-nowrap">
                        {p.period_start} to {p.period_end}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-900 tabular-nums whitespace-nowrap">
                        ₱{Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700 whitespace-nowrap">
                        {p.payment_method}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-800 whitespace-nowrap">
                        {p.reference_number}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded border ${
                            statusColors[p.status] || ''
                          }`}
                        >
                          {p.status}
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
            <h2 className="text-base font-bold text-neutral-900">Submit Weekly Garbage Fee</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enter your payment transaction reference for Purok Leader review.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Period From</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Period To</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Fee Amount (PHP)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-medium"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Cash to Leader">Cash to Leader</option>
                    <option value="Maya">Maya</option>
                    <option value="Barangay Hall">Barangay Hall Treasury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">
                  Transaction Reference Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GCASH-9921402831 or Receipt No."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 bg-neutral-50 focus:bg-white text-neutral-900 font-mono uppercase"
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
                  Submit Payment Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
