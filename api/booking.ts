import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || ""),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString(),
        req.body.name,
        req.body.mobile,
        req.body.tickets,
        req.body.amount,
        "UNPAID"
      ]]
    }
  });

  res.status(200).json({ success: true });
}

