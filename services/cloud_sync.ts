import { Booking } from "../types";

const CLOUD_API_BASE = "https://jsonblob.com/api/jsonBlob";

export const cloudSync = {
  // Create a new cloud sync room and return the ID
  createRoom: async (initialData: Booking[]): Promise<string | null> => {
    try {
      const response = await fetch(CLOUD_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(initialData)
      });
      const location = response.headers.get("Location");
      if (location) {
        return location.split('/').pop() || null;
      }
      return null;
    } catch (e) {
      console.error("Cloud Create Error:", e);
      return null;
    }
  },

  // Update existing cloud data
  updateData: async (roomId: string, data: Booking[]): Promise<boolean> => {
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error("Cloud Update Error:", e);
      return false;
    }
  },

  // Fetch data from cloud
  fetchData: async (roomId: string): Promise<Booking[] | null> => {
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${roomId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
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