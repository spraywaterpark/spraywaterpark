import { Booking } from "../types";

const CLOUD_API_BASE = "https://jsonblob.com/api/jsonBlob";

export const cloudSync = {
  createRoom: async (initialData: Booking[]): Promise<string | null> => {
    try {
      const response = await fetch(CLOUD_API_BASE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initialData)
      });
      if (!response.ok) return null;
      const location = response.headers.get("Location");
      return location ? location.split('/').pop() || null : null;
    } catch (e) {
      return null;
    }
  },

  updateData: async (roomId: string, data: Booking[]): Promise<boolean> => {
    if (!roomId || roomId.length < 5) return false;
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  fetchData: async (roomId: string): Promise<Booking[] | null> => {
    if (!roomId || roomId.length < 5) return null;
    try {
      // Use a AbortController to handle timeouts gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'GET',
        // Removing explicit headers to avoid extra CORS preflight OPTIONS requests
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : null;
      }
      
      return null;
    } catch (e) {
      // Quietly return null on network failure to avoid "Failed to fetch" spam in the console
      return null;
    }
  }
};
