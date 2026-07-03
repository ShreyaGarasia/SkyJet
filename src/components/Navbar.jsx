import React, { useState, useEffect, useRef } from 'react';
import { Plane, LogOut, User, LayoutDashboard, Calendar, AlertTriangle, Bell, X, Mail, MessageSquare, Monitor, ShieldCheck } from 'lucide-react';

export default function Navbar({ 
  user, 
  currentTab, 
  onTabChange, 
  onLoginClick, 
  onLogout,
  retrievedBooking,
  addToast
}) {
  const isAdminUser = user?.role === 'admin';
  const isCustomerUser = user && user.role !== 'admin';
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState(null);
  const notifRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const notificationIdsRef = useRef(new Set());

  // Fetch notifications periodically
  const fetchNotifications = async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 10000) return; // Prevent rapid fetches (10s minimum)
    lastFetchTimeRef.current = now;
    
    try {
      let url = '/api/notifications';
      if (retrievedBooking?.bookingId) {
        url += `?booking_id=${retrievedBooking.bookingId}`;
      } else if (user?.email) {
        url += `?email=${encodeURIComponent(user.email)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const uniqueData = Array.from(new Map(data.map(n => [n._id, n])).values()).slice(0, 20);
        setNotifications(uniqueData);
        if (!lastSeenNotificationId && uniqueData[0]?._id) {
          setLastSeenNotificationId(uniqueData[0]._id);
          setUnreadCount(uniqueData.length > 0 ? Math.min(uniqueData.length, 9) : 0);
          return;
        }

        if (uniqueData[0]?._id && uniqueData[0]._id !== lastSeenNotificationId) {
          setLastSeenNotificationId(uniqueData[0]._id);
          setUnreadCount((prev) => Math.min(prev + 1, 9));
        }
      }
    } catch (err) {
      // Silently fail
    }
  };

  const getUniqueNotifications = () => {
    const seen = new Set();
    return notifications.filter(n => {
      if (seen.has(n._id)) return false;
      seen.add(n._id);
      return true;
    }).slice(0, 20);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [retrievedBooking?.bookingId, user?.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-3.5 h-3.5 text-brand-blue" />;
      case 'sms': return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getNotifTypeBadge = (type) => {
    switch (type) {
      case 'email': return 'bg-blue-50 text-brand-blue';
      case 'sms': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4 px-6 md:px-8">
        
        {/* Logo and Brand Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-md border border-slate-100 transition-transform group-hover:scale-105 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="SkyJet Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-brand-blue-dark">
            Sky<span className="text-brand-green">Jet</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <button 
            onClick={() => onTabChange('home')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'home' 
                ? 'bg-slate-100 text-brand-blue font-bold' 
                : 'hover:text-brand-blue hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          
          {!isAdminUser && (
          <button 
            onClick={() => onTabChange('book')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'book' 
                ? 'bg-slate-100 text-brand-blue font-bold' 
                : 'hover:text-brand-blue hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Book Flight
          </button>
          )}

          {isAdminUser && (
          <button 
            onClick={() => onTabChange('admin')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'admin' 
                ? 'bg-slate-100 text-brand-blue font-bold' 
                : 'hover:text-brand-blue hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            Admin
          </button>
          )}

          {!user && (
          <button 
            onClick={() => onTabChange('admin')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'admin' 
                ? 'bg-slate-100 text-brand-blue font-bold' 
                : 'hover:text-brand-blue hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            Admin
          </button>
          )}

          {isCustomerUser && (
            <button 
              onClick={() => onTabChange('profile')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'profile' 
                  ? 'bg-slate-100 text-brand-blue font-bold' 
                  : 'hover:text-brand-blue hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-brand-green" />
              My Trips
            </button>
          )}
        </nav>

        {/* CTA / User Status + Notifications */}
        <div className="flex items-center gap-3">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotif(prev => !prev);
                if (!showNotif) setUnreadCount(0);
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotif && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-in">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-blue" />
                    <span className="font-bold text-sm text-slate-700">Notifications & Alerts</span>
                  </div>
                  <button
                    onClick={() => setShowNotif(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">No notifications yet.</p>
                      <p className="text-[10px] text-slate-300 mt-1">Retrieve a booking to see alerts.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {getUniqueNotifications().map((n) => (
                          <div key={n._id} className="px-4 py-3 hover:bg-slate-50/80 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${getNotifTypeBadge(n.type)}`}>
                                {getNotifIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-xs font-bold text-slate-700 truncate">{n.title}</p>
                                  <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${getNotifTypeBadge(n.type)}`}>
                                    {n.type}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-slate-300 mt-1 font-mono">{n.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
                  <p className="text-[10px] text-slate-400">
                    Showing notifications for active booking. Updates every 15 seconds.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User / Login Buttons */}
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-full py-1.5 pl-3 pr-2 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-brand-blue" />
                <span className="max-w-[100px] truncate">{user.firstName}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center justify-center p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoginClick('retrieve')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer shadow-3xs"
              >
                Manage Trip
              </button>
              
              <button
                onClick={() => onLoginClick('account')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue hover:bg-blue-700 px-4.5 py-2.5 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
