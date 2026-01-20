import { google } from "googleapis";

/* =========================================================
   HELPERS
========================================================= */

const normalizeIndianMobile = (mobile: string) => {
  let m = String(mobile).replace(/\D/g, "");
  if (m.length === 10) return `91${m}`;
  if (m.length === 12 && m.startsWith("91")) return m;
  return m;
};

/* =========================================================
   API HANDLER
========================================================= */

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  /* ================= HEALTH CHECK ================= */
  if (req.query.type === "health") {
    return res.status(200).json({
      whatsapp_token: !!process.env.WHATSAPP_TOKEN,
      whatsapp_phone_id: !!process.env.WHATSAPP_PHONE_ID,
      google_sheet: !!process.env.GOOGLE_CREDENTIALS && !!process.env.SHEET_ID
    });
  }

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "SERVER_CONFIG_ERROR" });
  }

  /* ================= GOOGLE AUTH ================= */
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  /* =========================================================
     WHATSAPP TEMPLATE SEND (META CLOUD API)
  ========================================================= */

  if (type === "whatsapp" && req.method === "POST") {
    const { mobile, name, ticketNo, visitDate, amount } = req.body;

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(400).json({ error: "META_CONFIG_MISSING" });
    }

    const to = normalizeIndianMobile(mobile);

    try {
      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: "ticket_confirmed",
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: name || "Guest" },
                    { type: "text", text: ticketNo || "-" },
                    { type: "text", text: visitDate || "-" },
                    { type: "text", text: `₹${amount || 0}` }
                  ]
                }
              ]
            }
          })
        }
      );

      const waData = await waRes.json();

      if (!waRes.ok) {
        return res.status(400).json({
          error: "WHATSAPP_FAILED",
          meta: waData
        });
      }

      return res.status(200).json({
        success: true,
        whatsapp_id: waData.messages?.[0]?.id
      });

    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /* =========================================================
     BOOKINGS → GOOGLE SHEETS
  ========================================================= */

  if (req.method === "POST" && !type) {
    const { namel̥name, mobile, adults, kids, amount, date, time } = req.body;

    try {
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      });

      const values = [[
        timestamp,
        name,
        mobile,
        adults,
        kids,
        Number(adults) + Number(kids),
        amount,
        date,
        time,
        "PAID"
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });

      return res.status(200).json({ success: true });

    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /* =========================================================
     GET BOOKINGS (ADMIN)
  ========================================================= */

  if (req.method === "GET" && !type) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A2:J2000"
      });

      const rows = response.data.values || [];

      const bookings = rows.map((row: any, index: number) => ({
        id: index + 1,
        createdAt: row[0],
        name: row[1],
        mobile: row[2],
        adults: Number(row[3] || 0),
        kids: Number(row[4] || 0),
        totalAmount: Number(row[6] || 0),
        date: row[7],
        time: row[8],
        status: row[9]
      })).reverse();

      return res.status(200).json(bookings);

    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
