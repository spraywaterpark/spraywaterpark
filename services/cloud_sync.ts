
import { Booking, AdminSettings } from "../types";

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
      // Add timestamp to prevent caching of booking data
      const response = await fetch(`/api/booking?_t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  fetchSettings: async (): Promise<AdminSettings | null> => {
    try {
      // CRITICAL: Added timestamp _t to URL to bypass browser cache on mobile/laptops
      const response = await fetch(`/api/booking?type=settings&_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (e) {
      console.error("Cloud settings fetch error:", e);
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
      console.error("Cloud settings save error:", e);
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
