
import { Booking } from "../types";

export const cloudSync = {
  // Logs a single successful booking to Google Sheets via our API
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
      console.error("Sync Error:", error);
      return false;
    }
  },

  // Stub for fetching data - Sheets is primarily used for logging in this setup.
  // To implement full sync reading, a 'GET' handler in api/booking.ts would be needed.
  fetchData: async (syncId: string): Promise<Booking[] | null> => {
    // Returning null allows the app to fallback to local storage
    return null;
  },

  // Wrapper for updateData used by App.tsx
  updateData: async (syncId: string, bookings: Booking[]): Promise<void> => {
    // When a full list is updated, we might want to log only the newest entry
    // or implement a full sheet overwrite (not recommended for simple logging)
    console.debug("State sync triggered for Room:", syncId);
  },

  // Added createRoom method to resolve the error in pages/admin_portal.tsx (line 63)
  createRoom: async (bookings: Booking[]): Promise<string> => {
    // Generate a new random sync ID for cloud synchronization
    const newId = Math.random().toString(36).substring(2, 11).toUpperCase();
    console.debug("Created new Room ID:", newId);
    return newId;
  }
};
