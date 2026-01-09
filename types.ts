export interface Booking {
  id: string;
  name: string;
  mobile: string;
  date: string;
  time: string;
  adults: number;
  kids: number;
  totalAmount: number;
  status: 'pending' | 'confirmed';
  createdAt: string;
}

export interface AdminSettings {
  morningAdultRate: number;
  morningKidRate: number;
  eveningAdultRate: number;
  eveningKidRate: number;
  earlyBirdDiscount: number;
  extraDiscountPercent: number;
}
