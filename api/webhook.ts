

export default async function handler(req: any, res: any) {
  // Meta verification logic (GET request)
  if (req.method === 'GET') {
    // Try to get params from req.query or manually from URL
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const mode = url.searchParams.get('hub.mode') || (req.query && req.query['hub.mode']);
    const token = url.searchParams.get('hub.verify_token') || (req.query && req.query['hub.verify_token']);
    const challenge = url.searchParams.get('hub.challenge') || (req.query && req.query['hub.challenge']);

    console.log('Webhook verification attempt:', { mode, token });

    if (mode === 'subscribe' && token === 'spray_water_park_2024') {
      console.log('Webhook Verified Successfully!');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    } else {
      console.error('Webhook Verification Failed: Token mismatch or missing params');
      return res.status(403).send('Verification failed');
    }
  }

  // Handling incoming messages (POST request)
  if (req.method === 'POST') {
    return res.status(200).json({ status: 'success' });
  }

  return res.status(405).send('Method Not Allowed');
}
