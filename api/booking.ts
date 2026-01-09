
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  // Validate Environment Variables
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    console.error("CRITICAL: Missing Sheets Config in Vercel Dashboard");
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  if (req.method === "GET") {
    try {
      // Fetch the last 500 rows to ensure we have recent data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "A2:J501", // Skip header row
      });

      const rows = response.data.values || [];
      
      // Map rows back to Booking objects
      const bookings = rows.map((row: any, index: number) => ({
        id: row[0] ? `SYNC-${index}` : row[0], // Fallback if ID column is missing
        name: row[1] || "Guest",
        mobile: row[2] || "",
        adults: parseInt(row[3]) || 0,
        kids: parseInt(row[4]) || 0,
        totalAmount: parseInt(row[6]) || 0,
        date: row[7] || "",
        time: row[8] || "",
        status: row[9] === "PAID" ? "confirmed" : "pending",
        createdAt: row[0] || new Date().toISOString(), // Use timestamp from first column
      })).reverse(); // Newest first

      return res.status(200).json(bookings);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }

  if (req.method === "POST") {
    const { name, mobile, adults, kids, tickets, amount, date, time } = req.body;

    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const values = [[
        timestamp,
        name || "Guest",
        mobile || "N/A",
        adults || 0,
        kids || 0,
        tickets || ((adults || 0) + (kids || 0)),
        amount || 0,
        date || "N/A",
        time || "N/A",
        "PAID"
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Google Sheets API Error:", error.message);
      return res.status(500).json({ error: "Failed to log booking" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
