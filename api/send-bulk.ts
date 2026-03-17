

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { mobile, templateName, promoImage } = req.body;
  const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
  const token = (process.env.WHATSAPP_TOKEN || "").trim();

  if (!phoneId || !token) {
    return res.status(500).json({ success: false, message: 'WhatsApp configuration missing' });
  }

  // Number cleaning logic
  let cleanMobile = String(mobile || "").replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number' });
  }
  cleanMobile = "91" + cleanMobile;

  // Bulk Message Payload
  const payload = {
    messaging_product: "whatsapp",
    to: cleanMobile,
    type: "template",
    template: {
      name: templateName || "offer_waterpark",
      language: { code: "en_US" },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: { 
                link: promoImage || "https://lh3.googleusercontent.com/3RZ93oAVqtog6291LWQUCsBYhL0u5ULjCap1Pb3HAgPvhVMRoWq1gwUaVvheq0hAQt-7UUQdsMxKJPoPWg=s360-w360-h360" 
              }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "Guest" // Variable {{1}} ke liye
            }
          ]
        }
      ]
    }
  };

  try {
    const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    const data = await waRes.json();
    return res.status(waRes.ok ? 200 : 400).json({ success: waRes.ok, details: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, details: error.message });
  }
}
