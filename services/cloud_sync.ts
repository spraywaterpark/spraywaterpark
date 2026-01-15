
import { Booking, AdminSettings, LockerReceipt } from "../types";

export const cloudSync = {
  saveBooking: async (booking: Booking): Promise<boolean> => {
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: booking.name,
          mobile: booking.mobile,
          adults: booking.adults,
          kids: booking.kids,
          tickets: booking.adults + booking.kids,
          amount: booking.totalAmount,
          date: booking.date,
          time: booking.time
        })
      });
      return response.ok;
    } catch (error) {
      console.warn("Sheet sync failed:", error);
      return false;
    }
  },

  fetchData: async (syncId: string): Promise<Booking[] | null> => {
    try {
      const response = await fetch(`/api/booking?_t=${Date.now()}`);
      if (response.ok) return await response.json();
      return null;
    } catch (e) {
      return null;
    }
  },

  fetchSettings: async (): Promise<AdminSettings | null> => {
    try {
      const response = await fetch(`/api/booking?type=settings&_t=${Date.now()}`);
      if (response.ok) return await response.json();
      return null;
    } catch (e) {
      return null;
    }
  },

  saveSettings: async (settings: AdminSettings): Promise<boolean> => {
    try {
      const response = await fetch("/api/booking?type=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  // --- NEW RENTAL SYNC METHODS ---

  fetchRentals: async (): Promise<LockerReceipt[] | null> => {
    try {
      const response = await fetch(`/api/booking?type=rentals&_t=${Date.now()}`);
      if (response.ok) return await response.json();
      return null;
    } catch (e) {
      return null;
    }
  },

  saveRental: async (rental: LockerReceipt): Promise<boolean> => {
    try {
      const response = await fetch("/api/booking?type=rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rental)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  updateRental: async (rental: LockerReceipt): Promise<boolean> => {
    try {
      const response = await fetch("/api/booking?type=rentals&action=update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rental)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  updateData: async (syncId: string, bookings: Booking[]): Promise<void> => {
    console.debug("Local state sync active.");
  },

  createRoom: async (bookings: Booking[]): Promise<string> => {
    return Math.random().toString(36).substring(2, 11).toUpperCase();
  }
};
