import { Booking, AdminSettings } from "../types";

export interface WhatsAppResponse {
  success: boolean;
  error?: string;
  details?: string;
  fb_trace_id?: string;
  meta_code?: number;
  meta_subcode?: number;
}

export const notificationService = {
  sendWhatsAppTicket: async (booking: Booking, settings?: AdminSettings): Promise<WhatsAppResponse> => {
    // Default values if settings not provided
    let templateName = 'booked_ticket';
    let langCode = 'en';
    let hasVariables = false;
    
    // Use provided settings or fallback to localStorage
    const currentSettings = settings || (() => {
      try {
        const saved = localStorage.getItem('swp_settings');
        return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
    })();

    if (currentSettings) {
      templateName = currentSettings.waTemplateName || templateName;
      langCode = currentSettings.waLangCode || langCode;
      hasVariables = (currentSettings.waVarCount || 0) > 0;
    }

    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          booking: booking,
          templateName,
          langCode,
          hasVariables
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "SERVER_ERROR",
          details: data.details || "Meta API rejected the message.",
          fb_trace_id: data.fb_trace_id,
          meta_code: data.meta_code || data.code,
          meta_subcode: data.meta_subcode
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: "NETWORK_ERROR",
        details: error.message || "Could not connect to the server."
      };
    }
  }
};
