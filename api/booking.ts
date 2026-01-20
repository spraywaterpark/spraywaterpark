import { google } from "googleapis";

/**
 * SINGLE API FILE
 * - Booking save to Google Sheet
 * - Locker rentals (future safe)
 * - WhatsApp official template message
 */

export default async function handler(req: any, res: any) {
  /* ================= BASIC HEADERS ================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* ================= ENV CHECK ================= */
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "GOOGLE CONFIG MISSING" });
  }

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

  /* ================= GOOGLE AUTH ================= */
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const type = req.query.type;

  /* ======================================================
     HELPER
     ====================================================== */
  const safeInt = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  /* ======================================================
     1️⃣ WHATSAPP OFFICIAL TEMPLATE MESSAGE
     ====================================================== */
  if (type === "whatsapp" && req.method === "POST") {
    try {
      if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        return res.status(400).json({ error: "WHATSAPP CONFIG MISSING" });
      }

      const { mobile, name } = req.body;

      const waRes = await fetch(
        `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mobile.startsWith("91") ? mobile : `91${mobile}`,
            type: "template",
            template: {
              name: "ticket_test", // ⚠️ EXACT approved template name
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: name || "Guest",
                    },
                  ],
                },
              ],
            },
          }),
        }
      );

      const waData = await waRes.json();

      if (!waRes.ok) {
        return res.status(400).json({
          error: "META_ERROR",
          details: waData,
        });
      }

      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  /* ======================================================
     2️⃣ GET BOOKINGS (ADMIN / DASHBOARD)
     ====================================================== */
  if (req.method === "GET" && !type) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A2:J2000",
      });

      const rows = response.data.values || [];

      const bookings = rows.map((row: any, i: number) => ({
        id: i,
        createdAt: row[0],
        name: row[1],
        mobile: row[2],
        adults: safeInt(row[3]),
        kids: safeInt(row[4]),
        totalPersons: safeInt(row[5]),
        amount: safeInt(row[6]),
        visitDate: row[7],
        visitTime: row[8],
        status: row[9],
      }));

      return res.status(200).json(bookings.reverse());
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  /* ======================================================
     3️⃣ NEW BOOKING SAVE (PAYMENT SUCCESS)
     ====================================================== */
  if (req.method === "POST" && !type) {
    try {
      const { name, mobile, adults, kids, amount, date, time } = req.body;

      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      const values = [
        [
          timestamp,
          name,
          mobile,
          safeInt(adults),
          safeInt(kids),
          safeInt(adults) + safeInt(kids),
          safeInt(amount), // ✅ AMOUNT FIXED
          date,
          time,
          "PAID",
        ],
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  /* ======================================================
     FALLBACK
     ====================================================== */
  return res.status(405).json({ error: "Method Not Allowed" });
}
