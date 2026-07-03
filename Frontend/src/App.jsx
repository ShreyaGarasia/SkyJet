import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import BookFlight from './components/BookFlight';
import AdminSimulator from './components/AdminSimulator';
import AdminDashboard from './components/AdminDashboard';
import TripsProfile from './components/TripsProfile';
import Chatbot from './components/Chatbot';
import Toast from './components/Toast';
import { Star } from 'lucide-react';
import {
  saveUserSession,
  saveActiveBooking,
  clearActiveBooking,
  saveCurrentTab,
  loadPersistedAppState,
  clearAllSession,
} from './utils/sessionStorage';
import { isAdmin } from './utils/api';

function App() {
  // Navigation & session state
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'book', 'simulator', 'profile'
  const [user, setUser] = useState(null); // passenger account user details (email, firstName, lastName)
  const [userBookings, setUserBookings] = useState([]);
  const [tripsData, setTripsData] = useState({ upcoming: [], completed: [], cancelled: [], all: [] });
  
  // Retrieved single booking state (active in dashboard)
  const [retrievedBooking, setRetrievedBooking] = useState(null);
  const [flight, setFlight] = useState(null);
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('retrieve');
  const [toasts, setToasts] = useState([]);
  const [sessionReady, setSessionReady] = useState(false);

  const mapFlightFromApi = (apiFlightData) => {
    if (!apiFlightData) return null;
    return {
      flightNumber: apiFlightData.flight_number,
      origin: apiFlightData.origin,
      destination: apiFlightData.destination,
      scheduledTime: apiFlightData.scheduled_time,
      gate: apiFlightData.gate,
      terminal: apiFlightData.terminal,
      flightType: apiFlightData.flightType,
      status: apiFlightData.status,
      flightId: apiFlightData.flight_id,
    };
  };

  const mapPassengerFromApi = (passenger) => ({
    bookingId: passenger.booking_id,
    firstName: passenger.first_name,
    lastName: passenger.last_name,
    email: passenger.email,
    phone: passenger.phone || '',
    seat: passenger.seat || '',
    fareCategory: passenger.fare_category || 'Premium Economy (Refundable)',
    bookingDate: passenger.booking_date || '',
    refundAmount: passenger.refund_amount,
    cardLast4: passenger.card_last4,
  });

  // Helper to fetch/refresh trips list
  const refreshUserBookings = useCallback(async (email, password) => {
    if (!email || !password) return;
    try {
      let bookings = [];
      const res = await fetch('/api/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        bookings = data.bookings || [];
        setUserBookings(bookings);
      }
      const tripsRes = await fetch(`/api/my-trips?email=${encodeURIComponent(email)}`);
      if (tripsRes.ok) {
        const trips = await tripsRes.json();
        setTripsData(trips);
        setUserBookings(trips.all?.length ? trips.all : bookings);
      }
    } catch (err) {
      console.error('Error refreshing bookings:', err);
    }
  }, []);

  // Toast notifications helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const applyRetrievedBooking = useCallback((apiData, { showToast = true, switchTab = true } = {}) => {
    const { passenger, flight: flightData } = apiData;
    setRetrievedBooking(mapPassengerFromApi(passenger));
    setFlight(mapFlightFromApi(flightData));
    saveActiveBooking(passenger.booking_id, passenger.last_name);
    if (switchTab) {
      setCurrentTab('home');
      saveCurrentTab('home');
    }
    if (showToast) {
      addToast(`Booking ${passenger.booking_id} retrieved successfully!`, 'success');
    }
  }, []);

  const restoreActiveBooking = useCallback(async (bookingId, lastName, showToast = false, switchTab = false) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, last_name: lastName }),
      });
      const data = await res.json();
      if (res.ok) {
        applyRetrievedBooking(data, { showToast, switchTab });
        return true;
      }
      clearActiveBooking();
    } catch {
      clearActiveBooking();
    }
    return false;
  }, [applyRetrievedBooking]);

  // Restore session, tab, and active booking on page load
  useEffect(() => {
    const restore = async () => {
      const persisted = loadPersistedAppState();

      if (persisted.user && persisted.session) {
        setUser(persisted.user);
        await refreshUserBookings(persisted.session.email, persisted.session.password);
        let tab = persisted.currentTab || (persisted.user.role === 'admin' ? 'admin' : 'profile');
        if (persisted.user.role === 'admin' && ['book', 'profile'].includes(tab)) tab = 'admin';
        if (persisted.user.role === 'customer' && tab === 'admin') tab = 'home';
        setCurrentTab(tab);
      } else if (persisted.user) {
        setUser(persisted.user);
        await refreshUserBookings(persisted.user.email, 'password');
        let tab = persisted.currentTab || (persisted.user.role === 'admin' ? 'admin' : 'profile');
        if (persisted.user.role === 'admin' && ['book', 'profile'].includes(tab)) tab = 'admin';
        if (persisted.user.role === 'customer' && tab === 'admin') tab = 'home';
        setCurrentTab(tab);
      } else if (persisted.currentTab) {
        setCurrentTab(persisted.currentTab);
      }

      if (persisted.activeBooking?.bookingId && persisted.activeBooking?.lastName) {
        await restoreActiveBooking(
          persisted.activeBooking.bookingId,
          persisted.activeBooking.lastName,
          false,
          !persisted.user
        );
      }

      setSessionReady(true);
    };

    restore();
  }, [refreshUserBookings, restoreActiveBooking]);

  useEffect(() => {
    if (sessionReady) {
      saveCurrentTab(currentTab);
    }
  }, [currentTab, sessionReady]);

  const getStoredCredentials = () => loadPersistedAppState().session;

  // ----------------- EVENT HANDLERS -----------------

  // 1. Single Booking PNR Lookup (Manage Booking)
  const handleRetrieveBooking = (apiData) => {
    applyRetrievedBooking(apiData, { showToast: true, switchTab: true });
  };

  // Open booking by ID (admin can open without passenger last name)
  const handleOpenBookingById = async (bookingId) => {
    try {
      const res = await fetch(`/api/booking/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        handleRetrieveBooking(data);
      } else {
        addToast('Booking not found.', 'warning');
      }
    } catch {
      addToast('Error fetching booking details.', 'warning');
    }
  };


  // 2. User Account Login
  const handleAccountLogin = (userData, bookingsList, password) => {
    setUser(userData);
    setUserBookings(bookingsList);
    saveUserSession(userData, password);
    if (isAdmin(userData)) {
      setCurrentTab('admin');
      saveCurrentTab('admin');
      addToast(`Welcome Admin ${userData.firstName}!`, 'success');
    } else {
      setCurrentTab('profile');
      saveCurrentTab('profile');
      addToast(`Signed in as ${userData.firstName} ${userData.lastName}!`, 'success');
      refreshUserBookings(userData.email, password);
    }
  };

  // 3. Log out passenger session
  const handleLogout = () => {
    setUser(null);
    setUserBookings([]);
    setTripsData({ upcoming: [], completed: [], cancelled: [], all: [] });
    setRetrievedBooking(null);
    setFlight(null);
    clearAllSession();
    setCurrentTab('home');
    addToast('Logged out of session.', 'info');
  };

  const handleTabChange = (tab) => {
    if (isAdmin(user) && ['book', 'profile'].includes(tab)) {
      addToast('Admin accounts cannot book passenger flights.', 'warning');
      return;
    }
    if (user && user.role === 'customer' && tab === 'admin') {
      addToast('Admin access required.', 'warning');
      return;
    }
    setCurrentTab(tab);
    saveCurrentTab(tab);
  };

  // 4. Booking Completion from BookFlight component
  const handleBookingComplete = () => {
    const creds = getStoredCredentials();
    if (user && creds?.password) {
      refreshUserBookings(user.email, creds.password);
    }
  };

  // 5. Navigate to retrieve search automatically (after booking a flight)
  const handleNavigateToRetrieve = async (bookingId, lastName) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, last_name: lastName })
      });
      const data = await res.json();
      if (res.ok) {
        handleRetrieveBooking(data);
      } else {
        addToast('Error retrieving booking reference.', 'warning');
      }
    } catch {
      addToast('Error connecting to server.', 'warning');
    }
  };

  // 6. Simulator Disruption Triggered Callback (sync views)
  const handleDisruptionTriggered = async () => {
    // Refresh retrieved booking details if active
    if (retrievedBooking) {
      try {
        const res = await fetch(`/api/booking/${retrievedBooking.bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setFlight(mapFlightFromApi(data.flight));
        }
      } catch (err) {
        console.error("Error refreshing active flight:", err);
      }
    }
    // Refresh profile booking lists if user is logged in
    if (user) {
      const creds = getStoredCredentials();
      if (creds?.password) refreshUserBookings(user.email, creds.password);
    }
  };

  // 7. Simulating live status inside retrieved booking card
  const handleSimulateStatus = async (newStatus) => {
    if (!retrievedBooking) return;
    if (!isAdmin(user)) {
      addToast('Admin access required to change flight status.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/simulate-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: retrievedBooking.bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlight(mapFlightFromApi(data.booking.flight));
        addToast(`Simulated flight status as '${newStatus}'`, 'info');
        if (user) {
          const creds = getStoredCredentials();
          if (creds?.password) refreshUserBookings(user.email, creds.password);
        }
      } else {
        addToast(data.error || 'Failed to update simulation status.', 'warning');
      }
    } catch {
      addToast('Server communication error.', 'warning');
    }
  };

  const handleRebookSuccess = (newFlightData) => {
    setFlight(mapFlightFromApi(newFlightData));
    const creds = getStoredCredentials();
    if (user && creds?.password) refreshUserBookings(user.email, creds.password);
  };

  const handleRefundSuccess = (updatedFlightData) => {
    setFlight(mapFlightFromApi(updatedFlightData));
    const creds = getStoredCredentials();
    if (user && creds?.password) refreshUserBookings(user.email, creds.password);
  };

  const triggerLoginOpen = (initialMode = 'retrieve') => {
    setLoginModalMode(initialMode);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-blue selection:text-white">
      
      {/* Navigation Header */}
      <Navbar 
        user={user} 
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onLoginClick={triggerLoginOpen} 
        onLogout={handleLogout}
        retrievedBooking={retrievedBooking}
        addToast={addToast}
      />

      {/* Main Container Switch */}
      <main className="flex-1">
        
        {/* TAB 1: HOME & RETRIEVER / DASHBOARD */}
        {currentTab === 'home' && (
          <div>
            {retrievedBooking ? (
              <div id="dashboard-top" className="animate-fade-in scroll-mt-20">
                <div className="bg-gradient-to-b from-blue-50/50 to-transparent">
                  
                  {/* Close Dashboard Button */}
                  <div className="max-w-7xl mx-auto px-6 pt-6 md:px-8 text-left">
                    <button
                      onClick={() => {
                        setRetrievedBooking(null);
                        setFlight(null);
                        clearActiveBooking();
                      }}
                      className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all"
                    >
                      ← Close Booking Dashboard
                    </button>
                  </div>

                  <Dashboard 
                      user={retrievedBooking}
                      flight={flight}
                      allowSimulate={isAdmin(user)}
                      onSimulateStatus={handleSimulateStatus}
                      onRebookSuccess={handleRebookSuccess}
                      onRefundSuccess={handleRefundSuccess}
                      addToast={addToast}
                    />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Hero Landing Search Box */}
                <Hero 
                  onSearchSubmit={handleNavigateToRetrieve} 
                  onLoginClick={() => triggerLoginOpen('retrieve')}
                />

                {/* FAQ Promise & Rules (Static sections) */}
                <section id="about" className="py-20 bg-white border-t border-slate-100 scroll-mt-20">
                  <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                      
                      <div className="text-left space-y-6">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                        <h2 className="font-display text-3xl font-extrabold text-brand-blue-dark tracking-tight sm:text-4xl">
                          SkyJet Premium Passenger Promise
                        </h2>
                        <p className="text-slate-500 leading-relaxed">
                          We believe air travel should be pleasant from booking to landing. Our team works tirelessly to keep delays minimal and operations fluid. And when bad weather or crew delays strike, our smart technology guarantees you choices immediately.
                        </p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-sm">99.8% Reliability</h4>
                            <p className="text-xs text-slate-400">Industry-leading on-time departure metrics.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-sm">Smart Recovery</h4>
                            <p className="text-xs text-slate-400">100% digital self-service flight rebooking.</p>
                          </div>
                        </div>
                      </div>

                      {/* Graphic Promo Panel */}
                      <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green/80 p-8 text-white flex flex-col justify-between overflow-hidden shadow-xl">
                        <div className="absolute inset-0 z-0 opacity-10">
                          <div className="absolute -top-10 -left-10 w-40 h-40 border-4 border-white rounded-full"></div>
                          <div className="absolute -bottom-10 -right-10 w-60 h-60 border-4 border-white rounded-full"></div>
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <span className="font-display text-xl font-bold italic tracking-wide">SkyJet Elite</span>
                          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Priority Member</span>
                        </div>

                        <div className="relative z-10 text-left space-y-2">
                          <h3 className="text-2xl font-bold font-display leading-tight">Elevating standard travel to extraordinary heights.</h3>
                          <p className="text-xs text-white/80">Exclusive airport lounge access, priority boarding, and full flexibility standard on all bookings.</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </section>

                {/* FAQ & Service Rules Section */}
                <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100 scroll-mt-20">
                  <div className="mx-auto max-w-4xl px-6 md:px-8 text-left">
                    <h2 className="font-display text-3xl font-bold text-brand-blue-dark text-center mb-12">Disruption FAQs</h2>
                    
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs">
                        <h4 className="font-bold text-slate-800 mb-2">What happens if my flight is cancelled by SkyJet?</h4>
                        <p className="text-sm text-slate-500">
                          You are instantly eligible for a free flight change tonight, tomorrow, or a full refund back to your original payment. Our smart recovery engine allows you to process these choices directly in seconds.
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs">
                        <h4 className="font-bold text-slate-800 mb-2">Does weather disruptions impact my refund eligibility?</h4>
                        <p className="text-sm text-slate-500">
                          Severe weather delays authorize free flight changes to any open flight. In addition, passengers can opt to cancel for a full refund or future credit depending on specific location guidelines.
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs">
                        <h4 className="font-bold text-slate-800 mb-2">How fast are refund requests processed?</h4>
                        <p className="text-sm text-slate-500">
                          Refund claims processed digitally via the portal or the AI support chatbot are approved immediately. The credit reflects on your banking card statement in 3 to 5 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOK A FLIGHT */}
        {currentTab === 'book' && !isAdmin(user) && (
          <div className="animate-fade-in">
            <BookFlight 
              user={user}
              addToast={addToast}
              onBookingComplete={handleBookingComplete}
              onNavigateToRetrieve={handleNavigateToRetrieve}
            />
          </div>
        )}

        {/* TAB 3: ADMIN DASHBOARD (full operations control) */}
        {currentTab === 'admin' && (
          <div className="animate-fade-in">
            <AdminDashboard 
              user={user}
              addToast={addToast}
              onDisruptionTriggered={handleDisruptionTriggered}
              onSelectBooking={handleOpenBookingById}
              onTabChange={handleTabChange}
              onLoginClick={triggerLoginOpen}
            />
          </div>
        )}

        {currentTab === 'book' && isAdmin(user) && (
          <div className="mx-auto max-w-md px-6 py-20 text-center text-slate-500">
            <p className="text-sm font-semibold">Admin accounts cannot book passenger flights.</p>
          </div>
        )}

        {/* TAB: LEGACY SIMULATOR (still accessible) */}
        {currentTab === 'simulator' && isAdmin(user) && (
          <div className="animate-fade-in">
            <AdminSimulator 
              user={user}
              addToast={addToast}
              onDisruptionTriggered={handleDisruptionTriggered}
            />
          </div>
        )}
        {currentTab === 'simulator' && !isAdmin(user) && (
          <div className="mx-auto max-w-md px-6 py-20 text-center text-slate-500">
            <p className="text-sm font-semibold">Admin access required to use the Simulator.</p>
          </div>
        )}

        {/* TAB 4: MY TRIPS / BOOKINGS PROFILE */}
        {currentTab === 'profile' && user && !isAdmin(user) && (
          <div className="animate-fade-in">
            <TripsProfile 
              user={user}
              bookings={userBookings}
              tripsData={tripsData}
              onSelectBooking={handleNavigateToRetrieve}
              onTripsRefresh={() => {
                const creds = getStoredCredentials();
                if (creds?.password) refreshUserBookings(user.email, creds.password);
              }}
              addToast={addToast}
            />
          </div>
        )}

        {currentTab === 'profile' && !user && sessionReady && (
          <div className="mx-auto max-w-md px-6 py-20 text-center text-slate-500">
            <p className="text-sm font-semibold">Sign in to view your trip dashboard.</p>
            <button
              onClick={() => triggerLoginOpen('account')}
              className="mt-4 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-brand-blue-dark text-white py-12 px-6 border-t border-slate-800">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/skyjet-logo.svg" 
              alt="SkyJet" 
              className="h-8 w-8"
            />
            <span className="font-display text-lg font-bold tracking-tight">Sky<span className="text-brand-green">Jet</span> Airlines</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => setCurrentTab('home')} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => setCurrentTab('book')} className="hover:text-white transition-colors cursor-pointer">Book Flights</button>
            <button onClick={() => setCurrentTab('admin')} className="hover:text-white transition-colors cursor-pointer">Admin Dashboard</button>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SkyJet International. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Login & Single Booking Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        mode={loginModalMode}
        onClose={() => setIsLoginOpen(false)} 
        onLogin={handleRetrieveBooking}
        onAccountLogin={handleAccountLogin}
      />

      {/* Floating Chatbot Assistant */}
      <Chatbot 
        flight={flight} 
        user={retrievedBooking}
        onRebook={handleRebookSuccess}
        onRefund={handleRefundSuccess}
        addToast={addToast}
        isLoggedIn={!!retrievedBooking}
        onTabChange={handleTabChange}
        onLoginClick={triggerLoginOpen}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

    </div>
  );
}

export default App;
