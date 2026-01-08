
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, mobile, tickets, amount, adults, kids, date, time } = req.body;

    // Check for required environment variables
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
      console.error("Missing environment variables: GOOGLE_CREDENTIALS or SHEET_ID");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Preparing the row data
    // Format: [Timestamp, Name, Mobile, Adults, Kids, Total Tickets, Amount, Date, Time, Status]
    const values = [[
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      name || "Unknown",
      mobile || "N/A",
      adults || 0,
      kids || 0,
      tickets || (Number(adults || 0) + Number(kids || 0)),
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

    return res.status(200).json({ success: true, message: "Booking logged to Google Sheets" });
  } catch (error: any) {
    console.error("Google Sheets Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}
