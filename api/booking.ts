import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  /* ================= BASIC ================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  /* ================= ENV CHECK ================= */
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "GOOGLE CONFIG MISSING" });
  }

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  const toInt = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

  /* ======================================================
     1️⃣ WHATSAPP TEMPLATE MESSAGE (ticket_confirmed)
     ====================================================== */
  if (type === "whatsapp" && req.method === "POST") {
    try {
      if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        return res.status(400).json({ error: "WHATSAPP CONFIG MISSING" });
      }

      const { mobile, amount } = req.body;

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
              name: "ticket_confirmed", // ✅ YOUR APPROVED TEMPLATE
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: String(amount), // {{1}} → NUMBER
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
          error: "META_API_ERROR",
          details: waData,
        });
      }

      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  /* ======================================================
     2️⃣ GET BOOKINGS (ADMIN)
     ====================================================== */
  if (req.method === "GET" && !type) {
    try {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A2:J2000",
      });

      const rows = resp.data.values || [];

      const data = rows.map((r: any, i: number) => ({
        id: i,
        createdAt: r[0],
        name: r[1],
        mobile: r[2],
        adults: toInt(r[3]),
        kids: toInt(r[4]),
        totalPersons: toInt(r[5]),
        amount: toInt(r[6]),
        date: r[7],
        time: r[8],
        status: r[9],
      }));

      return res.status(200).json(data.reverse());
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  /* ======================================================
     3️⃣ SAVE BOOKING (PAYMENT SUCCESS)
     ====================================================== */
  if (req.method === "POST" && !type) {
    try {
      const { name, mobile, adults, kids, amount, date, time } = req.body;

      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      const values = [[
        timestamp,
        name,
        mobile,
        toInt(adults),
        toInt(kids),
        toInt(adults) + toInt(kids),
        toInt(amount), // ✅ AMOUNT FIX
        date,
        time,
        "PAID",
      ]];

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

  return res.status(405).json({ error: "Method Not Allowed" });
}
