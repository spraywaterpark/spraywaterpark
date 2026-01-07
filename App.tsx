import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import AdminPanel from './pages/AdminPanel';
import PaymentPage from './pages/PaymentPage';
import MyBookings from './pages/MyBookings';
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

  const [settings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FE]">
      <header className="sticky top-0 z-[100] w-full glass-header no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B2559] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              <i className="fas fa-water"></i>
            </div>
            <h1 className="text-xl font-black text-[#1B2559] uppercase tracking-tight">Spray Aqua Resort</h1>
          </Link>

          <div className="flex items-center gap-8">
            {auth.role === 'guest' && (
              <nav className="hidden md:flex items-center gap-10">
                <Link to="/book" className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === '/book' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>Book Tickets</Link>
                <Link to="/my-bookings" className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === '/my-bookings' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>My Passes</Link>
              </nav>
            )}
            {auth.role && (
              <button onClick={logout} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <i className="fas fa-power-off"></i>
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
            <LoginPage onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />
          } />
          <Route path="/book" element={auth.role === 'guest' ? <BookingPage settings={settings} bookings={bookings} onProceed={() => {}} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <PaymentPage addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <MyBookings bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPanel bookings={bookings} settings={settings} onUpdateSettings={() => {}} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
