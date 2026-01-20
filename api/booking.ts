import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  /* ================= HEALTH CHECK ================= */
  if (req.query.type === "health") {
    return res.status(200).json({
      whatsapp_token: !!process.env.WHATSAPP_TOKEN,
      whatsapp_phone_id: !!process.env.WHATSAPP_PHONE_ID,
      google_sheets: !!process.env.GOOGLE_CREDENTIALS && !!process.env.SHEET_ID
    });
  }

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  const safeInt = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  /* ================= WHATSAPP TEMPLATE SEND ================= */
  if (type === "whatsapp" && req.method === "POST") {
    const { mobile } = req.body;

    const TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

    if (!TOKEN || !PHONE_ID) {
      return res.status(400).json({ error: "META_CREDENTIALS_MISSING" });
    }

    try {
      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mobile.startsWith("91") ? mobile : `91${mobile}`,
            type: "template",
            template: {
              name: "booked_ticket",
              language: {
                code: "en_US"
              }
            }
          })
        }
      );

      const data = await waRes.json();

      if (!waRes.ok) {
        return res.status(400).json({
          success: false,
          meta_error: data.error?.message,
          meta_code: data.error?.code,
          fb_trace_id: data.error?.fbtrace_id
        });
      }

      return res.status(200).json({
        success: true,
        message_id: data.messages?.[0]?.id
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /* ================= LOCKERS SHEET ================= */
  if (type === "rentals") {
    if (req.method === "POST") {
      const r = req.body;

      try {
        const values = [[
          r.receiptNo,
          r.guestName,
          r.guestMobile,
          r.date,
          r.shift,
          JSON.stringify(r.maleLockers || []),
          JSON.stringify(r.femaleLockers || []),
          safeInt(r.maleCostumes),
          safeInt(r.femaleCostumes),
          safeInt(r.rentAmount),
          safeInt(r.securityDeposit),
          safeInt(r.totalCollected),
          safeInt(r.refundableAmount),
          r.status,
          r.createdAt,
          r.returnedAt || ""
        ]];

        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: "Lockers!A:P",
          valueInputOption: "RAW",
          requestBody: { values }
        });

        return res.status(200).json({ success: true });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  /* ================= BOOKINGS (WATER PARK) ================= */
  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;

    try {
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      });

      const amountSafe = safeInt(amount);

      const values = [[
        timestamp,
        name,
        mobile,
        safeInt(adults),
        safeInt(kids),
        safeInt(adults) + safeInt(kids),
        amountSafe,
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
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Invalid request" });
}
