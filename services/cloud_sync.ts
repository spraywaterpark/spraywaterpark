import { Booking } from "../types";

export const cloudSync = {
  saveBooking: async (booking: Booking): Promise<boolean> => {
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      return response.ok;
    } catch (error) {
      console.error("Save booking failed:", error);
      return false;
    }
  }
};
