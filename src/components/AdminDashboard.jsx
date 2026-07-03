import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock, RotateCcw, Activity, Users, Plane, Calendar, CreditCard, ArrowRight, RefreshCw as LoopIcon } from 'lucide-react';

import { authHeaders } from '../utils/api';
import { isAdmin } from '../utils/api';

export default function AdminDashboard({ user, addToast, onDisruptionTriggered, onSelectBooking, onLoginClick, onTabChange }) {
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [disruptingId, setDisruptingId] = useState(null);
  const [showOnlyBooked, setShowOnlyBooked] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedFlightForBookings, setSelectedFlightForBookings] = useState(null);
  const [flightBookings, setFlightBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingListError, setBookingListError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = authHeaders(user);
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else if (statsRes.status === 403) {
        addToast('Admin sign-in required. Use admin@skyjet.com / admin123.', 'warning');
      }
      
      const flightsRes = await fetch('/api/admin/flights', { headers });
      if (flightsRes.ok) {
        const flightsData = await flightsRes.json();
        setFlights(flightsData);
      }
    } catch (err) {
      addToast('Error compiling administration control board stats.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin(user) && onLoginClick) {
      onLoginClick('account');
    }
  }, [user, onLoginClick]);

  useEffect(() => {
    if (isAdmin(user)) {
      fetchData();
    }
  }, [user?.email]);

  if (!isAdmin(user)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-12 shadow-sm">
          <div className="h-14 w-14 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
            <div className="text-2xl">🔐</div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Admin Access Required</h3>
          <p className="text-sm text-slate-600 mb-6">Sign in with an administrator account to view and manage flight operations.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                const email = 'admin@skyjet.com';
                const password = 'admin123';
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);
                fetch('/api/login-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.user) {
                      const userData = { ...data.user, firstName: data.user.first_name || 'Admin', lastName: data.user.last_name || 'User' };
                      if (onSelectBooking && typeof window !== 'undefined') {
                        const event = new CustomEvent('adminLogin', { detail: { user: userData, password } });
                        window.dispatchEvent(event);
                      }
                      addToast(`Welcome ${userData.firstName}! Logging in...`, 'success');
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      addToast('Admin login failed', 'warning');
                    }
                  })
                  .catch(() => addToast('Connection error', 'warning'));
              }}
              className="px-6 py-3 bg-brand-blue hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
            >
              Quick Sign In as Admin
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDisrupt = async (flightId, flightNumber, status) => {
    setDisruptingId(flightId);
    try {
      const res = await fetch('/api/admin/disrupt', {
        method: 'POST',
        headers: authHeaders(user),
        body: JSON.stringify({ flight_id: flightId, status }),
      });
      const data = await res.json();
      console.log('Disrupt response:', { status: res.status, data });
      
      if (res.ok) {
        addToast(`✅ Flight ${flightNumber} is now '${status}'`, 'success');
        // Wait a moment then refresh data
        setTimeout(() => fetchData(), 500);
        if (onDisruptionTriggered) {
          onDisruptionTriggered();
        }
      } else {
        addToast(`❌ ${data.error || 'Failed to update flight status.'}`, 'warning');
      }
    } catch (error) {
      console.error('Disrupt error:', error);
      addToast('❌ Server communications error.', 'warning');
    } finally {
      setDisruptingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'On Time':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Boarding':
        return 'bg-blue-50 text-brand-blue border-blue-100 animate-pulse';
      case 'Delayed':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Refund Processed':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // SVGs render helper for Charts
  const renderDoughnutChart = () => {
    if (!stats) return null;
    const dist = stats.charts.flight_status_dist;
    const colors = ['#0f52ba', '#d97706', '#dc2626', '#10b981']; // Blue, Amber, Red, Green
    
    const total = dist.reduce((acc, curr) => acc + curr.count, 0) || 1;
    let accumulatedPercent = 0;
    
    return (
      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
        {/* SVG Drawing */}
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
            {/* Background ring */}
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            
            {dist.map((item, idx) => {
              const percent = (item.count / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = 100 - accumulatedPercent;
              accumulatedPercent += percent;
              
              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-800">{total}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Flights</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 text-xs text-left">
          {dist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
              <span className="font-semibold text-slate-600">{item.name}:</span>
              <strong className="text-slate-800">{item.count} ({Math.round((item.count / total) * 100)}%)</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!stats) return null;
    const bookings = stats.charts.daily_bookings;
    const maxVal = Math.max(...bookings.map(b => b.count), 1);
    
    // SVG Dimensions
    const width = 280;
    const height = 120;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Generate coordinate path points
    const points = bookings.map((b, idx) => {
      const x = padding + (idx / (bookings.length - 1)) * chartWidth;
      const y = padding + chartHeight - (b.count / maxVal) * chartHeight;
      return { x, y, label: b.day, count: b.count };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="space-y-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f52ba" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#0f52ba" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

          {/* Area Fill */}
          <path d={fillPathData} fill="url(#gradient-line)" />

          {/* Line Path */}
          <path d={pathData} fill="none" stroke="#0f52ba" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#0f52ba" strokeWidth="2" className="cursor-pointer hover:r-5 transition-all" />
              <text x={p.x} y={height - 2} textAnchor="middle" className="text-[8px] font-bold fill-slate-400 font-sans">{p.label}</text>
              <text x={p.x} y={p.y - 6} textAnchor="middle" className="text-[8px] font-bold fill-slate-700 font-sans">{p.count}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!stats) return null;
    const rev = stats.charts.revenue;
    const items = [
      { name: 'Gross', amount: rev.total, color: 'bg-blue-600' },
      { name: 'Refunded', amount: rev.refunded, color: 'bg-red-500' },
      { name: 'Net Revenue', amount: rev.net, color: 'bg-emerald-500' }
    ];
    
    const maxAmount = Math.max(...items.map(i => i.amount), 1);

    return (
      <div className="space-y-4 pt-2 text-left">
        {items.map((item, idx) => {
          const widthPercent = (item.amount / maxAmount) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500">{item.name}</span>
                <strong className="text-slate-700">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${widthPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const flightsToRender = (flights || []).filter((f) => {
    if (showOnlyBooked) return (f.bookings_count || 0) > 0;
    return true;
  });

  const openBookingList = async (flight) => {
    setSelectedFlightForBookings(flight);
    setBookingModalOpen(true);
    setBookingListError(null);
    setFlightBookings([]);
    setBookingsLoading(true);

    try {
      const res = await fetch(`/api/admin/flight-bookings/${flight.flight_id}`, {
        headers: authHeaders(user),
      });
      if (res.ok) {
        const bookings = await res.json();
        setFlightBookings(bookings);
      } else {
        setBookingListError('Unable to load bookings for this flight.');
      }
    } catch (err) {
      setBookingListError('Server error loading booking list.');
    } finally {
      setBookingsLoading(false);
    }
  };

  const closeBookingList = () => {
    setBookingModalOpen(false);
    setSelectedFlightForBookings(null);
    setFlightBookings([]);
    setBookingListError(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-all"
            title="Back to Home"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-blue mb-1">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-blue">SkyJet Operations Control</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-brand-blue-dark">Airline Admin Dashboard</h2>
            <p className="text-sm text-slate-400">Monitor bookings trends, compile financial charts, and simulate operations disruptions.</p>
          </div>
        </div>

        <button 
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Board</span>
        </button>
      </div>

      {/* KPI COUNTERS PANEL */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bookings</span>
              <strong className="text-slate-800 text-xl font-extrabold">{stats.counters.total_bookings}</strong>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Passengers</span>
              <strong className="text-slate-800 text-xl font-extrabold">{stats.counters.active_passengers}</strong>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cancelled / Delayed</span>
              <strong className="text-slate-800 text-xl font-extrabold">
                {stats.counters.cancelled_flights} / {stats.counters.delayed_flights}
              </strong>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refund Requests</span>
              <strong className="text-slate-800 text-xl font-extrabold">{stats.counters.refund_requests}</strong>
            </div>
          </div>

        </div>
      )}

      {/* CHARTS CONTAINER GRID */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">Daily Bookings Trend</h4>
            {renderLineChart()}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">Flight Status Distribution</h4>
            {renderDoughnutChart()}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">Revenue &amp; Refunds Simulation</h4>
            {renderBarChart()}
          </div>

        </div>
      )}

      {/* OPERATIONS LIST & DISRUPTION TRIGGERS */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="font-display text-lg font-extrabold text-slate-800">Simulate Disruptions on Scheduled Flights</h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500">Show only flights with bookings</label>
          <input type="checkbox" checked={showOnlyBooked} onChange={() => setShowOnlyBooked(!showOnlyBooked)} />
        </div>
      </div>
      
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {(!flights || flights.length === 0) && !loading ? (
            <div className="p-8 text-center text-sm text-slate-500">No scheduled flights found.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Flight</th>
                <th className="px-5 py-4">Carrier</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Scheduled Departure</th>
                <th className="px-5 py-4">Terminal / Gate</th>
                <th className="px-5 py-4">Bookings</th>
                <th className="px-5 py-4 text-center">Booked</th>
                <th className="px-5 py-4 text-center">Seats Left</th>
                <th className="px-5 py-4">Current Status</th>
                <th className="px-5 py-4 text-right">Operations Controller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flightsToRender.map((f) => (
                <tr key={f.flight_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-700">{f.flight_number}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-400">{f.airline}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">
                    {f.origin.split(' ')[0]} → {f.destination.split(' ')[0]}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 font-semibold">{f.scheduled_time}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{f.terminal} / Gate {f.gate}</td>
                  <td className="px-5 py-4 text-left text-xs text-slate-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(f.bookings_preview || []).map((bId) => (
                        <button
                          key={bId}
                          onClick={() => onSelectBooking ? onSelectBooking(bId) : null}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-mono hover:bg-slate-200 transition-colors"
                          title={`Open booking ${bId}`}
                        >
                          {bId}
                        </button>
                      ))}
                      {f.bookings_more > 0 && (
                        <button
                          onClick={() => openBookingList(f)}
                          className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[11px] hover:bg-slate-100 transition-colors"
                          title="View all bookings for this flight"
                        >
                          +{f.bookings_more} more
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-xs font-semibold text-slate-700">{f.bookings_count || 0}</td>
                  <td className="px-5 py-4 text-center text-xs font-bold text-slate-700">{f.seats_left}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(f.status)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${f.status === 'Cancelled' ? 'bg-red-500' : f.status === 'Delayed' ? 'bg-amber-500' : 'bg-brand-green'}`}></span>
                      {f.status} {f.delay_duration && `(${f.delay_duration})`}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Cancelled')}
                        disabled={f.status === 'Cancelled' || disruptingId === f.flight_id}
                        className="px-2 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-600"
                        title="Simulate Cancellation"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Delayed')}
                        disabled={f.status === 'Delayed' || disruptingId === f.flight_id}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-amber-50 disabled:hover:text-amber-700"
                        title="Simulate Delay"
                      >
                        Delay
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'Boarding')}
                        disabled={f.status === 'Boarding' || disruptingId === f.flight_id}
                        className="px-2 py-1 bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-blue-50 disabled:hover:text-brand-blue"
                        title="Simulate Boarding"
                      >
                        Board
                      </button>

                      <button
                        onClick={() => handleDisrupt(f.flight_id, f.flight_number, 'On Time')}
                        disabled={f.status === 'On Time' || disruptingId === f.flight_id}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-brand-green hover:text-white border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-emerald-50 disabled:hover:text-brand-green"
                        title="Restore to On Time"
                      >
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          )}
        </div>
      </div>

      {bookingModalOpen && selectedFlightForBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bookings for {selectedFlightForBookings.flight_number}</h3>
                <p className="text-sm text-slate-500">{selectedFlightForBookings.origin} → {selectedFlightForBookings.destination}</p>
              </div>
              <button
                onClick={closeBookingList}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-6">
              {bookingsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading bookings…</div>
              ) : bookingListError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{bookingListError}</div>
              ) : flightBookings.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No bookings were found for this flight.</div>
              ) : (
                <div className="space-y-3">
                  {flightBookings.map((book) => (
                    <div key={book.booking_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-1 rounded-md bg-white text-xs font-semibold text-slate-700 border border-slate-200">{book.booking_id}</span>
                          <span className="text-xs text-slate-500">{book.first_name} {book.last_name}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Seat: {book.seat || 'N/A'} • {book.booking_date || 'Unknown date'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{book.status || 'Confirmed'}</span>
                        <button
                          onClick={() => onSelectBooking ? onSelectBooking(book.booking_id) : null}
                          className="rounded-xl bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-blue/90"
                        >
                          Open Booking
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}    </div>
  );
}
