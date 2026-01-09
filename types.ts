export interface Booking {
  id: string;
  name: string;
  mobile: string;
  date: string;
  time: string;
  adults: number;
  kids: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface DiscountTier {
  maxGuests: number;
  discountPercent: number;
}

export interface ShiftDiscount {
  tiers: DiscountTier[];
}

export interface AdminSettings {
  morningAdultRate: number;
  morningKidRate: number;
  eveningAdultRate: number;
  eveningKidRate: number;
  capacityPerShift: number;
  discounts: {
    morning: ShiftDiscount;
    evening: ShiftDiscount;
  };
}
