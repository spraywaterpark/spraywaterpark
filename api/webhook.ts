
export default async function handler(req: any, res: any) {
  // Meta verification (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'spray_water_park_2024') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }
    
    // Simple health check for us to test
    if (req.query.test === 'true') {
      return res.status(200).send('Webhook is active and waiting for Meta');
    }
  }

  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(403).send('Forbidden');
}
