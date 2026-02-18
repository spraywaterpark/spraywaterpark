
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ success: false, details: "Server Configuration Missing" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;
  const action = req.query.action;
  const id = req.query.id;

  try {
    // --- SETTINGS SYNC (MASTER DATA) ---
    if (type === 'settings') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ 
          spreadsheetId: process.env.SHEET_ID, 
          range: "Settings!A1:A1" 
        });
        const val = response.data.values?.[0]?.[0];
        return res.status(200).json(val ? JSON.parse(val) : {});
      }
      if (req.method === "POST") {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: "Settings!A1",
          valueInputOption: "RAW",
          requestBody: { values: [[JSON.stringify(req.body)]] }
        });
        return res.status(200).json({ success: true });
      }
    }

    // --- TICKET DETAILS FOR SCANNER ---
    if (type === 'ticket_details') {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      const row = rows.find(r => r[0] === id);
      
      if (!row) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      if (row[9] === "CHECKED-IN") return res.status(400).json({ success: false, details: "Already Checked In" });

      return res.status(200).json({ 
        success: true, 
        booking: {
          id: row[0], name: row[1], mobile: row[2], adults: row[3], kids: row[4], 
          totalAmount: row[6], date: row[7], time: row[8], status: row[9]
        }
      });
    }

    // --- GATE CHECK-IN ---
    if (type === 'checkin') {
      const { ticketId } = req.body;
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === ticketId);
      
      if (rowIndex === -1) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!J${rowIndex + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [["CHECKED-IN"]] }
      });

      return res.status(200).json({ success: true });
    }

    // --- RENTALS (LOCKERS/COSTUMES) ---
    if (type === 'rentals') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Rentals!A2:P1000" });
        const rows = response.data.values || [];
        const data = rows.map(r => ({
          receiptNo: r[0], guestName: r[1], guestMobile: r[2], date: r[3], shift: r[4],
          maleLockers: r[5] ? JSON.parse(r[5]) : [], femaleLockers: r[6] ? JSON.parse(r[6]) : [],
          maleCostumes: parseInt(r[7]) || 0, femaleCostumes: parseInt(r[8]) || 0,
          rentAmount: parseInt(r[9]) || 0, securityDeposit: parseInt(r[10]) || 0,
          totalCollected: parseInt(r[11]) || 0, refundableAmount: parseInt(r[12]) || 0,
          status: r[13], createdAt: r[14], returnedAt: r[15] || null
        }));
        return res.status(200).json(data);
      }

      if (req.method === "POST") {
        const r = req.body;
        if (action === 'update') {
          const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Rentals!A2:A1000" });
          const rowIndex = (response.data.values || []).findIndex(row => row[0] === r.receiptNo);
          if (rowIndex !== -1) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Rentals!N${rowIndex + 2}:P${rowIndex + 2}`,
              valueInputOption: "RAW",
              requestBody: { values: [[r.status, r.createdAt, r.returnedAt || ""]] }
            });
          }
          return res.status(200).json({ success: true });
        } 
        
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: "Rentals!A:P",
          valueInputOption: "RAW",
          requestBody: { values: [[
            r.receiptNo, r.guestName, r.guestMobile, r.date, r.shift,
            JSON.stringify(r.maleLockers), JSON.stringify(r.femaleLockers),
            r.maleCostumes, r.femaleCostumes, r.rentAmount, r.securityDeposit,
            r.totalCollected, r.refundableAmount, r.status, r.createdAt, ""
          ]] }
        });
        return res.status(200).json({ success: true });
      }
    }

    // --- STANDARD BOOKINGS (POST & GET) ---
    if (req.method === "POST") {
      const b = req.body;
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:J",
        valueInputOption: "RAW",
        requestBody: { values: [[
          b.id, b.name, b.mobile, b.adults, b.kids, b.adults + b.kids, b.amount, b.date, b.time, "PAID"
        ]] }
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      return res.status(200).json(rows.map(row => ({
        id: row[0], name: row[1], mobile: row[2], adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, 
        totalAmount: parseInt(row[6])||0, date: row[7], time: row[8], status: row[9] === "CHECKED-IN" ? "checked-in" : "confirmed", createdAt: row[0]
      })).reverse());
    }

  } catch (e: any) {
    console.error("API Error:", e.message);
    return res.status(500).json({ success: false, details: e.message });
  }
}
