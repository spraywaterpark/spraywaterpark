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

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { success: false, details: `Server returned non-JSON response: ${text.substring(0, 100)}...` };
      }

      return { 
        success: response.ok, 
        details: data.details || (response.ok ? undefined : `HTTP Error ${response.status}`)
      };
    } catch (error: any) {
      return { success: false, details: `Network Connection Failed: ${error.message}` };
    }
  }
};
