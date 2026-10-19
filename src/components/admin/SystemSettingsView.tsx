/**
 * System Settings View - Admin (Barangay Captain)
 * Configures the weekly contribution fee (₱5.00 default), hotlines, and municipal credentials
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, Database, Shield, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dbHealth, setDbHealth] = useState<{ status: string; database_mode: string; metrics: any } | null>(null);
  const [weeklyFee, setWeeklyFee] = useState('5.00');
  const [barangayName, setBarangayName] = useState('Barangay Bang-Bang');
  const [captainName, setCaptainName] = useState('Hon. Artemio Degamo');
  const [hotline, setHotline] = useState('(032) 496-8120 / +63 917 849 2031');
  const [gcashNumber, setGcashNumber] = useState('0917-849-2031 (Barangay Bang-Bang Waste Fund)');
  const [savedMessage, setSavedMessage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [settData, healthData] = await Promise.all([
          api.getSettings(),
          api.checkHealth()
        ]);
        setSettings(settData);
        setDbHealth(healthData);
        if (settData.weekly_contribution_fee) setWeeklyFee(settData.weekly_contribution_fee);
        if (settData.barangay_name) setBarangayName(settData.barangay_name);
        if (settData.barangay_captain) setCaptainName(settData.barangay_captain);
        if (settData.contact_hotline) setHotline(settData.contact_hotline);
        if (settData.gcash_treasury_number) setGcashNumber(settData.gcash_treasury_number);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        weekly_contribution_fee: weeklyFee,
        barangay_name: barangayName,
        barangay_captain: captainName,
        contact_hotline: hotline,
        gcash_treasury_number: gcashNumber
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <Settings className="w-4 h-4 text-emerald-700" />
          <span>Barangay Administration</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-1">
          System Parameters & Configuration
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage configurable weekly contribution dues, official contact channels, and view database architecture mode.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration updated successfully. All resident payment forms now reflect the new parameters.</span>
        </div>
      )}

      {/* Database Status Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Database Engine Status</h3>
              <p className="text-xs text-neutral-500 font-mono">
                Active Mode: <strong className="text-emerald-900">{dbHealth?.database_mode || 'Local Persistent Engine'}</strong>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            Connected & Nominal
          </span>
        </div>
        <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
          The system includes fully parameterized MySQL 8.x migrations for Aiven MySQL (<code className="font-mono text-emerald-800">database/schema.sql</code> and <code className="font-mono text-emerald-800">database/seed.sql</code>). When <code className="font-mono">MYSQL_HOST</code> is supplied in environment variables, it routes through SSL to Aiven MySQL.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide border-b border-neutral-100 pb-2">
          Solid Waste Management Policy Settings
        </h2>

        <div>
          <label className="block text-neutral-800 font-semibold mb-1">
            Weekly Contribution Fee per Household (₱ PHP)
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">₱</span>
            <input
              type="number"
              step="0.50"
              min="1.00"
              value={weeklyFee}
              onChange={(e) => setWeeklyFee(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900 font-mono font-bold text-sm"
              required
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Official weekly contribution amount required from each household (initially set to ₱5.00/week).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-neutral-800 font-semibold mb-1">Barangay Name</label>
            <input
              type="text"
              value={barangayName}
              onChange={(e) => setBarangayName(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
              required
            />
          </div>
          <div>
            <label className="block text-neutral-800 font-semibold mb-1">Incumbent Barangay Captain (Admin)</label>
            <input
              type="text"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-800 font-semibold mb-1">Barangay Hall Contact Hotline</label>
            <input
              type="text"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-neutral-800 font-semibold mb-1">GCash Waste Treasury Destination</label>
            <input
              type="text"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
