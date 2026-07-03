const KEYS = {
  user: 'skyjet_user',
  session: 'skyjet_session',
  activeBooking: 'skyjet_active_booking',
  currentTab: 'skyjet_current_tab',
};

export function saveUserSession(user, password) {
  localStorage.setItem(KEYS.user, JSON.stringify(user));
  localStorage.setItem(KEYS.session, JSON.stringify({ email: user.email, password }));
}

export function saveActiveBooking(bookingId, lastName) {
  localStorage.setItem(
    KEYS.activeBooking,
    JSON.stringify({ bookingId, lastName })
  );
}

export function clearActiveBooking() {
  localStorage.removeItem(KEYS.activeBooking);
}

export function saveCurrentTab(tab) {
  localStorage.setItem(KEYS.currentTab, tab);
}

export function loadPersistedAppState() {
  try {
    const user = localStorage.getItem(KEYS.user);
    const session = localStorage.getItem(KEYS.session);
    const activeBooking = localStorage.getItem(KEYS.activeBooking);
    const currentTab = localStorage.getItem(KEYS.currentTab);

    return {
      user: user ? JSON.parse(user) : null,
      session: session ? JSON.parse(session) : null,
      activeBooking: activeBooking ? JSON.parse(activeBooking) : null,
      currentTab: currentTab || null,
    };
  } catch {
    clearAllSession();
    return { user: null, session: null, activeBooking: null, currentTab: null };
  }
}

export function clearAllSession() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
