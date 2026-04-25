import { put, list } from '@vercel/blob';

const PATHNAME = 'myplan-events.json';

async function readEvents() {
  try {
    const { blobs } = await list({ prefix: PATHNAME });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    console.error('readEvents error:', e);
    return [];
  }
}

async function writeEvents(events) {
  await put(PATHNAME, JSON.stringify(events), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await readEvents());
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const events = await readEvents();
      const event = { id: Date.now().toString(), ...body, g: 0, al: body.al ?? 0, cal: body.cal || 'user' };
      events.push(event);
      await writeEvents(events);
      return res.status(201).json(event);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const events = (await readEvents()).filter(e => e.id !== id);
      await writeEvents(events);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('handler error:', err);
    res.status(500).json({ error: err.message, name: err.name });
  }
}
