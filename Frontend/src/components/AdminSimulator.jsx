import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, AlertTriangle, Clock, RotateCcw, Activity } from 'lucide-react';
import { authHeaders } from '../utils/api';

export default function AdminSimulator({ user, addToast, onDisruptionTriggered }) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/flights', { headers: authHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
      }
    } catch {
      addToast('Error fetching flights for administrator view.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleDisrupt = async (flightId, flightNumber, status) => {
    try {
      const res = await fetch('/api/admin/disrupt', {
        method: 'POST',
        headers: authHeaders(user),
        body: JSON.stringify({ flight_id: flightId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Simulated status: Flight ${flightNumber} is now '${status}'`, 'info');
        fetchFlights();
        if (onDisruptionTriggered) {
          onDisruptionTriggered();
        }
      } else {
        addToast(data.error || 'Failed to trigger simulation status. Admin access required.', 'warning');
      }
    } catch {
      addToast('Communication error with Flask server.', 'warning');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'On Time':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Boarding':
        return 'bg-blue-50 text-brand-blue border-blue-200';
      case 'Delayed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Refund Processed':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">SkyJet Flight Control Center</span>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-brand-blue-dark">Interactive Disruption Simulator</h2>
          <p className="text-sm text-slate-400">Trigger live cancellations or delays to see how the customer self-service recovery engine responds.</p>
        </div>

        <button 
          onClick={fetchFlights}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Board</span>
        </button>
      </div>

      {/* FLIGHT CONTROL TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Flight</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Scheduled Departure</th>
                <th className="px-6 py-4 text-center">Seats Left</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Simulation Commands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flights.map((f) => (
                <tr key={f.flight_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{f.flight_number}</td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">{f.origin.split(' ')[0]} → {f.destination.split(' ')[0]}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{f.scheduled_time}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">{f.seats_left}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Cancelled')}
                        disabled={f.status === 'Cancelled'}
                        className="px-2 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-600"
                        title="Simulate Flight Cancelled"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Cancel
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Delayed')}
                        disabled={f.status === 'Delayed'}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-amber-50 disabled:hover:text-amber-700"
                        title="Simulate Flight Delayed"
                      >
                        <Clock className="w-3 h-3" />
                        Delay
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Boarding')}
                        disabled={f.status === 'Boarding'}
                        className="px-2 py-1 bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-blue-50 disabled:hover:text-brand-blue"
                        title="Simulate Boarding"
                      >
                        <Play className="w-3 h-3" />
                        Board
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'On Time')}
                        disabled={f.status === 'On Time'}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-brand-green hover:text-white border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-emerald-50 disabled:hover:text-brand-green"
                        title="Restore to On Time"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Explanatory visual callout */}
      <div className="mt-6 rounded-2xl bg-blue-50/50 border border-blue-100 p-4 text-xs text-brand-blue-dark leading-relaxed">
        💡 **How to Test:** 
        1. Book a flight under the **Book Flight** tab and keep a record of your Booking PNR.
        2. Click **Simulator** here and click **Cancel** or **Delay** next to that flight number.
        3. Go to the **Manage Booking** section, input the PNR and your Last Name. 
        4. The disruption helper automatically activates. Try rebooking or refunding, and see how seats and itineraries update dynamically!
      </div>

    </div>
  );
}
