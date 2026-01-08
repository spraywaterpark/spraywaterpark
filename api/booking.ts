
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, mobile, adults, kids, tickets, amount, date, time } = req.body;

  // Validate Environment Variables
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    console.error("CRITICAL: Missing Sheets Config in Vercel Dashboard");
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Format for Sheet columns: 
    // [Timestamp, Name, Mobile, Adults, Kids, Total, Amount, Visit Date, Visit Slot, Status]
    const values = [[
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
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
      requestBody: {
        values: values
      }
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Google Sheets API Error:", error.message);
    return res.status(500).json({ 
      error: "Failed to log booking", 
      details: error.message 
    });
  }
}
