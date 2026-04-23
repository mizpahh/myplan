import { put, head } from '@vercel/blob';

const BLOB_KEY = 'myplan-events.json';

async function readEvents() {
  try {
    const existing = await head(BLOB_KEY).catch(() => null);
    if (!existing) return [];
    const res = await fetch(existing.url);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeEvents(events) {
  await put(BLOB_KEY, JSON.stringify(events), {
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
    const events = await readEvents();
    return res.status(200).json(events);
  }

  if (req.method === 'POST') {
    const events = await readEvents();
    const event = { id: Date.now().toString(), ...req.body, g: 0, al: 0, cal: 'user' };
    events.push(event);
    await writeEvents(events);
    return res.status(201).json(event);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    let events = await readEvents();
    events = events.filter(e => e.id !== id);
    await writeEvents(events);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
