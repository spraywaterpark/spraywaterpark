
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  // Prevent caching at the API level
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    console.error("CRITICAL: Missing Sheets Config");
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const isSettingsRequest = req.query.type === 'settings';

  // Handle SETTINGS Sync (Rates, Blocked Slots, etc.)
  if (isSettingsRequest) {
    if (req.method === "GET") {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1", 
        });
        const data = response.data.values?.[0]?.[0];
        return res.status(200).json(data ? JSON.parse(data) : null);
      } catch (error: any) {
        console.warn("Settings fetch notice (Normal if empty):", error.message);
        return res.status(200).json(null);
      }
    }

    if (req.method === "POST") {
      try {
        const settingsJson = JSON.stringify(req.body);
        const values = [[settingsJson]];
        
        // Use 'update' to strictly overwrite Settings tab A1
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values }
        });
        
        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error("Settings Sync Error:", error.message);
        // Return detailed error so the Admin can see what's wrong on their screen
        return res.status(500).json({ 
          error: "Cloud Sync Failed", 
          message: error.message,
          hint: error.message.includes("range") ? "Check if tab name is exactly 'Settings'" : "Check API permissions"
        });
      }
    }
  }

  // Handle BOOKINGS Sync
  // Note: We use 'A:J' which targets the FIRST tab in the sheet.
  if (req.method === "GET") {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "A2:J1000", 
      });
      const rows = response.data.values || [];
      const bookings = rows.map((row: any, index: number) => ({
        id: row[0] ? `SYNC-${index}` : `ID-${Math.random()}`,
        name: row[1] || "Guest",
        mobile: row[2] || "",
        adults: parseInt(row[3]) || 0,
        kids: parseInt(row[4]) || 0,
        totalAmount: parseInt(row[6]) || 0,
        date: row[7] || "",
        time: row[8] || "",
        status: row[9] === "PAID" ? "confirmed" : "pending",
        createdAt: row[0] || new Date().toISOString(),
      })).reverse();
      return res.status(200).json(bookings);
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch bookings", details: error.message });
    }
  }

  if (req.method === "POST") {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const values = [[
        timestamp, 
        name || "Guest", 
        mobile || "N/A", 
        adults || 0, 
        kids || 0,
        (adults || 0) + (kids || 0), 
        amount || 0, 
        date || "N/A", 
        time || "N/A", 
        "PAID"
      ]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "A:J", // Appends to the first available sheet
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to log booking", details: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
