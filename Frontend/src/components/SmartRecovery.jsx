import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, ArrowRight, CheckCircle2, ChevronRight, AlertTriangle, ArrowLeft, Loader } from 'lucide-react';

export default function SmartRecovery({ flight, user, onRebookSuccess, onRefundSuccess, addToast }) {
  const [step, setStep] = useState('options'); // 'options', 'flights', 'confirm', 'done'
  const [selectedCategory, setSelectedCategory] = useState(null); // 'tomorrow', 'tonight', 'refund'
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [availableFlights, setAvailableFlights] = useState({ tonight: [], tomorrow: [] });
  const [refundInfo, setRefundInfo] = useState({ amount: 540.00, cardLast4: '4321' });
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [flightType, setFlightType] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch available recovery options from the backend
  useEffect(() => {
    if (!user?.bookingId) return;
    const fetchRecovery = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recovery/${user.bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableFlights({
            tonight: data.options.tonight || [],
            tomorrow: data.options.tomorrow || [],
          });
          setRefundInfo({
            amount: data.refund_amount || 540.00,
            cardLast4: data.card_last4 || '4321',
          });
          setRecoveryNotes(data.recovery_notes || '');
          setFlightType(data.flightType || '');
        }
      } catch {
        addToast('Could not load recovery options from server.', 'warning');
      } finally {
        setLoading(false);
      }
    };
    fetchRecovery();
  }, [user?.bookingId]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    if (category === 'refund') {
      setStep('confirm');
    } else {
      setStep('flights');
    }
  };

  const handleSelectFlight = (flt) => {
    setSelectedFlight(flt);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      if (selectedCategory === 'refund') {
        const res = await fetch('/api/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: user.bookingId }),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || 'Refund failed. Please try again.', 'warning');
          return;
        }
        onRefundSuccess(data.booking.flight);
        addToast(`Refund of $${refundInfo.amount.toFixed(2)} processed successfully to card *${refundInfo.cardLast4}.`, 'success');
        setStep('done');
      } else {
        const res = await fetch('/api/rebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: user.bookingId,
            new_flight_id: selectedFlight.flight_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || 'Rebooking failed. Please try again.', 'warning');
          return;
        }
        onRebookSuccess(data.booking.flight);
        addToast(`Successfully rebooked to flight ${selectedFlight.flight_number}.`, 'success');
        setStep('done');
      }
    } catch {
      addToast('Server error during confirmation. Please try again.', 'warning');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setStep('options');
    setSelectedCategory(null);
    setSelectedFlight(null);
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/15 p-6 shadow-sm">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-red-100 pb-4 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <AlertTriangle className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-red-950">Disruption Recovery Assistant</h3>
          <p className="text-xs text-red-700">Flight {flight?.flightNumber || 'SJ-412'} is cancelled. Choose a recovery option below at no extra cost.</p>
          {flightType && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mt-1">{flightType} route</p>
          )}
        </div>
      </div>

      {recoveryNotes && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
          {recoveryNotes}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader className="w-5 h-5 animate-spin text-brand-blue" />
          <span className="text-sm">Loading recovery options…</span>
        </div>
      )}

      {/* STEP 1: OPTIONS */}
      {!loading && step === 'options' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            
            {/* Option A */}
            <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-brand-blue hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-brand-blue">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-sm">Option A</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Flight Tomorrow</h4>
                <p className="text-xs text-slate-400 mt-1">Rebook on next-day flights. Morning &amp; afternoon departures available.</p>
              </div>
              <button 
                onClick={() => handleSelectCategory('tomorrow')}
                className="mt-6 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all cursor-pointer"
              >
                <span>Choose Flight</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option B */}
            <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-brand-blue hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-brand-green">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-sm">Option B</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Flight Tonight</h4>
                <p className="text-xs text-slate-400 mt-1">Rebook on night flights departing within the next 4 hours.</p>
              </div>
              <button 
                onClick={() => handleSelectCategory('tonight')}
                className="mt-6 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all cursor-pointer"
              >
                <span>Choose Flight</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option C */}
            <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-red-500 hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-500">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-sm">Option C</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Instant Refund</h4>
                <p className="text-xs text-slate-400 mt-1">Cancel booking and receive a full credit card refund instantly.</p>
              </div>
              <button 
                onClick={() => handleSelectCategory('refund')}
                className="mt-6 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer"
              >
                <span>Process Refund</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: AVAILABLE FLIGHTS LIST */}
      {!loading && step === 'flights' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-blue transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Options</span>
            </button>
            <span className="text-xs font-semibold text-slate-400">Step 2 of 3: Select Alternative Flight</span>
          </div>

          <h4 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">
            Available Flights ({selectedCategory === 'tomorrow' ? 'Tomorrow' : 'Tonight'})
          </h4>

          <div className="grid gap-3">
            {(availableFlights[selectedCategory] || []).map((flt) => (
              <div 
                key={flt.flight_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-blue hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50 text-brand-blue font-bold text-xs text-center leading-tight">
                    {flt.flight_number}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{flt.scheduled_time}</div>
                    <div className="text-xs text-slate-400">Gate: {flt.gate} | Status: <span className={flt.status === 'Boarding' ? 'text-brand-blue font-semibold' : 'text-brand-green font-semibold'}>{flt.status}</span></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0">
                  <span className="text-xs text-slate-400">{flt.seats_left} seats left</span>
                  <button
                    onClick={() => handleSelectFlight(flt)}
                    className="px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Select Flight
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRMATION */}
      {!loading && step === 'confirm' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button 
              onClick={selectedCategory === 'refund' ? handleReset : () => setStep('flights')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-blue transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span className="text-xs font-semibold text-slate-400">Step 3 of 3: Confirm Request</span>
          </div>

          <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-xs">
            {selectedCategory === 'refund' ? (
              <div>
                <h4 className="font-bold text-red-700 text-base mb-2">Request Full Refund</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You are filing a refund claim for booking reference <strong className="font-mono">{user?.bookingId}</strong>. 
                  A total of <strong className="text-slate-800">${refundInfo.amount.toFixed(2)}</strong> will be credited back to your card ending in <strong className="font-mono">{refundInfo.cardLast4}</strong>.
                </p>
                <div className="mt-4 p-3 bg-red-50 text-xs text-red-800 rounded-lg">
                  <strong>Notice:</strong> This action cannot be undone. Your flight ticket will be officially cancelled.
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-bold text-brand-blue-dark text-base mb-2">Confirm Your New Itinerary</h4>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Original Flight</span>
                    <strong className="text-sm text-slate-700">{flight?.flightNumber} (Cancelled)</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">New Flight</span>
                    <strong className="text-sm text-brand-blue">{selectedFlight?.flight_number}</strong>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  <p><strong>Departure Time:</strong> {selectedFlight?.scheduled_time}</p>
                  <p><strong>Gate Assignment:</strong> Gate {selectedFlight?.gate}</p>
                  <p><strong>Status:</strong> {selectedFlight?.status}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={confirming}
              className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className={`flex-1 py-3 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 ${
                selectedCategory === 'refund' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-brand-green hover:bg-emerald-600'
              }`}
            >
              {confirming && <Loader className="w-4 h-4 animate-spin" />}
              {selectedCategory === 'refund' ? 'Confirm Refund' : 'Confirm Rebooking'}
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: DONE SCREEN */}
      {!loading && step === 'done' && (
        <div className="py-6 text-center animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-brand-green mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h4 className="font-display text-xl font-bold text-slate-800">Request Processed!</h4>
          
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {selectedCategory === 'refund' 
              ? `Your refund of $${refundInfo.amount.toFixed(2)} is processing. A confirmation email has been sent to ${user?.email}.`
              : `You are all set! Your booking has been updated to Flight ${selectedFlight?.flight_number || ''}.`
            }
          </p>

          <button
            onClick={handleReset}
            className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Back to Recovery Portal
          </button>
        </div>
      )}

    </div>
  );
}
