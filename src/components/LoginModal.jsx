import React, { useState } from 'react';
import { X, Key, Mail, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, mode = 'retrieve', onClose, onLogin, onAccountLogin }) {
  const [activeMode, setActiveMode] = useState(mode); // 'retrieve', 'login', 'signup'
  
  // Single Booking Retrieve state
  const [bookingId, setBookingId] = useState('SJ987');
  const [firstNameLookup, setFirstNameLookup] = useState('Rajesh');
  const [lastNameLookup, setLastNameLookup] = useState('Patel');
  
  // Account Sign In / Sign Up state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setActiveMode(mode);
    setError('');
  }, [mode, isOpen]);

  if (!isOpen) return null;

  // Retrieve single booking handler
  const handleRetrieveSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId || !firstNameLookup || !lastNameLookup) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          first_name: firstNameLookup,
          last_name: lastNameLookup
        })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        onClose();
      } else {
        setError(data.error || 'Booking reference not found.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Sign In handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onAccountLogin(data.user, data.bookings, password);
        onClose();
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login after sign up
        const loginRes = await fetch('/api/login-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onAccountLogin(loginData.user, loginData.bookings, password);
          onClose();
        } else {
          setActiveMode('login');
          setError('Account created! Please sign in.');
        }
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = () => {
    setBookingId('SJ987');
    setFirstNameLookup('Rajesh');
    setLastNameLookup('Patel');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Modal Card */}
      <div 
        className="w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-2xl overflow-hidden transform scale-100 transition-transform duration-300"
        style={{ animation: 'zoomIn 0.25s ease-out' }}
      >
        
        {/* Header */}
        <div className="relative bg-brand-blue-dark p-6 text-white text-left">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">
                {activeMode === 'retrieve' && 'Retrieve Your Booking'}
                {activeMode === 'login' && 'Passenger Sign In'}
                {activeMode === 'signup' && 'Create SkyJet Profile'}
              </h3>
              <p className="text-xs text-blue-200">
                {activeMode === 'retrieve' && 'Enter booking details to access disruption recovery'}
                {activeMode === 'login' && 'Access all booked itineraries'}
                {activeMode === 'signup' && 'Sign up to manage all future travel itineraries'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500">
          <button
            onClick={() => { setActiveMode('retrieve'); setError(''); }}
            className={`flex-1 py-3 border-b-2 transition-all cursor-pointer ${
              activeMode === 'retrieve' 
                ? 'border-brand-blue text-brand-blue-dark bg-slate-50/40' 
                : 'border-transparent hover:text-brand-blue hover:bg-slate-50/20'
            }`}
          >
            Retrieve Booking
          </button>
          <button
            onClick={() => { setActiveMode('login'); setError(''); }}
            className={`flex-1 py-3 border-b-2 transition-all cursor-pointer ${
              activeMode === 'login' || activeMode === 'signup'
                ? 'border-brand-blue text-brand-blue-dark bg-slate-50/40' 
                : 'border-transparent hover:text-brand-blue hover:bg-slate-50/20'
            }`}
          >
            Passenger Portal
          </button>
        </div>

        {/* Body content based on active mode */}
        <div className="p-6 text-left">
          {error && (
            <div className="mb-4 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* MODE 1: RETRIEVE SINGLE BOOKING */}
          {activeMode === 'retrieve' && (
            <form onSubmit={handleRetrieveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Booking Reference (ID)</label>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="e.g. SJ987"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstNameLookup}
                  onChange={(e) => setFirstNameLookup(e.target.value)}
                  placeholder="e.g. Rajesh"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastNameLookup}
                  onChange={(e) => setLastNameLookup(e.target.value)}
                  placeholder="e.g. Patel"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Retrieve Booking</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                <span className="text-[11px] text-slate-400 text-center font-semibold">Demo Sandbox Quick Start:</span>
                <button
                  type="button"
                  onClick={autofillDemo}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-blue hover:border-brand-blue transition-all cursor-pointer"
                >
                  Autofill SJ987 Booking (Cancelled Flight)
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: ACCOUNT LOGIN */}
          {activeMode === 'login' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Sign In</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">
                  New to SkyJet?{' '}
                  <button 
                    type="button"
                    onClick={() => { setActiveMode('signup'); setError(''); }}
                    className="text-brand-blue font-bold hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* MODE 3: ACCOUNT SIGN UP */}
          {activeMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sid"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Patel"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sid.patel@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Choose Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Register Account</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setActiveMode('login'); setError(''); }}
                    className="text-brand-blue font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </form>
          )}

        </div>
      </div>

      <style>{`
        @keyframes zoomIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
