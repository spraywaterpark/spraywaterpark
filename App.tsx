import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import LoginGate from './pages/login_gate';
import BookingGate from './pages/booking_gate';
import AdminPortal from './pages/admin_portal';
import SecurePayment from './pages/secure_payment';
import TicketHistory from './pages/ticket_history';
import { AuthState, Booking, AdminSettings, UserRole, LockerIssue } from './types';
import { DEFAULT_ADMIN_SETTINGS, MASTER_SYNC_ID } from './constants';
import { cloudSync } from './services/cloud_sync';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ===============================
     AUTH STATE
  ================================ */

  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem('swp_auth');
    return saved ? JSON.parse(saved) : { role: null, user: null };
  });

  /* ===============================
     BOOKINGS
  ================================ */

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swp_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  /* ===============================
     LOCKER / COSTUME ISSUES (NEW)
  ================================ */

  const [lockerIssues, setLockerIssues] = useState<LockerIssue[]>(() => {
    const saved = localStorage.getItem('swp_locker_issues');
    return saved ? JSON.parse(saved) : [];
  });

  /* ===============================
     ADMIN SETTINGS
  ================================ */

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed, blockedSlots: parsed.blockedSlots || [] };
  });

  /* ===============================
     SYNC STATE
  ================================ */

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('swp_sync_id') || MASTER_SYNC_ID);

  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);

  /* ===============================
     STORAGE SYNC
  ================================ */

  useEffect(() => { sessionStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('swp_sync_id', syncId); }, [syncId]);
  useEffect(() => { localStorage.setItem('swp_locker_issues', JSON.stringify(lockerIssues)); }, [lockerIssues]);

  /* ===============================
     CLOUD SYNC
  ================================ */

  const performSync = async () => {
    setIsSyncing(true);
    try {
      const remoteSettings = await cloudSync.fetchSettings();
      if (remoteSettings && JSON.stringify(settings) !== JSON.stringify(remoteSettings)) {
        setSettings(remoteSettings);
      }

      const remoteBookings = await cloudSync.fetchData(syncId);
      if (remoteBookings && JSON.stringify(bookingsRef.current) !== JSON.stringify(remoteBookings)) {
        setBookings(remoteBookings);
      }
    } catch {}
    setIsSyncing(false);
  };

  useEffect(() => {
    performSync();
    const interval = setInterval(performSync, 20000);
    return () => clearInterval(interval);
  }, [syncId]);

  /* ===============================
     AUTH ACTIONS
  ================================ */

  const loginAsGuest = (name: string, mobile: string) => {
    setAuth({ role: 'guest', user: { name, mobile } });
  };

  const loginAsAdmin = (email: string, role: UserRole) => {
    setAuth({ role, user: { email } });
  };

  const logout = () => {
    sessionStorage.clear();
    setAuth({ role: null, user: null });
    navigate('/', { replace: true });
  };

  /* ===============================
     BOOKING ACTIONS
  ================================ */

  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    if (syncId) await cloudSync.updateData(syncId, updated);
  };

  /* ===============================
     LOCKER ISSUE ACTIONS (NEW)
  ================================ */

  const addLockerIssue = (issue: LockerIssue) => {
    setLockerIssues(prev => [issue, ...prev]);
  };

  const closeLockerIssue = (receiptNo: string) => {
    setLockerIssues(prev =>
      prev.map(i => i.receiptNo === receiptNo ? { ...i, returnedAt: new Date().toISOString() } : i)
    );
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-[9999] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20">
              <i className="fas fa-water text-xs"></i>
            </div>
            <h1 className="text-sm md:text-lg font-extrabold text-white uppercase">Spray Aqua Resort</h1>
          </Link>

          {auth.role && (
            <button onClick={logout} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-white">
              Sign Out
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full flex justify-center px-3 md:px-6 py-6">
        <div className="w-full max-w-7xl">
          <Routes>

            <Route path="/" element={
              auth.role === 'admin' ? <Navigate to="/admin" /> :
              auth.role === 'staff' ? <Navigate to="/staff" /> :
              auth.role === 'guest' ? <Navigate to="/book" /> :
              <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />
            } />

            <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={()=>{}} /> : <Navigate to="/" />} />
            <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
            <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />

            <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={setSettings} syncId={syncId} onSyncSetup={setSyncId} /> : <Navigate to="/" />} />

            <Route path="/staff" element={auth.role === 'staff' ? (
              <div className="text-white text-3xl font-black p-10">Staff Portal Coming Next 🚧</div>
            ) : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />

          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
