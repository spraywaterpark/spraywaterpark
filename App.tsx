import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    const interval = setInterval(syncData, 15000); 
    return () => clearInterval(interval);
  }, [syncId]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); navigate('/'); };
  
  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    await cloudSync.updateData(syncId, updated);
  };

  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);

  const isLoginPage = location.pathname === '/' && auth.role === null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className={`${isLoginPage ? 'absolute' : 'sticky'} top-0 z-[100] w-full ${isLoginPage ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md border-b border-slate-100'} transition-all duration-700 no-print`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 md:h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className={`w-9 h-9 ${isLoginPage ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'} rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}>
                <i className="fas fa-bars-staggered text-[12px]"></i>
              </div>
              <h1 className={`text-[15px] font-black uppercase tracking-tight ${isLoginPage ? 'text-white drop-shadow-lg' : 'text-slate-900'}`}>
                Spray Aqua <span className="font-light opacity-60">Resort</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {auth.role === 'guest' && (
              <nav className="hidden sm:flex items-center gap-10 mr-6">
                <Link to="/book" className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/book' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>Reserve</Link>
                <Link to="/my-bookings" className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/my-bookings' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>Wallet</Link>
              </nav>
            )}
            {auth.role && (
              <button 
                onClick={logout} 
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                <span>Logout</span>
                <i className="fas fa-power-off text-[9px]"></i>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full ${isLoginPage ? '' : 'max-w-7xl mx-auto'}`}>
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
