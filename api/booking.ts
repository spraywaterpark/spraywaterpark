
import { google } from "googleapis";

// DETERMINISTIC TEMPLATE: "Pathar ki Lakeer"
// Note: In LIVE mode, these free-text messages only work if the user messaged you in the last 24 hours.
// To bypass this, you MUST register a Template in Meta Portal and use that.
function generateOfficialTemplate(booking: any) {
  const isMorning = booking.time.toLowerCase().includes('morning');
  const guestName = booking.name || 'Guest';

  const rules = `
🚫 *Group Policy:* To maintain a family-friendly environment, single males or "only males" groups are strictly not allowed. (अकेले पुरुष या केवल पुरुषों के समूह को प्रवेश की अनुमति नहीं है।)

Smoking and alcohol are prohibited. Appropriate swimwear mandatory. Paid lockers available.`;

  if (isMorning) {
    return `Hello ${guestName}! 😊\n\nConfirmed for *Spray Aqua Resort!* 🌊\n\n*Details:*\n📅 Date: ${booking.date}\n⏰ Slot: 10AM-3PM\n💰 Paid: ₹${booking.totalAmount}\n🎁 *OFFER:* FREE Snacks / Chole Bhature!\n\nRules: ${rules}`;
  } else {
    return `Hello ${guestName}! 😊\n\nConfirmed for *Spray Aqua Resort!* 🌊\n\n*Details:*\n📅 Date: ${booking.date}\n⏰ Slot: 4PM onwards\n💰 Paid: ₹${booking.totalAmount}\n🎁 *OFFER:* FREE Grand Buffet Dinner!\n\nRules: ${rules}`;
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
      token_preview: WHATSAPP_TOKEN ? `${WHATSAPP_TOKEN.substring(0, 10)}...` : 'NONE'
    });
  }

  // --- CONFIG DIAGNOSTIC TEST (STRICT TEMPLATE MODE) ---
  if (req.query.type === 'test_config' && req.method === 'POST') {
    const { token, phoneId, mobile } = req.body;
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    try {
      // In LIVE Mode, you MUST use a template to start a conversation.
      // 'hello_world' is a default template provided by Meta to all accounts.
      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "template",
          template: { 
            name: "hello_world", 
            language: { code: "en_US" } 
          }
        })
      });
      
      const data = await waRes.json();
      
      if (waRes.ok) {
        return res.status(200).json({ 
          success: true, 
          msg: "Meta accepted the Template request.",
          message_id: data.messages?.[0]?.id 
        });
      } else {
        return res.status(waRes.status).json({ 
          success: false, 
          details: data.error?.message || "Meta API Rejected",
          code: data.error?.code,
          subcode: data.error?.error_subcode,
          meta_error: data.error
        });
      }
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // --- BROADCAST LOGIC ---
  if (req.query.type === 'broadcast' && req.method === 'POST') {
    const { targets, message } = req.body;
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return res.status(400).json({ error: "API_CONFIG_MISSING" });

    const results = [];
    for (const mobile of targets) {
      let cleanMobile = mobile.replace(/\D/g, '');
      if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;
      
      try {
        const waRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanMobile,
            type: "text",
            text: { body: message }
          })
        });
        results.push(waRes.status);
      } catch (e) {
        results.push(500);
      }
    }
    return res.status(200).json({ success: true, processed: results.length });
  }

  // --- TICKETING LOGIC ---
  if (req.query.type === 'whatsapp' && req.method === 'POST') {
    const { mobile, booking } = req.body;
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return res.status(400).json({ error: "CREDENTIALS_MISSING" });

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    const messageText = generateOfficialTemplate(booking);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;

    try {
      // Note: This 'text' message will fail in LIVE mode if it's the first message.
      // RECOMMENDED: Create a template named 'booking_confirmation' in Meta and use it here.
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
          error: textData.error?.type || "META_API_REJECTED",
          details: textData.error?.message,
          meta_code: textData.error?.code,
          fb_trace_id: textData.error?.fbtrace_id
        });
      }

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
    return res.status(200).json(rows.map((row: any) => ({
      id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: "confirmed", createdAt: row[0] || "",
    })).reverse());
  }

  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const values = [[new Date().toLocaleString("en-IN"), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
