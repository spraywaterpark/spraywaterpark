import React, { useState, useEffect, useRef } from 'react';
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
    const saved = sessionStorage.getItem('swp_auth');
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

  const [syncId] = useState<string>(MASTER_SYNC_ID);
  const location = useLocation();
  const bookingsRef = useRef<Booking[]>(bookings);

  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);

  useEffect(() => { 
    sessionStorage.setItem('swp_auth', JSON.stringify(auth)); 
  }, [auth]);

  useEffect(() => { 
    localStorage.setItem('swp_bookings', JSON.stringify(bookings)); 
  }, [bookings]);

  useEffect(() => {
    const syncData = async () => {
      const remoteData = await cloudSync.fetchData(syncId);
      if (remoteData && JSON.stringify(bookingsRef.current) !== JSON.stringify(remoteData)) {
        setBookings(remoteData);
      }
    };
    syncData();
    const interval = setInterval(syncData, 10000); 
    return () => clearInterval(interval);
  }, [syncId]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); };
  
  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    await cloudSync.updateData(syncId, updated);
  };

  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FE]">
      <header className="sticky top-0 z-[100] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B2559] rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-water"></i>
            </div>
            <h1 className="text-xl font-black text-[#1B2559] uppercase tracking-tight">Spray Aqua Resort</h1>
          </Link>

          <div className="flex items-center gap-8">
            {auth.role === 'guest' && (
              <nav className="hidden md:flex items-center gap-10">
                <Link to="/book" className={`text-[10px] font-black uppercase tracking-[0.2em] ${location.pathname === '/book' ? 'text-blue-600' : 'text-gray-400'}`}>Book Now</Link>
                <Link to="/my-bookings" className={`text-[10px] font-black uppercase tracking-[0.2em] ${location.pathname === '/my-bookings' ? 'text-blue-600' : 'text-gray-400'}`}>My Tickets</Link>
              </nav>
            )}
            {auth.role && (
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                <i className="fas fa-power-off text-sm"></i>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 flex flex-col items-center">
        <Routes>
          <Route path="/" element={
            auth.role === 'admin' ? <Navigate to="/admin" /> : 
            auth.role === 'guest' ? <Navigate to="/book" /> : 
            <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />
          } />
          <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={() => {}} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={updateSettings} syncId={syncId} onSyncSetup={() => {}} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
