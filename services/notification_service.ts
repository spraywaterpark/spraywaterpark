
import { Booking } from "../types";

export const notificationService = {
  sendWhatsAppTicket: async (booking: Booking): Promise<{ success: boolean; details?: string }> => {
    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: booking.mobile, booking: booking })
      });
      const data = await response.json();
      return { success: response.ok && data.success, details: data.details };
    } catch (error: any) {
      return { success: false, details: error.message };
    }
  },

  sendWelcomeMessage: async (booking: any): Promise<{ success: boolean; details?: string }> => {
    try {
      // Use the pre-approved 'welcome' template from Meta WhatsApp Manager
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile: booking.mobile, 
          booking: { name: booking.name },
          isWelcome: true 
        })
      });
      const data = await response.json();
      return { success: response.ok && data.success, details: data.details };
    } catch (error: any) {
      return { success: false, details: error.message };
    }
  }
};
