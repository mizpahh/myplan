import { put, list } from '@vercel/blob';

const PATHNAME = 'myplan-events.json';

async function readEvents() {
  try {
    const { blobs } = await list({ prefix: PATHNAME });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeEvents(events) {
  await put(PATHNAME, JSON.stringify(events), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json(await readEvents());
  }

  if (req.method === 'POST') {
    const events = await readEvents();
    const event = { id: Date.now().toString(), ...req.body, g: 0, al: req.body.al ?? 0, cal: req.body.cal || 'user' };
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
}
