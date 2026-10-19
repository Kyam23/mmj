/**
 * Collector Tasks Interactive Operations - Role 2
 * Start collection, update progress volume (kg), and mark completed
 */

import React, { useState, useEffect } from 'react';
import { Truck, Play, CheckCircle2, Scale, Clock, AlertCircle, FileText } from 'lucide-react';
import { CollectionSchedule } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CollectorTasks: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<CollectionSchedule | null>(null);

  // Form State
  const [truckNumber, setTruckNumber] = useState('LGU-BangBang-Compactor-01');
  const [collectedVolume, setCollectedVolume] = useState('180');
  const [collectorNotes, setCollectorNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadSchedules = async () => {
    try {
      const data = await api.getSchedules();
      setSchedules(data);
      if (selectedSchedule) {
        const refreshed = data.find((s) => s.id === selectedSchedule.id);
        if (refreshed) setSelectedSchedule(refreshed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleStart = async (s: CollectionSchedule) => {
    try {
      await api.startCollection({
        schedule_id: s.id,
        truck_number: truckNumber,
        notes: collectorNotes || `Collection started in ${s.purok_name}`
      });
      setActionSuccess(`Route started for ${s.purok_name}. Timestamps recorded.`);
      loadSchedules();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to start collection');
    }
  };

  const handleUpdate = async (s: CollectionSchedule) => {
    try {
      await api.updateCollectionProgress({
        schedule_id: s.id,
        collected_volume_kg: Number(collectedVolume) || 0,
        collector_notes: collectorNotes
      });
      setActionSuccess(`Progress updated (${collectedVolume} kg).`);
      loadSchedules();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    }
  };

  const handleComplete = async (s: CollectionSchedule) => {
    if (!confirm(`Mark collection in ${s.purok_name} as COMPLETED? Completion timestamp will be logged.`)) return;
    try {
      await api.completeCollection({
        schedule_id: s.id,
        collected_volume_kg: Number(collectedVolume) || 200,
        collector_notes: collectorNotes || `Collection completed in full for ${s.purok_name}. Dispatched to Cordova MRF.`
      });
      setActionSuccess(`Collection route in ${s.purok_name} completed and verified.`);
      loadSchedules();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to complete collection');
    }
  };

  const mySchedules = schedules.filter((s) => s.collector_id === user?.id || !user?.id);
  const activeSchedules = mySchedules.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
          <Truck className="w-4 h-4 text-amber-700" />
          <span>Garbage Collector Action Panel</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-1">
          Assigned Collection Routes
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Execute assigned collection routes, record compactor truck identifiers, and submit collected volumes.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Active Tasks Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
          Pending & In-Progress Routes ({activeSchedules.length})
        </h2>

        {activeSchedules.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-10 text-center text-xs text-neutral-500">
            Great job! You have no pending collection tasks assigned right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeSchedules.map((s) => {
              const isInProgress = s.status === 'In Progress';
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-xl p-5 border shadow-xs flex flex-col justify-between ${
                    isInProgress ? 'border-sky-300 ring-2 ring-sky-100' : 'border-neutral-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isInProgress
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="text-xs font-mono text-neutral-500">{s.scheduled_date}</span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 mt-2">{s.purok_name}</h3>
                    <p className="text-xs text-neutral-600 mt-0.5 font-mono">{s.time_slot}</p>

                    <div className="mt-3 p-3 bg-neutral-50 rounded-lg text-xs space-y-1.5 border border-neutral-100">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Waste Type:</span>
                        <span className="font-semibold text-neutral-900">{s.waste_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Admin Notes:</span>
                        <span className="text-neutral-700 truncate max-w-[200px]">{s.notes || 'Routine route'}</span>
                      </div>
                      {isInProgress && s.execution_record?.started_at && (
                        <div className="flex justify-between text-sky-800">
                          <span>Route Started:</span>
                          <span className="font-mono">
                            {new Date(s.execution_record.started_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    {!isInProgress ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] text-neutral-500 mb-0.5">Compactor Truck No.</label>
                            <input
                              type="text"
                              value={truckNumber}
                              onChange={(e) => setTruckNumber(e.target.value)}
                              className="w-full p-1.5 border border-neutral-300 rounded text-xs bg-neutral-50 font-mono text-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-neutral-500 mb-0.5">Route Remarks</label>
                            <input
                              type="text"
                              placeholder="e.g. Seaside entry clear"
                              value={collectorNotes}
                              onChange={(e) => setCollectorNotes(e.target.value)}
                              className="w-full p-1.5 border border-neutral-300 rounded text-xs bg-neutral-50 text-neutral-900"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleStart(s)}
                          className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Collection Route Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] text-neutral-600 font-semibold mb-0.5">
                              Tonnage Collected (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={collectedVolume}
                              onChange={(e) => setCollectedVolume(e.target.value)}
                              className="w-full p-1.5 border border-neutral-300 rounded text-xs bg-neutral-50 font-mono font-bold text-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-neutral-600 font-semibold mb-0.5">
                              Collector Notes
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 100% collected from households"
                              value={collectorNotes}
                              onChange={(e) => setCollectorNotes(e.target.value)}
                              className="w-full p-1.5 border border-neutral-300 rounded text-xs bg-neutral-50 text-neutral-900"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(s)}
                            className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium border border-neutral-300 transition-colors"
                          >
                            Update Weight
                          </button>
                          <button
                            onClick={() => handleComplete(s)}
                            className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
