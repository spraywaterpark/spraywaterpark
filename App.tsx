
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

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed, blockedSlots: parsed.blockedSlots || [] };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('swp_sync_id') || MASTER_SYNC_ID);

  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);

  useEffect(() => { sessionStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('swp_sync_id', syncId); }, [syncId]);

  const performSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch Cloud Settings
      const remoteSettings = await cloudSync.fetchSettings();
      if (remoteSettings && typeof remoteSettings === 'object' && Object.keys(remoteSettings).length > 0) {
        setSettings(prev => {
          // Compare and update only if different
          if (JSON.stringify(prev) !== JSON.stringify(remoteSettings)) {
            console.log("Cloud settings updated successfully on this device.");
            return remoteSettings;
          }
          return prev;
        });
      }

      // 2. Fetch Bookings
      const remoteBookings = await cloudSync.fetchData(syncId);
      if (remoteBookings && Array.isArray(remoteBookings)) {
        if (JSON.stringify(bookingsRef.current) !== JSON.stringify(remoteBookings)) {
          setBookings(remoteBookings);
        }
      }
    } catch (err) {
      console.warn("Sync notice:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    performSync();
    // Aggressive sync for better real-time behavior
    const interval = setInterval(performSync, 20000); 
    return () => clearInterval(interval);
  }, [syncId]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });

  const logout = (e: React.MouseEvent | void) => {
    if (e) (e as React.MouseEvent).preventDefault();
    sessionStorage.clear();
    setAuth({ role: null, user: null });
    navigate('/', { replace: true });
  };

  const addBooking = async (booking: Booking) => {
    const updated = [booking, ...bookingsRef.current];
    setBookings(updated);
    if (syncId) await cloudSync.updateData(syncId, updated);
  };

  const handleUpdateSettings = async (newSettings: AdminSettings) => {
    // Optimistic local update
    setSettings(newSettings);
    localStorage.setItem('swp_settings', JSON.stringify(newSettings));
    
    try {
      const response = await fetch("/api/booking?type=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to sync to Cloud.");
      }
      
      alert("✅ Settings Saved! All mobile devices and laptops will update within 20 seconds.");
    } catch (error: any) {
      console.error("Cloud Error:", error);
      alert(`⚠️ CLOUD SAVE FAILED!\n\nReason: ${error.message}\n\nNote: Changes are saved on THIS laptop but NOT on other devices. Make sure your sheet has a tab named exactly 'Settings'.`);
    }
  };

  const handleBack = () => {
    if (location.pathname === '/book') {
      setAuth({ role: null, user: null });
      navigate('/', { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-[9999] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20">
              <i className="fas fa-water text-xs"></i>
            </div>
            <h1 className="text-sm md:text-lg font-extrabold text-white uppercase tracking-tight whitespace-nowrap">Spray Aqua Resort</h1>
          </Link>
          
          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            {isSyncing && (
              <div className="hidden md:flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
                <i className="fas fa-circle-notch fa-spin"></i> Syncing Cloud
              </div>
            )}
            
            {auth.role === 'guest' && (
              <nav className="flex items-center gap-4 md:gap-10 shrink-0">
                {location.pathname !== '/' && (
                  <button 
                    onClick={handleBack} 
                    className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all cursor-pointer group whitespace-nowrap"
                  >
                    <i className="fas fa-arrow-left text-[8px] group-hover:-translate-x-1 transition-transform"></i> Go Back
                  </button>
                )}
                <Link to="/my-bookings" className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${location.pathname === '/my-bookings' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60 hover:text-white'}`}>My Tickets</Link>
              </nav>
            )}
            
            {auth.role && (
              <button onClick={() => logout()} className="relative z-[10000] flex items-center gap-2 md:gap-3 bg-white/10 hover:bg-red-500/40 px-3 md:px-5 py-2 rounded-full border border-white/20 transition-all group cursor-pointer shrink-0">
                <span className="hidden sm:inline text-[9px] font-black text-white/70 uppercase tracking-widest group-hover:text-white">Sign Out</span>
                <div className="w-6 h-6 md:w-7 md:h-7 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:bg-red-500 transition-colors">
                  <i className="fas fa-power-off text-[9px] md:text-[10px]"></i>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full flex justify-center px-3 md:px-6 py-6 md:py-10 overflow-visible">
        <div className="w-full max-w-7xl overflow-visible">
          <Routes>
            <Route path="/" element={auth.role === 'admin' ? <Navigate to="/admin" /> : auth.role === 'guest' ? <Navigate to="/book" /> : <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />} />
            <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={(b:any)=>b} /> : <Navigate to="/" />} />
            <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
            <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
            <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={handleUpdateSettings} syncId={syncId} onSyncSetup={setSyncId} onLogout={() => logout()} /> : <Navigate to="/" />} />
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
