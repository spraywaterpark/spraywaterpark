import React, { useState } from 'react';
import { AdminSettings } from '../types';

const AdminPortal: React.FC<{ settings: AdminSettings; onUpdateSettings: (s: AdminSettings) => void }> = ({ settings, onUpdateSettings }) => {

  const [draft, setDraft] = useState<AdminSettings>(settings);

  const updateTier = (shift: 'morning' | 'evening', index: number, field: 'maxGuests' | 'discountPercent', value: number) => {
    const copy = { ...draft };
    copy.discounts[shift].tiers[index][field] = value;
    setDraft(copy);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10">

      <h2 className="text-3xl font-black text-center">Admin Control Panel</h2>

      {(['morning', 'evening'] as const).map(shift => (
        <div key={shift} className="bg-white p-6 rounded-xl shadow space-y-4">

          <h3 className="text-xl font-black capitalize">{shift} Discounts</h3>

          {draft.discounts[shift].tiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <input
                type="number"
                value={tier.maxGuests}
                onChange={e => updateTier(shift, i, 'maxGuests', +e.target.value)}
                className="input-premium"
                placeholder="Max Guests"
              />
              <input
                type="number"
                value={tier.discountPercent}
                onChange={e => updateTier(shift, i, 'discountPercent', +e.target.value)}
                className="input-premium"
                placeholder="Discount %"
              />
              <span className="flex items-center">Tier {i + 1}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-black">Capacity Per Shift</h3>
        <input
          type="number"
          value={draft.capacityPerShift}
          onChange={e => setDraft({ ...draft, capacityPerShift: +e.target.value })}
          className="input-premium mt-4"
        />
      </div>

      <button onClick={() => onUpdateSettings(draft)} className="btn-resort w-full">
        Save Settings
      </button>

    </div>
  );
};

export default AdminPortal;
