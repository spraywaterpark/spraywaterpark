import { AdminSettings } from './types';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  morningAdultRate: 600,
  morningKidRate: 400,
  eveningAdultRate: 700,
  eveningKidRate: 500,
  capacityPerShift: 300,

  discounts: {
    morning: {
      tiers: [
        { maxGuests: 40, discountPercent: 20 },
        { maxGuests: 20, discountPercent: 10 }
      ]
    },
    evening: {
      tiers: [
        { maxGuests: 40, discountPercent: 20 },
        { maxGuests: 20, discountPercent: 10 }
      ]
    }
  }
};

export const TIME_SLOTS = [
  "Morning Slot: 10:00 AM - 2:00 PM",
  "Evening Slot: 4:00 PM - 9:00 PM"
];

export const OFFERS = {
  MORNING: "Free Chole Bhature",
  EVENING: "Free Buffet Dinner"
};

export const TERMS_AND_CONDITIONS = [
  "Government ID required at entry",
  "Outside food not allowed",
  "Management is not responsible for personal belongings",
  "Children must be supervised by adults"
];

export const MASTER_SYNC_ID = "MASTER_SPRAY_AQUA";
