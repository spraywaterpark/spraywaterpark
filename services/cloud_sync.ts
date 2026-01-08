
import { Booking } from "../types";

export const cloudSync = {
  saveBooking: async (booking: Booking): Promise<boolean> => {
    try {
      // Create a controller to abort the fetch if it takes too long (8 seconds)
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
      console.warn("Sheet sync skipped or failed:", error);
      return false;
    }
  },

  fetchData: async (syncId: string): Promise<Booking[] | null> => {
    // Return null to allow local storage fallback
    return null;
  },

  updateData: async (syncId: string, bookings: Booking[]): Promise<void> => {
    console.debug("Local state updated. Room:", syncId);
  },

  createRoom: async (bookings: Booking[]): Promise<string> => {
    const newId = Math.random().toString(36).substring(2, 11).toUpperCase();
    return newId;
  }
};
