
import { google } from "googleapis";
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import LoginGate from './pages/login_gate';
import BookingGate from './pages/booking_gate';
import AdminPortal from './pages/admin_portal';
import SecurePayment from './pages/secure_payment';
import TicketHistory from './pages/ticket_history';
import StaffPortal from './pages/staff_portal';
import { AuthState, Booking, AdminSettings, UserRole, LockerIssue } from './types';
import { DEFAULT_ADMIN_SETTINGS, MASTER_SYNC_ID } from './constants';
import { cloudSync } from './services/cloud_sync';
import AdminLockers from './pages/admin_lockers';


const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem('swp_auth');
    return saved ? JSON.parse(saved) : { role: null, user: null };
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swp_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [lockerIssues, setLockerIssues] = useState<LockerIssue[]>(() => {
    const saved = localStorage.getItem('swp_locker_issues');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return { 
      ...DEFAULT_ADMIN_SETTINGS, 
      ...parsed, 
      blockedSlots: Array.isArray(parsed?.blockedSlots) ? parsed.blockedSlots : [] 
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('swp_sync_id') || MASTER_SYNC_ID);

  const bookingsRef = useRef<Booking[]>(bookings);
  const isFetching = useRef(false);

  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);

  useEffect(() => { sessionStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('swp_sync_id', syncId); }, [syncId]);
  useEffect(() => { localStorage.setItem('swp_locker_issues', JSON.stringify(lockerIssues)); }, [lockerIssues]);

  const performSync = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsSyncing(true);
    try {
      const [remoteSettings, remoteBookings] = await Promise.all([
        cloudSync.fetchSettings(),
        cloudSync.fetchData(syncId)
      ]);

      if (remoteSettings && JSON.stringify(settings) !== JSON.stringify(remoteSettings)) {
        setSettings(prev => ({ ...prev, ...remoteSettings }));
      }
      if (remoteBookings && JSON.stringify(bookingsRef.current) !== JSON.stringify(remoteBookings)) {
        setBookings(remoteBookings);
      }
    } catch (e) {
      console.warn("Sync encountered a temporary issue.");
    } finally {
      setIsSyncing(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    performSync();
    const interval = setInterval(performSync, 30000); 
    return () => clearInterval(interval);
  }, [syncId]);

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

  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    if (syncId) await cloudSync.updateData(syncId, updated);
  };

  const updateBooking = async (updatedBooking: Booking) => {
    const updated = bookingsRef.current.map(b => b.id === updatedBooking.id ? updatedBooking : b);
    setBookings(updated);
    if (syncId) await cloudSync.updateData(syncId, updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-[9999] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20">
              <i className="fas fa-water text-xs"></i>
            </div>
            <h1 className="text-sm md:text-lg font-extrabold text-white uppercase tracking-tighter">Spray Aqua Resort</h1>
          </Link>

          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Syncing</span>
              </div>
            )}
            {auth.role && (
              <button onClick={logout} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-[10px] font-black uppercase text-white hover:bg-white/20 transition-all">
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex justify-center px-3 md:px-6 py-6">
        <div className="w-full max-w-7xl">
          <Routes>
            <Route path="/" element={
              auth.role === 'admin' ? <Navigate to="/admin" /> :
              (auth.role === 'staff' || auth.role === 'staff1' || auth.role === 'staff2') ? <Navigate to="/staff" /> :
              auth.role === 'guest' ? <Navigate to="/book" /> :
              <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />
            } />
            <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={()=>{}} /> : <Navigate to="/" />} />
            <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} bookings={bookings} /> : <Navigate to="/" />} />
            <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} settings={settings} onUpdateBooking={updateBooking} /> : <Navigate to="/" />} />
            <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={setSettings} syncId={syncId} onSyncSetup={setSyncId} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/admin-lockers" element={auth.role === 'admin' ? <AdminLockers /> : <Navigate to="/" />} />
            <Route path="/staff" element={(auth.role === 'staff' || auth.role === 'staff1' || auth.role === 'staff2') ? <StaffPortal role={auth.role} /> : <Navigate to="/" />} />
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
