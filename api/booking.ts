
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
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
        // If "Settings" sheet doesn't exist, just return null so frontend uses defaults
        console.warn("Settings fetch failed (likely missing 'Settings' tab):", error.message);
        return res.status(200).json(null);
      }
    }

    if (req.method === "POST") {
      try {
        const values = [[JSON.stringify(req.body)]];
        // Note: The user MUST create a tab named 'Settings' in their Google Sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values }
        });
        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error("Settings Save Error:", error.message);
        // Fallback: If Settings tab is missing, try to log it but return error so admin knows
        return res.status(500).json({ 
          error: "Failed to save settings. Please ensure a tab named 'Settings' exists in your Google Sheet.",
          details: error.message 
        });
      }
    }
  }

  // Handle BOOKINGS Sync
  if (req.method === "GET") {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "A2:J501",
      });
      const rows = response.data.values || [];
      const bookings = rows.map((row: any, index: number) => ({
        id: row[0] ? `SYNC-${index}` : row[0],
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
      console.error("Bookings Fetch Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }

  if (req.method === "POST") {
    const { name, mobile, adults, kids, tickets, amount, date, time } = req.body;
    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const values = [[
        timestamp, name || "Guest", mobile || "N/A", adults || 0, kids || 0,
        tickets || ((adults || 0) + (kids || 0)), amount || 0, date || "N/A", time || "N/A", "PAID"
      ]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Booking Append Error:", error.message);
      return res.status(500).json({ error: "Failed to log booking" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
