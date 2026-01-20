import { google } from "googleapis";

/* =========================================================
   CONFIG
========================================================= */

const LOCKER_SHEET_NAME = "Lockers";
const SETTINGS_SHEET_NAME = "Settings";
const BOOKING_SHEET_NAME = "Sheet1";

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  /* ================= HEALTH CHECK ================= */

  if (req.query.type === "health") {
    return res.status(200).json({
      whatsapp_token: !!process.env.WHATSAPP_TOKEN,
      whatsapp_phone_id: !!process.env.WHATSAPP_PHONE_ID,
      google_credentials: !!process.env.GOOGLE_CREDENTIALS,
      sheet_id: !!process.env.SHEET_ID
    });
  }

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "SERVER_CONFIG_MISSING" });
  }

  /* ================= GOOGLE AUTH ================= */

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  /* =========================================================
     WHATSAPP TEMPLATE MESSAGE (META OFFICIAL)
  ========================================================= */

  if (type === "whatsapp" && req.method === "POST") {
    try {
      const { mobile, templateName, language = "en" } = req.body;

      if (!mobile || !templateName) {
        return res.status(400).json({ error: "MISSING_PARAMS" });
      }

      const WA_TOKEN = process.env.WHATSAPP_TOKEN!;
      const PHONE_ID = process.env.WHATSAPP_PHONE_ID!;

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mobile.startsWith("91") ? mobile : `91${mobile}`,
            type: "template",
            template: {
              name: templateName,
              language: { code: language }
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
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
      return res.status(500).json({
        error: "WHATSAPP_SEND_FAILED",
        details: err.message
      });
    }
  }

  /* =========================================================
     LOCKERS (STAFF → GOOGLE SHEET)
  ========================================================= */

  if (type === "rentals") {

    /* ---------- GET ALL LOCKER RECORDS ---------- */
    if (req.method === "GET") {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: `${LOCKER_SHEET_NAME}!A2:P2000`
        });

        return res.status(200).json(response.data.values || []);
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    /* ---------- POST NEW / UPDATE ---------- */
    if (req.method === "POST") {
      const rental = req.body;
      const action = req.query.action;

      try {
        /* UPDATE RETURN STATUS */
        if (action === "update") {
          const rows = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: `${LOCKER_SHEET_NAME}!A:A`
          });

          const index = rows.data.values?.findIndex(
            (r: any) => r[0] === rental.receiptNo
          );

          if (index === -1) {
            return res.status(404).json({ error: "RECEIPT_NOT_FOUND" });
          }

          const rowNo = index + 1;

          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `${LOCKER_SHEET_NAME}!N${rowNo}:P${rowNo}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[rental.status, rental.createdAt, rental.returnedAt || ""]]
            }
          });

          return res.status(200).json({ success: true });
        }

        /* INSERT NEW ISSUE */
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: `${LOCKER_SHEET_NAME}!A:P`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              rental.receiptNo,
              rental.guestName,
              rental.guestMobile,
              rental.date,
              rental.shift,
              JSON.stringify(rental.maleLockers),
              JSON.stringify(rental.femaleLockers),
              rental.maleCostumes,
              rental.femaleCostumes,
              rental.rentAmount,
              rental.securityDeposit,
              rental.totalCollected,
              rental.refundableAmount,
              rental.status,
              rental.createdAt,
              ""
            ]]
          }
        });

        return res.status(200).json({ success: true });

      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  /* =========================================================
     SETTINGS
  ========================================================= */

  if (type === "settings") {
    if (req.method === "GET") {
      const resData = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: `${SETTINGS_SHEET_NAME}!A1`
      });

      return res.status(200).json(resData.data.values?.[0]?.[0] || null);
    }

    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `${SETTINGS_SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [[JSON.stringify(req.body)]] }
      });

      return res.status(200).json({ success: true });
    }
  }

  /* =========================================================
     BOOKINGS (TICKET BOOKING)
  ========================================================= */

  if (!type && req.method === "POST") {
    const { name, mobile, adults, kids, amount, date, time } = req.body;

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `${BOOKING_SHEET_NAME}!A:J`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          timestamp,
          name,
          mobile,
          adults,
          kids,
          adults + kids,
          amount,
          date,
          time,
          "PAID"
        ]]
      }
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
