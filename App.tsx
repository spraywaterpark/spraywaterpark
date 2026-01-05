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
  // Use sessionStorage instead of localStorage for auth to ensure Login is "First Page" for new sessions
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
        const currentStr = JSON.stringify(bookingsRef.current);
        const remoteStr = JSON.stringify(remoteData);
        
        if (currentStr !== remoteStr) {
          setBookings(remoteData);
        }
      } else {
        setIsCloudConnected(false);
      }
    };

    syncData();
    const interval = setInterval(syncData, 5000); 
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [syncId]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); };
  
  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    
    if (syncId) {
      const success = await cloudSync.updateData(syncId, updated);
      setIsCloudConnected(success);
    }
  };

  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);
  const setupSyncId = (id: string) => setSyncId(id);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FE]">
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-slate-100 no-print shadow-sm h-20 md:h-24 flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex justify-between items-center">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-12 h-12 blue-gradient rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <i className="fas fa-water text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#1B2559] tracking-tighter uppercase leading-none">Spray Aqua Resort</h1>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase">Jaipur's Finest</p>
                  {/* Cloud status only visible for Admin */}
                  {auth.role === 'admin' && (
                    isCloudConnected ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-black text-emerald-600 uppercase">Live Sync</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Local Mode</span>
                      </div>
                    )
                  )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {auth.role === 'guest' && (
              <nav className="hidden md:flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <Link to="/book" className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${location.pathname === '/book' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Reserve</Link>
                <Link to="/my-bookings" className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${location.pathname === '/my-bookings' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>My Tickets</Link>
              </nav>
            )}
            
            {auth.role && (
              <button onClick={logout} className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl uppercase tracking-widest transition-all border border-transparent hover:border-red-100">
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
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
