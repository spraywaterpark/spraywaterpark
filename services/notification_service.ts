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

      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { success: false, details: "Invalid server response format." };
      }

      if (response.ok && data.success) {
        return { success: true, details: data.messageId || data.details };
      }

      return { 
        success: false, 
        details: data.details || `Error ${response.status}: Failed to send message.`
      };

    } catch (error: any) {
      return { success: false, details: `Connection Error: ${error.message}` };
    }
  }
};
