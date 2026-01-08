
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

  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('swp_sync_id') || MASTER_SYNC_ID);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const location = useLocation();
  
  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);

  useEffect(() => { sessionStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('swp_sync_id', syncId); }, [syncId]);

  useEffect(() => {
    if (!syncId) return;
    let isMounted = true;
    const syncData = async () => {
      const remoteData = await cloudSync.fetchData(syncId);
      if (!isMounted) return;
      if (remoteData) {
        setIsCloudConnected(true);
        if (JSON.stringify(bookingsRef.current) !== JSON.stringify(remoteData)) {
          setBookings(remoteData);
        }
      } else {
        setIsCloudConnected(false);
      }
    };
    syncData();
    const interval = setInterval(syncData, 5000); 
    return () => { isMounted = false; clearInterval(interval); };
  }, [syncId]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { 
    if(confirm("Are you sure you want to sign out?")) {
      setAuth({ role: null, user: null }); 
      sessionStorage.clear(); 
    }
  };
  
  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);
  const setupSyncId = (id: string) => setSyncId(id);

  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    if (syncId) await cloudSync.updateData(syncId, updated);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[100] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20">
              <i className="fas fa-water text-sm"></i>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-tight uppercase">Spray Aqua Resort</h1>
          </Link>

          <div className="flex items-center gap-6">
            {auth.role === 'guest' && (
              <nav className="hidden md:flex items-center gap-10">
                <Link to="/book" className={`text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/book' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60 hover:text-white'}`}>Book Now</Link>
                <Link to="/my-bookings" className={`text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/my-bookings' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60 hover:text-white'}`}>My Tickets</Link>
              </nav>
            )}
            
            {auth.role && (
              <button 
                onClick={logout} 
                className="flex items-center gap-3 bg-white/10 hover:bg-red-500/20 px-5 py-2.5 rounded-full border border-white/20 transition-all duration-300 group"
              >
                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest group-hover:text-white transition-colors">Sign Out</span>
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-red-600 transition-all">
                  <i className="fas fa-power-off text-[10px]"></i>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-10">
        <Routes>
          <Route path="/" element={
            auth.role === 'admin' ? <Navigate to="/admin" /> : 
            auth.role === 'guest' ? <Navigate to="/book" /> : 
            <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />
          } />
          <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={(b: any) => b} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={updateSettings} syncId={syncId} onSyncSetup={setupSyncId} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
