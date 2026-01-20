import { Booking } from "../types";

export const notificationService = {
  sendWhatsAppTicket: async (booking: Booking): Promise<{ success: boolean; details?: string }> => {
    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          booking: booking
        })
      });

      const data = await response.json();
      return { success: response.ok, details: data.details };
    } catch (error: any) {
      return { success: false, details: error.message };
    }
  }
};
