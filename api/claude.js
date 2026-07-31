// Vercel Serverless Function — secure Claude API proxy
// API key lives in Vercel env vars, never in client code.
// Set ANTHROPIC_API_KEY in your Vercel project settings.

export default async function handler(req, res) {
  // CORS headers so the Vite frontend can call this in dev and prod
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY environment variable is not set. ' +
             'Add it in your Vercel project → Settings → Environment Variables.',
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[/api/claude] error:', err);
    return res.status(500).json({ error: err.message || 'Upstream API call failed' });
  }
}
