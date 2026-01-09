
import { Booking } from "../types";

export const cloudSync = {
  saveBooking: async (booking: Booking): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("Sheet sync failed:", error);
      return false;
    }
  },

  fetchData: async (syncId: string): Promise<Booking[] | null> => {
    try {
      const response = await fetch("/api/booking");
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error("Cloud fetch error:", e);
      return null;
    }
  },

  updateData: async (syncId: string, bookings: Booking[]): Promise<void> => {
    // This could be used for advanced real-time features
    console.debug("Local state sync active.");
  },

  createRoom: async (bookings: Booking[]): Promise<string> => {
    const newId = Math.random().toString(36).substring(2, 11).toUpperCase();
    return newId;
  }
};
