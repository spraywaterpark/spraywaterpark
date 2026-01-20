
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // --- HEALTH CHECK FOR ADMIN PANEL ---
  if (req.query.type === 'health') {
    return res.status(200).json({
      whatsapp_token: !!process.env.WHATSAPP_TOKEN,
      whatsapp_phone_id: !!process.env.WHATSAPP_PHONE_ID,
      google_sheets: !!process.env.GOOGLE_CREDENTIALS && !!process.env.SHEET_ID
    });
  }

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  const safeParseInt = (val: any) => {
    if (!val) return 0;
    const str = String(val).trim();
    if (str.includes('/') || str.includes('-')) {
      const date = new Date(str);
      if (!isNaN(date.getTime()) && date.getFullYear() <= 1901) {
        return date.getDate();
      }
    }
    const num = parseInt(str);
    return isNaN(num) ? 0 : num;
  };

  // --- OFFICIAL WHATSAPP INTEGRATION ---
  if (type === 'whatsapp' && req.method === 'POST') {
    const { mobile, message } = req.body;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(400).json({ 
        success: false, 
        error: "META_CREDENTIALS_MISSING",
        details: "Configuration Error: Check WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in your environment variables."
      });
    }

    try {
      const waResponse = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: mobile.startsWith('91') ? mobile : `91${mobile}`,
          type: "text",
          text: { body: message }
        })
      });

      const waData = await waResponse.json();
      
      if (!waResponse.ok) {
        return res.status(waResponse.status).json({ 
          success: false, 
          error: "META_API_REJECTION",
          details: waData.error?.message || "Meta API rejected the request.",
          fb_trace_id: waData.error?.fbtrace_id,
          meta_code: waData.error?.code,
          meta_subcode: waData.error?.error_subcode
        });
      }

      return res.status(200).json({ success: true, wa_id: waData.messages?.[0]?.id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: "FETCH_FAILED", details: error.message });
    }
  }

  // --- GOOGLE SHEETS LOGIC (Rentals/Settings/Bookings) ---
  if (type === 'rentals') {
    if (req.method === "GET") {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: "Lockers!A2:P2000",
        });
        const rows = response.data.values || [];
        const rentals = rows
          .filter(row => row && row[0] && row[0].toString().startsWith('SWP'))
          .map((row: any) => ({
            receiptNo: row[0],
            guestName: row[1],
            guestMobile: row[2],
            date: row[3],
            shift: row[4],
            maleLockers: row[5] ? JSON.parse(row[5]) : [],
            femaleLockers: row[6] ? JSON.parse(row[6]) : [],
            maleCostumes: safeParseInt(row[7]),
            femaleCostumes: safeParseInt(row[8]),
            rentAmount: safeParseInt(row[9]),
            securityDeposit: safeParseInt(row[10]),
            totalCollected: safeParseInt(row[11]),
            refundableAmount: safeParseInt(row[12]),
            status: row[13] || 'issued',
            createdAt: row[14],
            returnedAt: row[15] || null
          })).reverse();
        return res.status(200).json(rentals);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }

    if (req.method === "POST") {
      const rental = req.body;
      const action = req.query.action;
      try {
        if (action === 'update') {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: "Lockers!A:A",
          });
          const rows = response.data.values || [];
          const rowIndex = rows.findIndex(row => row[0] === rental.receiptNo);
          if (rowIndex !== -1) {
            const sheetRow = rowIndex + 1;
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Lockers!N${sheetRow}:P${sheetRow}`,
              valueInputOption: "USER_ENTERED",
              requestBody: { values: [[rental.status, rental.createdAt, rental.returnedAt]] }
            });
            return res.status(200).json({ success: true });
          }
          return res.status(404).json({ error: "Receipt not found" });
        } 
        else if (action === 'checkout') {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: "Lockers!A:N",
          });
          const rows = response.data.values || [];
          const timestamp = new Date().toISOString();
          const updates: any[] = [];
          rows.forEach((row, index) => {
            if (row[13] === 'issued') {
              updates.push({
                range: `Lockers!N${index + 1}:P${index + 1}`,
                values: [['returned', row[14] || timestamp, timestamp]]
              });
            }
          });
          if (updates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
              spreadsheetId: process.env.SHEET_ID,
              requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: updates
              }
            });
          }
          const settingsRes = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: "Settings!A1",
          });
          let settings = {};
          try { settings = JSON.parse(settingsRes.data.values?.[0]?.[0] || "{}"); } catch(e) {}
          const updatedSettings = { ...settings, lastShiftReset: timestamp };
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: "Settings!A1",
            valueInputOption: "RAW",
            requestBody: { values: [[JSON.stringify(updatedSettings)]] }
          });
          return res.status(200).json({ success: true, count: updates.length });
        }
        else {
          const values = [[
            rental.receiptNo,
            rental.guestName,
            rental.guestMobile,
            rental.date,
            rental.shift,
            JSON.stringify(rental.maleLockers),
            JSON.stringify(rental.femaleLockers),
            Number(rental.maleCostumes),
            Number(rental.femaleCostumes),
            Number(rental.rentAmount),
            Number(rental.securityDeposit),
            Number(rental.totalCollected),
            Number(rental.refundableAmount),
            rental.status,
            rental.createdAt,
            ""
          ]];
          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: "Lockers!A:P",
            valueInputOption: "RAW",
            requestBody: { values }
          });
          return res.status(200).json({ success: true });
        }
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }

  if (type === 'settings') {
    if (req.method === "GET") {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1", 
        });
        const data = response.data.values?.[0]?.[0];
        return res.status(200).json(data ? JSON.parse(data) : null);
      } catch (error: any) {
        return res.status(200).json(null);
      }
    }
    if (req.method === "POST") {
      try {
        const settingsJson = JSON.stringify(req.body);
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1",
          valueInputOption: "RAW", 
          requestBody: { values: [[settingsJson]] }
        });
        return res.status(200).json({ success: true });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }

  if (req.method === "GET" && !type) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A2:J1000", 
      });
      const rows = response.data.values || [];
      const bookings = rows.map((row: any, index: number) => ({
        id: row[0] ? `SYNC-${index}` : `ID-${Math.random()}`,
        name: row[1] || "Guest",
        mobile: row[2] || "",
        adults: safeParseInt(row[3]),
        kids: safeParseInt(row[4]),
        totalAmount: safeParseInt(row[6]),
        date: row[7] || "",
        time: row[8] || "",
        status: row[9] === "PAID" ? "confirmed" : "pending",
        createdAt: row[0] || new Date().toISOString(),
      })).reverse();
      return res.status(200).json(bookings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const values = [[timestamp, name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
