import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginGate from './pages/login_gate';
import BookingGate from './pages/booking_gate';
import AdminPortal from './pages/admin_portal';
import SecurePayment from './pages/secure_payment';
import TicketHistory from './pages/ticket_history';
import { AuthState, Booking, AdminSettings } from './types';
import { DEFAULT_ADMIN_SETTINGS, MASTER_SYNC_ID } from './constants';
import { cloudSync } from './services/cloud_sync';

const AppContent: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('swp_auth');
    return saved ? JSON.parse(saved) : { role: null, user: null };
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swp_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
  });

  // Use MASTER_SYNC_ID by default so all devices connect automatically
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('swp_sync_id') || MASTER_SYNC_ID);
  const location = useLocation();

  useEffect(() => { localStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('swp_sync_id', syncId); }, [syncId]);

  // LIVE MONITORING: Pull latest bookings from cloud every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const remoteData = await cloudSync.fetchData(syncId);
      if (remoteData && Array.isArray(remoteData)) {
        // Only update if there's new data to avoid unnecessary re-renders
        if (remoteData.length !== bookings.length) {
          console.log("Cloud Update Received: Syncing New Bookings...");
          setBookings(remoteData);
        }
      }
    }, 10000); // 10 seconds polling for fast updates
    return () => clearInterval(syncInterval);
  }, [syncId, bookings.length]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); };
  
  const addBooking = async (booking: Booking) => {
    // 1. Update local state immediately for speed
    const updated = [booking, ...bookings];
    setBookings(updated);
    
    // 2. Push to Cloud Database INSTANTLY so Admin sees it
    console.log("Pushing new booking to Cloud Database...");
    await cloudSync.updateData(syncId, updated);
  };

  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);
  const setupSyncId = (id: string) => setSyncId(id || MASTER_SYNC_ID);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 blue-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-water text-sm md:text-base"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1B2559] tracking-tight leading-none uppercase">SPRAY AQUA</h1>
              <p className="text-[8px] md:text-[9px] font-bold text-blue-500 tracking-widest uppercase mt-0.5">Resort</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Cloud Enabled</span>
            </div>
            
            {auth.role === 'guest' && (
              <nav className="flex items-center gap-1">
                <Link to="/book" className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${location.pathname === '/book' ? 'text-blue-600' : 'text-slate-400'}`}>Book</Link>
                <Link to="/my-bookings" className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${location.pathname === '/my-bookings' ? 'text-blue-600' : 'text-slate-400'}`}>Tickets</Link>
              </nav>
            )}
            
            {auth.role && (
              <button onClick={logout} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                <i className="fas fa-sign-out-alt md:hidden text-base"></i>
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-12">
        <Routes>
          <Route path="/" element={auth.role === 'admin' ? <Navigate to="/admin" /> : auth.role === 'guest' ? <Navigate to="/book" /> : <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />} />
          <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={(b: any) => b} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={updateSettings} syncId={syncId} onSyncSetup={setupSyncId} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="py-8 md:py-12 bg-white border-t border-slate-100 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Spray Aqua Resort</h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Jagatpura, Jaipur, Rajasthan</p>
          </div>
          <div className="flex gap-6 text-slate-300 text-xl">
            <i className="fab fa-instagram hover:text-pink-500 cursor-pointer"></i>
            <i className="fab fa-facebook hover:text-blue-600 cursor-pointer"></i>
            <i className="fab fa-whatsapp hover:text-green-500 cursor-pointer"></i>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2024 Spray Aqua Resort</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
