import { Booking } from "../types";

const CLOUD_API_BASE = "https://jsonblob.com/api/jsonBlob";

export const cloudSync = {
  createRoom: async (initialData: Booking[]): Promise<string | null> => {
    try {
      const response = await fetch(CLOUD_API_BASE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(initialData)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const location = response.headers.get("Location");
      return location ? location.split('/').pop() || null : null;
    } catch (e) {
      console.error("Cloud Create Error:", e);
      return null;
    }
  },

  updateData: async (roomId: string, data: Booking[]): Promise<boolean> => {
    if (!roomId || roomId === "1351141753443835904" || roomId.length < 5) return false;
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error("Cloud Update Error:", e);
      return false;
    }
  },

  fetchData: async (roomId: string): Promise<Booking[] | null> => {
    if (!roomId || roomId === "1351141753443835904" || roomId.length < 5) return null;
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error("Cloud Fetch Error:", e);
      return null;
    }
  }
};
