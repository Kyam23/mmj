/**
 * Payment Verification View - Role 3: Purok Leader
 * Review and verify resident weekly ₱5.00 contributions with GCash/Cash references
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Check, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { PaymentSubmission } from '../../types';
import { api } from '../../services/api';

export const PaymentVerificationView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('Pending');
  const [rejectionReasons, setRejectionReasons] = useState<{ [id: string]: string }>({});
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (paymentId: string, status: 'Verified' | 'Rejected') => {
    const reason = rejectionReasons[paymentId] || 'Reference number not matching bank/GCash records.';
    try {
      await api.verifyPayment({
        payment_id: paymentId,
        status,
        rejection_reason: status === 'Rejected' ? reason : undefined
      });
      setMessage(`Payment was ${status.toLowerCase()}. Resident notified.`);
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Payment review failed');
    }
  };

  const filtered = payments.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
          <Receipt className="w-4 h-4 text-teal-700" />
          <span>Purok Solid Waste Treasury Verification</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-1">
          Weekly Garbage Contribution Verification
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Review resident payment reference numbers (₱5.00/week) submitted via GCash, Maya, or direct Cash.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-200/60 rounded-xl w-fit">
        <button
          onClick={() => setFilterStatus('Pending')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterStatus === 'Pending' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Pending Verifications ({payments.filter((p) => p.status === 'Pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('Verified')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterStatus === 'Verified' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Approved ({payments.filter((p) => p.status === 'Verified').length})
        </button>
        <button
          onClick={() => setFilterStatus('Rejected')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterStatus === 'Rejected' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Rejected ({payments.filter((p) => p.status === 'Rejected').length})
        </button>
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterStatus === '' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          All Payments
        </button>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-10 text-center text-xs text-neutral-500">
            No payment submissions currently found under this filter.
          </div>
        ) : (
          filtered.map((pay) => {
            const isPending = pay.status === 'Pending';
            return (
              <div
                key={pay.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900">{pay.resident_name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {pay.household_number}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        Period: {pay.period_start} to {pay.period_end}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-emerald-900 text-base">
                        ₱{Number(pay.amount).toFixed(2)}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="font-semibold text-neutral-700">{pay.payment_method}</span>
                      <span className="text-neutral-400">·</span>
                      <span className="font-mono text-neutral-600">Ref: {pay.reference_number}</span>
                    </div>

                    {pay.rejection_reason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                        <span className="font-semibold">Rejection Note: </span>
                        {pay.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Actions / Status */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                        pay.status === 'Verified'
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : pay.status === 'Rejected'
                          ? 'text-rose-800 bg-rose-50 border-rose-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {pay.status}
                    </span>

                    {isPending && (
                      <div className="w-full sm:w-auto mt-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Rejection note if invalid..."
                          value={rejectionReasons[pay.id] || ''}
                          onChange={(e) =>
                            setRejectionReasons({ ...rejectionReasons, [pay.id]: e.target.value })
                          }
                          className="w-full text-xs p-1.5 border border-neutral-300 rounded bg-neutral-50 text-neutral-900"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecision(pay.id, 'Rejected')}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject Reference
                          </button>
                          <button
                            onClick={() => handleDecision(pay.id, 'Verified')}
                            className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Verify ₱5.00 Paid
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
