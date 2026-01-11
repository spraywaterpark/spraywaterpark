
import React from 'react';

const StaffPortal: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 text-white animate-fade">

      <h1 className="text-4xl font-black uppercase mb-4">
        Staff Control Panel
      </h1>

      <p className="text-white/70 text-sm mb-10">
        Locker & Costume Management System
      </p>

      <div className="bg-white/10 border border-white/20 rounded-3xl p-10 max-w-xl w-full text-center shadow-xl">

        <p className="text-lg font-bold mb-4">
          System Status
        </p>

        <p className="text-white/70">
          🧾 Issue & Return System will load here…
        </p>

        <p className="mt-6 text-xs text-white/50 uppercase tracking-widest">
          Secure Staff Environment
        </p>
      </div>

    </div>
  );
};

export default StaffPortal;
