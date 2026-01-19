
import { google } from "googleapis";

// DETERMINISTIC TEMPLATE: "Pathar ki Lakeer"
function generateOfficialTemplate(booking: any) {
  const isMorning = booking.time.toLowerCase().includes('morning');
  const guestName = booking.name || 'Guest';

  const rules = `
🚫 *Group Policy:* To maintain a family-friendly environment, single males or "only males" groups are strictly not allowed. (अकेले पुरुष या केवल पुरुषों के समूह को प्रवेश की अनुमति नहीं है।)

🚭 *Clean Environment:* Alcohol and smoking are strictly prohibited on the premises. (परिसर के भीतर शराब का सेवन और धूम्रपान पूरी तरह से वर्जित है।)

🩱 *Pool Access:* Proper swimming costumes are mandatory. Guests without appropriate swimwear will not be allowed past the changing rooms into the pool area. (पूल में प्रवेश के लिए उचित स्विमवियर अनिवार्य है। बिना कॉस्ट्यूम के चेंजिंग रूम से आगे जाना वर्जित है।)

🔒 *Safety:* Please look after your belongings. While we provide paid locker facilities for your convenience, the resort is not responsible for any lost items. (निजी सामान के खोने के लिए प्रबंधन जिम्मेदार नहीं है। सशुल्क लॉकर सुविधा उपलब्ध है।)`;

  if (isMorning) {
    return `Hello ${guestName}! 😊

We are absolutely thrilled to confirm your booking at *Spray Aqua Resort!* Get ready for an unforgettable morning of fun, splashes, and relaxation. 🌊

*Your Booking Details:*
📅 *Date:* ${booking.date}
⏰ *Slot:* 10:00 AM to 03:00 PM (Morning Shift)
💰 *Total Amount Paid:* ₹${booking.totalAmount}
🎁 *SPECIAL OFFER INCLUDED:* Your booking comes with a *FREE Snacks / Chole Bhature* for all guests! 🥟🍛

To ensure you have the best experience, please take a moment to review our house rules:
${rules}

Warm regards,
*The Manager*
*Spray Aqua Resort* 🏨`;
  } else {
    return `Hello ${guestName}! 😊

We are absolutely thrilled to confirm your booking at *Spray Aqua Resort!* Get ready for an unforgettable evening of fun, splashes, and relaxation. 🌊

*Your Booking Details:*
📅 *Date:* ${booking.date}
⏰ *Slot:* 04:00 PM onwards (Evening Shift)
💰 *Total Amount Paid:* ₹${booking.totalAmount}
🎁 *SPECIAL OFFER INCLUDED:* Your booking comes with a *FREE Grand Buffet Dinner* for all guests! 🍽️🥘

To ensure you have the best experience, please take a moment to review our house rules:
${rules}

Warm regards,
*The Manager*
*Spray Aqua Resort* 🏨`;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

  if (req.query.type === 'health') {
    return res.status(200).json({
      whatsapp_token: !!WHATSAPP_TOKEN,
      whatsapp_phone_id: !!PHONE_NUMBER_ID,
      google_sheets: !!process.env.GOOGLE_CREDENTIALS && !!process.env.SHEET_ID
    });
  }

  // DIAGNOSTIC TEST ENDPOINT
  if (req.query.type === 'test_whatsapp' && req.method === 'POST') {
    const { mobile } = req.body;
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return res.status(400).json({ success: false, error: "CREDENTIALS_MISSING" });
    
    let cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile.startsWith('91')) cleanMobile = `91${cleanMobile}`;

    try {
      const testRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "text",
          text: { body: "Spray Aqua Resort: Diagnostic Test Successful! ✅ Your API Connection is working perfectly." }
        })
      });
      const data = await testRes.json();
      if (!testRes.ok) return res.status(testRes.status).json({ success: false, ...data });
      return res.status(200).json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.query.type === 'whatsapp' && req.method === 'POST') {
    const { mobile, booking } = req.body;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(400).json({ success: false, error: "CREDENTIALS_MISSING" });
    }

    // SANITIZE MOBILE: No spaces, starts with 91
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    } else if (cleanMobile.startsWith('0') && cleanMobile.length === 11) {
      cleanMobile = `91${cleanMobile.substring(1)}`;
    } else if (!cleanMobile.startsWith('91')) {
       // if it doesn't have 91 and isn't 10 digits, we still try to prefix if it looks like a local number
       if (cleanMobile.length < 10) return res.status(400).json({ success: false, error: "INVALID_PHONE" });
       cleanMobile = `91${cleanMobile}`;
    }

    const messageText = generateOfficialTemplate(booking);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;

    try {
      // 1. Send Text message
      const textRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "text",
          text: { body: messageText }
        })
      });

      const textData = await textRes.json();

      if (!textRes.ok) {
        return res.status(textRes.status).json({ 
          success: false, 
          error: "META_REJECTED",
          details: textData.error?.message || "Unknown Meta Error",
          meta_code: textData.error?.code,
          meta_subcode: textData.error?.error_subcode,
          fb_trace_id: textData.error?.fbtrace_id
        });
      }

      // 2. Send QR Image (Optional second message)
      await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "image",
          image: { link: qrImageUrl, caption: `Official Entry Pass: ${booking.id}` }
        })
      });

      return res.status(200).json({ success: true, ai_message: messageText });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: "API_CRASH", details: error.message });
    }
  }

  // --- GOOGLE SHEETS LOGIC ---
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) return res.status(500).json({ error: "Config Error" });
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;
  const safeParseInt = (val: any) => { if (!val) return 0; const n = parseInt(String(val).trim()); return isNaN(n) ? 0 : n; };

  if (type === 'rentals') {
    if (req.method === "GET") {
      try {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Lockers!A2:P2000" });
        const rows = response.data.values || [];
        const rentals = rows.filter(row => row && row[0] && row[0].toString().startsWith('SWP')).map((row: any) => ({
          receiptNo: row[0], guestName: row[1], guestMobile: row[2], date: row[3], shift: row[4], maleLockers: row[5] ? JSON.parse(row[5]) : [], femaleLockers: row[6] ? JSON.parse(row[6]) : [], maleCostumes: safeParseInt(row[7]), femaleCostumes: safeParseInt(row[8]), rentAmount: safeParseInt(row[9]), securityDeposit: safeParseInt(row[10]), totalCollected: safeParseInt(row[11]), refundableAmount: safeParseInt(row[12]), status: row[13] || 'issued', createdAt: row[14], returnedAt: row[15] || null
        })).reverse();
        return res.status(200).json(rentals);
      } catch (e: any) { return res.status(500).json({ error: e.message }); }
    }
    if (req.method === "POST") {
      const rental = req.body;
      const action = req.query.action;
      try {
        if (action === 'update') {
          const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Lockers!A:A" });
          const rows = response.data.values || [];
          const rowIndex = rows.findIndex(row => row[0] === rental.receiptNo);
          if (rowIndex !== -1) {
            await sheets.spreadsheets.values.update({ spreadsheetId: process.env.SHEET_ID, range: `Lockers!N${rowIndex+1}:P${rowIndex+1}`, valueInputOption: "USER_ENTERED", requestBody: { values: [[rental.status, rental.createdAt, rental.returnedAt]] } });
            return res.status(200).json({ success: true });
          }
        } else {
          const values = [[rental.receiptNo, rental.guestName, rental.guestMobile, rental.date, rental.shift, JSON.stringify(rental.maleLockers), JSON.stringify(rental.femaleLockers), Number(rental.maleCostumes), Number(rental.femaleCostumes), Number(rental.rentAmount), Number(rental.securityDeposit), Number(rental.totalCollected), Number(rental.refundableAmount), rental.status, rental.createdAt, ""]];
          await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Lockers!A:P", valueInputOption: "RAW", requestBody: { values } });
          return res.status(200).json({ success: true });
        }
      } catch (e: any) { return res.status(500).json({ error: e.message }); }
    }
  }

  if (type === 'settings') {
    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1" });
      const data = response.data.values?.[0]?.[0];
      return res.status(200).json(data ? JSON.parse(data) : null);
    }
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1", valueInputOption: "RAW", requestBody: { values: [[JSON.stringify(req.body)]] } });
      return res.status(200).json({ success: true });
    }
  }

  if (req.method === "GET" && !type) {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
    const rows = response.data.values || [];
    return res.status(200).json(rows.map((row: any, index: number) => ({
      id: row[0] ? `SYNC-${index}` : `ID-${Math.random()}`, name: row[1] || "Guest", mobile: row[2] || "", adults: safeParseInt(row[3]), kids: safeParseInt(row[4]), totalAmount: safeParseInt(row[6]), date: row[7] || "", time: row[8] || "", status: row[9] === "PAID" ? "confirmed" : "pending", createdAt: row[0] || new Date().toISOString(),
    })).reverse());
  }

  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const values = [[new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
